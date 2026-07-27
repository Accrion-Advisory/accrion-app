// Core Types for Accrion Advisory CRM

export type Role = 'ADVISOR' | 'CLIENT'
export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'PAUSED'
export type Temperament =
  | 'DELIBERATE'
  | 'REACTIVE'
  | 'AVOIDANT'
  | 'OVERCONFIDENT'
  | 'ANCHORED'
  | 'BALANCED'

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type GoalCategory =
  | 'RETIREMENT'
  | 'EDUCATION'
  | 'PROPERTY'
  | 'EMERGENCY_FUND'
  | 'WEALTH_CREATION'
  | 'BUSINESS'
  | 'OTHER'

export type GoalStatus =
  | 'ON_TRACK'
  | 'NEEDS_ATTENTION'
  | 'AT_RISK'
  | 'ACHIEVED'
  | 'PAUSED'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'
export type ReviewStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED'
export type DriftLevel =
  | 'ON_TRACK'
  | 'SLIGHT_DRIFT'
  | 'SIGNIFICANT_DRIFT'
  | 'CRITICAL'

export type CommType = 'MEETING' | 'CALL' | 'EMAIL' | 'MESSAGE' | 'REVIEW'
export type DocType = 'KYC' | 'AGREEMENT' | 'STATEMENT' | 'REPORT' | 'OTHER'
export type ActionOwner = 'CLIENT' | 'ADVISOR'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  password_hash: string
  created_at: string
  updated_at: string
}

export interface ClientProfile {
  id: string
  user_id: string
  advisor_id: string

  // Personal
  phone?: string
  date_of_birth?: string
  occupation?: string
  city?: string

  // Family
  marital_status?: string
  dependents: number
  family_notes?: string

  // Financial Snapshot
  income_range?: string
  net_worth_band?: string
  primary_liability?: string

  // Behavioral Core
  stated_risk_score?: number
  revealed_risk_score?: number
  discomfort_budget?: number
  panic_threshold?: number
  decision_temperament?: Temperament
  behavioral_summary?: string

  // Meta
  onboarded_at: string
  last_reviewed_at?: string
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  client_id: string
  title: string
  description?: string
  target_amount?: number
  target_date?: string
  priority: Priority
  category: GoalCategory
  status: GoalStatus
  progress_notes?: string
  created_at: string
  updated_at: string
}

export interface BehavioralFlag {
  id: string
  client_id: string
  date: string
  market_context: string
  client_behavior: string
  advisor_response?: string
  resolved: boolean
  severity: Severity
  is_internal: boolean
  created_at: string
}

export interface DecisionEntry {
  id: string
  client_id: string
  date: string
  decision: string
  context: string
  emotional_state?: string
  reasoning?: string
  advisor_note?: string
  outcome?: string
  outcome_date?: string
  is_internal: boolean
  created_at: string
}

export interface ReviewCycle {
  id: string
  client_id: string
  scheduled_date: string
  completed_date?: string
  status: ReviewStatus
  pre_review_answers?: {
    q1?: string
    q2?: string
    q3?: string
    q4?: string
  }
  advisor_notes?: string
  drift_assessment?: DriftLevel
  created_at: string
}

export interface ActionItem {
  id: string
  review_id: string
  description: string
  owner: ActionOwner
  due_date?: string
  completed: boolean
  completed_at?: string
  created_at: string
}

export interface CommunicationEntry {
  id: string
  client_id: string
  date: string
  type: CommType
  summary: string
  is_internal: boolean
  created_at: string
}

export interface Document {
  id: string
  client_id: string
  name: string
  type: DocType
  url: string
  uploaded_at: string
}

export interface BehavioralSnapshot {
  id: string
  client_id: string
  date: string
  stated_risk_score?: number
  revealed_risk_score?: number
  discomfort_budget?: number
  panic_threshold?: number
  decision_temperament?: Temperament
  advisor_observation?: string
  created_at: string
}

// Extended types with joined data
export interface ClientWithUser extends ClientProfile {
  user: User
}

export interface GoalWithClient extends Goal {
  client: ClientProfile
}

export interface DashboardStats {
  totalClients: number
  reviewsThisMonth: number
  openFlags: number
  decisionsLogged: number
  previousTotalClients: number
  previousReviewsThisMonth: number
  previousDecisionsLogged: number
  /** New flags opened in the trailing 30 days, vs the 30 days before that. */
  flagsOpenedLast30: number
  flagsOpenedPrev30: number
}
