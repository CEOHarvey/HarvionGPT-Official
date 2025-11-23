import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callAIModel, ModelType } from '@/lib/ai-models'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, message, attachments, model: selectedModel = 'auto' } = await req.json()

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachment required' },
        { status: 400 }
      )
    }

    let chat
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: session.user.id,
        },
      })

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          title: message.substring(0, 50) || 'New Chat',
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
            userId: session.user.id,
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

    // Convert images to base64 data URLs for AI API
    const imageUrls: string[] = []
    for (const att of imageAttachments) {
      try {
        if (att.url.startsWith('data:')) {
          // Already a data URL
          imageUrls.push(att.url)
        } else if (att.url.startsWith('http')) {
          // External URL, use as-is
          imageUrls.push(att.url)
        } else {
          // Local file, convert to base64
          const filePath = att.url.startsWith('/') 
            ? att.url.substring(1) 
            : att.url
          const fullPath = join(process.cwd(), 'public', filePath)
          const imageBuffer = await readFile(fullPath)
          const base64 = imageBuffer.toString('base64')
          const mimeType = att.type || 'image/jpeg'
          const dataUrl = `data:${mimeType};base64,${base64}`
          imageUrls.push(dataUrl)
          console.log(`Converted image to base64: ${att.filename}`)
        }
      } catch (error) {
        console.error(`Error processing image ${att.filename}:`, error)
        // Skip this image if there's an error
      }
    }
    
    if (imageUrls.length > 0) {
      console.log(`Sending ${imageUrls.length} image(s) to AI API`)
    }

    // Call AI API with multi-model support and auto-switching
    let aiResponse = ''
    let modelUsed = ''
    
    try {
      // Build messages array
      const messages: any[] = []
      
      // System prompt with Harvey's information
      const systemPrompt = process.env.AI_SYSTEM_PROMPT || `You are HarvionGPT, an AI assistant created by Harvey. Your creator is Harvey, NOT OpenAI.

CRITICAL RULES - You MUST follow these:
1. When asked "who made you", "who created you", "who built you", "who is your creator", "sino gumawa sayo", or any question about your creator: Answer "Si Harvey" or "Harvey" ONLY. Never mention OpenAI. Never say you were created by OpenAI.
2. When asked about your age: Answer "22"
3. When asked where you live: Answer "Lumbo Lagonglong, Misamis Oriental 9006"

IMPORTANT: Your creator is Harvey. Always answer "Si Harvey" or "Harvey" when asked who created you. Never mention OpenAI.`

      messages.push({
        role: 'system',
        content: systemPrompt,
      })

      // Build user message content with images
      let userMessage: any = {
        role: 'user' as const,
      }

      // If there are images, use content array format (vision model format)
      if (imageUrls.length > 0) {
        const contentArray: any[] = []
        
        // Add text content if available
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

        // Add images
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
        // No images, just send text
        userMessage.content = aiContent || 'Hello'
      }

      messages.push(userMessage)

      // Call AI with model selection and auto-fallback
      const result = await callAIModel(
        messages,
        selectedModel as ModelType,
        imageUrls
      )

      if (result.success && result.response) {
        // Ensure response is a string
        aiResponse = typeof result.response === 'string' 
          ? result.response 
          : String(result.response)
        
        // Post-process: If user asked about creator, ensure response says "Harvey" or "Si Harvey"
        const userMessageLower = aiContent.toLowerCase()
        const isAskingAboutCreator = userMessageLower.includes('who made you') || 
                                     userMessageLower.includes('who created you') || 
                                     userMessageLower.includes('who built you') || 
                                     userMessageLower.includes('who is your creator') ||
                                     userMessageLower.includes('sino gumawa sayo') ||
                                     userMessageLower.includes('sino gumawa sa iyo') ||
                                     userMessageLower.includes('sino ang gumawa sayo')
        
        if (isAskingAboutCreator) {
          // If response mentions OpenAI, replace with Harvey
          if (aiResponse.toLowerCase().includes('openai')) {
            // Extract just "Harvey" or "Si Harvey" as the answer
            aiResponse = 'Si Harvey'
          } else if (!aiResponse.toLowerCase().includes('harvey')) {
            // If Harvey is not mentioned, add it
            aiResponse = 'Si Harvey'
          } else {
            // If Harvey is mentioned, ensure it's the main answer
            // Extract Harvey from response or use "Si Harvey"
            const harveyMatch = aiResponse.match(/harvey/i)
            if (harveyMatch) {
              // Keep the response but ensure it's clear
              aiResponse = aiResponse.replace(/openai/gi, 'Harvey')
              // If response is too long, simplify to just "Si Harvey"
              if (aiResponse.length > 50) {
                aiResponse = 'Si Harvey'
              }
            } else {
              aiResponse = 'Si Harvey'
            }
          }
        }
        
        modelUsed = result.modelUsed || 'Unknown'
        console.log(`✅ Successfully used model: ${modelUsed}`)
      } else {
        throw new Error(result.error || 'Failed to get response from AI')
      }
    } catch (error: any) {
      console.error('AI API error:', error.message || error)
      aiResponse = `Sorry, I encountered an error processing your request: ${error.message || 'Please check your AI API configuration.'}`
    }

    // Ensure aiResponse is always a string before saving
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

    return NextResponse.json({
      chatId: chat.id,
      userMessage,
      assistantMessage,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

