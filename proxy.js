import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Only same-site paths may be used as a post-sign-in destination ("//evil.com" is not one).
function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : null
}

// Send a signed-out visitor to the sign-in page, remembering where they were headed so signing in
// lands them there (e.g. /admin) instead of silently dropping the destination.
function redirectToSignIn(request) {
  const url = request.nextUrl.clone()
  const wanted = request.nextUrl.pathname + request.nextUrl.search
  url.pathname = '/'
  url.search = ''
  url.searchParams.set('next', wanted)
  return NextResponse.redirect(url)
}

export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for SSR auth to work correctly
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Email links (password reset, invites) can land on the home page with a ?code if the
  // project's redirect settings send them there. Finish the sign-in instead of dropping it.
  if (pathname === '/' && request.nextUrl.searchParams.get('code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    url.searchParams.set('next', '/settings?reset=true')
    return NextResponse.redirect(url)
  }

  // Public routes — anyone can access
  const publicRoutes = ['/', '/auth/callback', '/auth/confirm']

  // API routes that are called server-to-server (verified internally)
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }
  if (publicRoutes.includes(pathname)) {
    // If already logged in, redirect away from login page
    if (user && pathname === '/') {
      const url = request.nextUrl.clone()
      const next = safeNext(request.nextUrl.searchParams.get('next'))
      url.pathname = next || '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Admin-only routes
  if (pathname.startsWith('/admin')) {
    if (!user) return redirectToSignIn(request)
    // Admin check happens inside the admin pages via server component
    return supabaseResponse
  }

  // All other routes require auth
  if (!user) return redirectToSignIn(request)

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo|Logoblack|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
