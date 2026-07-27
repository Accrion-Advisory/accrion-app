-- Adds persisted notification preferences to the users table.
-- Run this in the Supabase SQL Editor after accrion-schema.sql.

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}'::jsonb;
