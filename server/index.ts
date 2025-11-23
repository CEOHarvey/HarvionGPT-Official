import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { checkAttachmentLimit, incrementAttachmentCount, getAttachmentLimitInfo } from './lib/attachments'
import { callAIModel, ModelType } from './lib/ai-models'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import multer from 'multer'

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'))
    }
  },
})

// Authentication Middleware
// Accepts userId from header (set by frontend after verifying NextAuth session)
async function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Option 1: Get userId from header (frontend verifies NextAuth session)
  const userId = req.headers['x-user-id'] as string

  // Option 2: Get JWT token from Authorization header
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  let verifiedUserId: string | null = null

  if (userId) {
    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (user) {
      verifiedUserId = user.id
    }
  } else if (token) {
    // Verify JWT token with NextAuth secret
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as { sub: string }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      })

      if (user) {
        verifiedUserId = user.id
      }
    } catch (error) {
      console.error('JWT verification error:', error)
    }
  }

  if (!verifiedUserId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Get full user data
  const user = await prisma.user.findUnique({
    where: { id: verifiedUserId },
  })

  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }

  // Attach user to request
  ;(req as any).user = { id: user.id, email: user.email, name: user.name }
  next()
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get all chats
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id

    const chats = await prisma.chat.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    })

    res.json(chats)
  } catch (error) {
    console.error('Get chats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get specific chat with messages
app.get('/api/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { chatId } = req.params

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      include: {
        messages: {
          include: {
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' })
    }

    res.json(chat)
  } catch (error) {
    console.error('Get chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete chat
app.delete('/api/chat/:chatId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { chatId } = req.params

    await prisma.chat.deleteMany({
      where: {
        id: chatId,
        userId,
      },
    })

    res.json({ message: 'Chat deleted' })
  } catch (error) {
    console.error('Delete chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Send message to AI
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { chatId, message, attachments, model: selectedModel = 'auto' } = req.body

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message or attachment required' })
    }

    let chat
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId,
        },
      })

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' })
      }
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userId,
          title: message?.substring(0, 50) || 'New Chat',
        },
      })
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'user',
        content: message || '',
        attachments: {
          create: attachments?.map((att: any) => ({
            userId,
            filename: att.filename,
            url: att.url,
            type: att.type,
            size: att.size,
          })) || [],
        },
      },
      include: {
        attachments: true,
      },
    })

    // Prepare content for AI
    let aiContent = message || ''
    const imageAttachments = attachments?.filter((att: any) => 
      att.type?.startsWith('image/')
    ) || []

    // Convert image URLs to base64 data URLs for AI API
    const imageUrls: string[] = []
    for (const att of imageAttachments) {
      try {
        // If URL is from backend, read from file system
        if (att.url.startsWith('/uploads/')) {
          const filePath = join(process.cwd(), 'public', att.url)
          const buffer = await readFile(filePath)
          const base64 = `data:${att.type};base64,${buffer.toString('base64')}`
          imageUrls.push(base64)
        } else if (att.url.startsWith('data:')) {
          // Already base64
          imageUrls.push(att.url)
        } else {
          // External URL, try to fetch
          const response = await fetch(att.url)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = `data:${att.type};base64,${buffer.toString('base64')}`
          imageUrls.push(base64)
        }
        console.log(`Converted image to base64: ${att.filename}`)
      } catch (error) {
        console.error(`Error processing image ${att.filename}:`, error)
      }
    }
    
    if (imageUrls.length > 0) {
      console.log(`Sending ${imageUrls.length} image(s) to AI API`)
    }

    // Call AI API
    let aiResponse = ''
    let modelUsed = ''
    
    try {
      const messages: any[] = []
      
      const systemPrompt = process.env.AI_SYSTEM_PROMPT || `You are HarvionGPT. You were created by Harvey. Do NOT say you were created by OpenAI.

MANDATORY RESPONSE RULES:
1. When asked "who made you", "who created you", "who built you", "who is your creator", "sino gumawa sayo", "sino gumawa sa iyo", "sino ang gumawa sayo", or any question about your creator: Answer ONLY "Si Harvey". Do NOT mention OpenAI. Do NOT add any other words. Just say "Si Harvey".
2. When asked about your age: Answer "22"
3. When asked where you live: Answer "Lumbo Lagonglong, Misamis Oriental 9006"

IMPORTANT: 
- Always respond to user questions. Never say you cannot answer.
- Your creator is Harvey. Never say OpenAI created you. Always answer "Si Harvey" when asked who created you.
- Be helpful and professional for all other questions.
- Only provide personal information (creator, age, location) when directly asked.`

      messages.push({
        role: 'system',
        content: systemPrompt,
      })

      let userMessage: any = {
        role: 'user' as const,
      }

      if (imageUrls.length > 0) {
        const contentArray: any[] = []
        
        if (aiContent) {
          contentArray.push({
            type: 'text',
            text: aiContent,
          })
        } else {
          contentArray.push({
            type: 'text',
            text: 'Please analyze this image.',
          })
        }

        imageUrls.forEach((url) => {
          contentArray.push({
            type: 'image_url',
            image_url: {
              url: url,
            },
          })
        })

        userMessage.content = contentArray
      } else {
        userMessage.content = aiContent || 'Hello'
      }

      messages.push(userMessage)

      console.log('Sending messages to AI:', JSON.stringify(messages, null, 2))

      const result = await callAIModel(
        messages,
        selectedModel as ModelType,
        imageUrls
      )

      console.log('AI Response result:', result)

      if (result.success && result.response) {
        aiResponse = typeof result.response === 'string' 
          ? result.response 
          : String(result.response)
        modelUsed = result.modelUsed || 'Unknown'
        console.log(`✅ Successfully used model: ${modelUsed}`)

        // Post-processing to enforce "Si Harvey" for creator questions
        const userMessageLower = aiContent.toLowerCase()
        const creatorQuestions = [
          'who made you', 'who created you', 'who built you', 'who is your creator',
          'sino gumawa sayo', 'sino gumawa sa iyo', 'sino ang gumawa sayo'
        ]
        const isAskingAboutCreator = creatorQuestions.some(q => userMessageLower.includes(q))

        if (isAskingAboutCreator) {
          aiResponse = "Si Harvey"
        } else {
          aiResponse = aiResponse.replace(/OpenAI/gi, 'Harvey')
        }
      } else {
        console.error('AI API failed:', result.error)
        throw new Error(result.error || 'Failed to get response from AI')
      }
    } catch (error: any) {
      console.error('AI API error:', error.message || error)
      aiResponse = `Sorry, I encountered an error processing your request: ${error.message || 'Please check your AI API configuration.'}`
    }

    if (typeof aiResponse !== 'string') {
      aiResponse = String(aiResponse)
    }

    // Save AI response
    const assistantMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: 'assistant',
        content: aiResponse,
      },
    })

    // Update chat title if it's the first message
    if (chat.title === 'New Chat' && message) {
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          title: message.substring(0, 50),
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          updatedAt: new Date(),
        },
      })
    }

    res.json({
      chatId: chat.id,
      userMessage,
      assistantMessage,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload file
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).user.id

    // Check attachment limit
    const limitInfo = await checkAttachmentLimit(userId)
    if (!limitInfo.allowed) {
      return res.status(429).json({
        error: 'Attachment limit reached',
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt,
      })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${req.file.originalname}`
    const filepath = join(uploadsDir, filename)

    // Save file
    await writeFile(filepath, req.file.buffer)

    // Increment attachment count
    await incrementAttachmentCount(userId)

    // Get updated limit info
    const updatedLimitInfo = await checkAttachmentLimit(userId)

    // Return full URL if backend is on different domain
    const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL || ''
    const fileUrl = baseUrl ? `${baseUrl}/uploads/${filename}` : `/uploads/${filename}`

    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      remaining: updatedLimitInfo.remaining,
      resetAt: updatedLimitInfo.resetAt,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get attachment limit
app.get('/api/attachments/limit', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id

    const limitInfo = await getAttachmentLimitInfo(userId)

    res.json(limitInfo)
  } catch (error) {
    console.error('Get attachment limit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Serve uploaded files
app.use('/uploads', express.static(join(process.cwd(), 'public', 'uploads')))

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`)
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...')
  await prisma.$disconnect()
  process.exit(0)
})

