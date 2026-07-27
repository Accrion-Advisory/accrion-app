import { getDashboardStats, getUpcomingReviews, getOpenFlags, getRecentActivity } from '@/lib/data/dashboard'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { Reveal } from '@/components/brand/Reveal'

export const dynamic = 'force-dynamic'

function inferBiasType(behavior: string): { label: string; color: string } {
  const b = (behavior || '').toLowerCase()
  if (b.includes('sell') || b.includes('panic') || b.includes('crash') || b.includes('exit'))
    return { label: 'Loss Aversion', color: 'text-danger' }
  if (b.includes('now') || b.includes('immediate') || b.includes('quick') || b.includes('today'))
    return { label: 'Present Bias', color: 'text-warning' }
  if (b.includes('anchor') || b.includes('bought at') || b.includes('peak') || b.includes('original'))
    return { label: 'Anchoring', color: 'text-accent' }
  if (b.includes('confident') || b.includes('certain') || b.includes('definitely') || b.includes('sure'))
    return { label: 'Overconfidence', color: 'text-warning' }
  if (b.includes('everyone') || b.includes('people are') || b.includes('trend') || b.includes('heard'))
    return { label: 'Herd Behavior', color: 'text-fg-muted' }
  return { label: 'Behavioral Flag', color: 'text-fg-muted' }
}

function getDriftLabel(drift: string | null) {
  switch (drift) {
    case 'ON_TRACK': return { label: 'On Track', cls: 'text-success bg-success/10 border-success/20' }
    case 'SLIGHT_DRIFT': return { label: 'Slight Drift', cls: 'text-warning bg-warning/10 border-warning/20' }
    case 'SIGNIFICANT_DRIFT': return { label: 'Significant Drift', cls: 'text-danger bg-danger/10 border-danger/20' }
    case 'CRITICAL': return { label: 'Critical', cls: 'text-danger bg-danger/10 border-danger/30 font-semibold' }
    default: return { label: 'Scheduled', cls: 'text-fg-muted bg-bg-tertiary border-border' }
  }
}

function MiniSparkline({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return (
    <svg width="40" height="20" viewBox="0 0 40 20">
      <polyline points="0,18 10,14 20,10 30,6 40,2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (trend === 'down') return (
    <svg width="40" height="20" viewBox="0 0 40 20">
      <polyline points="0,2 10,6 20,10 30,14 40,18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg width="40" height="20" viewBox="0 0 40 20">
      <polyline points="0,10 10,9 20,11 30,9 40,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DeltaChip({ delta, inverse = false, period = 'last month' }: { delta: number; inverse?: boolean; period?: string }) {
  const isGood = inverse ? delta < 0 : delta > 0
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-xs text-fg-muted">
      <Minus className="w-3 h-3" /> same as {period}
    </span>
  )
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-success' : 'text-danger'}`}>
      {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(delta)} vs {period}
    </span>
  )
}

function trendFor(delta: number): 'up' | 'down' | 'flat' {
  return delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
}

export default async function AdvisorDashboard() {
  const [stats, upcomingReviews, openFlags, recentActivity] = await Promise.all([
    getDashboardStats(),
    getUpcomingReviews(5),
    getOpenFlags(5),
    getRecentActivity(10),
  ])

  const clientsDelta = stats.totalClients - stats.previousTotalClients
  const reviewsDelta = stats.reviewsThisMonth - stats.previousReviewsThisMonth
  const decisionsDelta = stats.decisionsLogged - stats.previousDecisionsLogged
  const flagsDelta = stats.flagsOpenedLast30 - stats.flagsOpenedPrev30

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-3xl text-fg-primary">Dashboard</h1>
            <p className="text-sm text-fg-muted mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          {stats.openFlags > 0 && (
            <Link href="/advisor/flags" className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/30 text-danger rounded text-sm hover:bg-danger/15 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              {stats.openFlags} open flag{stats.openFlags !== 1 ? 's' : ''} need attention
            </Link>
          )}
        </div>
      </header>

      <main className="px-8 py-8">

        {/* Stats Cards */}
        <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Active Clients" value={stats.totalClients} trend={trendFor(clientsDelta)} delta={clientsDelta} href="/advisor/clients" color="text-fg-primary" />
          <StatCard label="Reviews This Month" value={stats.reviewsThisMonth} trend={trendFor(reviewsDelta)} delta={reviewsDelta} href="/advisor/reviews" color="text-fg-primary" />
          <StatCard label="Open Flags" value={stats.openFlags} trend={trendFor(flagsDelta)} delta={flagsDelta} href="/advisor/flags" color={stats.openFlags > 0 ? 'text-danger' : 'text-fg-primary'} highlight={stats.openFlags > 0} />
          <StatCard label="Decisions Logged" value={stats.decisionsLogged} trend={trendFor(decisionsDelta)} delta={decisionsDelta} color="text-fg-primary" />
        </Reveal>

        {/* Two Column */}
        <Reveal delay={0.1} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Upcoming Reviews */}
          <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-fg-muted" />
                <h2 className="font-display font-semibold text-lg text-fg-primary">Upcoming Reviews</h2>
              </div>
              <Link href="/advisor/reviews" className="text-sm text-accent hover:text-accent-warm transition-colors flex items-center gap-1">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {upcomingReviews?.map((review: any) => {
                const drift = getDriftLabel(review.drift_assessment)
                const daysUntil = differenceInDays(new Date(review.scheduled_date), new Date())
                return (
                  <Link key={review.id} href={`/advisor/clients/${review.client.id}?tab=reviews`} className="flex items-center justify-between px-6 py-4 hover:bg-bg-tertiary/60 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="text-fg-primary font-medium text-sm group-hover:text-accent transition-colors truncate">
                        {review.client?.user?.name || 'Unknown Client'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-fg-muted font-mono">{format(new Date(review.scheduled_date), 'MMM d, yyyy')}</span>
                        {daysUntil <= 3 && daysUntil >= 0 && (
                          <span className="text-xs text-warning font-medium">{daysUntil === 0 ? 'Today' : `in ${daysUntil}d`}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 border rounded-full flex-shrink-0 ml-3 ${drift.cls}`}>
                      {drift.label}
                    </span>
                  </Link>
                )
              })}
              {!upcomingReviews?.length && (
                <div className="px-6 py-8 text-fg-muted text-sm text-center">No upcoming reviews scheduled</div>
              )}
            </div>
          </div>

          {/* Open Flags with bias type */}
          <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-danger/70 flex-shrink-0" />
                <h2 className="font-display font-semibold text-lg text-fg-primary">Open Flags</h2>
              </div>
              <Link href="/advisor/flags" className="text-sm text-accent hover:text-accent-warm transition-colors flex items-center gap-1">
                All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {openFlags?.map((flag: any) => {
                const bias = inferBiasType(flag.client_behavior || '')
                return (
                  <Link key={flag.id} href={`/advisor/clients/${flag.client.id}?tab=behavior`} className="flex items-start gap-3 px-6 py-4 hover:bg-bg-tertiary/60 transition-colors group">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${flag.severity === 'HIGH' ? 'bg-danger' : flag.severity === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-fg-primary font-medium text-sm group-hover:text-accent transition-colors truncate">
                          {flag.client?.user?.name || 'Unknown'}
                        </span>
                        <span className={`text-xs font-medium flex-shrink-0 ${bias.color}`}>{bias.label}</span>
                      </div>
                      <p className="text-fg-secondary text-xs line-clamp-1">{flag.client_behavior}</p>
                      <span className="text-fg-muted text-xs font-mono">{format(new Date(flag.date), 'MMM d')}</span>
                    </div>
                  </Link>
                )
              })}
              {!openFlags?.length && (
                <div className="px-6 py-8 text-fg-muted text-sm text-center">No open flags — all clear</div>
              )}
            </div>
          </div>
        </Reveal>

        {/* Recent Activity */}
        <Reveal delay={0.15} className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
            <TrendingUp className="w-4 h-4 text-fg-muted" />
            <h2 className="font-display font-semibold text-lg text-fg-primary">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity?.map((item: any) => (
              <Link key={item.id} href={`/advisor/clients/${item.client.id}?tab=decisions`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-bg-tertiary/60 transition-colors group">
                <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent text-xs">✓</span>
                </span>
                <span className="flex-1 text-sm text-fg-secondary min-w-0 truncate">
                  <span className="font-medium text-fg-primary group-hover:text-accent transition-colors">
                    {item.client?.user?.name || 'Unknown'}
                  </span>
                  {' — '}
                  {item.decision}
                </span>
                <span className="text-fg-muted text-xs font-mono flex-shrink-0">{format(new Date(item.date), 'MMM d')}</span>
              </Link>
            ))}
            {!recentActivity?.length && (
              <div className="px-6 py-8 text-fg-muted text-sm text-center">No recent activity</div>
            )}
          </div>
        </Reveal>

      </main>
    </div>
  )
}

function StatCard({
  label, value, trend, delta, href, color, highlight = false,
}: {
  label: string; value: number; trend: 'up' | 'down' | 'flat'; delta: number
  href?: string; color: string; highlight?: boolean
}) {
  const content = (
    <div className={`bg-bg-secondary border rounded-lg p-6 transition-colors ${highlight ? 'border-danger/50' : 'border-border'} ${href ? 'hover:bg-bg-tertiary cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs text-fg-muted font-medium uppercase tracking-wider leading-none">{label}</span>
        <span className={`${color} opacity-50`}><MiniSparkline trend={trend} /></span>
      </div>
      <div className={`font-display font-bold text-4xl leading-none mb-3 ${color}`}>{value}</div>
      <DeltaChip delta={delta} inverse={label === 'Open Flags'} period={label === 'Open Flags' ? 'prior 30 days' : 'last month'} />
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}
