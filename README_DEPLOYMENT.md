# 🚀 Quick Deployment Summary

## Architecture
- **Frontend**: Vercel (Next.js)
- **Backend**: Render (Express.js)
- **Database**: Neon PostgreSQL

## Quick Steps

1. **Backend (Render)**
   - Root Directory: `server`
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm start`
   - Set `FRONTEND_URL` to your Vercel URL

2. **Frontend (Vercel)**
   - Root Directory: `./`
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL

3. **Shared Environment Variables**
   - `DATABASE_URL` (same in both)
   - `NEXTAUTH_SECRET` (same in both)
   - `NEXTAUTH_URL` (Vercel frontend URL)

See `DEPLOYMENT_GUIDE.md` for complete instructions.

