# Deployment Guide

This guide will help you deploy HarvionGPT to Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account
- Vercel account
- Render account
- Neon PostgreSQL database
- Gmail account for OAuth and SMTP
- AI API key

## Step 1: Set up Neon PostgreSQL Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)
4. Save this for later use as `DATABASE_URL`

## Step 2: Set up Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the consent screen if prompted
6. Application type: Web application
7. Authorized redirect URIs:
   - For local: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-vercel-app.vercel.app/api/auth/callback/google`
8. Copy the Client ID and Client Secret

## Step 3: Set up Gmail SMTP

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Save this password (you'll use it as `SMTP_PASSWORD`)

## Step 4: Deploy to Vercel (Frontend)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add environment variables:
   ```
   DATABASE_URL=your-neon-connection-string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate-a-random-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   AI_API_KEY=your-ai-api-key
   AI_API_URL=https://api.openai.com/v1/chat/completions
   AI_MODEL=gpt-4-vision-preview
   ```
7. Click "Deploy"
8. After deployment, update the Gmail OAuth redirect URI with your Vercel URL

## Step 5: Deploy to Render (Backend)

**Note**: Since Next.js is a full-stack framework, you can deploy everything to Vercel. However, if you want to separate the backend:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `harvion-gpt-backend`
   - Environment: Node
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
5. Add the same environment variables as Vercel
6. Click "Create Web Service"

## Step 6: Run Database Migrations

After deployment, run migrations:

```bash
# For Vercel (via Vercel CLI or GitHub Actions)
npx prisma migrate deploy

# Or connect to your database and run migrations manually
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

## Step 7: Verify Deployment

1. Visit your Vercel URL
2. Try signing up with email/password
3. Check your email for the welcome message
4. Try signing in with Google
5. Create a chat and send a message
6. Test file upload functionality

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if SSL mode is required (add `?sslmode=require`)
- Ensure database is accessible from Vercel/Render IPs

### Authentication Issues
- Verify `NEXTAUTH_URL` matches your deployment URL
- Check OAuth redirect URIs match exactly
- Ensure `NEXTAUTH_SECRET` is set

### Email Issues
- Verify SMTP credentials are correct
- Check if app password is valid
- Ensure 2FA is enabled on Gmail account

### File Upload Issues
- For production, consider using cloud storage (S3, Cloudinary)
- Vercel has read-only filesystem, so local uploads won't persist
- Update upload route to use cloud storage service

## Production Recommendations

1. **File Storage**: Use AWS S3, Cloudinary, or similar for file uploads
2. **CDN**: Configure CDN for static assets
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **Rate Limiting**: Add rate limiting to API routes
5. **Caching**: Implement caching for chat history
6. **Backup**: Set up automated database backups

