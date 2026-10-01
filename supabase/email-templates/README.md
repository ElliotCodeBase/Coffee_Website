# Invite email design

Team invitations (Admin → Team → "Invite") can be sent two ways. Both use the same designed layout.

## 1. Sent by the website itself (recommended)

If these two environment variables are set on your host, the site sends a branded invitation
(your business name and theme colors, the person's name, who invited them, and what their role can do):

- `RESEND_API_KEY`
- `CONTACT_FORM_FROM_EMAIL` — an address on a domain verified in Resend

If either is missing, or Resend refuses the email, the site falls back to option 2 and, when even that
cannot deliver, shows the invite link on screen so you can send it by hand.

## 2. Sent by Supabase

Supabase uses its own template for this email. To give it the same design:

1. Supabase dashboard → **Authentication → Emails → Templates → Invite user**
2. Set the subject to: `You're invited to join The Mellow Mug`
3. Replace the message body with the contents of `invite.html` in this folder, and save.

Note: Supabase's built-in mail service can only email your own team and is limited to a few emails per hour.
Connect Resend under **Authentication → SMTP Settings** to email anyone.
