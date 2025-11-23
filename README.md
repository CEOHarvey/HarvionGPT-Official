# HarvionGPT

A ChatGPT-like application built with Next.js, Node.js, and Neon PostgreSQL. Features include user authentication, chat history, file attachments with limits, and AI-powered conversations.

## Features

- 🔐 **Authentication**: Gmail OAuth and email/password registration
- 📧 **Email Verification**: Welcome emails sent after registration
- 💬 **Chat Interface**: ChatGPT-like UI with real-time messaging
- 📝 **Chat History**: Persistent chat history saved in database
- 📎 **File Attachments**: Image uploads with AI vision support
- ⏱️ **Attachment Limits**: 10 attachments per user, resets every 4 hours
- ⏹️ **Stop Generation**: Ability to stop AI response generation
- 🎨 **Modern UI**: Clean, responsive design matching ChatGPT

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Email**: Nodemailer with Gmail SMTP
- **Hosting**: 
  - Frontend: Vercel
  - Backend: Render

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd HarvionGPT
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Gmail OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-harviongpt@gmail.com
SMTP_PASSWORD=your-app-password

# AI API (GitHub AI Inference & Bytez)
GITHUB_TOKEN=your-github-token
AI_API_URL=https://models.github.ai/inference
AI_SYSTEM_PROMPT=You are a helpful AI assistant.
BYTEZ_KEY=your-bytez-key (optional, defaults to provided key)
```

### 4. Set up database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Backend (Render)

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Set build command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Database (Neon PostgreSQL)

1. Create a new project in Neon
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy`

## Environment Variables Setup

### Gmail OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### Gmail SMTP

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASSWORD`

### AI API

Configure your AI API endpoint and API key. The default is set to OpenAI's API, but you can use any compatible API.

## Project Structure

```
HarvionGPT/
├── app/
│   ├── api/          # API routes
│   ├── auth/         # Authentication pages
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
├── lib/             # Utility functions
├── prisma/          # Database schema
└── public/          # Static files
```

## Features in Detail

### Attachment System

- Users can upload up to 10 images per 4-hour period
- The limit resets automatically every 4 hours
- Attachments are displayed in chat messages
- AI can analyze uploaded images

**Note**: For production deployments, consider using cloud storage (AWS S3, Cloudinary, etc.) instead of local file storage, especially when deploying to Vercel which has read-only filesystem.

### Chat History

- All chats are saved in the database
- Users can view and delete previous chats
- Chat titles are auto-generated from the first message

### Stop Generation

- Users can stop AI response generation at any time
- Uses AbortController to cancel ongoing requests

## License

MIT

