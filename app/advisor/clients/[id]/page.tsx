'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Tabs, type Tab } from '@/components/ui/Tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EditProfileModal } from '@/components/advisor/EditProfileModal'
import { ScheduleReviewModal } from '@/components/advisor/ScheduleReviewModal'
import { Reveal } from '@/components/brand/Reveal'
import {
  User, Target, Flag, FileText, Calendar, MessageSquare,
  FolderOpen, TrendingUp, AlertCircle, CheckCircle2,
  Plus, X, Loader2,
} from 'lucide-react'

// ── shared modal wrapper ──────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-bg-primary border border-border rounded-xl w-full max-w-lg my-8 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary rounded-t-xl flex-shrink-0">
          <h2 className="font-serif text-xl text-fg-primary">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-fg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

// ── field helpers ─────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-fg-primary text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
const labelCls = "block text-sm font-medium text-fg-secondary mb-1.5"

// ── Add Goal Modal ────────────────────────────────────────────
function AddGoalModal({ clientId, onClose, onAdd }: any) {
  const [form, setForm] = useState({ title: '', description: '', category: 'RETIREMENT', priority: 'MEDIUM', target_amount: '', target_date: '', progress_notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/advisor/clients/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'goal', client_id: clientId, ...form, target_amount: form.target_amount ? Number(form.target_amount) : null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onAdd(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal title="Add Goal" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Early Retirement Corpus" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {['RETIREMENT','EDUCATION','PROPERTY','EMERGENCY_FUND','WEALTH_CREATION','BUSINESS','OTHER'].map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Target Amount (₹)</label><input className={inputCls} type="number" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} placeholder="e.g. 5000000" /></div>
          <div><label className={labelCls}>Target Date</label><input className={inputCls} type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} /></div>
        </div>
        <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div><label className={labelCls}>Progress Notes</label><textarea className={inputCls} rows={2} value={form.progress_notes} onChange={e => set('progress_notes', e.target.value)} /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Add Goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Flag Modal ────────────────────────────────────────────
function AddFlagModal({ clientId, onClose, onAdd }: any) {
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), market_context: '', client_behavior: '', advisor_response: '', severity: 'MEDIUM', is_internal: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.market_context || !form.client_behavior) { setError('Market context and client behavior are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/advisor/clients/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'flag', client_id: clientId, ...form, date: new Date(form.date).toISOString() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onAdd(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal title="Add Behavioral Flag" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Date</label><input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div>
            <label className={labelCls}>Severity</label>
            <select className={inputCls} value={form.severity} onChange={e => set('severity', e.target.value)}>
              <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Market Context *</label><textarea className={inputCls} rows={2} value={form.market_context} onChange={e => set('market_context', e.target.value)} placeholder="What was happening in the market?" /></div>
        <div><label className={labelCls}>Client Behavior *</label><textarea className={inputCls} rows={2} value={form.client_behavior} onChange={e => set('client_behavior', e.target.value)} placeholder="What did the client do or say?" /></div>
        <div><label className={labelCls}>Advisor Response</label><textarea className={inputCls} rows={2} value={form.advisor_response} onChange={e => set('advisor_response', e.target.value)} placeholder="How did you respond?" /></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="internal" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)} className="w-4 h-4" />
          <label htmlFor="internal" className="text-sm text-fg-secondary cursor-pointer">Internal only (not visible to client)</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Add Flag'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Decision Modal ────────────────────────────────────────
function AddDecisionModal({ clientId, onClose, onAdd }: any) {
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), decision: '', context: '', emotional_state: '', reasoning: '', advisor_note: '', outcome: '', is_internal: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.decision || !form.context) { setError('Decision and context are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/advisor/clients/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'decision', client_id: clientId, ...form, date: new Date(form.date).toISOString() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onAdd(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal title="Log Decision" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div><label className={labelCls}>Date</label><input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
        <div><label className={labelCls}>Decision *</label><textarea className={inputCls} rows={2} value={form.decision} onChange={e => set('decision', e.target.value)} placeholder="What decision was made?" /></div>
        <div><label className={labelCls}>Context *</label><textarea className={inputCls} rows={2} value={form.context} onChange={e => set('context', e.target.value)} placeholder="What was the situation?" /></div>
        <div><label className={labelCls}>Emotional State</label><input className={inputCls} value={form.emotional_state} onChange={e => set('emotional_state', e.target.value)} placeholder="e.g. Anxious, Confident" /></div>
        <div><label className={labelCls}>Reasoning</label><textarea className={inputCls} rows={2} value={form.reasoning} onChange={e => set('reasoning', e.target.value)} placeholder="What reasoning did the client give?" /></div>
        <div><label className={labelCls}>Advisor Note</label><textarea className={inputCls} rows={2} value={form.advisor_note} onChange={e => set('advisor_note', e.target.value)} /></div>
        <div><label className={labelCls}>Outcome</label><input className={inputCls} value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="What happened as a result?" /></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="dec-internal" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)} className="w-4 h-4" />
          <label htmlFor="dec-internal" className="text-sm text-fg-secondary cursor-pointer">Internal only</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Log Decision'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Communication Modal ───────────────────────────────────
function AddCommModal({ clientId, onClose, onAdd }: any) {
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), comm_type: 'CALL', summary: '', is_internal: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.summary) { setError('Summary is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/advisor/clients/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'communication', client_id: clientId, ...form, date: new Date(form.date).toISOString() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onAdd(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal title="Log Communication" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Date</label><input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={form.comm_type} onChange={e => set('comm_type', e.target.value)}>
              {['MEETING','CALL','EMAIL','MESSAGE','REVIEW'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>Summary *</label><textarea className={inputCls} rows={3} value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="What was discussed?" /></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="comm-internal" checked={form.is_internal} onChange={e => set('is_internal', e.target.checked)} className="w-4 h-4" />
          <label htmlFor="comm-internal" className="text-sm text-fg-secondary cursor-pointer">Internal only</label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Log Communication'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Mark Complete Modal (inline, reused from ReviewsPageClient) ─
const DRIFT_OPTIONS = [
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'SLIGHT_DRIFT', label: 'Slight Drift' },
  { value: 'SIGNIFICANT_DRIFT', label: 'Significant Drift' },
  { value: 'CRITICAL', label: 'Critical' },
]

function CompleteReviewModal({ review, onClose, onComplete }: any) {
  const [notes, setNotes] = useState('')
  const [drift, setDrift] = useState('ON_TRACK')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try { await onComplete(review.id, notes, drift); onClose() }
    catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Mark Review Complete" onClose={onClose}>
      <p className="text-sm text-fg-muted mb-5">
        {format(new Date(review.scheduled_date), 'MMMM d, yyyy')} at {format(new Date(review.scheduled_date), 'h:mm a')}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div>
          <label className={labelCls}>Drift Assessment</label>
          <select className={inputCls} value={drift} onChange={e => setDrift(e.target.value)}>
            {DRIFT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Advisor Notes <span className="text-fg-muted font-normal">(optional)</span></label>
          <textarea className={inputCls} rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Key observations, decisions made, action items..." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Mark Complete'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────
interface ClientData {
  client: any; goals: any[]; flags: any[]; decisions: any[]
  reviews: any[]; communications: any[]; documents: any[]; snapshots: any[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.id as string
  const initialTab = searchParams.get('tab') || 'overview'

  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [completingReview, setCompletingReview] = useState<any>(null)
  const [addModal, setAddModal] = useState<string | null>(null)

  const reload = async () => {
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}`)
      if (!res.ok) throw new Error('Failed to load')
      setData(await res.json())
    } catch (err: any) { setError(err.message) }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/advisor/clients/${clientId}`)
        if (!res.ok) throw new Error('Failed to load client data')
        setData(await res.json())
      } catch (err: any) { setError(err.message) }
      finally { setLoading(false) }
    }
    load()
  }, [clientId])

  const handleSaveProfile = async (updates: any) => {
    const res = await fetch(`/api/advisor/clients/${clientId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error('Failed to update profile')
    await reload()
  }

  const handleScheduleReview = async () => {
    await reload()
  }

  const handleComplete = async (reviewId: string, notes: string, drift: string) => {
    const res = await fetch('/api/advisor/reviews', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, advisor_notes: notes, drift_assessment: drift }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
    await reload()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-fg-muted">Loading...</div></div>
  if (error || !data) return <div className="min-h-screen flex items-center justify-center"><div className="text-danger">{error || 'Client not found'}</div></div>

  const { client, goals, flags, decisions, reviews, communications, documents, snapshots } = data

  const tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'behavior', label: 'Behavior', icon: Flag },
    { id: 'decisions', label: 'Decisions', icon: FileText },
    { id: 'reviews', label: 'Reviews', icon: Calendar },
    { id: 'communications', label: 'Comms', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
  ]

  const riskGap = (client.stated_risk_score || 0) - (client.revealed_risk_score || 0)
  const hasSignificantGap = Math.abs(riskGap) >= 3

  return (
    <>
      {showEditModal && <EditProfileModal client={client} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />}
      {showScheduleModal && <ScheduleReviewModal clientId={clientId} clientName={client.user?.name || 'Unknown'} advisorId={client.advisor_id} onClose={() => setShowScheduleModal(false)} onScheduled={handleScheduleReview} />}
      {completingReview && <CompleteReviewModal review={completingReview} onClose={() => setCompletingReview(null)} onComplete={handleComplete} />}
      {addModal === 'goal' && <AddGoalModal clientId={clientId} onClose={() => setAddModal(null)} onAdd={reload} />}
      {addModal === 'flag' && <AddFlagModal clientId={clientId} onClose={() => setAddModal(null)} onAdd={reload} />}
      {addModal === 'decision' && <AddDecisionModal clientId={clientId} onClose={() => setAddModal(null)} onAdd={reload} />}
      {addModal === 'communication' && <AddCommModal clientId={clientId} onClose={() => setAddModal(null)} onAdd={reload} />}
      {addModal === 'document' && <AddDocumentModal clientId={clientId} onClose={() => setAddModal(null)} onAdd={reload} />}

      <div className="min-h-screen">
        <header className="border-b border-border bg-bg-secondary">
          <div className="px-4 md:px-8 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-2xl md:text-3xl text-fg-primary mb-1">{client.user?.name}</h1>
                <div className="flex items-center gap-3 text-sm flex-wrap">
                  <span className="text-fg-muted">{client.user?.email}</span>
                  <Badge variant={client.status === 'ACTIVE' ? 'success' : client.status === 'ONBOARDING' ? 'warning' : 'neutral'}>
                    {client.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setShowEditModal(true)} className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors hidden sm:block">
                  Edit Profile
                </button>
                <button onClick={() => setShowScheduleModal(true)} className="px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                  Schedule Review
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 md:px-8 py-6">
          <Tabs tabs={tabs} defaultTab={initialTab}>
            {(activeTab) => (
              <Reveal key={activeTab} once={false}>
                {(() => {
                  switch (activeTab) {
                    case 'overview':   return <OverviewTab client={client} riskGap={riskGap} hasSignificantGap={hasSignificantGap} />
                    case 'goals':      return <GoalsTab goals={goals} onAdd={() => setAddModal('goal')} />
                    case 'behavior':   return <BehaviorTab flags={flags} snapshots={snapshots} onAddFlag={() => setAddModal('flag')} />
                    case 'decisions':  return <DecisionsTab decisions={decisions} onAdd={() => setAddModal('decision')} />
                    case 'reviews':    return <ReviewsTab reviews={reviews} onComplete={setCompletingReview} />
                    case 'communications': return <CommunicationsTab communications={communications} onAdd={() => setAddModal('communication')} />
                    case 'documents':  return <DocumentsTab documents={documents} onAdd={() => setAddModal('document')} />
                    default: return null
                  }
                })()}
              </Reveal>
            )}
          </Tabs>
        </main>
      </div>
    </>
  )
}

// ── Tab components ────────────────────────────────────────────

const TEMPERAMENT_META: Record<string, { color: string; bg: string; border: string; desc: string }> = {
  DELIBERATE:    { color: 'text-accent',   bg: 'bg-accent/8',   border: 'border-accent/20',   desc: 'Slow, methodical. Needs data before acting. Values process over speed.' },
  REACTIVE:      { color: 'text-danger',   bg: 'bg-danger/8',   border: 'border-danger/20',   desc: 'Emotionally driven. Susceptible to fear and market noise. Needs anchoring.' },
  AVOIDANT:      { color: 'text-fg-muted', bg: 'bg-bg-tertiary', border: 'border-border',      desc: 'Delays difficult decisions. Risk of inaction at critical moments.' },
  OVERCONFIDENT: { color: 'text-warning',  bg: 'bg-warning/8',  border: 'border-warning/20',  desc: 'Overestimates ability and underestimates risk. Watch for excessive concentration.' },
  ANCHORED:      { color: 'text-warning',  bg: 'bg-warning/8',  border: 'border-warning/20',  desc: 'Fixates on cost basis or reference points. Struggles to cut losses.' },
  BALANCED:      { color: 'text-success',  bg: 'bg-success/8',  border: 'border-success/20',  desc: 'Measured and rational. Makes decisions aligned with stated risk tolerance.' },
}

function RiskGapChart({ stated, revealed }: { stated: number | null; revealed: number | null }) {
  const s = stated ?? 0
  const r = revealed ?? 0
  const gap = s - r
  const absGap = Math.abs(gap)
  const hasSignificant = absGap >= 3

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-fg-muted uppercase tracking-wider mb-1">Stated</div>
          <div className="font-serif text-5xl text-fg-primary leading-none">{s}<span className="text-lg text-fg-muted">/10</span></div>
        </div>
        <div className="flex-1 mx-6 flex flex-col items-center justify-end">
          {hasSignificant ? (
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${gap > 0 ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-danger/10 text-danger border border-danger/20'}`}>
              {gap > 0 ? `+${absGap} pt gap` : `−${absGap} pt gap`}
            </div>
          ) : (
            <div className="text-xs text-fg-muted px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 mb-2">Aligned</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-fg-muted uppercase tracking-wider mb-1">Revealed</div>
          <div className="font-serif text-5xl text-fg-primary leading-none">{r}<span className="text-lg text-fg-muted">/10</span></div>
        </div>
      </div>

      {/* Dual bar visualization */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-fg-muted mb-1">
            <span>Stated risk tolerance</span>
            <span>{s}/10</span>
          </div>
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${s * 10}%`, background: 'var(--accent)', opacity: 0.5 }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-fg-muted mb-1">
            <span>Revealed risk tolerance</span>
            <span>{r}/10</span>
          </div>
          <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${r * 10}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>

      {hasSignificant && (
        <div className={`mt-4 p-3 rounded-lg border flex items-start gap-2 ${gap > 0 ? 'bg-warning/8 border-warning/20' : 'bg-danger/8 border-danger/20'}`}>
          <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${gap > 0 ? 'text-warning' : 'text-danger'}`} />
          <div className="text-xs text-fg-secondary leading-relaxed">
            {gap > 0
              ? `Client states higher risk tolerance than behavior reveals. They may underestimate their emotional reaction to losses. Consider stress-testing scenarios in next review.`
              : `Client behaves more aggressively than stated tolerance. Watch for overconfidence or thrill-seeking. Ensure portfolio aligns with stated, not revealed, tolerance.`}
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ client, riskGap, hasSignificantGap }: any) {
  const temperamentMeta = client.decision_temperament ? TEMPERAMENT_META[client.decision_temperament] : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Risk Gap — the centerpiece */}
      <Card>
        <CardHeader><CardTitle>Behavioral Risk Profile</CardTitle></CardHeader>
        <CardContent>
          <RiskGapChart stated={client.stated_risk_score} revealed={client.revealed_risk_score} />
        </CardContent>
      </Card>

      {/* Temperament card */}
      <Card>
        <CardHeader><CardTitle>Decision Temperament</CardTitle></CardHeader>
        <CardContent>
          {temperamentMeta ? (
            <div>
              <div className={`inline-flex items-center px-4 py-2 rounded-lg border mb-4 ${temperamentMeta.bg} ${temperamentMeta.border}`}>
                <span className={`font-semibold text-lg ${temperamentMeta.color}`}>{client.decision_temperament}</span>
              </div>
              <p className="text-sm text-fg-secondary leading-relaxed mb-5">{temperamentMeta.desc}</p>

              {(client.panic_threshold || client.discomfort_budget) && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  {client.panic_threshold != null && (
                    <div className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="text-xs text-fg-muted mb-1">Panic Threshold</div>
                      <div className="font-serif text-2xl text-fg-primary">{client.panic_threshold}<span className="text-sm text-fg-muted">%</span></div>
                    </div>
                  )}
                  {client.discomfort_budget != null && (
                    <div className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="text-xs text-fg-muted mb-1">Discomfort Budget</div>
                      <div className="font-serif text-2xl text-fg-primary">{client.discomfort_budget}<span className="text-sm text-fg-muted">%</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-fg-muted text-sm py-4">Temperament not yet assessed</p>
          )}
        </CardContent>
      </Card>

      {/* Relationship details */}
      <Card>
        <CardHeader><CardTitle>Relationship Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div><dt className="text-sm text-fg-muted mb-1">City</dt><dd className="text-fg-primary">{client.city || '—'}</dd></div>
            <div><dt className="text-sm text-fg-muted mb-1">Occupation</dt><dd className="text-fg-primary">{client.occupation || '—'}</dd></div>
            <div><dt className="text-sm text-fg-muted mb-1">Onboarded</dt><dd className="text-fg-primary">{client.onboarded_at ? format(new Date(client.onboarded_at), 'MMMM d, yyyy') : '—'}</dd></div>
            <div><dt className="text-sm text-fg-muted mb-1">Last Review</dt><dd className="text-fg-primary">{client.last_reviewed_at ? format(new Date(client.last_reviewed_at), 'MMMM d, yyyy') : 'No reviews yet'}</dd></div>
            {client.marital_status && <div><dt className="text-sm text-fg-muted mb-1">Marital Status</dt><dd className="text-fg-primary capitalize">{client.marital_status.toLowerCase()}</dd></div>}
            {client.dependents > 0 && <div><dt className="text-sm text-fg-muted mb-1">Dependents</dt><dd className="text-fg-primary">{client.dependents}</dd></div>}
          </dl>
        </CardContent>
      </Card>

      {/* Financial snapshot */}
      <Card>
        <CardHeader><CardTitle>Financial Snapshot</CardTitle></CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div><dt className="text-sm text-fg-muted mb-1">Income Range</dt><dd className="text-fg-primary">{client.income_range || '—'}</dd></div>
            <div><dt className="text-sm text-fg-muted mb-1">Net Worth Band</dt><dd className="text-fg-primary">{client.net_worth_band || '—'}</dd></div>
            <div><dt className="text-sm text-fg-muted mb-1">Primary Liability</dt><dd className="text-fg-primary">{client.primary_liability || '—'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {client.behavioral_summary && (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Behavioral Summary</CardTitle></CardHeader>
          <CardContent><p className="text-fg-secondary leading-relaxed">{client.behavioral_summary}</p></CardContent>
        </Card>
      )}
    </div>
  )
}

function GoalsTab({ goals, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>
      {goals.length === 0 ? (
        <Card><CardContent><p className="text-fg-muted text-center py-8">No goals recorded yet</p></CardContent></Card>
      ) : goals.map((goal: any) => (
        <Card key={goal.id}>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-fg-primary mb-1">{goal.title}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={goal.priority === 'HIGH' ? 'danger' : goal.priority === 'MEDIUM' ? 'warning' : 'neutral'}>{goal.priority}</Badge>
                  <Badge variant={goal.status === 'ON_TRACK' ? 'success' : goal.status === 'NEEDS_ATTENTION' ? 'warning' : 'neutral'} size="sm">{goal.status.replace(/_/g,' ')}</Badge>
                  <span className="text-sm text-fg-muted">{goal.category.replace(/_/g,' ')}</span>
                  {goal.target_date && <span className="text-sm text-fg-muted">→ {format(new Date(goal.target_date), 'MMM yyyy')}</span>}
                </div>
              </div>
            </div>
            {goal.description && <p className="text-sm text-fg-secondary mb-2">{goal.description}</p>}
            {goal.progress_notes && <div className="p-3 bg-bg-tertiary rounded"><p className="text-sm text-fg-secondary">{goal.progress_notes}</p></div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const BIAS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  loss_aversion:  { label: 'Loss Aversion',  color: 'text-danger',  bg: 'bg-danger/10' },
  present_bias:   { label: 'Present Bias',   color: 'text-warning', bg: 'bg-warning/10' },
  anchoring:      { label: 'Anchoring',      color: 'text-accent',  bg: 'bg-accent/10' },
  overconfidence: { label: 'Overconfidence', color: 'text-warning', bg: 'bg-warning/10' },
  herd_behavior:  { label: 'Herd Behavior',  color: 'text-fg-muted', bg: 'bg-bg-tertiary' },
  status_quo:     { label: 'Status Quo',     color: 'text-fg-secondary', bg: 'bg-bg-tertiary' },
  default:        { label: 'Behavioral',     color: 'text-fg-muted', bg: 'bg-bg-tertiary' },
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

function BehaviorTab({ flags, snapshots, onAddFlag }: any) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-fg-primary">Behavioral Flags</h3>
          <button onClick={onAddFlag} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Flag
          </button>
        </div>
        <div className="space-y-4">
          {flags.length === 0 ? (
            <Card><CardContent><p className="text-fg-muted text-center py-8">No flags recorded</p></CardContent></Card>
          ) : flags.map((flag: any) => {
            const biasKey = inferBiasKey(flag.client_behavior)
            const bias = BIAS_LABELS[biasKey]
            return (
              <Card key={flag.id}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <span className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${flag.severity === 'HIGH' ? 'bg-danger' : flag.severity === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-fg-muted text-sm font-mono">{format(new Date(flag.date), 'MMM d, yyyy')}</span>
                        <Badge variant={flag.resolved ? 'success' : 'warning'}>{flag.resolved ? 'Resolved' : 'Open'}</Badge>
                        <Badge variant={flag.severity === 'HIGH' ? 'danger' : flag.severity === 'MEDIUM' ? 'warning' : 'neutral'} size="sm">{flag.severity}</Badge>
                        {/* Bias type pill */}
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${bias.bg} ${bias.color}`}>{bias.label}</span>
                        {flag.is_internal && <Badge variant="neutral" size="sm">Internal</Badge>}
                      </div>
                      <div className="text-xs text-fg-muted mb-1">Market Context</div>
                      <p className="text-sm text-fg-secondary mb-3">{flag.market_context}</p>
                      <div className="text-xs text-fg-muted mb-1">Client Behavior</div>
                      <p className="text-fg-primary mb-2">{flag.client_behavior}</p>
                      {flag.advisor_response && (
                        <div className="p-3 bg-bg-tertiary rounded mt-2">
                          <div className="text-xs text-fg-muted mb-1">Advisor Response</div>
                          <p className="text-sm text-fg-secondary">{flag.advisor_response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {snapshots.length > 0 && (
        <div>
          <h3 className="font-serif text-xl mb-4 text-fg-primary">Risk Profile Over Time</h3>
          <div className="space-y-3">
            {snapshots.map((s: any, i: number) => {
              const sScore = s.stated_risk_score ?? 0
              const rScore = s.revealed_risk_score ?? 0
              return (
                <Card key={s.id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-fg-muted text-sm font-mono">{format(new Date(s.date), 'MMMM d, yyyy')}</span>
                        {i === 0 && <span className="ml-2 text-xs text-accent font-medium">Latest</span>}
                      </div>
                      {s.decision_temperament && (
                        <span className="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-fg-secondary font-medium">{s.decision_temperament}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-fg-muted mb-1">
                          <span>Stated</span><span>{sScore}/10</span>
                        </div>
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${sScore * 10}%`, background: 'var(--accent)', opacity: 0.4 }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-fg-muted mb-1">
                          <span>Revealed</span><span>{rScore}/10</span>
                        </div>
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${rScore * 10}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>
                    </div>
                    {s.advisor_observation && <p className="text-sm text-fg-secondary mt-3 italic">"{s.advisor_observation}"</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function DecisionsTab({ decisions, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Log Decision
        </button>
      </div>
      {decisions.length === 0 ? (
        <Card><CardContent><p className="text-fg-muted text-center py-8">No decisions logged yet</p></CardContent></Card>
      ) : decisions.map((d: any) => (
        <Card key={d.id}>
          <CardContent>
            <div className="flex items-start justify-between mb-3">
              <span className="text-fg-muted text-sm font-mono">{format(new Date(d.date), 'MMM d, yyyy')}</span>
              {d.is_internal && <Badge variant="neutral" size="sm">Internal</Badge>}
            </div>
            <p className="text-fg-primary font-medium mb-2">{d.decision}</p>
            <p className="text-fg-secondary text-sm mb-2">{d.context}</p>
            {d.emotional_state && <p className="text-sm text-fg-muted mb-2">Emotional state: {d.emotional_state}</p>}
            {d.advisor_note && <div className="p-3 bg-bg-tertiary rounded"><div className="text-xs text-fg-muted mb-1">Advisor Note</div><p className="text-sm text-fg-secondary">{d.advisor_note}</p></div>}
            {d.outcome && <div className="mt-2"><div className="text-xs text-fg-muted mb-1">Outcome</div><p className="text-sm text-fg-secondary">{d.outcome}</p></div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ReviewsTab({ reviews, onComplete }: any) {
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <Card><CardContent><p className="text-fg-muted text-center py-8">No reviews scheduled</p></CardContent></Card>
      ) : reviews.map((review: any) => (
        <Card key={review.id}>
          <CardContent>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-fg-muted text-sm font-mono mb-2">
                  {format(new Date(review.scheduled_date), 'MMMM d, yyyy')} at {format(new Date(review.scheduled_date), 'h:mm a')}
                </div>
                <Badge variant={review.status === 'COMPLETED' ? 'success' : review.status === 'SCHEDULED' ? 'warning' : 'neutral'}>{review.status}</Badge>
              </div>
              {review.status === 'SCHEDULED' && (
                <button onClick={() => onComplete(review)} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete
                </button>
              )}
            </div>
            {review.drift_assessment && <div className="mb-3"><div className="text-xs text-fg-muted mb-1">Drift Assessment</div><div className="text-fg-primary font-medium">{review.drift_assessment.replace(/_/g,' ')}</div></div>}
            {review.advisor_notes && <div className="p-3 bg-bg-tertiary rounded"><div className="text-xs text-fg-muted mb-1">Notes</div><p className="text-sm text-fg-secondary">{review.advisor_notes}</p></div>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CommunicationsTab({ communications, onAdd }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Log Communication
        </button>
      </div>
      {communications.length === 0 ? (
        <Card><CardContent><p className="text-fg-muted text-center py-8">No communications recorded</p></CardContent></Card>
      ) : communications.map((c: any) => (
        <Card key={c.id}>
          <CardContent>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-fg-muted text-sm font-mono">{format(new Date(c.date), 'MMM d, yyyy')}</span>
              <Badge variant="neutral" size="sm">{c.type}</Badge>
              {c.is_internal && <Badge variant="neutral" size="sm">Internal</Badge>}
            </div>
            <p className="text-fg-secondary">{c.summary}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Add Document Modal ────────────────────────────────────────
function AddDocumentModal({ clientId, onClose, onAdd }: any) {
  const [form, setForm] = useState({ name: '', doc_type: 'OTHER', url: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Document name is required'); return }
    if (!form.url.trim()) { setError('URL is required'); return }
    try { new URL(form.url) } catch { setError('Please enter a valid URL (e.g. https://...)'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/advisor/clients/records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'document', client_id: clientId, ...form }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      onAdd(); onClose()
    } catch (err: any) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <Modal title="Add Document" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="px-3 py-2 bg-danger/10 border border-danger/30 rounded text-danger text-sm">{error}</div>}
        <div>
          <label className={labelCls}>Document Name *</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. KYC Form 2024, Investment Policy Statement" />
        </div>
        <div>
          <label className={labelCls}>Document Type</label>
          <select className={inputCls} value={form.doc_type} onChange={e => set('doc_type', e.target.value)}>
            <option value="KYC">KYC</option>
            <option value="AGREEMENT">Agreement</option>
            <option value="STATEMENT">Statement</option>
            <option value="REPORT">Report</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Document URL *</label>
          <input
            className={inputCls}
            type="url"
            value={form.url}
            onChange={e => set('url', e.target.value)}
            placeholder="https://drive.google.com/file/... or any public link"
          />
          <p className="text-xs text-fg-muted mt-1">Paste a link to the document (Google Drive, Dropbox, etc.)</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Saving...' : 'Add Document'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DocumentsTab({ documents, onAdd }: { documents: any[]; onAdd: () => void }) {
  const docTypeConfig: Record<string, { label: string; color: string; bg: string }> = {
    KYC:       { label: 'KYC',       color: 'text-accent',      bg: 'bg-accent/10' },
    AGREEMENT: { label: 'Agreement', color: 'text-accent-warm', bg: 'bg-accent-warm/10' },
    STATEMENT: { label: 'Statement', color: 'text-success',     bg: 'bg-success/10' },
    REPORT:    { label: 'Report',    color: 'text-warning',     bg: 'bg-warning/10' },
    OTHER:     { label: 'Document',  color: 'text-fg-muted',    bg: 'bg-bg-tertiary' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          {documents.length} document{documents.length !== 1 ? 's' : ''} on file
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <FolderOpen className="w-10 h-10 text-fg-muted mx-auto mb-3 opacity-40" />
              <p className="text-fg-muted mb-1">No documents yet</p>
              <p className="text-sm text-fg-muted/60 mb-4">Add KYC forms, agreements, statements, and reports here.</p>
              <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
                <Plus className="w-4 h-4" /> Add First Document
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc: any) => {
            const cfg = docTypeConfig[doc.type] || docTypeConfig.OTHER
            return (
              <Card key={doc.id}>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <FolderOpen className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-fg-primary font-medium truncate">{doc.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-fg-muted">
                          {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors text-fg-secondary flex-shrink-0"
                      >
                        View
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
