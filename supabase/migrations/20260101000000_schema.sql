-- ============================================================
-- ACCRION ADVISORY CRM — SCHEMA
-- Enums, tables, and indexes. Run on a fresh Supabase project
-- via `supabase db push` (this is migration 1 of 3).
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role         AS ENUM ('ADVISOR', 'CLIENT');
CREATE TYPE client_status     AS ENUM ('ACTIVE', 'INACTIVE', 'ONBOARDING', 'PAUSED');
CREATE TYPE temperament       AS ENUM ('DELIBERATE', 'REACTIVE', 'AVOIDANT', 'OVERCONFIDENT', 'ANCHORED', 'BALANCED');
CREATE TYPE priority          AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE goal_category     AS ENUM ('RETIREMENT', 'EDUCATION', 'PROPERTY', 'EMERGENCY_FUND', 'WEALTH_CREATION', 'BUSINESS', 'OTHER');
CREATE TYPE goal_status       AS ENUM ('ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK', 'ACHIEVED', 'PAUSED');
CREATE TYPE severity          AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE review_status     AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'RESCHEDULED');
CREATE TYPE drift_level       AS ENUM ('ON_TRACK', 'SLIGHT_DRIFT', 'SIGNIFICANT_DRIFT', 'CRITICAL');
CREATE TYPE comm_type         AS ENUM ('MEETING', 'CALL', 'EMAIL', 'MESSAGE', 'REVIEW');
CREATE TYPE doc_type          AS ENUM ('KYC', 'AGREEMENT', 'STATEMENT', 'REPORT', 'OTHER');
CREATE TYPE action_owner      AS ENUM ('CLIENT', 'ADVISOR');


-- ============================================================
-- TABLES
-- ============================================================

-- Users (mirrors auth.users; id == auth.users.id, kept in sync by the
-- trigger in the next migration). No password column — Supabase Auth
-- owns credentials.
CREATE TABLE users (
  id                  uuid PRIMARY KEY,
  email               text UNIQUE NOT NULL,
  name                text NOT NULL,
  role                user_role NOT NULL,
  notification_prefs  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES users(id) ON DELETE CASCADE,
  advisor_id           uuid REFERENCES users(id) ON DELETE CASCADE,

  -- Personal
  phone                text,
  date_of_birth        date,
  occupation           text,
  city                 text,

  -- Family
  marital_status       text,
  dependents           integer DEFAULT 0,
  family_notes         text,

  -- Financial snapshot
  income_range         text,
  net_worth_band       text,
  primary_liability    text,

  -- Behavioral core
  stated_risk_score    integer,
  revealed_risk_score  integer,
  discomfort_budget    integer,
  panic_threshold      integer,
  decision_temperament temperament,
  behavioral_summary   text,

  -- Meta
  onboarded_at         timestamptz DEFAULT now(),
  last_reviewed_at     timestamptz,
  status               client_status DEFAULT 'ONBOARDING',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- Goals
CREATE TABLE goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid REFERENCES clients(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  target_amount  numeric,
  target_date    date,
  priority       priority DEFAULT 'MEDIUM',
  category       goal_category NOT NULL,
  status         goal_status DEFAULT 'ON_TRACK',
  progress_notes text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Behavioral flags
CREATE TABLE behavioral_flags (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES clients(id) ON DELETE CASCADE,
  date             timestamptz NOT NULL,
  market_context   text NOT NULL,
  client_behavior  text NOT NULL,
  advisor_response text,
  resolved         boolean DEFAULT false,
  severity         severity DEFAULT 'MEDIUM',
  is_internal      boolean DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- Decision log
CREATE TABLE decision_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  date            timestamptz NOT NULL,
  decision        text NOT NULL,
  context         text NOT NULL,
  emotional_state text,
  reasoning       text,
  advisor_note    text,
  outcome         text,
  outcome_date    timestamptz,
  is_internal     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Review cycles
CREATE TABLE review_cycles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid REFERENCES clients(id) ON DELETE CASCADE,
  scheduled_date      timestamptz NOT NULL,
  completed_date      timestamptz,
  status              review_status DEFAULT 'SCHEDULED',
  pre_review_answers  jsonb,
  advisor_notes       text,
  drift_assessment    drift_level,
  created_at          timestamptz DEFAULT now()
);

-- Action items
CREATE TABLE action_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id    uuid REFERENCES review_cycles(id) ON DELETE CASCADE,
  description  text NOT NULL,
  owner        action_owner NOT NULL,
  due_date     timestamptz,
  completed    boolean DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- Communications
CREATE TABLE communications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  date        timestamptz NOT NULL,
  type        comm_type NOT NULL,
  summary     text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        doc_type NOT NULL,
  url         text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Behavioral snapshots
CREATE TABLE behavioral_snapshots (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            uuid REFERENCES clients(id) ON DELETE CASCADE,
  date                 timestamptz NOT NULL,
  stated_risk_score    integer,
  revealed_risk_score  integer,
  discomfort_budget    integer,
  panic_threshold      integer,
  decision_temperament temperament,
  advisor_observation  text,
  created_at           timestamptz DEFAULT now()
);

-- Advisor availability (weekly recurring schedule)
-- day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
CREATE TABLE advisor_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (advisor_id, day_of_week)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_clients_advisor            ON clients(advisor_id);
CREATE INDEX idx_clients_user               ON clients(user_id);
CREATE INDEX idx_clients_status             ON clients(status);
CREATE INDEX idx_goals_client               ON goals(client_id);
CREATE INDEX idx_behavioral_flags_client    ON behavioral_flags(client_id);
CREATE INDEX idx_behavioral_flags_resolved  ON behavioral_flags(resolved);
CREATE INDEX idx_decision_log_client        ON decision_log(client_id);
CREATE INDEX idx_review_cycles_client       ON review_cycles(client_id);
CREATE INDEX idx_review_cycles_status       ON review_cycles(status);
CREATE INDEX idx_action_items_review        ON action_items(review_id);
CREATE INDEX idx_communications_client      ON communications(client_id);
CREATE INDEX idx_documents_client           ON documents(client_id);
CREATE INDEX idx_snapshots_client           ON behavioral_snapshots(client_id);
CREATE INDEX idx_availability_advisor       ON advisor_availability(advisor_id);
