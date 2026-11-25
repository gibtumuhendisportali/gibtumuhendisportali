-- Phase 3: Events, Capacity-Safe Registrations, Digital Tickets, and QR Check-In

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  community_id TEXT REFERENCES communities(id),
  location TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  registered_count INTEGER NOT NULL DEFAULT 0 CHECK (
    registered_count >= 0 AND registered_count <= capacity
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'cancelled', 'completed')
  ),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status_starts ON events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TEXT NOT NULL,
  cancelled_at TEXT,
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id, status);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_salt TEXT NOT NULL,
  qr_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_in', 'cancelled')),
  checked_in_at TEXT,
  checked_in_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_hash ON tickets(qr_token_hash);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id, status);
