'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi'
import ModelSelector from './ModelSelector'
import { api } from '@/lib/api'

export type ModelType = 'auto' | 'gpt-4.1' | 'gpt-4.1-bytez' | 'gpt-4.1-mini'

interface Attachment {
  url: string
  filename: string
  type: string
  size: number
}

interface ChatInputProps {
  onSendMessage: (
    message: string,
    attachments: Attachment[]
  ) => void
  disabled?: boolean
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  autoMode: boolean
  onAutoModeChange: (enabled: boolean) => void
}

export default function ChatInput({ 
  onSendMessage, 
  disabled,
  selectedModel,
  onModelChange,
  autoMode,
  onAutoModeChange
}: ChatInputProps) {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentLimit, setAttachmentLimit] = useState({
    remaining: 10,
    resetAt: null as Date | null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getTimeUntilReset = () => {
    if (!attachmentLimit.resetAt) return 'some time'
    const now = new Date()
    const reset = new Date(attachmentLimit.resetAt)
    const diff = reset.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    fetchAttachmentLimit()
  }, [])

  const fetchAttachmentLimit = async () => {
    if (!session) return
    try {
      const data = await api.getAttachmentLimit(session)
      setAttachmentLimit({
        remaining: data.remaining,
        resetAt: data.resetAt ? new Date(data.resetAt) : null,
      })
    } catch (error) {
      console.error('Error fetching attachment limit:', error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (attachmentLimit.remaining <= 0) {
      alert(
        `Attachment limit reached. You can upload again in ${getTimeUntilReset()}`
      )
      return
    }

    if (!session) {
      const event = new CustomEvent('toast', {
        detail: { message: 'Please sign in to upload files', type: 'error' }
      })
      window.dispatchEvent(event)
      return
    }

    setIsUploading(true)

    try {
      const file = files[0]
      const data = await api.uploadFile(file, session)
      setAttachments((prev) => [
        ...prev,
        {
          url: data.url,
          filename: data.filename,
          type: data.type,
          size: data.size,
        },
      ])
      setAttachmentLimit({
        remaining: data.remaining,
        resetAt: data.resetAt ? new Date(data.resetAt) : null,
      })
      const event = new CustomEvent('toast', {
        detail: { message: 'Image uploaded successfully!', type: 'success' }
      })
      window.dispatchEvent(event)
    } catch (error) {
      console.error('Error uploading file:', error)
      const event = new CustomEvent('toast', {
        detail: { message: 'Failed to upload file. Please try again.', type: 'error' }
      })
      window.dispatchEvent(event)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return

    onSendMessage(message, attachments)
    setMessage('')
    setAttachments([])
    fetchAttachmentLimit()
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // On mobile, disable Enter to send - user must click send button
    if (isMobile) {
      return // Allow Enter to work normally (new line) on mobile
    }
    // On desktop, Enter sends, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200/50 bg-white/80 backdrop-blur-xl shadow-2xl safe-area-inset-bottom relative z-10">
      <div className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 pb-2 border-b border-gray-200/30">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          autoMode={autoMode}
          onAutoModeChange={onAutoModeChange}
        />
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        {attachments.length > 0 && (
          <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 sm:gap-3">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group"
              >
                {attachment.type.startsWith('image/') ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg sm:rounded-xl overflow-hidden shadow-lg border-2 border-white">
                    <img
                      src={attachment.url}
                      alt={attachment.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg sm:rounded-xl shadow-lg border-2 border-white">
                    <span className="text-xs text-center truncate px-1 sm:px-2 text-gray-700 font-medium">
                      {attachment.filename}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg transform hover:scale-110 transition-all touch-manipulation"
                >
                  <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || attachmentLimit.remaining <= 0}
            className="p-2.5 sm:p-3 text-gray-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50 rounded-lg sm:rounded-xl transition-all touch-manipulation active:scale-95"
            title={
              attachmentLimit.remaining <= 0
                ? `Limit reached. Resets in ${getTimeUntilReset()}`
                : `${attachmentLimit.remaining} attachments remaining`
            }
          >
            <FiPaperclip className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1 relative min-w-0">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isMobile ? "Type your message... (Tap send to send)" : "Ask anything... (Press Enter to send)"}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 pr-16 sm:pr-20 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:opacity-50 bg-white shadow-lg text-gray-900 placeholder-gray-400 font-medium transition-all hover:border-purple-300 text-sm sm:text-base"
              style={{
                minHeight: '48px',
                maxHeight: '150px',
              }}
            />
            {attachmentLimit.remaining <= 0 && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                Limit: {getTimeUntilReset()}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || (!message.trim() && attachments.length === 0)}
            className="p-3 sm:p-3.5 lg:p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            <FiSend className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
