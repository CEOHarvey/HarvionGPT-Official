// API configuration - switches between local Next.js API routes and external backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Helper to determine if we should use backend API or local routes
const useBackendAPI = !!API_BASE_URL

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  session?: any
): Promise<Response> {
  const url = useBackendAPI ? `${API_BASE_URL}${endpoint}` : endpoint

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // If using backend API and we have a session, add auth header
  if (useBackendAPI && session?.user?.id) {
    // Get JWT token from NextAuth
    // NextAuth stores JWT in httpOnly cookie, but backend needs Bearer token
    // We'll pass userId in header and backend will verify with NextAuth
    headers['X-User-Id'] = session.user.id
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

export const api = {
  getChats: async (session: any) => {
    const response = await apiRequest('/api/chats', { method: 'GET' }, session)
    if (!response.ok) throw new Error('Failed to fetch chats')
    return response.json()
  },

  getChat: async (chatId: string, session: any) => {
    const response = await apiRequest(`/api/chat/${chatId}`, { method: 'GET' }, session)
    if (!response.ok) throw new Error('Failed to fetch chat')
    return response.json()
  },

  deleteChat: async (chatId: string, session: any) => {
    const response = await apiRequest(`/api/chat/${chatId}`, { method: 'DELETE' }, session)
    if (!response.ok) throw new Error('Failed to delete chat')
    return response.json()
  },

  sendMessage: async (
    data: {
      chatId?: string
      message: string
      attachments?: any[]
      model?: string
    },
    session: any,
    signal?: AbortSignal
  ) => {
    const response = await apiRequest(
      '/api/chat',
      {
        method: 'POST',
        body: JSON.stringify(data),
        signal,
      },
      session
    )
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to send message' }))
      throw new Error(error.error || 'Failed to send message')
    }
    return response.json()
  },

  uploadFile: async (file: File, session: any) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''
    const url = API_BASE_URL ? `${API_BASE_URL}/api/upload` : '/api/upload'

    const formData = new FormData()
    formData.append('file', file)

    const headers: HeadersInit = {}
    if (API_BASE_URL && session?.user?.id) {
      headers['X-User-Id'] = session.user.id
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  },

  getAttachmentLimit: async (session: any) => {
    const response = await apiRequest('/api/attachments/limit', { method: 'GET' }, session)
    if (!response.ok) throw new Error('Failed to fetch attachment limit')
    return response.json()
  },
}

