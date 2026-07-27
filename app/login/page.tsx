'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Brain, Shield, BarChart2, Calendar, Users, CheckCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/Logo'
import { Reveal } from '@/components/brand/Reveal'

export const dynamic = 'force-dynamic'

const features = [
  {
    icon: Brain,
    title: 'Behavioral Ledger',
    description: 'Track how each client thinks, reacts, and decides — not just what they own.',
  },
  {
    icon: BarChart2,
    title: 'Risk Gap Analysis',
    description: 'Reveal the gap between stated risk tolerance and actual behavior under pressure.',
  },
  {
    icon: Calendar,
    title: 'Review Cycles',
    description: 'Structured periodic reviews that build long-term advisor-client alignment.',
  },
  {
    icon: Shield,
    title: 'Decision Journal',
    description: 'A living record of every financial decision, context, and emotional state.',
  },
]

const testimonials = [
  {
    quote: 'Accrion changed how I understand my clients. I now see patterns I never noticed before.',
    name: 'Priya Sharma',
    role: 'CFP, Wealth Advisor',
  },
  {
    quote: 'The behavioral insights help me have conversations that actually matter.',
    name: 'Rahul Gupta',
    role: 'Independent Financial Advisor',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [testimonialIdx] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error('Invalid email or password')
      const user = data.user
      let role: string = user.user_metadata?.role ?? ''
      if (!role) {
        const { data: dbUser } = await supabase
          .from('users').select('role, name').eq('email', user.email).maybeSingle()
        role = dbUser?.role ?? 'CLIENT'
        await supabase.auth.updateUser({ data: { role, name: dbUser?.name ?? '' } })
      }
      if (role === 'ADVISOR') {
        router.push('/advisor/dashboard')
      } else {
        router.push('/client/portal')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (type: 'advisor' | 'client') => {
    if (type === 'advisor') {
      setEmail('tanay@accrion.co'); setPassword('advisor123')
    } else {
      setEmail('arjun.mehta@email.com'); setPassword('client123')
    }
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-bg-primary">

      {/* ── Left Panel: Marketing ── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-bg-secondary border-r border-border p-12 relative overflow-hidden">

        {/* Decorative background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-accent-warm/5 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full bg-accent/4 blur-2xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="mb-16">
            <Logo size={40} href={null} />
          </div>

          {/* Hero */}
          <Reveal className="mb-14">
            <h1 className="font-display font-bold text-5xl text-fg-primary leading-tight mb-5">
              Financial advice
              <br />
              <span className="gradient-text">rooted in behavior.</span>
            </h1>
            <p className="text-lg text-fg-secondary leading-relaxed max-w-lg">
              Accrion is a behavioral financial advisory platform. Track how your clients
              actually think, not just what they own — and build relationships that last decades.
            </p>
          </Reveal>

          {/* Features */}
          <Reveal delay={0.1} className="grid grid-cols-2 gap-4 mb-14">
            {features.map((feature) => (
              <div key={feature.title} className="bg-bg-primary/60 border border-border rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-semibold text-fg-primary text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-fg-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </Reveal>

          {/* Trust signals */}
          <div className="flex items-center gap-6 text-xs text-fg-muted">
            {['Long-horizon focus', 'Behavioral science', 'Advisor-first design'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="border-t border-border pt-8">
            <blockquote className="text-fg-secondary text-sm leading-relaxed italic mb-3">
              &ldquo;{testimonials[testimonialIdx].quote}&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-accent" />
              </div>
              <div>
                <div className="text-sm font-medium text-fg-primary">{testimonials[testimonialIdx].name}</div>
                <div className="text-xs text-fg-muted">{testimonials[testimonialIdx].role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-16 min-h-screen lg:min-h-0">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Logo size={36} href={null} />
        </div>

        <div className="w-full max-w-[400px]">

          {/* Header */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-fg-primary mb-2">Welcome back</h2>
            <p className="text-fg-muted">Sign in to your advisory platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-fg-primary mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="w-full px-4 py-3.5 bg-bg-secondary border border-border rounded-xl text-fg-primary
                           placeholder:text-fg-muted text-[15px]
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                           disabled:opacity-50 transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-fg-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3.5 pr-12 bg-bg-secondary border border-border rounded-xl text-fg-primary
                             placeholder:text-fg-muted text-[15px]
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                             disabled:opacity-50 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span>{error}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.015 }}
              whileTap={loading ? undefined : { scale: 0.985 }}
              className="w-full py-3.5 bg-grad-brand text-white font-semibold rounded-xl transition-shadow duration-200
                         hover:shadow-[0_8px_30px_-8px_var(--glow-violet)]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2.5 text-[15px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-fg-muted">or try a demo account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillDemo('advisor')}
              disabled={loading}
              className="p-4 bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent/30 rounded-xl
                         transition-all duration-200 text-left group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center mb-2.5">
                <Users className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-xs font-semibold text-accent mb-1">Advisor Demo</div>
              <div className="text-[11px] font-mono text-fg-muted space-y-0.5">
                <div className="truncate">tanay@accrion.co</div>
                <div>advisor123</div>
              </div>
              <div className="text-[10px] text-fg-muted/60 mt-2 group-hover:text-accent transition-colors">
                Click to fill →
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('client')}
              disabled={loading}
              className="p-4 bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent-warm/30 rounded-xl
                         transition-all duration-200 text-left group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-lg bg-accent-warm/10 flex items-center justify-center mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent-warm" />
              </div>
              <div className="text-xs font-semibold text-accent-warm mb-1">Client Demo</div>
              <div className="text-[11px] font-mono text-fg-muted space-y-0.5">
                <div className="truncate">arjun.mehta@email.com</div>
                <div>client123</div>
              </div>
              <div className="text-[10px] text-fg-muted/60 mt-2 group-hover:text-accent-warm transition-colors">
                Click to fill →
              </div>
            </button>
          </div>

          {/* Mobile feature list */}
          <div className="lg:hidden mt-8 pt-6 border-t border-border">
            <p className="text-xs text-fg-muted text-center mb-4">Why Accrion?</p>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-2">
                  <f.icon className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-fg-secondary">{f.title}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-fg-muted text-xs mt-8">
            © 2026 Accrion Advisory. Secure behavioral financial platform.
          </p>
        </div>
      </div>
    </div>
  )
}
