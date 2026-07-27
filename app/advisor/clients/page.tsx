import { getAllClients } from '@/lib/data/clients'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, Plus, Clock } from 'lucide-react'
import { Reveal } from '@/components/brand/Reveal'

export const dynamic = 'force-dynamic'

const TEMPERAMENT_META: Record<string, { label: string; bg: string; text: string; desc: string }> = {
  DELIBERATE:    { label: 'Deliberate',    bg: 'bg-accent/10',   text: 'text-accent',       desc: 'Slow, analytical decisions' },
  REACTIVE:      { label: 'Reactive',      bg: 'bg-danger/10',   text: 'text-danger',       desc: 'Acts on emotion quickly' },
  AVOIDANT:      { label: 'Avoidant',      bg: 'bg-fg-muted/10', text: 'text-fg-muted',     desc: 'Delays or avoids decisions' },
  OVERCONFIDENT: { label: 'Overconfident', bg: 'bg-warning/10',  text: 'text-warning',      desc: 'Overestimates ability' },
  ANCHORED:      { label: 'Anchored',      bg: 'bg-warning/10',  text: 'text-warning',      desc: 'Fixates on reference points' },
  BALANCED:      { label: 'Balanced',      bg: 'bg-success/10',  text: 'text-success',      desc: 'Measured and consistent' },
}

function RiskGapBar({ stated, revealed }: { stated: number | null; revealed: number | null }) {
  const s = stated ?? 0
  const r = revealed ?? 0
  const gap = Math.abs(s - r)
  const significant = gap >= 3

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-fg-muted">Stated {s}/10</span>
        <span className="text-xs text-fg-muted">Revealed {r}/10</span>
      </div>
      <div className="relative h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-accent/40 rounded-full" style={{ width: `${s * 10}%` }} />
        <div className="absolute left-0 top-0 h-full bg-accent rounded-full opacity-80" style={{ width: `${r * 10}%` }} />
      </div>
      {significant && (
        <div className="flex items-center gap-1 mt-1.5">
          <AlertTriangle className="w-3 h-3 text-warning" />
          <span className="text-xs text-warning font-medium">{gap} pt gap</span>
        </div>
      )}
    </div>
  )
}

function TemperamentBadge({ temperament }: { temperament: string | null }) {
  if (!temperament) return <span className="text-xs text-fg-muted">—</span>
  const meta = TEMPERAMENT_META[temperament] ?? { label: temperament, bg: 'bg-bg-tertiary', text: 'text-fg-muted', desc: '' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.bg} ${meta.text}`} title={meta.desc}>
      {meta.label}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE'     ? 'bg-success/10 text-success border-success/30' :
    status === 'ONBOARDING' ? 'bg-warning/10 text-warning border-warning/30' :
    status === 'PAUSED'     ? 'bg-fg-muted/10 text-fg-muted border-fg-muted/20' :
                              'bg-fg-muted/10 text-fg-muted border-fg-muted/20'
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${cls}`}>{status}</span>
  )
}

function LastReviewedLabel({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-fg-muted italic">Never</span>
  const days = differenceInDays(new Date(), new Date(date))
  const color = days > 180 ? 'text-danger' : days > 90 ? 'text-warning' : 'text-fg-secondary'
  return (
    <div>
      <span className={`text-xs font-mono ${color}`}>{format(new Date(date), 'MMM d, yyyy')}</span>
      {days > 90 && (
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-warning" />
          <span className="text-xs text-warning">{days}d ago</span>
        </div>
      )}
    </div>
  )
}

export default async function ClientsPage() {
  const clients = await getAllClients()

  const byStatus = {
    ACTIVE: clients.filter((c: any) => c.status === 'ACTIVE').length,
    ONBOARDING: clients.filter((c: any) => c.status === 'ONBOARDING').length,
    OTHER: clients.filter((c: any) => !['ACTIVE','ONBOARDING'].includes(c.status)).length,
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl text-fg-primary">Clients</h1>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-sm text-fg-muted">{clients.length} total</span>
                <span className="text-xs text-fg-muted">·</span>
                <span className="text-sm text-success">{byStatus.ACTIVE} active</span>
                {byStatus.ONBOARDING > 0 && (
                  <>
                    <span className="text-xs text-fg-muted">·</span>
                    <span className="text-sm text-warning">{byStatus.ONBOARDING} onboarding</span>
                  </>
                )}
              </div>
            </div>
            <Link href="/advisor/clients/new" className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Client
            </Link>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <Reveal className="bg-bg-secondary border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary border-b border-border">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Client</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Temperament</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider w-44">Risk Profile</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Last Reviewed</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-fg-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-bg-tertiary/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-fg-primary group-hover:text-accent transition-colors">{client.user?.name}</div>
                    <div className="text-xs text-fg-muted mt-0.5">{client.user?.email}</div>
                    {client.occupation && <div className="text-xs text-fg-muted mt-0.5 italic">{client.occupation}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={client.status} />
                  </td>
                  <td className="px-6 py-4">
                    <TemperamentBadge temperament={client.decision_temperament} />
                  </td>
                  <td className="px-6 py-4 w-44">
                    {(client.stated_risk_score || client.revealed_risk_score) ? (
                      <RiskGapBar stated={client.stated_risk_score} revealed={client.revealed_risk_score} />
                    ) : (
                      <span className="text-xs text-fg-muted">Not assessed</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <LastReviewedLabel date={client.last_reviewed_at} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/advisor/clients/${client.id}`} className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors font-medium">
                      View <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center py-16 text-fg-muted">
              <p className="mb-2">No clients yet</p>
              <Link href="/advisor/clients/new" className="text-accent hover:text-accent-warm text-sm transition-colors">Add your first client →</Link>
            </div>
          )}
        </Reveal>
      </main>
    </div>
  )
}
