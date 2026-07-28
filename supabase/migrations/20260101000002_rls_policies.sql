-- ============================================================
-- ACCRION ADVISORY CRM — ROW LEVEL SECURITY
-- Advisors get full access to everything; clients can only read
-- their own data (and never internal-only rows). API routes use
-- the service-role client and bypass RLS entirely — these
-- policies are the backstop for any direct client-side access
-- (e.g. via the browser anon-key client). Migration 3 of 3.
-- ============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_flags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_availability ENABLE ROW LEVEL SECURITY;


-- USERS
CREATE POLICY "users: advisor can read all"
  ON users FOR SELECT TO authenticated
  USING (public.is_advisor());

CREATE POLICY "users: client can read own"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users: user can update own"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- CLIENTS
CREATE POLICY "clients: advisor full access"
  ON clients FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "clients: client can read own"
  ON clients FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- GOALS
CREATE POLICY "goals: advisor full access"
  ON goals FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "goals: client can read own"
  ON goals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = goals.client_id AND clients.user_id = auth.uid()
  ));

-- BEHAVIORAL FLAGS
CREATE POLICY "behavioral_flags: advisor full access"
  ON behavioral_flags FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "behavioral_flags: client can read own"
  ON behavioral_flags FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = behavioral_flags.client_id AND clients.user_id = auth.uid()
  ));

-- DECISION LOG
CREATE POLICY "decision_log: advisor full access"
  ON decision_log FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "decision_log: client can read own non-internal"
  ON decision_log FOR SELECT TO authenticated
  USING (
    is_internal = false AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = decision_log.client_id AND clients.user_id = auth.uid()
    )
  );

-- REVIEW CYCLES
CREATE POLICY "review_cycles: advisor full access"
  ON review_cycles FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "review_cycles: client can read own"
  ON review_cycles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = review_cycles.client_id AND clients.user_id = auth.uid()
  ));

-- ACTION ITEMS
CREATE POLICY "action_items: advisor full access"
  ON action_items FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "action_items: client can read own"
  ON action_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM review_cycles
    JOIN clients ON clients.id = review_cycles.client_id
    WHERE review_cycles.id = action_items.review_id
      AND clients.user_id = auth.uid()
  ));

-- COMMUNICATIONS
CREATE POLICY "communications: advisor full access"
  ON communications FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "communications: client can read own"
  ON communications FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = communications.client_id AND clients.user_id = auth.uid()
  ));

-- DOCUMENTS
CREATE POLICY "documents: advisor full access"
  ON documents FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "documents: client can read own"
  ON documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id AND clients.user_id = auth.uid()
  ));

-- BEHAVIORAL SNAPSHOTS
CREATE POLICY "behavioral_snapshots: advisor full access"
  ON behavioral_snapshots FOR ALL TO authenticated
  USING (public.is_advisor()) WITH CHECK (public.is_advisor());

CREATE POLICY "behavioral_snapshots: client can read own"
  ON behavioral_snapshots FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = behavioral_snapshots.client_id AND clients.user_id = auth.uid()
  ));

-- ADVISOR AVAILABILITY
CREATE POLICY "advisor_availability: advisor manages own"
  ON advisor_availability FOR ALL TO authenticated
  USING (advisor_id = auth.uid()) WITH CHECK (advisor_id = auth.uid());

CREATE POLICY "advisor_availability: authenticated can read"
  ON advisor_availability FOR SELECT TO authenticated
  USING (true);
