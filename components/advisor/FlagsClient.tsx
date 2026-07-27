'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Reveal } from '@/components/brand/Reveal'

const BIAS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  loss_aversion:  { label: 'Loss Aversion',  color: 'text-danger',      bg: 'bg-danger/10' },
  present_bias:   { label: 'Present Bias',   color: 'text-warning',     bg: 'bg-warning/10' },
  anchoring:      { label: 'Anchoring',      color: 'text-accent',      bg: 'bg-accent/10' },
  overconfidence: { label: 'Overconfidence', color: 'text-warning',     bg: 'bg-warning/10' },
  herd_behavior:  { label: 'Herd Behavior',  color: 'text-fg-muted',    bg: 'bg-bg-tertiary' },
  status_quo:     { label: 'Status Quo',     color: 'text-fg-secondary', bg: 'bg-bg-tertiary' },
  default:        { label: 'Behavioral',     color: 'text-fg-muted',    bg: 'bg-bg-tertiary' },
}

function inferBiasKey(behavior: string): string {
  const b = (behavior || '').toLowerCase()
  if (b.includes('sell') || b.includes('panic') || b.includes('crash') || b.includes('exit')) return 'loss_aversion'
  if (b.includes('now') || b.includes('immediate') || b.includes('quick') || b.includes('today')) return 'present_bias'
  if (b.includes('anchor') || b.includes('bought at') || b.includes('peak') || b.includes('original')) return 'anchoring'
  if (b.includes('confident') || b.includes('certain') || b.includes('definitely')) return 'overconfidence'
  if (b.includes('everyone') || b.includes('people are') || b.includes('heard')) return 'herd_behavior'
  if (b.includes('avoid') || b.includes('wait') || b.includes('delay')) return 'status_quo'
  return 'default'
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'HIGH') return <AlertTriangle className="w-4 h-4 text-danger" />
  if (severity === 'MEDIUM') return <AlertCircle className="w-4 h-4 text-warning" />
  return <Info className="w-4 h-4 text-fg-muted" />
}

function FlagCard({ flag, onResolve, resolving }: { flag: any; onResolve: (id: string) => void; resolving: boolean }) {
  const bias = BIAS_LABELS[inferBiasKey(flag.client_behavior || '')]

  return (
    <Card>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex-shrink-0"><SeverityIcon severity={flag.severity} /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                  className="text-base font-medium text-fg-primary hover:text-accent transition-colors"
                >
                  {flag.client?.user?.name || 'Unknown Client'}
                </Link>
                <div className="text-xs text-fg-muted mt-0.5">{flag.client?.user?.email}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${bias.bg} ${bias.color}`}>{bias.label}</span>
                <span className="text-fg-muted text-xs font-mono">{format(new Date(flag.date), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div>
                <div className="text-xs text-fg-muted mb-0.5">Market Context</div>
                <p className="text-sm text-fg-secondary">{flag.market_context}</p>
              </div>
              <div>
                <div className="text-xs text-fg-muted mb-0.5">Client Behavior</div>
                <p className="text-sm text-fg-primary">{flag.client_behavior}</p>
              </div>
              {flag.advisor_interpretation && (
                <div className="p-3 bg-bg-tertiary rounded">
                  <div className="text-xs text-fg-muted mb-0.5">Advisor Interpretation</div>
                  <p className="text-sm text-fg-secondary italic">{flag.advisor_interpretation}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Link
                href={`/advisor/clients/${flag.client.id}?tab=behavior`}
                className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors"
              >
                View Client <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {!flag.resolved && (
                <button
                  onClick={() => onResolve(flag.id)}
                  disabled={resolving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-success/30 text-success bg-success/5 hover:bg-success/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FlagsClient({ initialFlags }: { initialFlags: any[] }) {
  const [flags, setFlags] = useState<any[]>(initialFlags)
  const [resolving, setResolving] = useState<string | null>(null)

  const handleResolve = async (flagId: string) => {
    setResolving(flagId)
    try {
      const res = await fetch('/api/advisor/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag_id: flagId, resolved: true }),
      })
      if (!res.ok) throw new Error('Failed')
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, resolved: true } : f))
    } catch (e) {
      console.error(e)
    } finally {
      setResolving(null)
    }
  }

  const openFlags = flags.filter(f => !f.resolved)
  const resolvedFlags = flags.filter(f => f.resolved)

  const highOpen = openFlags.filter(f => f.severity === 'HIGH')
  const mediumOpen = openFlags.filter(f => f.severity === 'MEDIUM')
  const lowOpen = openFlags.filter(f => f.severity === 'LOW')

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <h1 className="font-display font-bold text-3xl text-fg-primary">Behavioral Flags</h1>
          <p className="text-sm text-fg-muted mt-1">Track and resolve behavioral concerns across your book</p>
        </div>
      </header>

      <main className="px-8 py-8 space-y-8">

        {/* Summary cards */}
        <Reveal className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-secondary border border-border rounded-lg p-5">
            <div className="text-xs text-fg-muted uppercase tracking-wider mb-2">Total Open</div>
            <div className="font-display font-bold text-4xl text-fg-primary">{openFlags.length}</div>
          </div>
          <div className="bg-bg-secondary border border-danger/30 rounded-lg p-5">
            <div className="text-xs text-fg-muted uppercase tracking-wider mb-2">High Severity</div>
            <div className="font-display font-bold text-4xl text-danger">{highOpen.length}</div>
          </div>
          <div className="bg-bg-secondary border border-warning/30 rounded-lg p-5">
            <div className="text-xs text-fg-muted uppercase tracking-wider mb-2">Medium Severity</div>
            <div className="font-display font-bold text-4xl text-warning">{mediumOpen.length}</div>
          </div>
          <div className="bg-bg-secondary border border-success/20 rounded-lg p-5">
            <div className="text-xs text-fg-muted uppercase tracking-wider mb-2">Resolved</div>
            <div className="font-display font-bold text-4xl text-success">{resolvedFlags.length}</div>
          </div>
        </Reveal>

        {/* Open flags grouped by severity */}
        {openFlags.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-fg-muted text-center py-10">No open flags — all clear across your book</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {highOpen.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-danger" />
                  <h2 className="font-serif text-xl text-fg-primary">High Severity</h2>
                  <Badge variant="danger">{highOpen.length}</Badge>
                </div>
                <div className="space-y-4">
                  {highOpen.map(flag => (
                    <FlagCard key={flag.id} flag={flag} onResolve={handleResolve} resolving={resolving === flag.id} />
                  ))}
                </div>
              </section>
            )}

            {mediumOpen.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <h2 className="font-serif text-xl text-fg-primary">Medium Severity</h2>
                  <Badge variant="warning">{mediumOpen.length}</Badge>
                </div>
                <div className="space-y-4">
                  {mediumOpen.map(flag => (
                    <FlagCard key={flag.id} flag={flag} onResolve={handleResolve} resolving={resolving === flag.id} />
                  ))}
                </div>
              </section>
            )}

            {lowOpen.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-4 h-4 text-fg-muted" />
                  <h2 className="font-serif text-xl text-fg-primary">Low Severity</h2>
                  <Badge variant="neutral">{lowOpen.length}</Badge>
                </div>
                <div className="space-y-4">
                  {lowOpen.map(flag => (
                    <FlagCard key={flag.id} flag={flag} onResolve={handleResolve} resolving={resolving === flag.id} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Resolved flags */}
        {resolvedFlags.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-serif text-xl text-fg-primary">Resolved</h2>
              <Badge variant="success">{resolvedFlags.length}</Badge>
            </div>
            <div className="space-y-3">
              {resolvedFlags.map(flag => (
                <Card key={flag.id}>
                  <CardContent>
                    <div className="flex items-start gap-4 opacity-60">
                      <span className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 bg-success" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Link href={`/advisor/clients/${flag.client.id}?tab=behavior`} className="font-medium text-fg-primary hover:text-accent transition-colors">
                            {flag.client?.user?.name || 'Unknown'}
                          </Link>
                          <span className="text-fg-muted text-xs font-mono flex-shrink-0">{format(new Date(flag.date), 'MMM d, yyyy')}</span>
                        </div>
                        <p className="text-sm text-fg-secondary">{flag.client_behavior}</p>
                        {flag.resolution_notes && (
                          <div className="mt-2 p-2.5 bg-success/5 border border-success/20 rounded">
                            <div className="text-xs text-success mb-0.5">Resolution</div>
                            <p className="text-sm text-fg-secondary">{flag.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
