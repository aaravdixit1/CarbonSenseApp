-- Migration: 001_initial_schema.sql
-- Creates the five core tables for CarbonSense backend.

-- users: mirrors auth.users, stores display info
CREATE TABLE users (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        TEXT NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- habit_profiles: one row per user (upserted on PUT /profile)
CREATE TABLE habit_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    transport_method    TEXT NOT NULL,
    car_type            TEXT,
    diet_type           TEXT NOT NULL,
    meat_frequency      TEXT NOT NULL,
    home_energy_source  TEXT NOT NULL,
    household_size      INTEGER NOT NULL,
    shopping_frequency  TEXT NOT NULL,
    flight_frequency    TEXT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- footprint_results: one row per user (upserted on POST /analyze)
CREATE TABLE footprint_results (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_tco2e    FLOAT NOT NULL,
    db_version     TEXT NOT NULL,
    fallback_used  BOOLEAN NOT NULL,
    breakdown      JSONB NOT NULL,
    factors_used   JSONB NOT NULL,
    calculated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- actions: replaced wholesale on each POST /analyze
CREATE TABLE actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description     TEXT NOT NULL,
    savings_tco2e   FLOAT NOT NULL,
    impact_label    TEXT NOT NULL,
    rank            INTEGER NOT NULL,
    composite_score FLOAT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- goals: lifecycle tracking for committed actions
CREATE TABLE goals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_id    UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'completed', 'dismissed')),
    committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
