import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STATUS_LABELS = {
  'Awaiting Artwork': { emoji: '🎨', title: 'Your artwork is needed', body: "We're ready to move forward — please upload your artwork file so we can get started." },
  'Art Approved':     { emoji: '✅', title: 'Artwork approved!', body: "Great news — your artwork has been approved and your order is moving into production." },
  'In Production':    { emoji: '🏭', title: 'Your order is in production', body: "Your order is on the press. We'll notify you when it passes quality check." },
  'Quality Check':    { emoji: '🔍', title: 'Quality check in progress', body: "Your order has finished printing and is now going through our quality control process." },
  'Shipped':          { emoji: '🚚', title: 'Your order has shipped!', body: "Your order is on its way. Check your tracking info for delivery updates." },
  'Delivered':        { emoji: '📦', title: 'Order delivered', body: "Your order has been delivered. Enjoy! Let us know if you need anything." },
};

export async function POST(req) {
  try {
    const { orderId, newStatus, trackingNumber } = await req.json();
    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId and newStatus required' }, { status: 400 });
    }

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

    const info = STATUS_LABELS[newStatus] || { emoji: '📋', title: `Order status updated to ${newStatus}`, body: `Your order ${order.order_number} has been updated.` };
    const firstName = profile.contact_name?.split(' ')[0] || profile.business_name || 'there';
    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.sascreenprinting.com'}/orders/${orderId}`;

    const trackingLine = trackingNumber
      ? `<p style="margin:0 0 16px;"><strong>Tracking:</strong> ${trackingNumber}</p>`
      : '';

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
          <p style="font-size:32px;margin:0 0 16px;">${info.emoji}</p>
          <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">${info.title}</h1>
          <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">Hi ${firstName},</p>
          <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px;">${info.body}</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e5e5;">
            <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Order Details</p>
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">${order.order_number}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">Status: <strong>${newStatus}</strong></p>
            ${trackingLine}
          </div>
          <a href="${portalUrl}" style="display:inline-block;background:#1a1a1a;color:white;padding:13px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">View Order in Portal →</a>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Reply to this email or message us in the portal.<br>S&A Screen Printing · 123 Print Ave, Newark NJ · (973) 555-0100</p>
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
        subject: `${info.emoji} ${order.order_number} — ${info.title}`,
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
