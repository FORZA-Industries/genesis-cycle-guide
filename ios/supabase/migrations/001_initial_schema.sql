-- 001_initial_schema.sql
-- Genesyx production schema (Master Implementation Doc §6.7).
-- Run in the Supabase SQL Editor of the `genesyx-prod` project (human checklist §9.2),
-- or via `supabase db push` after `supabase link`.
--
-- Four syncable tables + RLS (auth.uid() = owner on every table) + updated_at
-- triggers + auto-created profile row + pH range constraint + pH tombstones.

-- ============================================================ profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),
  focus_mode TEXT NOT NULL DEFAULT 'prep' CHECK (focus_mode IN ('prep', 'pregnancy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
-- No INSERT policy: rows are created by the auth trigger below.
-- partner_id writes happen via the service role only (Edge Functions).

-- ============================================================ cycle_settings
CREATE TABLE public.cycle_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  last_period_date DATE NOT NULL,
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 21 AND 35),
  period_length INTEGER NOT NULL DEFAULT 5 CHECK (period_length BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cycle_settings_all_own" ON public.cycle_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================ daily_logs
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT CHECK (mood IS NULL OR char_length(mood) <= 20),
  energy TEXT CHECK (energy IS NULL OR energy IN ('low', 'normal', 'high')),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  sleep_minutes INTEGER CHECK (sleep_minutes IS NULL OR sleep_minutes BETWEEN 0 AND 1440),
  water_ml INTEGER NOT NULL DEFAULT 0 CHECK (water_ml BETWEEN 0 AND 10000),
  supplements TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_logs_all_own" ON public.daily_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX daily_logs_user_date_idx ON public.daily_logs (user_id, date DESC);

-- ============================================================ ph_readings
CREATE TABLE public.ph_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ph_value NUMERIC(3, 1) NOT NULL CHECK (ph_value BETWEEN 4.5 AND 9.0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
  -- Tombstone (§6.4/F): deletions are soft so offline devices converge instead
  -- of resurrecting deleted readings. Clients filter deleted_at IS NULL.
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ph_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ph_readings_all_own" ON public.ph_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ph_readings_user_recorded_idx ON public.ph_readings (user_id, recorded_at DESC);

-- ============================================================ updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER cycle_settings_updated_at BEFORE UPDATE ON public.cycle_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER daily_logs_updated_at BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ph_readings_updated_at BEFORE UPDATE ON public.ph_readings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================ auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name',
                           NEW.raw_user_meta_data ->> 'full_name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
