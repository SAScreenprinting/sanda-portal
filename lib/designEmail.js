// Emails a client when S&A approves or denies one of their designs (sent through Resend).
const HEAD = "'Sora','DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
const BODY = "'DM Sans','Helvetica Neue',Helvetica,Arial,sans-serif";
const Y = '#ffc800';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function senderAddress(emailFrom) {
  const match = /<([^>]+)>/.exec(emailFrom || '');
  return `S&A POD <${match ? match[1] : (emailFrom || '').trim()}>`;
}

function page({ origin, title, body, note, button, link }) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Sora:wght@600;800&display=swap" rel="stylesheet">
<style>
@media (prefers-color-scheme: dark) {
  .bg, .bgtd { background:#000000 !important; background-image:linear-gradient(#000000,#000000) !important; }
  .card { background:#000000 !important; background-image:linear-gradient(#000000,#000000) !important; border-color:#2e2e2e !important; }
  .h1 { color:#ffffff !important; } .p { color:#b9b9c2 !important; } .note { color:#71717a !important; border-color:#2e2e2e !important; } .foot { color:#5c5c64 !important; }
}
</style></head>
<body class="bg" bgcolor="#eeeeee" style="margin:0;padding:0;background:#eeeeee;font-family:${BODY};">
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eeeeee" style="background:#eeeeee;padding:40px 16px;">
<tr><td align="center" class="bgtd" style="background:#eeeeee;">
  <table role="presentation" class="card" width="560" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #dddddd;border-top:4px solid ${Y};">
    <tr><td align="center" bgcolor="#000000" style="background:#000000;padding:26px 36px 18px;">
      <img src="${origin}/email/logo-reveal-v2.gif" alt="S&amp;A" width="220" style="display:block;border:0;height:auto;margin:0 auto;">
      <div style="margin-top:4px;font-family:${HEAD};font-size:11px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:${Y};">Client Portal</div>
    </td></tr>
    <tr><td style="padding:36px 36px 8px;">
      <h1 class="h1" style="margin:0 0 16px;font-family:${HEAD};font-size:26px;line-height:1.2;color:#000000;font-weight:800;letter-spacing:-0.5px;">${esc(title)}</h1>
      <p class="p" style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#333333;">${body}</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="${Y}" style="background:${Y};">
        <a href="${esc(link)}" style="display:inline-block;padding:16px 34px;font-family:${HEAD};font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#000000;text-decoration:none;">${esc(button)}</a>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:28px 36px 32px;">
      <p class="note" style="margin:0;padding-top:20px;border-top:1px solid #e5e5e5;font-size:13px;line-height:1.6;color:#777777;">${esc(note)}</p>
    </td></tr>
  </table>
  <p class="foot" style="margin:22px 0 0;font-size:12px;color:#777777;">S&amp;A Screen Printing &middot; sascreenprinting@outlook.com</p>
</td></tr></table>
</body></html>`;
}

/** Fire-and-forget: never throws, so a mail problem can't block the review itself. */
export async function sendDesignReviewEmail({ to, status, design, note, origin }) {
  try {
    if (!to || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
    const number = design?.product?.designNumber || design?.name;
    const product = design?.product?.productTitle || 'your product';
    const link = `${origin}/designs/${design.id}`;
    let subject, html;
    if (status === 'Approved') {
      subject = `${design.name} was approved`;
      html = page({
        origin, link, button: 'View design', title: 'Your design was approved',
        body: `<strong>${esc(design.name)}</strong> (${esc(product)}) has been reviewed and approved. S&amp;A will now set it up with your POD profile and your online stores.${design.product?.sku ? `<br><br><strong>SKU:</strong> ${esc(design.product.sku)}` : ''}<br><br>We will keep you posted on your Designs page.`,
        note: 'Questions? Reply to this email or open Messages in your portal.',
      });
    } else if (status === 'Denied') {
      subject = `${design.name} needs changes`;
      html = page({
        origin, link, button: 'View design', title: 'Your design needs changes',
        body: `<strong>${esc(design.name)}</strong> (${esc(product)}) could not be approved yet.<br><br><strong>Reason:</strong> ${esc(note || 'Please review it and submit a new version.')}<br><br>You can create a revised design in the Design Studio whenever you are ready.`,
        note: 'Questions? Reply to this email or open Messages in your portal.',
      });
    } else return false;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: senderAddress(process.env.EMAIL_FROM), to: [to], reply_to: 'sascreenprinting@outlook.com', subject, html }),
    });
    void number;
    return res.ok;
  } catch {
    return false;
  }
}
