import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Emails a client that a new invoice is waiting in their portal. Admin only.
export async function POST(req) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not configured' });

    const db = serviceDb();
    const { data: inv } = await db.from('invoices').select('*').eq('id', invoiceId).single();
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const { data: profile } = await db.from('profiles').select('contact_name, business_name, email').eq('id', inv.client_id).single();
    if (!profile?.email) return NextResponse.json({ skipped: true, reason: 'No email on profile' });

    const firstName = esc(profile.contact_name?.split(' ')[0] || profile.business_name || 'there');
    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.sandascreenprinting.com'}/billing`;
    const due = inv.due_date ? new Date(inv.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;"><tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
<tr><td style="background:#1a1a1a;padding:28px 32px;"><p style="margin:0;font-size:22px;font-weight:700;color:white;">S&amp;A Screen Printing</p></td></tr>
<tr><td style="padding:32px;">
<h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">You have a new invoice</h1>
<p style="font-size:14px;color:#6b7280;margin:0 0 24px;">Hi ${firstName},</p>
<div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e5e5;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">${esc(inv.invoice_number)}</p>
<p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a1a;">$${Number(inv.amount).toFixed(2)}</p>
${due ? `<p style="margin:0;font-size:13px;color:#6b7280;">Due ${esc(due)}</p>` : ''}
</div>
<a href="${portalUrl}" style="display:inline-block;background:#1a1a1a;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View and pay invoice</a>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;"><p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Reply to this email or message us in the portal.<br>S&amp;A Screen Printing · 195 Crosby Ave, Paterson NJ 07502 · (201) 949-8343</p></td></tr>
</table></td></tr></table></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'S&A Screen Printing <onboarding@resend.dev>',
        to: [profile.email],
        reply_to: 'sascreenprinting@outlook.com',
        subject: `Invoice ${inv.invoice_number} from S&A Screen Printing`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: 500 });
    return NextResponse.json({ sent: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
