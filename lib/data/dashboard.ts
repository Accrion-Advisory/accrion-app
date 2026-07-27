import { createServiceClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/lib/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServiceClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  // Get total active clients (now, and as of the end of last month)
  const { count: totalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  const { count: previousTotalClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')
    .lte('onboarded_at', endOfPrevMonth)

  // Get reviews this month vs last month
  const { count: reviewsThisMonth } = await supabase
    .from('review_cycles')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', startOfMonth)
    .lte('scheduled_date', endOfMonth)

  const { count: previousReviewsThisMonth } = await supabase
    .from('review_cycles')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_date', startOfPrevMonth)
    .lte('scheduled_date', endOfPrevMonth)

  // Open flags right now — trended against flags opened in the prior 30-day
  // window vs the 30 days before that (a point-in-time "still open" count
  // has no meaningful month-ago equivalent, so we trend on new-flag volume).
  const { count: openFlags } = await supabase
    .from('behavioral_flags')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false)

  const { count: flagsOpenedLast30 } = await supabase
    .from('behavioral_flags')
    .select('*', { count: 'exact', head: true })
    .gte('date', thirtyDaysAgo)

  const { count: flagsOpenedPrev30 } = await supabase
    .from('behavioral_flags')
    .select('*', { count: 'exact', head: true })
    .gte('date', sixtyDaysAgo)
    .lt('date', thirtyDaysAgo)

  // Get decisions logged this month vs last month
  const { count: decisionsLogged } = await supabase
    .from('decision_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth)
    .lte('created_at', endOfMonth)

  const { count: previousDecisionsLogged } = await supabase
    .from('decision_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfPrevMonth)
    .lte('created_at', endOfPrevMonth)

  return {
    totalClients: totalClients || 0,
    reviewsThisMonth: reviewsThisMonth || 0,
    openFlags: openFlags || 0,
    decisionsLogged: decisionsLogged || 0,
    previousTotalClients: previousTotalClients || 0,
    previousReviewsThisMonth: previousReviewsThisMonth || 0,
    previousDecisionsLogged: previousDecisionsLogged || 0,
    flagsOpenedLast30: flagsOpenedLast30 || 0,
    flagsOpenedPrev30: flagsOpenedPrev30 || 0,
  }
}

export async function getUpcomingReviews(limit: number = 5) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('review_cycles')
    .select('id, scheduled_date, status, drift_assessment, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .eq('status', 'SCHEDULED')
    .gte('scheduled_date', new Date().toISOString())
    .order('scheduled_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching upcoming reviews:', error)
    return []
  }

  return data || []
}

export async function getOpenFlags(limit: number = 5) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('id, date, client_behavior, severity, resolved, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .eq('resolved', false)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching open flags:', error)
    return []
  }

  return data || []
}

export async function getRecentActivity(limit: number = 10) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('decision_log')
    .select('id, date, decision, client_id, client:clients(id, user:users!clients_user_id_fkey(name))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }

  return data || []
}
