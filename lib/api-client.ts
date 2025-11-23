// API Client for backend communication
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:3001'

export async function getAuthToken(): Promise<string | null> {
  // Get JWT token from NextAuth session
  // This will be handled by NextAuth's getSession
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  
  if (!session) return null
  
  // NextAuth stores JWT in a cookie, we need to extract it
  // For now, we'll use a different approach - get token from cookies
  if (typeof window !== 'undefined') {
    // Client-side: get token from NextAuth
    const response = await fetch('/api/auth/session')
    const data = await response.json()
    // NextAuth doesn't expose token directly, so we'll need to modify the approach
    // For now, we'll pass userId and verify on backend
    return data?.user?.id || null
  }
  
  return session.user?.id || null
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get session token
  const { getSession } = await import('next-auth/react')
  const session = await getSession()
  
  if (!session) {
    throw new Error('Not authenticated')
  }

  // Get JWT token from NextAuth
  // NextAuth stores JWT in httpOnly cookie, but we need to pass it as Bearer token
  // We'll use a workaround: pass userId and verify on backend with session
  const token = session.user?.id

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // If we have a token, add Authorization header
  if (token) {
    // For now, we'll use a custom approach where backend verifies session
    // In production, you'd want to get the actual JWT from NextAuth
    headers['X-User-Id'] = token
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const apiClient = {
  // Chats
  getChats: () => fetchWithAuth('/api/chats'),
  
  getChat: (chatId: string) => fetchWithAuth(`/api/chat/${chatId}`),
  
  deleteChat: (chatId: string) => fetchWithAuth(`/api/chat/${chatId}`, { method: 'DELETE' }),
  
  sendMessage: (data: {
    chatId?: string
    message: string
    attachments?: any[]
    model?: string
  }) => fetchWithAuth('/api/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Upload
  uploadFile: async (file: File) => {
    const { getSession } = await import('next-auth/react')
    const session = await getSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'X-User-Id': session.user?.id || '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  },

  // Attachments
  getAttachmentLimit: () => fetchWithAuth('/api/attachments/limit'),
}

