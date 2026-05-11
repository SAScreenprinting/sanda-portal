import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY not configured' });
    }

    const { data: order } = await serviceClient
      .from('orders')
      .select('order_number, client_id')
      .eq('id', orderId)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('contact_name, business_name, email')
      .eq('id', order.client_id)
      .single();

    if (!profile?.email) return NextResponse.json({ skipped: true, reason: 'No email on profile' });

    const firstName = profile.contact_name?.split(' ')[0] || profile.business_name || 'there';
    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.sascreenprinting.com'}/orders/${orderId}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="background:#1a1a1a;padding:28px 32px;">
          <p style="margin:0;font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">S&A Screen Printing</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="font-size:32px;margin:0 0 16px;">🖼️</p>
          <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Your proof is ready for approval</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">Hi ${firstName},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">
            We've uploaded a proof for your order <strong>${order.order_number}</strong>. Please review and approve it — or send us any changes — so we can keep your production on schedule.
          </p>
          <div style="background:#fef3c7;border-radius:8px;padding:14px 18px;margin-bottom:24px;border:1px solid #fde68a;">
            <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">⏰ Approvals received before 12pm are processed same day.</p>
          </div>
          <a href="${portalUrl}" style="display:inline-block;background:#1a1a1a;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Review Proof →</a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">S&A Screen Printing · 123 Print Ave, Newark NJ · (973) 555-0100</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'S&A Screen Printing <noreply@sascreenprinting.com>',
        to: [profile.email],
        subject: `🖼️ Proof ready for ${order.order_number} — action required`,
        html,
      }),
    });

    const resData = await res.json();
    if (!res.ok) return NextResponse.json({ error: resData }, { status: 500 });

    return NextResponse.json({ sent: true, emailId: resData.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
