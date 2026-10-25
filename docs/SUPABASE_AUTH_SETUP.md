# Supabase dashboard settings for sign-in (do these once)

The app confirms e-mail addresses and resets passwords with a **code typed in the app**, not a link.
That works in Expo Go and needs no deep-link setup, but the e-mail templates must show the code.

1. **Authentication, Sign In / Providers, Email:** keep Email enabled. Keep "Confirm email" on
   (recommended). Set the minimum password length to 8.
2. **Authentication, Emails, Templates.** Edit both "Confirm signup" and "Reset password".
   Subject: `Ton code amphiHub : {{ .Token }}`
   Body:
   ```html
   <h2>Ton code amphiHub / Your amphiHub code</h2>
   <p>Saisis ce code dans l’application / Enter this code in the app:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:6px">
     {{ .Token }}
   </p>
   <p>
     Si ce n’est pas toi, ignore cet e-mail. / If this wasn’t you, ignore this
     e-mail.
   </p>
   ```
3. **Code length and lifetime:** the app accepts 6 to 10 digits. A shorter lifetime (for example 10 minutes)
   is safer than the default hour.
4. **Before any pilot, set up your own e-mail sender** (Authentication, Emails, SMTP Settings, for example
   Brevo or Resend). The built-in sender allows only a handful of e-mails per hour and will block real users.
5. **Test:** sign up in the app with a real address, check the code arrives, confirm it, sign out, then try
   "Mot de passe oublié".
6. **Make yourself an admin** after your first sign-up (see supabase/README.md).

If you switch "Confirm email" off, sign-up signs the user in at once and the code screen is skipped.
