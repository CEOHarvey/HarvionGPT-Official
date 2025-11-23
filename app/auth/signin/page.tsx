'use client'
import { signIn, getSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')  
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (error) {
      setError('Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('An error occurred')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Registration successful but sign in failed')
        setLoading(false)
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('An error occurred during registration')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-gradient"></div>
      
      {/* Animated Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Left Side - Premium Branding */}
      <div className="hidden md:flex md:w-1/2 relative z-10">
        <div className="w-full flex flex-col justify-center items-center text-white p-12 relative">
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl border-r border-white/10"></div>
          
          <div className="relative z-10 max-w-lg">
            {/* Logo/Brand */}
            <div className="mb-12">
              <h1 className="text-7xl font-black mb-4 tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                HarvionGPT
              </h1>
              <p className="text-xl text-purple-100 leading-relaxed">
                Experience the future of AI conversations. Intelligent, intuitive, and infinitely powerful.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6 mt-12">
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Smart AI Conversations</h3>
                  <p className="text-purple-200 text-sm">Advanced language models for natural, context-aware dialogues</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Image Analysis</h3>
                  <p className="text-purple-200 text-sm">AI-powered vision to understand and analyze your images</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Secure & Private</h3>
                  <p className="text-purple-200 text-sm">Enterprise-grade security with end-to-end encryption</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 min-h-screen md:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-6 sm:mb-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              HarvionGPT
            </h1>
          </div>

          {/* Glassmorphism Auth Card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/20 relative overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] hover:translate-x-[200%] transition-transform duration-1000"></div>
            
            <div className="relative z-10">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3">
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-purple-100 text-sm sm:text-base lg:text-lg">
                  {isRegistering 
                    ? 'Join thousands of users experiencing AI-powered conversations' 
                    : 'Sign in to continue your AI journey'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border-l-4 border-red-400 rounded-r-xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-200 font-semibold">{error}</p>
                  </div>
                </div>
              )}

              {/* Premium Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:bg-white/20 hover:border-white/50 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 mb-4 sm:mb-6 disabled:opacity-50 disabled:cursor-not-allowed group transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation text-sm sm:text-base"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <span className="text-sm sm:text-base lg:text-lg">Continue with Gmail</span>
              </button>

              {/* Premium Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-purple-200 font-semibold">Or continue with email</span>
                </div>
              </div>

              {/* Premium Form */}
              <form onSubmit={isRegistering ? handleRegister : handleEmailSignIn} className="space-y-4 sm:space-y-6">
                {isRegistering && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs sm:text-sm font-bold text-purple-100 mb-2 sm:mb-3"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all outline-none text-white placeholder-purple-200/50 font-medium text-base"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-bold text-purple-100 mb-2 sm:mb-3"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all outline-none text-white placeholder-purple-200/50 font-medium text-base"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs sm:text-sm font-bold text-purple-100 mb-2 sm:mb-3"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all outline-none text-white placeholder-purple-200/50 font-medium text-base"
                    placeholder="••••••••"
                  />
                  {isRegistering && (
                    <p className="mt-2 text-xs text-purple-200/70">Must be at least 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-black py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base lg:text-lg relative overflow-hidden group touch-manipulation"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      isRegistering ? 'Create Account' : 'Sign In'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </form>

              {/* Toggle Register/Sign In */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    setError('')
                  }}
                  className="text-sm text-purple-200 hover:text-white font-semibold transition-colors"
                >
                  {isRegistering ? (
                    <>
                      Already have an account?{' '}
                      <span className="text-white font-black underline decoration-2 underline-offset-4">Sign in</span>
                    </>
                  ) : (
                    <>
                      Don't have an account?{' '}
                      <span className="text-white font-black underline decoration-2 underline-offset-4">Register</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-purple-200/70">
            By continuing, you agree to our{' '}
            <a href="#" className="text-purple-300 hover:text-white underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-purple-300 hover:text-white underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}
