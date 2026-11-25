-- Phase 1B: Institutional Identity, Profiles, Founding Communities, KVKK Consents, and Audit Logs

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  supabase_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'platform_admin')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'rejected', 'suspended')
  ),
  verified_at TEXT,
  verified_by TEXT REFERENCES users(id),
  rejection_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'alumni')),
  department TEXT NOT NULL,
  entry_year INTEGER NOT NULL,
  graduation_year INTEGER,
  verification_note TEXT,
  directory_visible INTEGER NOT NULL DEFAULT 0 CHECK (directory_visible IN (0, 1)),
  show_contact_info INTEGER NOT NULL DEFAULT 0 CHECK (show_contact_info IN (0, 1)),
  show_professional_links INTEGER NOT NULL DEFAULT 0 CHECK (show_professional_links IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_founding INTEGER NOT NULL DEFAULT 0 CHECK (is_founding IN (0, 1)),
  created_at TEXT NOT NULL
);

-- Seed founding contributing communities (not permanent platform owners)
INSERT OR IGNORE INTO communities (id, slug, name, is_founding, created_at)
VALUES
  ('comm_yazek', 'yazek', 'YAZEK — Yapay Zeka Topluluğu', 1, '2026-11-23T00:00:00.000Z'),
  ('comm_rep', 'rep', 'REP — Robotik ve Elektronik Programlama Topluluğu', 1, '2026-11-23T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS community_permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'organizer')),
  granted_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_community_permissions_user_id ON community_permissions(user_id);

CREATE TABLE IF NOT EXISTS kvkk_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('kvkk_disclosure_ack', 'kvkk_explicit_consent')),
  policy_version TEXT NOT NULL,
  accepted INTEGER NOT NULL CHECK (accepted IN (0, 1)),
  consented_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kvkk_consents_user_id ON kvkk_consents(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
