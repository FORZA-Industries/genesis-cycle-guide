
CREATE TABLE public.ph_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ph_value NUMERIC(3,1) NOT NULL CHECK (ph_value >= 4.5 AND ph_value <= 9.0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ph_readings_user_recorded_idx ON public.ph_readings (user_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ph_readings TO authenticated;
GRANT ALL ON public.ph_readings TO service_role;

ALTER TABLE public.ph_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own ph readings" ON public.ph_readings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ph readings" ON public.ph_readings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ph readings" ON public.ph_readings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ph readings" ON public.ph_readings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER ph_readings_touch_updated
  BEFORE UPDATE ON public.ph_readings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
