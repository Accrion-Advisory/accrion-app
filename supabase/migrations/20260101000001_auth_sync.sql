-- ============================================================
-- ACCRION ADVISORY CRM — AUTH SYNC
-- Keeps public.users in sync with auth.users, and a helper to
-- check the advisor role from RLS policies. Migration 2 of 3.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- is_advisor() — used by RLS policies to grant advisors full
-- access to a table while clients only see their own rows.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_advisor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADVISOR'
  );
$$;


-- ────────────────────────────────────────────────────────────
-- handle_new_auth_user() — fires on auth.users INSERT.
--
-- Role/name are read from raw_user_meta_data first (set via the
-- Admin API's `user_metadata`, e.g. by scripts/seed.mjs or
-- app/api/auth/login's metadata-backfill), then raw_app_meta_data,
-- then default to CLIENT / the email's local part.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  user_role;
  _name  text;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    (NEW.raw_app_meta_data->>'role')::user_role,
    'CLIENT'::user_role
  );

  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, _name, _role)
  ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      name  = EXCLUDED.name,
      role  = EXCLUDED.role;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- ────────────────────────────────────────────────────────────
-- handle_auth_user_updated() — fires on auth.users UPDATE, so
-- metadata changes made after creation (e.g. the role backfill
-- in app/api/auth/login) stay in sync with public.users.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role  user_role;
  _name  text;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    (NEW.raw_app_meta_data->>'role')::user_role,
    (OLD.raw_user_meta_data->>'role')::user_role,
    'CLIENT'::user_role
  );

  _name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_app_meta_data->>'name',
    OLD.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  UPDATE public.users
  SET
    email = NEW.email,
    name  = _name,
    role  = _role
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();
