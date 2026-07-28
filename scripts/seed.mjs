// Seeds a freshly migrated Supabase project with one demo advisor
// (Tanay) and one demo client (Arjun Mehta), plus sample goals,
// flags, decisions, a completed review, and a weekly availability
// schedule.
//
// Run after `supabase link` + `supabase db push`:
//   npm run seed
//
// Safe to re-run: auth users, the client profile, and the review
// cycle are upserted. Child rows (goals, flags, decisions, etc.)
// have no natural unique key, so re-running duplicates them —
// this is meant to run once against a freshly migrated project.

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.')
  console.error('Run this with: node --env-file=.env.local scripts/seed.mjs')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function getOrCreateAuthUser({ email, password, name, role }) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existing = list.users.find((u) => u.email === email)
  if (existing) {
    console.log(`  ${email} already exists, reusing.`)
    return existing.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, name },
  })
  if (error) throw error
  console.log(`  Created ${email}.`)
  return data.user.id
}

async function main() {
  console.log('Creating demo auth users...')
  const advisorId = await getOrCreateAuthUser({
    email: 'tanay@accrion.co',
    password: 'advisor123',
    name: 'Tanay',
    role: 'ADVISOR',
  })
  const clientUserId = await getOrCreateAuthUser({
    email: 'arjun.mehta@email.com',
    password: 'client123',
    name: 'Arjun Mehta',
    role: 'CLIENT',
  })

  const clientId = 'a3ece44a-9bf5-4703-9ad3-cd25b99c7845'

  console.log('Seeding client profile...')
  await upsert('clients', { id: clientId }, {
    id: clientId,
    user_id: clientUserId,
    advisor_id: advisorId,
    phone: '+91 98200 11234',
    date_of_birth: '1984-03-22',
    occupation: 'Senior Engineering Manager',
    city: 'Bangalore',
    marital_status: 'Married',
    dependents: 2,
    family_notes: 'Spouse is a doctor with independent income.',
    income_range: '40L-60L',
    net_worth_band: '1Cr-3Cr',
    primary_liability: 'Home loan 45L outstanding',
    stated_risk_score: 7,
    revealed_risk_score: 4,
    discomfort_budget: 25,
    panic_threshold: 15,
    decision_temperament: 'REACTIVE',
    behavioral_summary: 'Confident professional with significant anxiety during market corrections.',
    onboarded_at: '2026-01-10T00:00:00Z',
    last_reviewed_at: '2026-01-28T00:00:00Z',
    status: 'ACTIVE',
  })

  console.log('Seeding goals...')
  await insertMany('goals', [
    {
      client_id: clientId,
      title: 'Early Retirement Corpus',
      description: 'Build a retirement corpus to retire comfortably by 55.',
      target_amount: 50000000,
      target_date: '2039-03-01',
      priority: 'HIGH',
      category: 'RETIREMENT',
      status: 'ON_TRACK',
      progress_notes: 'SIPs running. On track as of last review.',
    },
    {
      client_id: clientId,
      title: "Children's Education Fund",
      description: 'Fund higher education for both kids, likely abroad.',
      target_amount: 8000000,
      target_date: '2034-06-01',
      priority: 'HIGH',
      category: 'EDUCATION',
      status: 'NEEDS_ATTENTION',
      progress_notes: 'Corpus growing but below target pace due to market underperformance.',
    },
    {
      client_id: clientId,
      title: 'Emergency Fund',
      description: 'Maintain 6 months of expenses as liquid emergency reserve.',
      target_amount: 600000,
      target_date: '2026-06-01',
      priority: 'MEDIUM',
      category: 'EMERGENCY_FUND',
      status: 'ON_TRACK',
      progress_notes: 'FD ladder set up. Fully funded.',
    },
  ])

  console.log('Seeding behavioral flags...')
  await insertMany('behavioral_flags', [
    {
      client_id: clientId,
      date: '2026-01-20T00:00:00Z',
      market_context: 'Nifty fell 4.2% in a single week amid FII outflows.',
      client_behavior: 'Called twice in one day asking to move everything to FD.',
      advisor_response: 'Walked through the portfolio allocation and historical recovery data. Client calmed down.',
      resolved: true,
      severity: 'HIGH',
      is_internal: true,
    },
    {
      client_id: clientId,
      date: '2026-02-10T00:00:00Z',
      market_context: 'Budget announcement created short-term volatility in mid-caps.',
      client_behavior: 'Wanted to pause SIPs for 3 months "until things settle".',
      advisor_response: 'Explained rupee cost averaging benefit. Client agreed to continue SIPs.',
      resolved: true,
      severity: 'MEDIUM',
      is_internal: false,
    },
  ])

  console.log('Seeding decision log...')
  await insertMany('decision_log', [
    {
      client_id: clientId,
      date: '2026-01-15T00:00:00Z',
      decision: 'Agreed to increase SIP by ₹20,000/month',
      context: 'Annual appraisal resulted in significant salary hike.',
      emotional_state: 'Positive and motivated',
      reasoning: 'Wanted to accelerate retirement corpus after raise.',
      advisor_note: 'Good decision aligned with long-term goals. Encouraged.',
      outcome: 'SIP increase executed. Running smoothly.',
      outcome_date: '2026-01-16T00:00:00Z',
      is_internal: false,
    },
    {
      client_id: clientId,
      date: '2026-01-21T00:00:00Z',
      decision: 'Decided against redeeming equity funds during correction',
      context: 'Market down 4.2%. Client initially wanted to exit.',
      emotional_state: 'Anxious, panic-driven',
      reasoning: 'Feared further losses. Wanted capital protection.',
      advisor_note: 'Reactive behaviour consistent with profile. Logged for pattern tracking.',
      outcome: 'Held position. Portfolio recovered 3.1% in following 2 weeks.',
      outcome_date: '2026-02-04T00:00:00Z',
      is_internal: true,
    },
  ])

  console.log('Seeding review cycle + action items...')
  const reviewId = 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  await upsert('review_cycles', { id: reviewId }, {
    id: reviewId,
    client_id: clientId,
    scheduled_date: '2026-01-28T10:00:00Z',
    completed_date: '2026-01-28T11:15:00Z',
    status: 'COMPLETED',
    advisor_notes: 'Client is performing well overall. Behavioral reactivity is the primary concern. Education goal needs a top-up discussion next quarter.',
    drift_assessment: 'SLIGHT_DRIFT',
  })

  await insertMany('action_items', [
    {
      review_id: reviewId,
      description: 'Review education fund allocation and present top-up plan.',
      owner: 'ADVISOR',
      due_date: '2026-02-28T00:00:00Z',
      completed: true,
      completed_at: '2026-02-20T00:00:00Z',
    },
    {
      review_id: reviewId,
      description: 'Share reading material on behavioural biases during market volatility.',
      owner: 'ADVISOR',
      due_date: '2026-02-10T00:00:00Z',
      completed: true,
      completed_at: '2026-02-08T00:00:00Z',
    },
    {
      review_id: reviewId,
      description: 'Set up auto-debit for increased SIP amount.',
      owner: 'CLIENT',
      due_date: '2026-02-05T00:00:00Z',
      completed: true,
      completed_at: '2026-02-03T00:00:00Z',
    },
  ])

  console.log('Seeding communications...')
  await insertMany('communications', [
    {
      client_id: clientId,
      date: '2026-01-20T14:30:00Z',
      type: 'CALL',
      summary: 'Client called during market correction. Panicked about losses. Advisor walked through portfolio resilience and calmed him down.',
      is_internal: true,
    },
    {
      client_id: clientId,
      date: '2026-01-28T11:15:00Z',
      type: 'REVIEW',
      summary: 'Quarterly review completed. Discussed behavioral patterns, education fund gap, and retirement SIP progress.',
      is_internal: false,
    },
    {
      client_id: clientId,
      date: '2026-02-10T09:00:00Z',
      type: 'EMAIL',
      summary: 'Sent article on rupee cost averaging and SIP behaviour during volatile markets.',
      is_internal: false,
    },
  ])

  console.log('Seeding behavioral snapshots...')
  await insertMany('behavioral_snapshots', [
    {
      client_id: clientId,
      date: '2026-01-10T00:00:00Z',
      stated_risk_score: 7,
      revealed_risk_score: 5,
      discomfort_budget: 25,
      panic_threshold: 18,
      decision_temperament: 'REACTIVE',
      advisor_observation: 'Onboarding snapshot. Stated risk appetite is higher than revealed behaviour suggests.',
    },
    {
      client_id: clientId,
      date: '2026-01-28T00:00:00Z',
      stated_risk_score: 7,
      revealed_risk_score: 4,
      discomfort_budget: 25,
      panic_threshold: 15,
      decision_temperament: 'REACTIVE',
      advisor_observation: 'Post-correction review. Revealed risk score dropped further after panic call in January. Panic threshold tightened.',
    },
  ])

  console.log('Seeding advisor availability (Mon–Thu 10–6, Fri 10–2)...')
  const { error: availError } = await supabase.from('advisor_availability').upsert(
    [
      { advisor_id: advisorId, day_of_week: 0, start_time: '10:00', end_time: '18:00', is_active: false },
      { advisor_id: advisorId, day_of_week: 1, start_time: '10:00', end_time: '18:00', is_active: true },
      { advisor_id: advisorId, day_of_week: 2, start_time: '10:00', end_time: '18:00', is_active: true },
      { advisor_id: advisorId, day_of_week: 3, start_time: '10:00', end_time: '18:00', is_active: true },
      { advisor_id: advisorId, day_of_week: 4, start_time: '10:00', end_time: '18:00', is_active: true },
      { advisor_id: advisorId, day_of_week: 5, start_time: '10:00', end_time: '14:00', is_active: true },
      { advisor_id: advisorId, day_of_week: 6, start_time: '10:00', end_time: '18:00', is_active: false },
    ],
    { onConflict: 'advisor_id,day_of_week' }
  )
  if (availError) throw availError

  console.log('\nDone. Demo logins:')
  console.log('  Advisor -> tanay@accrion.co / advisor123')
  console.log('  Client  -> arjun.mehta@email.com / client123')
}

async function upsert(table, match, row) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: Object.keys(match).join(',') })
  if (error) throw error
}

async function insertMany(table, rows) {
  const { error } = await supabase.from(table).insert(rows)
  if (error && error.code !== '23505') throw error
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
