# Branded portal emails

Dark, amber-accented templates that match the client portal. Paste each into Supabase:
**Authentication -> Emails -> Templates**, choosing the matching tab. Use the subject shown below.

| Supabase tab | File | Subject |
|---|---|---|
| Reset Password | `recovery.html` | Reset your S&A portal password |
| Invite user | `invite.html` | You're invited to the S&A client portal |
| Confirm sign up | `confirmation.html` | Confirm your S&A portal account |
| Magic Link | `magic-link.html` | Your S&A portal sign-in link |
| Change Email Address | `email-change.html` | Confirm your new email address |

## Sender (Authentication -> Emails -> SMTP Settings)
Turn on custom SMTP using Resend, with a domain verified in Resend (add its DNS records where sascreenprinting.com's DNS is managed):
- Sender email: `noreply@sascreenprinting.com`
- Sender name: `S&A Screen Printing`
- Host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key
Replies can be pointed at sascreenprinting@outlook.com from Resend.

The templates use Supabase's `{{ .ConfirmationURL }}` variable; do not edit it.
