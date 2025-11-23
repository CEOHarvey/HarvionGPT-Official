'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Sidebar from './Sidebar'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import ModelSelector, { ModelType } from './ModelSelector'
import Toast from './Toast'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  attachments?: Array<{
    id: string
    filename: string
    url: string
    type: string
  }>
}

interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export default function ChatInterface() {
  const { data: session } = useSession()
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelType>('auto')
  const [autoMode, setAutoMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load model preference from localStorage (default to auto mode)
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel') as ModelType
    const savedAutoMode = localStorage.getItem('autoMode')
    
    // Default to auto mode if nothing is saved
    if (savedModel) {
      setSelectedModel(savedModel)
    } else {
      setSelectedModel('auto')
      localStorage.setItem('selectedModel', 'auto')
    }
    
    if (savedAutoMode !== null) {
      setAutoMode(savedAutoMode === 'true')
    } else {
      setAutoMode(true)
      localStorage.setItem('autoMode', 'true')
    }
  }, [])

  useEffect(() => {
    const handleToast = (e: CustomEvent) => {
      setToast({ message: e.detail.message, type: e.detail.type })
    }
    window.addEventListener('toast' as any, handleToast as EventListener)
    return () => window.removeEventListener('toast' as any, handleToast as EventListener)
  }, [])

  useEffect(() => {
    fetchChats()
  }, [])

  useEffect(() => {
    if (currentChatId) {
      fetchChat(currentChatId)
    } else {
      setMessages([])
    }
  }, [currentChatId])

  const fetchChats = async () => {
    if (!session) return
    try {
      const data = await api.getChats(session)
      setChats(data)
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const fetchChat = async (chatId: string) => {
    if (!session) return
    try {
      const data = await api.getChat(chatId, session)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching chat:', error)
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
    setMessages([])
  }

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!session) return
    try {
      await api.deleteChat(chatId, session)
      setChats(chats.filter((chat) => chat.id !== chatId))
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const handleSendMessage = async (
    message: string,
    attachments: Array<{ url: string; filename: string; type: string; size: number }>
  ) => {
    if (!message && attachments.length === 0) return

    setIsLoading(true)
    setIsGenerating(true)

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
      attachments: attachments.map((att) => ({
        id: `temp-att-${Date.now()}`,
        filename: att.filename,
        url: att.url,
        type: att.type,
      })),
    }

    setMessages((prev) => [...prev, userMessage])

    // Create abort controller for stop generation
    abortControllerRef.current = new AbortController()

    if (!session) return
    
    try {
      const data = await api.sendMessage(
        {
          chatId: currentChatId || undefined,
          message,
          attachments,
          model: autoMode ? 'auto' : selectedModel,
        },
        session,
        abortControllerRef.current.signal
      )

      // Update messages with server response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== userMessage.id)
        return [
          ...filtered,
          data.userMessage,
          {
            id: data.assistantMessage.id,
            role: 'assistant',
            content: data.assistantMessage.content,
            createdAt: data.assistantMessage.createdAt,
          },
        ]
      })

      // Update current chat ID if it's a new chat
      if (!currentChatId && data.chatId) {
        setCurrentChatId(data.chatId)
        fetchChats()
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User stopped generation
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== userMessage.id)
          return [
            ...filtered,
            {
              ...userMessage,
              id: userMessage.id.replace('temp-', ''),
            },
            {
              id: `stopped-${Date.now()}`,
              role: 'assistant',
              content: 'Generation stopped by user.',
              createdAt: new Date().toISOString(),
            },
          ]
        })
      } else {
        console.error('Error sending message:', error)
        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== userMessage.id)
          return filtered
        })
        const event = new CustomEvent('toast', {
          detail: { message: error.message || 'Failed to send message. Please try again.', type: 'error' }
        })
        window.dispatchEvent(event)
      }
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={() => {
            handleNewChat()
            setSidebarOpen(false)
          }}
          onSelectChat={(chatId) => {
            handleSelectChat(chatId)
            setSidebarOpen(false)
          }}
          onDeleteChat={handleDeleteChat}
          user={session?.user}
        />
      </div>
      
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        {/* Mobile Header with Menu Button */}
        <div className="relative z-20 p-3 lg:p-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                HarvionGPT
              </h1>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto relative z-10 safe-area-inset-bottom">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4 py-8">
              <div className="text-center max-w-2xl w-full">
                <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl mb-6 transform hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient px-4">
                  What are you working on?
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8 px-4">
                  Start a conversation with AI. Ask questions, get insights, or explore creative ideas.
                </p>
                <div className="flex flex-wrap gap-2 lg:gap-3 justify-center px-4">
                  <button
                    onClick={() => {
                      const input = document.querySelector('textarea') as HTMLTextAreaElement
                      if (input) {
                        input.value = 'Explain quantum computing in simple terms'
                        input.dispatchEvent(new Event('input', { bubbles: true }))
                        input.focus()
                      }
                    }}
                    className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all font-medium cursor-pointer"
                  >
                    💡 Ask questions
                  </button>
                  <button
                    onClick={() => {
                      const input = document.querySelector('textarea') as HTMLTextAreaElement
                      if (input) {
                        input.value = 'Write a creative story about...'
                        input.dispatchEvent(new Event('input', { bubbles: true }))
                        input.focus()
                      }
                    }}
                    className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all font-medium cursor-pointer"
                  >
                    🎨 Get creative
                  </button>
                  <button
                    onClick={() => {
                      const input = document.querySelector('textarea') as HTMLTextAreaElement
                      if (input) {
                        input.value = 'Analyze this data and provide insights...'
                        input.dispatchEvent(new Event('input', { bubbles: true }))
                        input.focus()
                      }
                    }}
                    className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all font-medium cursor-pointer"
                  >
                    📊 Analyze data
                  </button>
                  <button
                    onClick={() => {
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
                      if (fileInput) fileInput.click()
                    }}
                    className="px-5 py-2.5 bg-white/90 backdrop-blur-sm rounded-full text-sm text-gray-700 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105 transition-all font-medium cursor-pointer"
                  >
                    🖼️ Upload images
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ChatMessages
              messages={messages}
              isGenerating={isGenerating}
              onStopGeneration={handleStopGeneration}
            />
          )}
        </div>
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          selectedModel={selectedModel}
          onModelChange={(model) => {
            setSelectedModel(model)
            localStorage.setItem('selectedModel', model)
          }}
          autoMode={autoMode}
          onAutoModeChange={(enabled) => {
            setAutoMode(enabled)
            localStorage.setItem('autoMode', enabled.toString())
            if (enabled) {
              setSelectedModel('auto')
              localStorage.setItem('selectedModel', 'auto')
            }
          }}
        />
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
