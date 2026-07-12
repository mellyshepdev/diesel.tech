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
