'use client'
import dynamic from 'next/dynamic'

const EarthBackground = dynamic(() => import('./EarthBackground'), { ssr: false })

export default function Home() {
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

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Client Portal</span>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-white/40 text-sm">Sign in to manage your orders and artwork</p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Email address</label>
              <input
                type="email"
                placeholder="you@yourbrand.com"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="bg-white text-black rounded-lg py-3 text-sm font-semibold mt-2 hover:bg-white/90 transition-colors"
            >
              Sign in
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

        </div>
      </div>

    </main>
  )
}