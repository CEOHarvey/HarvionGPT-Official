# 🚀 Complete Deployment Guide - Frontend (Vercel) + Backend (Render)

## Architecture Overview

```
[Frontend] Vercel (https://frontend.com)
    ↓ API Calls
[Backend] Render (https://api.frontend.com)
    ↓
[Database] Neon PostgreSQL
```

---

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Neon PostgreSQL database created
- [ ] Gmail OAuth configured
- [ ] Gmail SMTP app password generated
- [ ] AI API keys ready
- [ ] NEXTAUTH_SECRET generated

---

## Step 1: Prepare GitHub Repository

```bash
# Make sure all code is committed
git add .
git commit -m "Ready for deployment - Frontend/Backend separation"
git push origin master
```

**Note:** If your default branch is `main` instead of `master`, use:
```bash
git push origin main
```

---

## Step 2: Set Up Neon PostgreSQL Database

1. Go to https://console.neon.tech/
2. Create a new project
3. Copy the connection string: `postgresql://user:password@host/database?sslmode=require`
4. Save this as `DATABASE_URL`

---

## Step 3: Set Up Gmail OAuth

1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen (External, App name: HarvionGPT)
6. Create OAuth Client:
   - Type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-frontend.vercel.app/api/auth/callback/google` (update after deployment)
7. Copy Client ID and Client Secret

---

## Step 4: Set Up Gmail SMTP

1. Enable 2FA on Gmail account
2. Go to https://myaccount.google.com/apppasswords
3. Generate App Password for "Mail"
4. Copy the 16-character password

---

## Step 5: Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

---

## Step 6: Deploy Backend to Render

### 6.1 Create Render Web Service

1. Go to https://dashboard.render.com/
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `harvion-gpt-backend`
   - **Environment**: `Node`
   - **Region**: Singapore (or closest)
   - **Branch**: `main`
   - **Root Directory**: `server` (important!)
   - **Build Command**: `npm install && npx prisma generate --schema=../prisma/schema.prisma && npm run build`
   - **Start Command**: `npm start`

### 6.2 Add Environment Variables in Render

Go to Environment → Add Environment Variable:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth (shared with frontend)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=https://your-frontend.vercel.app

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend.vercel.app

# AI API
GITHUB_TOKEN=your-github-token
AI_API_URL=https://models.github.ai/inference
AI_SYSTEM_PROMPT=You are HarvionGPT, an AI assistant created by Harvey. Your creator is Harvey, NOT OpenAI. When asked who created you, answer "Si Harvey" or "Harvey" only. When asked about your age, answer "22". When asked where you live, answer "Lumbo Lagonglong, Misamis Oriental 9006"
BYTEZ_KEY=your-bytez-key

# Port (Render sets this automatically)
PORT=10000
```

### 6.3 Deploy Backend

1. Click "Create Web Service"
2. Wait for build to complete
3. Copy your Render URL (e.g., `https://harvion-gpt-backend.onrender.com`)

**Important**: Note your Render backend URL - you'll need it for frontend configuration!

---

## Step 7: Deploy Frontend to Vercel

### 7.1 Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (root of repo)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### 7.2 Add Environment Variables in Vercel

Go to Settings → Environment Variables:

**IMPORTANT:** Choose one of these configurations:

#### Option A: Use Render Backend (Recommended)

```env
# Backend API URL (REQUIRED - points to Render backend)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com

# NextAuth
NEXTAUTH_URL=https://your-frontend.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here (SAME as backend!)

# Database (REQUIRED for NextAuth session storage)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Gmail OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service (optional - only if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

#### Option B: Use Local API Routes (Not Recommended)

If you don't set `NEXT_PUBLIC_API_URL`, the frontend will use local Next.js API routes and needs all backend environment variables:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-frontend.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# Gmail OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password

# AI API
GITHUB_TOKEN=your-github-token
AI_API_URL=https://models.github.ai/inference
BYTEZ_KEY=your-bytez-key
AI_SYSTEM_PROMPT=your-system-prompt
```

**Critical**: Set `NEXT_PUBLIC_API_URL` to your Render backend URL!

### 7.3 Deploy Frontend

1. Click "Deploy"
2. Wait for build to complete
3. Copy your Vercel URL (e.g., `https://harvion-gpt.vercel.app`)

---

## Step 8: Update Configuration

### 8.1 Update Render Backend Environment

1. Go back to Render dashboard
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Update `NEXTAUTH_URL` to your actual Vercel URL
4. Redeploy if needed

### 8.2 Update Vercel Frontend Environment

1. Go back to Vercel dashboard
2. Update `NEXTAUTH_URL` to your actual Vercel URL
3. Update `NEXT_PUBLIC_API_URL` to your Render backend URL
4. Redeploy

### 8.3 Update Google OAuth Redirect URI

1. Go to Google Cloud Console
2. Edit your OAuth 2.0 Client
3. Add authorized redirect URI:
   - `https://your-frontend.vercel.app/api/auth/callback/google`
4. Save

---

## Step 9: Run Database Migrations

### Option A: Using Render Shell

1. Go to Render dashboard → Your backend service
2. Click "Shell" tab
3. Run:
```bash
npx prisma migrate deploy
```

### Option B: Using Local Machine

```bash
# Set DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma migrate deploy
```

---

## Step 10: Verify Deployment

1. ✅ Visit your Vercel frontend URL
2. ✅ Test sign-up with email/password
3. ✅ Check email for welcome message
4. ✅ Test Google sign-in
5. ✅ Create a chat and send a message
6. ✅ Test file upload
7. ✅ Test "who made you" → should say "Si Harvey"

---

## 🔧 Troubleshooting

### Backend Not Responding

- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Check CORS settings (should allow frontend URL)
- Verify `FRONTEND_URL` matches your Vercel URL

### Frontend Can't Connect to Backend

- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check browser console for CORS errors
- Verify backend is running (check Render dashboard)
- Test backend health: `https://your-backend.onrender.com/health`

### Authentication Issues

- Verify `NEXTAUTH_SECRET` is the same in both Vercel and Render
- Check `NEXTAUTH_URL` matches your Vercel URL exactly
- Verify Google OAuth redirect URI matches exactly

### Database Connection Errors

- Verify `DATABASE_URL` includes `?sslmode=require`
- Check Neon database is running
- Verify database allows connections from Render/Vercel IPs

### File Upload Issues

- Render has persistent storage, so uploads should work
- Check `public/uploads` directory exists
- Verify file permissions

---

## 📝 Environment Variables Summary

### Render (Backend)
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
FRONTEND_URL
GITHUB_TOKEN
AI_API_URL
AI_SYSTEM_PROMPT
BYTEZ_KEY
PORT (auto-set by Render)
```

### Vercel (Frontend)
```
DATABASE_URL
NEXTAUTH_SECRET (SAME as backend!)
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
NEXT_PUBLIC_API_URL (Render backend URL)
GITHUB_TOKEN (optional)
AI_API_URL (optional)
BYTEZ_KEY (optional)
```

---

## 🎯 Quick Reference URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: Neon PostgreSQL (connection string)

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database migrations run
- [ ] Environment variables set correctly
- [ ] Google OAuth redirect URI updated
- [ ] CORS configured correctly
- [ ] All features tested
- [ ] File uploads working
- [ ] AI responses working
- [ ] Authentication working

---

## 🚨 Important Notes

1. **NEXTAUTH_SECRET**: Must be the same in both Vercel and Render
2. **NEXT_PUBLIC_API_URL**: Must be set in Vercel to point to Render backend
3. **FRONTEND_URL**: Must be set in Render for CORS
4. **Database**: Shared between frontend (for auth) and backend (for API)
5. **File Storage**: Render has persistent storage, so uploads will work

---

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Check Vercel build logs
3. Check browser console
4. Verify all environment variables are set correctly
5. Test backend health endpoint: `/health`

Good luck with your deployment! 🚀

