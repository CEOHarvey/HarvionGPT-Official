'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { FiStopCircle, FiUser, FiCopy, FiCheck } from 'react-icons/fi'

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

interface ChatMessagesProps {
  messages: Message[]
  isGenerating: boolean
  onStopGeneration: () => void
}

export default function ChatMessages({
  messages,
  isGenerating,
  onStopGeneration,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
      
      // Show visual feedback
      const event = new CustomEvent('toast', {
        detail: { message: 'Message copied to clipboard!', type: 'success' }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Failed to copy:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Failed to copy message', type: 'error' }
      })
      window.dispatchEvent(event)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 space-y-4 sm:space-y-6 lg:space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 sm:gap-3 lg:gap-4 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="HarvionGPT Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className={`flex flex-col gap-1 sm:gap-2 max-w-[85%] sm:max-w-2xl lg:max-w-3xl ${message.role === 'user' ? 'items-end' : 'items-start'} group`}>
              <div
                className={`rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg relative ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                    : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-200'
                }`}
              >
                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-0 transition-all touch-manipulation active:opacity-100 ${
                    message.role === 'user'
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Copy message"
                >
                  {copiedId === message.id ? (
                    <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <FiCopy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-2 sm:mb-3 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="relative">
                        {attachment.type.startsWith('image/') ? (
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                            className="max-w-full h-auto rounded-lg sm:rounded-xl shadow-md"
                          />
                        ) : (
                          <div className="p-2 sm:p-3 bg-gray-100 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                            {attachment.filename}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        // Code blocks with syntax highlighting
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          
                          // Helper function to extract text from React children
                          const extractText = (child: any): string => {
                            if (typeof child === 'string') {
                              return child
                            }
                            if (typeof child === 'number') {
                              return String(child)
                            }
                            if (Array.isArray(child)) {
                              return child.map(extractText).join('')
                            }
                            if (child && typeof child === 'object' && child.props) {
                              return extractText(child.props.children)
                            }
                            return ''
                          }
                          
                          const codeText = extractText(children)
                          
                          return !inline && match ? (
                            <div className="relative my-4 rounded-lg overflow-hidden border border-gray-300 shadow-lg">
                              <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
                                <span className="text-xs text-gray-300 font-mono uppercase">{match[1]}</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(codeText)
                                      const event = new CustomEvent('toast', {
                                        detail: { message: 'Code copied!', type: 'success' }
                                      })
                                      window.dispatchEvent(event)
                                    } catch (error) {
                                      console.error('Failed to copy code:', error)
                                    }
                                  }}
                                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
                                  title="Copy code"
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className="m-0 p-4 bg-gray-950 overflow-x-auto" {...props}>
                                <code className={`${className} text-sm font-mono`} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          )
                        },
                        // Headings
                        h1: ({ children }: any) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>,
                        h2: ({ children }: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">{children}</h2>,
                        h3: ({ children }: any) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h3>,
                        // Lists
                        ul: ({ children }: any) => <ul className="list-disc list-inside my-3 space-y-1 text-gray-700">{children}</ul>,
                        ol: ({ children }: any) => <ol className="list-decimal list-inside my-3 space-y-1 text-gray-700">{children}</ol>,
                        li: ({ children }: any) => <li className="ml-4 text-gray-700">{children}</li>,
                        // Paragraphs
                        p: ({ children }: any) => <p className="my-2 text-gray-700 leading-relaxed">{children}</p>,
                        // Links
                        a: ({ href, children }: any) => (
                          <a href={href} className="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        // Strong/Bold
                        strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
                        // Emphasis/Italic
                        em: ({ children }: any) => <em className="italic text-gray-700">{children}</em>,
                        // Blockquotes
                        blockquote: ({ children }: any) => (
                          <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600">
                            {children}
                          </blockquote>
                        ),
                        // Tables
                        table: ({ children }: any) => (
                          <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-gray-300">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }: any) => (
                          <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                            {children}
                          </th>
                        ),
                        td: ({ children }: any) => (
                          <td className="border border-gray-300 px-4 py-2">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-white font-medium">{message.content}</div>
                )}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isGenerating && (
          <div className="flex justify-start gap-2 sm:gap-3 lg:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-lg">
              <img 
                src="/logo.png" 
                alt="HarvionGPT Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="max-w-[85%] sm:max-w-2xl lg:max-w-3xl rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-purple-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-pink-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                  <div
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  ></div>
                </div>
                <button
                  onClick={onStopGeneration}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md font-semibold"
                >
                  <FiStopCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  )
}
