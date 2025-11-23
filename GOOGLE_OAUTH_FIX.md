# 🔧 Fix Google OAuth "Access blocked" Error

## Common Causes:
1. **Incorrect Redirect URI** in Google Cloud Console
2. **Wrong OAuth credentials** (Client ID/Secret)
3. **OAuth Consent Screen** not properly configured
4. **Mismatched callback URL**

## Step-by-Step Fix:

### 1. Check Your Vercel Frontend URL
- Go to Vercel Dashboard → Your Project
- Copy your production URL (e.g., `https://harviongpt2.vercel.app`)

### 2. Update Google Cloud Console

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/
   - Select your project

2. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Make sure it's configured:
     - User Type: **External** (for testing) or **Internal** (for Google Workspace)
     - App name: **HarvionGPT**
     - Support email: Your email
     - Authorized domains: Add `vercel.app` and your custom domain if any
     - Scopes: Add `email`, `profile`, `openid`
   - Click **Save and Continue**

3. **Update OAuth 2.0 Client ID:**
   - Go to "APIs & Services" → "Credentials"
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", add:
     ```
     https://your-frontend.vercel.app/api/auth/callback/google
     ```
   - **IMPORTANT:** Replace `your-frontend.vercel.app` with your actual Vercel URL
   - Also add for local development:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Save**

### 3. Verify Environment Variables in Vercel

Go to Vercel Dashboard → Settings → Environment Variables:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXTAUTH_URL=https://your-frontend.vercel.app
NEXTAUTH_SECRET=your-secret-here
```

**Important:**
- `NEXTAUTH_URL` must match your Vercel URL exactly
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` must match Google Cloud Console

### 4. Common Redirect URI Formats

For NextAuth with Google provider, the callback URL is always:
```
https://your-domain.com/api/auth/callback/google
```

**Examples:**
- Vercel: `https://harviongpt2.vercel.app/api/auth/callback/google`
- Custom domain: `https://harviongpt.com/api/auth/callback/google`
- Local: `http://localhost:3000/api/auth/callback/google`

### 5. Testing Checklist

✅ OAuth Consent Screen is published (or in Testing mode with your email added)
✅ Redirect URI matches exactly (including `https://` and `/api/auth/callback/google`)
✅ Client ID and Secret are correct in Vercel
✅ `NEXTAUTH_URL` matches your Vercel domain
✅ App is in "Testing" mode (for external apps) or you're added as a test user

### 6. If Still Not Working

1. **Check Google Cloud Console Logs:**
   - Go to "APIs & Services" → "Dashboard"
   - Check for any errors

2. **Verify the exact error:**
   - Open browser console (F12)
   - Check Network tab for the OAuth request
   - Look for the exact error message

3. **Common Issues:**
   - **"redirect_uri_mismatch"**: Redirect URI doesn't match exactly
   - **"access_denied"**: User denied permission or app not in testing mode
   - **"invalid_client"**: Wrong Client ID or Secret

### 7. Quick Test

After updating:
1. **Redeploy Vercel** (or wait for auto-redeploy)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try Google sign-in again**

---

## Need Help?

If still having issues, check:
- Google Cloud Console → Credentials → OAuth 2.0 Client IDs
- Make sure redirect URI is EXACTLY: `https://your-vercel-url.vercel.app/api/auth/callback/google`
- No trailing slashes, no typos, exact match required

