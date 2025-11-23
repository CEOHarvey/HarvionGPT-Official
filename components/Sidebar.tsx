'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { FiPlus, FiTrash2, FiMenu, FiX } from 'react-icons/fi'

interface Chat {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface SidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  user,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat?')) {
      onDeleteChat(chatId)
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={`${
        isExpanded ? 'w-72' : 'w-20'
      } h-full bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col transition-all duration-300 shadow-2xl relative z-20`}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          {isExpanded ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/logo.png" 
                alt="HarvionGPT Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
              />
              <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                HarvionGPT
              </h2>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <img 
                src="/logo.png" 
                alt="HarvionGPT Logo" 
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>
        
        <button
          onClick={onNewChat}
          className={`w-full flex items-center ${isExpanded ? 'gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3' : 'justify-center p-3'} rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base touch-manipulation`}
          title={!isExpanded ? 'New Chat' : ''}
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          {isExpanded && <span>New Chat</span>}
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 sm:space-y-2">
        {isExpanded && (
          <>
            <h3 className="text-xs font-bold text-purple-300 uppercase mb-2 sm:mb-3 px-2 tracking-wider">
              Recent Chats
            </h3>
            {chats.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-purple-200/60">
                <p className="text-xs sm:text-sm">No chats yet</p>
                <p className="text-xs mt-1">Start a new conversation!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all touch-manipulation ${
                      currentChatId === chat.id
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm border border-purple-500/30 shadow-lg'
                        : 'hover:bg-white/5 border border-transparent active:bg-white/10'
                    }`}
                  >
                    <span className="truncate flex-1 text-xs sm:text-sm font-medium">
                      {chat.title}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-1.5 hover:bg-red-500/20 rounded-lg transition-all touch-manipulation"
                    >
                      <FiTrash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg flex-shrink-0">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || 'User'}
                className="w-full h-full rounded-lg sm:rounded-xl object-cover"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold truncate">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-purple-200/70 truncate">
                {user?.email}
              </div>
            </div>
          )}
        </div>
        {isExpanded && (
          <button
            onClick={() => signOut()}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors text-left border border-white/10 hover:border-white/20 touch-manipulation"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
