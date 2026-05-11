'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase'

const EarthBackground = dynamic(() => import('./EarthBackground'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'forgot'
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('Invalid email or password. Contact your account rep if you need access.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setResetLoading(true)
    setResetMsg('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/settings?reset=true`,
    })
    if (error) setResetMsg('Something went wrong. Check the email address and try again.')
    else setResetMsg('Check your email — a reset link is on its way.')
    setResetLoading(false)
  }

  return (
    <main className="min-h-screen flex bg-black relative overflow-hidden">

      <div className="absolute inset-0 z-0">
        <EarthBackground />
      </div>

      <div className="absolute inset-0 bg-black/55 z-10"></div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-20">
        <div>
          <img
            src="/logo.png"
            alt="S&A Screen Printing"
            style={{ width: '160px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <div>
          <h2 className="text-4xl font-semibold text-white leading-tight mb-4">
            Your print partner.<br />Your portal.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm">
            Track every order in real time, upload artwork, manage your inventory, and stay connected with your production team — all in one place.
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-white text-xl font-semibold">2 day</p>
            <p className="text-white/30 text-xs">turnaround SLA</p>
          </div>
          <div className="w-px bg-white/10"></div>
          <div>
            <p className="text-white text-xl font-semibold">100%</p>
            <p className="text-white/30 text-xs">in-house printing</p>
          </div>
          <div className="w-px bg-white/10"></div>
          <div>
            <p className="text-white text-xl font-semibold">Live</p>
            <p className="text-white/30 text-xs">order tracking</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-16 relative z-20">
        <div className="w-full max-w-sm mx-auto">

          <div className="lg:hidden mb-10">
            <img
              src="/logo.png"
              alt="S&A Screen Printing"
              style={{ width: '120px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </div>

          {mode === 'login' ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Client Portal</span>
                </div>
                <h1 className="text-3xl font-semibold text-white mb-2">Welcome back</h1>
                <p className="text-white/40 text-sm">Sign in to manage your orders and artwork</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourbrand.com"
                    required
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => setMode('forgot')}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors w-full"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-lg">
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white text-black rounded-lg py-3 text-sm font-semibold mt-2 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="flex items-center gap-3 mt-8">
                <span className="h-px flex-1 bg-white/10"></span>
                <span className="text-white/20 text-xs">or</span>
                <span className="h-px flex-1 bg-white/10"></span>
              </div>

              <p className="text-xs text-white/20 text-center mt-6">
                Don't have access?{' '}
                <span className="text-white/50 cursor-pointer hover:text-white transition-colors">
                  Contact your account rep
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button onClick={() => { setMode('login'); setResetMsg(''); }}
                  className="text-white/40 text-xs hover:text-white/70 transition-colors mb-6 flex items-center gap-1">
                  ← Back to sign in
                </button>
                <h1 className="text-3xl font-semibold text-white mb-2">Reset password</h1>
                <p className="text-white/40 text-sm">Enter your email and we'll send a reset link.</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Email address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@yourbrand.com"
                    required
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors"
                  />
                </div>

                {resetMsg && (
                  <div className={`rounded-lg px-4 py-3 ${resetMsg.includes('way') ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <p className={`text-xs ${resetMsg.includes('way') ? 'text-green-400' : 'text-red-400'}`}>{resetMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="bg-white text-black rounded-lg py-3 text-sm font-semibold mt-2 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>

    </main>
  )
}
