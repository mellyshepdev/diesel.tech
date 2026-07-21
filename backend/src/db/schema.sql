CREATE TABLE IF NOT EXISTS makes (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS models (
  id      SERIAL PRIMARY KEY,
  make_id INTEGER NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  UNIQUE (make_id, name)
);

CREATE TABLE IF NOT EXISTS engines (
  id                  SERIAL PRIMARY KEY,
  model_id            INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  horsepower          INTEGER,
  torque_lb_ft        INTEGER,
  displacement_liters NUMERIC(4,1),
  fuel_type           TEXT NOT NULL DEFAULT 'diesel',
  UNIQUE (model_id, name)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id           SERIAL PRIMARY KEY,
  engine_id    INTEGER NOT NULL REFERENCES engines(id) ON DELETE CASCADE,
  year         INTEGER NOT NULL,
  vin          TEXT UNIQUE,
  unit_number  TEXT,
  mileage      INTEGER,
  owner        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE engines ADD COLUMN IF NOT EXISTS horsepower INTEGER;
ALTER TABLE engines ADD COLUMN IF NOT EXISTS torque_lb_ft INTEGER;
ALTER TABLE engines ADD COLUMN IF NOT EXISTS displacement_liters NUMERIC(4,1);
ALTER TABLE engines ADD COLUMN IF NOT EXISTS fuel_type TEXT NOT NULL DEFAULT 'diesel';

-- Mechanic career progression (engine-viewer's coins/level/tool-shop system).
-- Keyed on the Keycloak access token's `sub` claim, not a local users table —
-- there's no reason to mirror Keycloak's user store here, `sub` is a stable
-- opaque ID we can trust once the JWT is verified. Level itself is never
-- stored: it's derived client-side from `coins` (see `levelForCoins` in
-- EngineViewer.tsx) so it can never drift out of sync with the number that
-- actually earned it.
CREATE TABLE IF NOT EXISTS player_progress (
  user_sub       TEXT PRIMARY KEY,
  coins          INTEGER NOT NULL DEFAULT 0,
  owned_tools    JSONB NOT NULL DEFAULT '[]'::jsonb,
  owned_sections JSONB NOT NULL DEFAULT '[]'::jsonb, -- toolbox sections bought (TOOLBOX_SECTIONS ids)
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS owned_sections JSONB NOT NULL DEFAULT '[]'::jsonb;
