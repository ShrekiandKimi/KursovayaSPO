/*
  # Add missing columns to existing tables

  1. Changes
    - `profiles`: Add `email` column
    - `trips`: Add `driver_earnings`, `park_earnings`, `status`, `passenger_rating` columns

  2. Notes
    - These columns are needed for the taxi park management features
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'driver_earnings'
  ) THEN
    ALTER TABLE trips ADD COLUMN driver_earnings numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'park_earnings'
  ) THEN
    ALTER TABLE trips ADD COLUMN park_earnings numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'status'
  ) THEN
    ALTER TABLE trips ADD COLUMN status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'passenger_rating'
  ) THEN
    ALTER TABLE trips ADD COLUMN passenger_rating integer CHECK (passenger_rating >= 1 AND passenger_rating <= 5);
  END IF;
END $$;
