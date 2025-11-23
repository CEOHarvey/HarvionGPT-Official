# ✅ Verify Vercel Frontend → Render Backend Connection

## Quick Verification Steps

### 1. Check Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Look for `NEXT_PUBLIC_API_URL`
3. Should be set to: `https://your-backend.onrender.com`
4. **Important:** No trailing slash at the end!

### 2. Test in Browser Console

1. Open your Vercel site: `https://your-frontend.vercel.app`
2. Open **Browser DevTools** (F12)
3. Go to **Console** tab
4. Type this command:
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'Using local API routes')
   ```
5. Or check the actual API base URL:
   ```javascript
   // This will show if backend is configured
   fetch('/api/chats').then(r => r.json()).then(console.log).catch(console.error)
   ```

### 3. Check Network Tab (Best Method)

1. Open your Vercel site
2. Open **Browser DevTools** (F12)
3. Go to **Network** tab
4. Try to **sign in** or **load chats**
5. Look for API requests:

   **✅ If connected to Render backend:**
   - You'll see requests to: `https://your-backend.onrender.com/api/...`
   - Example: `https://harvion-gpt-backend.onrender.com/api/chats`

   **❌ If using local API routes:**
   - You'll see requests to: `/api/chats` (relative URL)
   - These go to Vercel's Next.js API routes

### 4. Check Backend Logs on Render

1. Go to **Render Dashboard** → Your Backend Service
2. Click on **Logs** tab
3. Try to use the app (sign in, send message, etc.)
4. **If connected:** You should see request logs like:
   ```
   GET /api/chats 200
   POST /api/chat 200
   ```
5. **If not connected:** No logs will appear

### 5. Test API Endpoint Directly

1. Open your **Render backend URL** in browser:
   ```
   https://your-backend.onrender.com/health
   ```
2. Should return: `{"status":"ok","timestamp":"..."}`
3. If this works, backend is running ✅

### 6. Check Frontend Code Behavior

The frontend automatically detects if backend is configured:

- **If `NEXT_PUBLIC_API_URL` is set:**
  - All API calls go to Render backend
  - Example: `https://backend.onrender.com/api/chats`

- **If `NEXT_PUBLIC_API_URL` is NOT set:**
  - Uses local Next.js API routes
  - Example: `/api/chats` (goes to Vercel)

### 7. Visual Test

**Sign in and check:**
1. Sign in to your app
2. Open **Network** tab in DevTools
3. Look for requests when loading chats/messages
4. Check the **Request URL** column:
   - ✅ Backend: `https://your-backend.onrender.com/api/...`
   - ❌ Local: `https://your-frontend.vercel.app/api/...`

### 8. Quick Test Script

Add this to your browser console on the Vercel site:

```javascript
// Check if backend is configured
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  console.log('✅ Backend configured:', apiUrl);
  // Test connection
  fetch(`${apiUrl}/health`)
    .then(r => r.json())
    .then(data => console.log('✅ Backend is reachable:', data))
    .catch(err => console.error('❌ Backend connection failed:', err));
} else {
  console.log('❌ Using local API routes (NEXT_PUBLIC_API_URL not set)');
}
```

## Common Issues

### Issue: Still using local API routes

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
2. Make sure it's set correctly (no trailing slash)
3. **Redeploy** Vercel after adding/updating the variable
4. Clear browser cache

### Issue: CORS errors

**Solution:**
1. Check Render backend has `FRONTEND_URL` set correctly
2. Should be: `https://your-frontend.vercel.app`
3. Restart Render service after updating

### Issue: 401 Unauthorized

**Solution:**
1. Check if `NEXTAUTH_SECRET` is the same in both Vercel and Render
2. Check if `NEXTAUTH_URL` is set correctly in Vercel
3. Verify session is being created properly

## Expected Behavior

**✅ When properly connected:**
- Network requests go to Render backend URL
- Render logs show incoming requests
- API calls work correctly
- No CORS errors

**❌ When not connected:**
- Network requests go to local `/api/...` routes
- Render logs show no activity
- May work but using Vercel's API routes instead

---

## Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel
- [ ] Value is: `https://your-backend.onrender.com` (no trailing slash)
- [ ] Vercel has been redeployed after setting the variable
- [ ] Network tab shows requests to Render backend
- [ ] Render logs show incoming requests
- [ ] No CORS errors in browser console



