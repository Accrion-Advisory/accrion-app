'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  LogOut, Calendar, ChevronLeft, ChevronRight,
  X, CheckCircle2, Loader2, User, RefreshCw, Trash2, AlertTriangle,
  Target, Brain, FileText, Clock, BookOpen,
  ChevronDown, Shield, BarChart2, Menu,
  AlertCircle, CheckCircle, Pause, Zap, ExternalLink,
} from 'lucide-react'
import { format, parseISO, addDays, formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/Logo'
import { Reveal } from '@/components/brand/Reveal'

type ModalMode = 'book' | 'reschedule' | 'cancel'
type NavSection = 'overview' | 'goals' | 'decisions' | 'reviews' | 'documents'

const temperamentInfo: Record<string, { label: string; description: string; color: string; bg: string }> = {
  DELIBERATE:    { label: 'Deliberate',   description: 'You think carefully before acting. You weigh options thoroughly and rarely make impulsive decisions — a real strength in volatile markets.', color: 'text-accent', bg: 'bg-accent/10' },
  REACTIVE:      { label: 'Reactive',     description: 'You respond quickly to market movements. This energy can be an asset — your advisor helps channel it toward intentional action rather than impulse.', color: 'text-warning', bg: 'bg-warning/10' },
  AVOIDANT:      { label: 'Avoidant',     description: "You tend to delay decisions under uncertainty. Your advisor helps you stay engaged so inaction doesn't become a hidden risk.", color: 'text-fg-muted', bg: 'bg-bg-tertiary' },
  OVERCONFIDENT: { label: 'Confident',    description: 'You approach investing with conviction. Your advisor acts as a sounding board to stress-test ideas and protect you from blind spots.', color: 'text-success', bg: 'bg-success/10' },
  ANCHORED:      { label: 'Anchored',     description: 'You hold onto reference points — past prices, early decisions. Your advisor helps you see each decision fresh, on its own merits.', color: 'text-accent-warm', bg: 'bg-accent-warm/10' },
  BALANCED:      { label: 'Balanced',     description: 'You bring calm, proportionate thinking to financial decisions. You adapt well to new information without overreacting.', color: 'text-success', bg: 'bg-success/10' },
}

const goalStatusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle }> = {
  ON_TRACK:        { label: 'On Track',        color: 'text-success',  bg: 'bg-success/10',  border: 'border-success/30',  icon: CheckCircle },
  NEEDS_ATTENTION: { label: 'Needs Attention', color: 'text-warning',  bg: 'bg-warning/10',  border: 'border-warning/30',  icon: AlertCircle },
  AT_RISK:         { label: 'At Risk',         color: 'text-danger',   bg: 'bg-danger/10',   border: 'border-danger/30',   icon: AlertTriangle },
  ACHIEVED:        { label: 'Achieved',        color: 'text-success',  bg: 'bg-success/10',  border: 'border-success/30',  icon: CheckCircle2 },
  PAUSED:          { label: 'Paused',          color: 'text-fg-muted', bg: 'bg-bg-tertiary', border: 'border-border',      icon: Pause },
}

const categoryLabel: Record<string, string> = {
  RETIREMENT: 'Retirement', EDUCATION: 'Education', PROPERTY: 'Property',
  EMERGENCY_FUND: 'Emergency Fund', WEALTH_CREATION: 'Wealth Creation', BUSINESS: 'Business', OTHER: 'Other',
}

const docTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
  KYC:       { label: 'KYC',       color: 'text-accent',      bg: 'bg-accent/10' },
  AGREEMENT: { label: 'Agreement', color: 'text-accent-warm', bg: 'bg-accent-warm/10' },
  STATEMENT: { label: 'Statement', color: 'text-success',     bg: 'bg-success/10' },
  REPORT:    { label: 'Report',    color: 'text-warning',     bg: 'bg-warning/10' },
  OTHER:     { label: 'Document',  color: 'text-fg-muted',    bg: 'bg-bg-tertiary' },
}

function RiskGapVisual({ stated, revealed }: { stated: number; revealed: number }) {
  const gap = Math.abs(stated - revealed)
  const isHigher = stated > revealed
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-fg-secondary font-medium">How you describe your risk appetite</span>
            <span className="text-fg-primary font-semibold">{stated}/10</span>
          </div>
          <div className="h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-700" style={{ width: `${stated * 10}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-fg-secondary font-medium">How you actually behave under pressure</span>
            <span className="text-fg-primary font-semibold">{revealed}/10</span>
          </div>
          <div className="h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent-warm rounded-full transition-all duration-700" style={{ width: `${revealed * 10}%` }} />
          </div>
        </div>
      </div>
      {gap > 0 ? (
        <div className={`rounded-lg p-3 text-sm ${gap >= 3 ? 'bg-warning/10 border border-warning/20' : 'bg-bg-tertiary'}`}>
          <span className={`font-medium ${gap >= 3 ? 'text-warning' : 'text-fg-secondary'}`}>
            {gap >= 3 ? '⚠ ' : ''}Gap of {gap} point{gap !== 1 ? 's' : ''}:
          </span>{' '}
          <span className="text-fg-secondary">
            {isHigher
              ? 'You tend to feel more cautious in practice than you expect upfront. Your advisor accounts for this.'
              : "You tend to be more resilient under pressure than you expect. That's a genuine strength."}
          </span>
        </div>
      ) : (
        <div className="rounded-lg p-3 bg-success/10 text-sm border border-success/20">
          <span className="font-medium text-success">Strong alignment:</span>{' '}
          <span className="text-fg-secondary">Your stated and revealed risk tolerance match — you know yourself well.</span>
        </div>
      )}
    </div>
  )
}

function GoalProgressBar({ status }: { status: string }) {
  const progressMap: Record<string, number> = { ACHIEVED: 100, ON_TRACK: 68, NEEDS_ATTENTION: 42, AT_RISK: 22, PAUSED: 35 }
  const colorMap: Record<string, string> = { ACHIEVED: 'bg-success', ON_TRACK: 'bg-accent', NEEDS_ATTENTION: 'bg-warning', AT_RISK: 'bg-danger', PAUSED: 'bg-fg-muted' }
  return (
    <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
      <div className={`h-full ${colorMap[status] ?? 'bg-accent'} rounded-full transition-all duration-1000`} style={{ width: `${progressMap[status] ?? 50}%` }} />
    </div>
  )
}

export default function ClientPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [advisor, setAdvisor] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [decisions, setDecisions] = useState<any[]>([])
  const [nextReview, setNextReview] = useState<any>(null)
  const [pastReviews, setPastReviews] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<NavSection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [modalMode, setModalMode] = useState<ModalMode>('book')
  const [showModal, setShowModal] = useState(false)
  const [slots, setSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [calendarOffset, setCalendarOffset] = useState(0)

  const sectionRefs = useRef<Record<NavSection, HTMLElement | null>>({
    overview: null, goals: null, decisions: null, reviews: null, documents: null,
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const role = authUser.user_metadata?.role ?? 'CLIENT'
      if (role !== 'CLIENT') { router.push('/advisor/dashboard'); return }
      setUser({ id: authUser.id, email: authUser.email, name: authUser.user_metadata?.name ?? authUser.email, role })
      const res = await fetch(`/api/client/portal?userId=${authUser.id}`)
      const data = await res.json()
      setClient(data.client)
      setAdvisor(data.advisor)
      setGoals(data.goals || [])
      setDecisions(data.decisions || [])
      setNextReview(data.nextReview)
      setPastReviews(data.pastReviews || [])
      setDocuments(data.documents || [])
      setLoading(false)
    }
    init()
  }, [router])

  const loadSlots = async (mode: ModalMode) => {
    setSlotsLoading(true); setSlots([])
    try {
      const advisorId = client?.advisor_id
      const excludeParam = mode === 'reschedule' && nextReview?.id ? `&exclude_review_id=${nextReview.id}` : ''
      const res = await fetch(`/api/advisor/availability?advisorId=${advisorId}&days=21${excludeParam}`)
      const data = await res.json()
      setSlots(data.slots || [])
    } catch { setSlots([]) }
    finally { setSlotsLoading(false) }
  }

  const openBook = () => { setModalMode('book'); setShowModal(true); setSuccessMsg(''); setErrorMsg(''); setSelectedDate(null); setSelectedSlot(null); setCalendarOffset(0); loadSlots('book') }
  const openReschedule = () => { setModalMode('reschedule'); setShowModal(true); setSuccessMsg(''); setErrorMsg(''); setSelectedDate(null); setSelectedSlot(null); setCalendarOffset(0); loadSlots('reschedule') }
  const openCancel = () => { setModalMode('cancel'); setShowModal(true); setSuccessMsg(''); setErrorMsg('') }
  const closeModal = () => { setShowModal(false); setSuccessMsg(''); setErrorMsg(''); setSelectedDate(null); setSelectedSlot(null) }

  const handleBook = async () => {
    if (!selectedSlot) return
    setSubmitting(true); setErrorMsg('')
    try {
      const payload: any = { client_id: client?.id, advisor_id: client?.advisor_id, scheduled_datetime: selectedSlot.datetime }
      if (modalMode === 'reschedule' && nextReview?.id) payload.reschedule_id = nextReview.id
      const res = await fetch('/api/client/book-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNextReview(data.review)
      setSuccessMsg(modalMode === 'reschedule' ? `Rescheduled to ${format(parseISO(selectedSlot.date), 'MMMM d')} at ${selectedSlot.label}` : `Booked for ${format(parseISO(selectedSlot.date), 'MMMM d')} at ${selectedSlot.label}`)
    } catch (err: any) { setErrorMsg(err.message) }
    finally { setSubmitting(false) }
  }

  const handleCancel = async () => {
    setSubmitting(true); setErrorMsg('')
    try {
      const res = await fetch('/api/client/book-review', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ review_id: nextReview?.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNextReview(null); setSuccessMsg('Your review call has been cancelled.')
    } catch (err: any) { setErrorMsg(err.message) }
    finally { setSubmitting(false) }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const scrollToSection = (section: NavSection) => {
    setActiveSection(section)
    setMobileNavOpen(false)
    setTimeout(() => {
      sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), 1 + calendarOffset * 7 + i), 'yyyy-MM-dd'))
  const slotsForDate = (date: string) => slots.filter((s) => s.date === date)
  const tempInfo = client?.decision_temperament ? temperamentInfo[client.decision_temperament] : null
  const hasRiskGap = client?.stated_risk_score != null && client?.revealed_risk_score != null

  const navItems: { id: NavSection; label: string; icon: typeof Target; count?: number }[] = [
    { id: 'overview',   label: 'Overview',   icon: BarChart2 },
    { id: 'goals',      label: 'Goals',      icon: Target,    count: goals.length || undefined },
    { id: 'decisions',  label: 'Decisions',  icon: BookOpen,  count: decisions.length || undefined },
    { id: 'reviews',    label: 'Reviews',    icon: Calendar,  count: pastReviews.length || undefined },
    { id: 'documents',  label: 'Documents',  icon: FileText,  count: documents.length || undefined },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4 text-fg-muted">
          <Logo size={40} showWordmark={false} href={null} />
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading your portal...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg-secondary/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={30} showWordmark={false} href={null} />
            <div className="min-w-0 hidden sm:block">
              <div className="font-display font-semibold text-base text-fg-primary leading-tight truncate">{user?.name}</div>
              <div className="text-xs text-fg-muted">Accrion Advisory</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${activeSection === item.id ? 'bg-accent/10 text-accent' : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary'}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
                {item.count != null && item.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeSection === item.id ? 'bg-accent/20 text-accent' : 'bg-bg-tertiary text-fg-muted'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-bg-tertiary text-fg-secondary transition-colors"
              aria-label="Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <ThemeToggle />
            <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-fg-secondary" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-border bg-bg-secondary">
            {/* User info on mobile */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className="text-sm font-medium text-fg-primary">{user?.name}</div>
              <div className="text-xs text-fg-muted">{user?.email}</div>
            </div>
            <nav className="grid grid-cols-5 gap-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex flex-col items-center gap-1 py-3 px-1 text-center transition-colors
                    ${activeSection === item.id ? 'text-accent bg-accent/5' : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary'}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  {item.count != null && item.count > 0 && (
                    <span className="text-[9px] px-1 bg-accent/10 text-accent rounded-full">{item.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-16">

        {/* ── OVERVIEW ── */}
        <section ref={(el) => { sectionRefs.current.overview = el }}>
          {/* Mobile: stack advisor + review on top */}
          <Reveal className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            <div className="lg:col-span-1 space-y-4">
              {/* Advisor card */}
              <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
                <div className="text-xs text-fg-muted uppercase tracking-wide mb-3">Your Advisor</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-serif text-fg-primary text-base truncate">{advisor?.name || 'Your Advisor'}</div>
                    <div className="text-xs text-fg-muted truncate">{advisor?.email}</div>
                  </div>
                </div>
                {!nextReview && (
                  <motion.button
                    onClick={openBook}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-grad-brand text-white
                               rounded-lg font-medium text-sm shadow-[0_8px_24px_-10px_var(--glow-violet)]"
                  >
                    <Calendar className="w-4 h-4" />
                    Book a Review Call
                  </motion.button>
                )}
              </div>

              {/* Next Review */}
              <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
                <div className="text-xs text-fg-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Next Review
                </div>
                {nextReview ? (
                  <>
                    <div className="mb-3">
                      <div className="font-serif text-xl text-fg-primary">
                        {format(new Date(nextReview.scheduled_date), 'MMMM d')}
                      </div>
                      <div className="text-sm text-fg-muted mt-0.5">
                        {format(new Date(nextReview.scheduled_date), 'EEEE')} · {format(new Date(nextReview.scheduled_date), 'h:mm a')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={openReschedule}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-border
                                   rounded-lg text-xs font-medium text-fg-secondary hover:bg-bg-tertiary transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                      </button>
                      <button onClick={openCancel}
                        className="flex items-center justify-center px-3 py-2 border border-danger/30
                                   rounded-lg text-xs text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-fg-muted">No upcoming review. Book a call to stay on track.</p>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Goals', value: goals.length, icon: Target },
                  { label: 'Decisions', value: decisions.length, icon: BookOpen },
                  { label: 'Reviews', value: pastReviews.length, icon: Calendar },
                ].map((stat) => (
                  <div key={stat.label} className="bg-bg-secondary border border-border rounded-xl p-3 text-center">
                    <div className="font-serif text-2xl text-fg-primary">{stat.value}</div>
                    <div className="text-xs text-fg-muted mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Snapshot */}
            <div className="lg:col-span-2">
              <div className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-6 h-full">
                <div className="flex items-center gap-2 mb-5">
                  <Brain className="w-5 h-5 text-accent" />
                  <h2 className="font-serif text-lg text-fg-primary">Your Behavioral Snapshot</h2>
                </div>

                {tempInfo && (
                  <div className={`rounded-xl p-4 mb-5 ${tempInfo.bg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`w-4 h-4 ${tempInfo.color}`} />
                      <span className={`font-semibold text-sm ${tempInfo.color}`}>{tempInfo.label} Temperament</span>
                    </div>
                    <p className="text-sm text-fg-secondary leading-relaxed">{tempInfo.description}</p>
                  </div>
                )}

                {hasRiskGap ? (
                  <>
                    <div className="text-xs text-fg-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                      <BarChart2 className="w-3.5 h-3.5" /> Risk Tolerance Gap
                    </div>
                    <RiskGapVisual stated={client.stated_risk_score} revealed={client.revealed_risk_score} />
                  </>
                ) : client?.stated_risk_score != null && (
                  <div>
                    <div className="text-xs text-fg-muted uppercase tracking-wide mb-3">Risk Preference</div>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 flex-1 bg-bg-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${client.stated_risk_score * 10}%` }} />
                      </div>
                      <span className="text-sm font-medium text-fg-primary w-8 text-right">{client.stated_risk_score}/10</span>
                    </div>
                  </div>
                )}

                {client?.behavioral_summary && (
                  <div className="mt-5 pt-5 border-t border-border">
                    <div className="text-xs text-fg-muted uppercase tracking-wide mb-2">Advisor's Observation</div>
                    <p className="text-sm text-fg-secondary leading-relaxed italic">"{client.behavioral_summary}"</p>
                  </div>
                )}

                {!tempInfo && !hasRiskGap && !client?.behavioral_summary && (
                  <div className="py-8 text-center text-fg-muted text-sm">
                    Your behavioral profile will appear here after your first review.
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── GOALS ── */}
        <section ref={(el) => { sectionRefs.current.goals = el }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Target className="w-5 h-5 text-accent" />
              <h2 className="font-serif text-xl sm:text-2xl text-fg-primary">Your Goals</h2>
            </div>
            <span className="text-sm text-fg-muted">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
          </div>

          <Reveal>
          {goals.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
              <Target className="w-10 h-10 text-fg-muted mx-auto mb-3 opacity-40" />
              <p className="text-fg-muted text-sm">No goals set yet. Your advisor will add them after your onboarding review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {goals.map((goal) => {
                const config = goalStatusConfig[goal.status] || goalStatusConfig.NEEDS_ATTENTION
                const StatusIcon = config.icon
                return (
                  <div key={goal.id} className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif text-base sm:text-lg text-fg-primary leading-tight">{goal.title}</h3>
                        <div className="text-xs text-fg-muted mt-1">
                          {categoryLabel[goal.category] || goal.category}
                          {goal.target_date && <span> · Target {format(new Date(goal.target_date), 'MMM yyyy')}</span>}
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${config.color} ${config.bg} border ${config.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{config.label}</span>
                      </span>
                    </div>
                    <GoalProgressBar status={goal.status} />
                    {goal.description && <p className="text-sm text-fg-secondary leading-relaxed">{goal.description}</p>}
                    {goal.target_amount && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-fg-muted">Target:</span>
                        <span className="text-fg-primary font-medium">₹{goal.target_amount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {goal.progress_notes && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs text-fg-secondary leading-relaxed">{goal.progress_notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </Reveal>
        </section>

        {/* ── DECISIONS ── */}
        <section ref={(el) => { sectionRefs.current.decisions = el }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="font-serif text-xl sm:text-2xl text-fg-primary">Decision Journal</h2>
            </div>
            <span className="text-sm text-fg-muted">{decisions.length} entr{decisions.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <p className="text-sm text-fg-secondary mb-5 -mt-2">A record of important financial decisions, giving you a long-horizon view of your journey.</p>

          <Reveal>
          {decisions.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
              <BookOpen className="w-10 h-10 text-fg-muted mx-auto mb-3 opacity-40" />
              <p className="text-fg-muted text-sm">Decisions will appear here as they are logged by your advisor.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((decision, index) => (
                <div key={decision.id} className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="text-xs text-fg-muted font-mono">
                        {format(new Date(decision.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {decision.emotional_state && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-fg-muted flex-shrink-0">
                        {decision.emotional_state}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base sm:text-lg text-fg-primary mb-2">{decision.decision}</h3>
                  {decision.context && <p className="text-sm text-fg-secondary leading-relaxed mb-3">{decision.context}</p>}
                  {decision.reasoning && (
                    <div className="flex gap-2 pt-3 border-t border-border">
                      <div className="w-1 bg-accent/30 rounded-full flex-shrink-0" />
                      <p className="text-sm text-fg-secondary leading-relaxed">
                        <span className="font-medium text-fg-primary">Reasoning: </span>
                        {decision.reasoning}
                      </p>
                    </div>
                  )}
                  {decision.outcome && (
                    <div className="mt-3 flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-fg-secondary">{decision.outcome}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </Reveal>
        </section>

        {/* ── REVIEWS ── */}
        <section ref={(el) => { sectionRefs.current.reviews = el }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-accent" />
              <h2 className="font-serif text-xl sm:text-2xl text-fg-primary">Review History</h2>
            </div>
            {!nextReview && (
              <button onClick={openBook}
                className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-warm transition-colors">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Book Next</span>
                <span className="sm:hidden">Book</span>
              </button>
            )}
          </div>

          <Reveal>
          {nextReview && (
            <div className="bg-accent/8 border border-accent/20 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-fg-primary">
                    Next: {format(new Date(nextReview.scheduled_date), 'EEEE, MMM d')}
                  </div>
                  <div className="text-xs text-fg-muted">{format(new Date(nextReview.scheduled_date), 'h:mm a')} · with {advisor?.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={openReschedule} className="text-xs text-accent hover:underline">Reschedule</button>
                <span className="text-fg-muted">·</span>
                <button onClick={openCancel} className="text-xs text-danger hover:underline">Cancel</button>
              </div>
            </div>
          )}

          {pastReviews.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
              <Calendar className="w-10 h-10 text-fg-muted mx-auto mb-3 opacity-40" />
              <p className="text-fg-muted mb-4 text-sm">No completed reviews yet.</p>
              {!nextReview && (
                <button onClick={openBook}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-warm transition-colors">
                  <Calendar className="w-4 h-4" /> Book Your First Review
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {pastReviews.map((review) => {
                const driftColors: Record<string, string> = {
                  ON_TRACK: 'text-success bg-success/10 border-success/30',
                  SLIGHT_DRIFT: 'text-warning bg-warning/10 border-warning/30',
                  SIGNIFICANT_DRIFT: 'text-warning bg-warning/10 border-warning/30',
                  CRITICAL: 'text-danger bg-danger/10 border-danger/30',
                }
                const driftLabels: Record<string, string> = {
                  ON_TRACK: 'On Track', SLIGHT_DRIFT: 'Slight Drift', SIGNIFICANT_DRIFT: 'Sig. Drift', CRITICAL: 'Critical',
                }
                const driftClass = review.drift_assessment ? driftColors[review.drift_assessment] : 'text-fg-muted bg-bg-tertiary border-border'
                const driftLabel = review.drift_assessment ? driftLabels[review.drift_assessment] : 'Completed'
                return (
                  <div key={review.id} className="bg-bg-secondary border border-border rounded-xl p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium text-fg-primary text-sm sm:text-base">
                          {format(new Date(review.scheduled_date), 'MMMM d, yyyy')}
                        </div>
                        <div className="text-xs text-fg-muted mt-0.5">
                          {formatDistanceToNow(new Date(review.scheduled_date), { addSuffix: true })}
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${driftClass}`}>
                        {driftLabel}
                      </span>
                    </div>
                    {review.advisor_notes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-fg-secondary leading-relaxed">{review.advisor_notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </Reveal>
        </section>

        {/* ── DOCUMENTS ── */}
        <section ref={(el) => { sectionRefs.current.documents = el }}>
          <div className="flex items-center gap-2.5 mb-5">
            <FileText className="w-5 h-5 text-accent" />
            <h2 className="font-serif text-xl sm:text-2xl text-fg-primary">Documents</h2>
          </div>

          <Reveal>
          {documents.length === 0 ? (
            <div className="bg-bg-secondary border border-border rounded-xl p-10 text-center">
              <Shield className="w-10 h-10 text-fg-muted mx-auto mb-3 opacity-40" />
              <p className="text-fg-muted text-sm">Your advisor will share documents here — agreements, reports, and statements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => {
                const typeConfig = docTypeConfig[doc.type] || docTypeConfig.OTHER
                return (
                  <div key={doc.id}
                    className="bg-bg-secondary border border-border rounded-xl p-4 flex items-center gap-3 group hover:border-accent/40 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                      <FileText className={`w-5 h-5 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-fg-primary text-sm truncate">{doc.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                        <span className="text-xs text-fg-muted">{format(new Date(doc.uploaded_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-all flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </Reveal>
        </section>

      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 text-center text-fg-muted text-xs">
          © 2026 Accrion Advisory · Your long-horizon financial plan
        </div>
      </footer>

      {/* ── Booking Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60">
          <div className="bg-bg-primary border border-border rounded-t-2xl sm:rounded-xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-bg-primary z-10">
              {/* Mobile drag handle */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-border sm:hidden" />
              <div className="pt-2 sm:pt-0">
                <h2 className="font-serif text-xl sm:text-2xl text-fg-primary">
                  {modalMode === 'cancel' ? 'Cancel Review Call' : modalMode === 'reschedule' ? 'Reschedule Call' : 'Book a Review Call'}
                </h2>
                <p className="text-sm text-fg-muted mt-0.5">
                  {modalMode === 'cancel'
                    ? `This will cancel your call with ${advisor?.name}`
                    : `1-hour session with ${advisor?.name}`}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {successMsg ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-4" />
                  <h3 className="font-serif text-xl sm:text-2xl text-fg-primary mb-2">
                    {modalMode === 'cancel' ? 'Call Cancelled' : modalMode === 'reschedule' ? 'Call Rescheduled!' : 'Call Booked!'}
                  </h3>
                  <p className="text-fg-muted mb-6 text-sm">{successMsg}</p>
                  <button onClick={closeModal} className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-warm transition-colors">Done</button>
                </div>

              ) : modalMode === 'cancel' ? (
                <div className="text-center py-6">
                  <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                  <p className="text-fg-primary mb-2">Cancel your review on</p>
                  <p className="text-xl font-serif text-fg-primary mb-1">
                    {nextReview && format(new Date(nextReview.scheduled_date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-fg-muted text-sm mb-8">
                    {nextReview && format(new Date(nextReview.scheduled_date), 'h:mm a')} with {advisor?.name}
                  </p>
                  {errorMsg && <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{errorMsg}</div>}
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={closeModal} className="px-5 py-2.5 border border-border rounded-lg font-medium text-fg-secondary hover:bg-bg-tertiary transition-colors text-sm">Keep It</button>
                    <button onClick={handleCancel} disabled={submitting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-danger text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                  </div>
                </div>

              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-16 text-fg-muted gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading available times...
                </div>

              ) : slots.length === 0 ? (
                <div className="text-center py-16 text-fg-muted text-sm">
                  No available slots in the next 3 weeks. Please check back later.
                </div>

              ) : (
                <>
                  {modalMode === 'reschedule' && nextReview && (
                    <div className="mb-4 px-4 py-3 bg-bg-secondary border border-border rounded-lg text-sm text-fg-secondary">
                      Current: <span className="text-fg-primary font-medium">
                        {format(new Date(nextReview.scheduled_date), 'MMM d')} at {format(new Date(nextReview.scheduled_date), 'h:mm a')}
                      </span> — select a new slot below
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))} disabled={calendarOffset === 0}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-fg-secondary">
                      {format(addDays(new Date(), 1 + calendarOffset * 7), 'MMM d')} — {format(addDays(new Date(), 7 + calendarOffset * 7), 'MMM d')}
                    </span>
                    <button onClick={() => setCalendarOffset((o) => o + 1)} disabled={calendarOffset >= 2}
                      className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary disabled:opacity-30">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-5">
                    {weekDates.map((date) => {
                      const daySlots = slotsForDate(date)
                      const isSelected = selectedDate === date
                      const hasSlots = daySlots.length > 0
                      return (
                        <button key={date}
                          onClick={() => { if (hasSlots) { setSelectedDate(date); setSelectedSlot(null) } }}
                          disabled={!hasSlots}
                          className={`flex flex-col items-center py-2.5 sm:py-3 px-0.5 rounded-lg border transition-all text-center
                            ${isSelected ? 'border-accent bg-accent/10 text-accent'
                              : hasSlots ? 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary cursor-pointer'
                              : 'border-transparent text-fg-muted opacity-40 cursor-not-allowed'}`}>
                          <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide">{format(parseISO(date), 'EEE')}</span>
                          <span className="text-base sm:text-lg font-serif mt-0.5">{format(parseISO(date), 'd')}</span>
                          {hasSlots && <span className="text-[10px] mt-0.5 text-fg-muted">{daySlots.length}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {selectedDate && (
                    <div className="mb-5">
                      <div className="text-sm font-medium text-fg-secondary mb-3">
                        Available times on {format(parseISO(selectedDate), 'EEEE, MMM d')}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slotsForDate(selectedDate).map((slot) => (
                          <button key={slot.datetime} onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-all
                              ${selectedSlot?.datetime === slot.datetime
                                ? 'border-accent bg-accent text-white'
                                : 'border-border hover:border-accent/50 hover:bg-bg-secondary text-fg-primary'}`}>
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {errorMsg && <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{errorMsg}</div>}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-fg-muted">
                      {selectedSlot ? `${format(parseISO(selectedSlot.date), 'MMM d')} at ${selectedSlot.label}` : 'Select date & time'}
                    </div>
                    <motion.button onClick={handleBook} disabled={!selectedSlot || submitting}
                      whileHover={!selectedSlot || submitting ? undefined : { scale: 1.02 }}
                      whileTap={!selectedSlot || submitting ? undefined : { scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-grad-brand text-white rounded-lg font-medium text-sm
                                 disabled:opacity-40 disabled:cursor-not-allowed">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? 'Saving...' : modalMode === 'reschedule' ? 'Confirm Reschedule' : 'Confirm Booking'}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
