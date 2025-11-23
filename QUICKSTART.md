# Quick Start Guide

Get HarvionGPT running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL database (free tier works)
- Gmail account for OAuth and email

## Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
# Database (get from Neon console)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# Gmail OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI API (use your AI service)
AI_API_KEY=your-api-key
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4-vision-preview
```

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Open Browser

Visit [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Sign Up**: Create an account with email/password or use Gmail
2. **Check Email**: You should receive a welcome email
3. **Start Chatting**: Type a message and start chatting with AI
4. **Upload Images**: Try uploading an image (up to 10 per 4 hours)
5. **View History**: Your chats are saved automatically

## Need Help?

- See [README.md](./README.md) for detailed documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
- Check the console for any errors

## Common Issues

**Database connection error?**
- Verify your `DATABASE_URL` is correct
- Make sure SSL mode is set: `?sslmode=require`

**Gmail OAuth not working?**
- Check redirect URI matches: `http://localhost:3000/api/auth/callback/google`
- Verify client ID and secret are correct

**Email not sending?**
- Enable 2FA on Gmail
- Generate an app password (not your regular password)
- Use the app password in `SMTP_PASSWORD`

**AI not responding?**
- Check your `AI_API_KEY` is valid
- Verify `AI_API_URL` is correct
- Check API rate limits

