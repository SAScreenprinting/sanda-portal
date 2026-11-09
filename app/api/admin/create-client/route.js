import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  // Verify the caller is an authenticated admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, business_name, contact_name, phone } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  // Use service role key to create the user (bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  const fields = { email, business_name, contact_name, phone, is_admin: false }

  if (createError) {
    // A login can exist without a profile (an earlier attempt that did not finish). Repair that one instead of failing.
    if (!/already|registered|exists/i.test(createError.message)) return NextResponse.json({ error: createError.message }, { status: 400 })
    let existing = null
    for (let page = 1; page <= 10 && !existing; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 })
      if (error || !data?.users?.length) break
      existing = data.users.find((u) => (u.email || '').toLowerCase() === String(email).toLowerCase()) || null
      if (data.users.length < 200) break
    }
    if (!existing) return NextResponse.json({ error: createError.message }, { status: 400 })
    const { data: hasProfile } = await adminClient.from('profiles').select('id').eq('id', existing.id).maybeSingle()
    if (hasProfile) return NextResponse.json({ error: 'That email already has a client account.' }, { status: 400 })
    const { error: fixError } = await adminClient.from('profiles').upsert({ id: existing.id, ...fields }, { onConflict: 'id' })
    if (fixError) return NextResponse.json({ error: 'Could not finish the account: ' + fixError.message }, { status: 500 })
    await adminClient.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    return NextResponse.json({ success: true, userId: existing.id, repaired: true })
  }

  // Save their business info. Upsert so it works whether or not the database already made a blank profile for the new login.
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ id: newUser.user.id, ...fields }, { onConflict: 'id' })
  if (profileError) {
    // Do not leave a login with no profile behind.
    await adminClient.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: 'Could not save the client profile: ' + profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}
