'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Calendar, ArrowRight, CheckCircle2, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ScheduleReviewModal } from './ScheduleReviewModal'
import { Reveal } from '@/components/brand/Reveal'

interface ReviewsPageClientProps {
  reviews: any[]
  clients: any[]
}

const DRIFT_OPTIONS = [
  { value: 'ON_TRACK', label: 'On Track' },
  { value: 'SLIGHT_DRIFT', label: 'Slight Drift' },
  { value: 'SIGNIFICANT_DRIFT', label: 'Significant Drift' },
  { value: 'CRITICAL', label: 'Critical' },
]

function CompleteReviewModal({
  review,
  onClose,
  onComplete,
}: {
  review: any
  onClose: () => void
  onComplete: (reviewId: string, notes: string, drift: string) => Promise<void>
}) {
  const [notes, setNotes] = useState('')
  const [drift, setDrift] = useState('ON_TRACK')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onComplete(review.id, notes, drift)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border rounded-xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl text-fg-primary">Mark Review Complete</h2>
            <p className="text-sm text-fg-muted mt-1">
              {review.client?.user?.name} — {format(new Date(review.scheduled_date), 'MMMM d, yyyy')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-fg-primary mb-2">
              Drift Assessment
            </label>
            <select
              value={drift}
              onChange={(e) => setDrift(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-fg-primary
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              {DRIFT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg-primary mb-2">
              Advisor Notes <span className="text-fg-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Key observations, decisions made, action items..."
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-fg-primary
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-accent text-white rounded-lg
                         hover:bg-accent-warm transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ReviewsPageClient({ reviews, clients }: ReviewsPageClientProps) {
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [completingReview, setCompletingReview] = useState<any>(null)
  const [reviewList, setReviewList] = useState(reviews)

  const scheduledReviews = reviewList.filter((r: any) => r.status === 'SCHEDULED')
  const completedReviews = reviewList.filter((r: any) => r.status === 'COMPLETED')

  const handleScheduleReview = async () => {
    window.location.reload()
  }

  const handleComplete = async (reviewId: string, notes: string, drift: string) => {
    const res = await fetch('/api/advisor/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_id: reviewId,
        advisor_notes: notes,
        drift_assessment: drift,
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to complete review')
    }
    const { data: updated } = await res.json()
    // Update local state — move from scheduled to completed
    setReviewList((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
    )
  }

  return (
    <>
      {showScheduleModal && (
        <ScheduleReviewModal
          clients={clients}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={handleScheduleReview}
        />
      )}

      {completingReview && (
        <CompleteReviewModal
          review={completingReview}
          onClose={() => setCompletingReview(null)}
          onComplete={handleComplete}
        />
      )}

      <div className="min-h-screen">
        <header className="border-b border-border bg-bg-secondary">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display font-bold text-3xl text-fg-primary">Review Cycles</h1>
                <p className="text-sm text-fg-muted mt-1">Scheduled and completed reviews</p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Review
              </button>
            </div>
          </div>
        </header>

        <main className="px-8 py-8 space-y-8">
          {/* Upcoming */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl text-fg-primary">Upcoming</h2>
              <Badge variant="warning">{scheduledReviews.length}</Badge>
            </div>

            <Reveal className="space-y-4">
              {scheduledReviews.length === 0 ? (
                <Card>
                  <CardContent>
                    <p className="text-fg-muted text-center py-8">No upcoming reviews</p>
                  </CardContent>
                </Card>
              ) : (
                scheduledReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/advisor/clients/${review.client.id}?tab=reviews`}
                            className="text-lg font-medium text-fg-primary hover:text-accent transition-colors"
                          >
                            {review.client?.user?.name || 'Unknown Client'}
                          </Link>
                          <div className="text-sm text-fg-muted mt-1">
                            {review.client?.user?.email}
                          </div>
                          <div className="flex items-center gap-2 mt-3 text-sm">
                            <Calendar className="w-4 h-4 text-fg-muted" />
                            <span className="text-fg-secondary font-mono">
                              {format(new Date(review.scheduled_date), 'MMMM d, yyyy')}
                            </span>
                            <span className="text-fg-muted">
                              {format(new Date(review.scheduled_date), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setCompletingReview(review)}
                            className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm
                                       rounded-lg hover:bg-accent-warm transition-colors font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Complete
                          </button>
                          <Link
                            href={`/advisor/clients/${review.client.id}?tab=reviews`}
                            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors"
                          >
                            View Client
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </Reveal>
          </section>

          {/* Completed */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-serif text-2xl text-fg-primary">Completed</h2>
              <Badge variant="success">{completedReviews.length}</Badge>
            </div>

            <Reveal className="space-y-4">
              {completedReviews.length === 0 ? (
                <Card>
                  <CardContent>
                    <p className="text-fg-muted text-center py-8">No completed reviews</p>
                  </CardContent>
                </Card>
              ) : (
                completedReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/advisor/clients/${review.client.id}?tab=reviews`}
                            className="text-lg font-medium text-fg-primary hover:text-accent transition-colors"
                          >
                            {review.client?.user?.name || 'Unknown Client'}
                          </Link>
                          <div className="text-sm text-fg-muted mt-1">
                            {review.client?.user?.email}
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-fg-muted" />
                              <span className="text-fg-secondary font-mono">
                                {format(new Date(review.scheduled_date), 'MMMM d, yyyy')}
                              </span>
                            </div>
                            {review.drift_assessment && (
                              <Badge variant={
                                review.drift_assessment === 'ON_TRACK' ? 'success' :
                                review.drift_assessment === 'SLIGHT_DRIFT' ? 'warning' :
                                'danger'
                              }>
                                {review.drift_assessment.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          {review.advisor_notes && (
                            <div className="mt-3 p-3 bg-bg-tertiary rounded">
                              <p className="text-sm text-fg-secondary line-clamp-2">
                                {review.advisor_notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/advisor/clients/${review.client.id}?tab=reviews`}
                          className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-warm transition-colors flex-shrink-0"
                        >
                          View Details
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </Reveal>
          </section>
        </main>
      </div>
    </>
  )
}
