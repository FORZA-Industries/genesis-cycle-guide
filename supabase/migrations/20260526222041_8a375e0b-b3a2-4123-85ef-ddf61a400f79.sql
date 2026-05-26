CREATE TABLE public.cycle_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 21 AND 35),
  period_length INTEGER NOT NULL DEFAULT 5 CHECK (period_length BETWEEN 1 AND 10),
  last_period_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_settings TO authenticated;
GRANT ALL ON public.cycle_settings TO service_role;

ALTER TABLE public.cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cycle_settings" ON public.cycle_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cycle_settings" ON public.cycle_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cycle_settings" ON public.cycle_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own cycle_settings" ON public.cycle_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER cycle_settings_touch_updated_at
  BEFORE UPDATE ON public.cycle_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();