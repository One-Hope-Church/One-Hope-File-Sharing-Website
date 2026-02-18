# OTP sign-in with Supabase Auth

The app uses **Supabase Auth** only for sign-in: Supabase sends the OTP email and verifies the code. No Resend or other email service is used in the app.

## 1. Get your anon key

- Supabase Dashboard → **Project Settings** → **API**
- Copy the **anon public** key (safe for client-side).
- In `web/.env` add:
  ```
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

## 2. OTP emails (Supabase)

Supabase sends the sign-in email. You can either:

- **Use Supabase’s default email** (limited; good for testing), or
- **Custom SMTP** (Supabase Dashboard → **Authentication** → **SMTP**): use any provider (e.g. Resend, SendGrid) so emails come from your domain. Configure host, port, username, password, and sender address in the Dashboard. The app does not need any email-related env vars.

## 3. Show the 6-digit code (Magic Link template)

By default Supabase sends a magic link. To send a **6-digit code** that users enter on the verify page:

- Supabase Dashboard → **Authentication** → **Email Templates**
- Open **Magic Link**
- In the **Body** (HTML), include the token, for example:

  ```html
  <h2>Your One Hope Resources sign-in code</h2>
  <p>Your one-time code is: <strong>{{ .Token }}</strong></p>
  <p>This code expires in 1 hour. Enter it on the sign-in page.</p>
  <p>If you didn't request this, you can ignore this email.</p>
  ```

- Subject e.g. "Your One Hope Resources sign-in code"
- Save

`{{ .Token }}` is the 6-digit OTP.

## 4. Auth URL (optional)

- **Site URL:** Your app’s public URL (e.g. `https://resources.onehopechurch.com` or `http://localhost:3000` for dev)
- **Redirect URLs:** Add the same URL and `http://localhost:3000/**` for local dev

After this, sign-in uses Supabase to send and verify the OTP; your app session is set from your `users` table (role, blocked).
