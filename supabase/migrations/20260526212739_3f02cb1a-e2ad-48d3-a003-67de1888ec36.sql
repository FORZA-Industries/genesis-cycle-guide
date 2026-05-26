
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own or partner profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Partner invites
CREATE TABLE public.partner_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX partner_invites_inviter_idx ON public.partner_invites(inviter_id);
CREATE INDEX partner_invites_email_idx ON public.partner_invites(lower(invitee_email));
GRANT SELECT, INSERT, UPDATE ON public.partner_invites TO authenticated;
GRANT ALL ON public.partner_invites TO service_role;
ALTER TABLE public.partner_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviter sees own invites" ON public.partner_invites
  FOR SELECT TO authenticated USING (inviter_id = auth.uid());
CREATE POLICY "Invitee sees invites by email" ON public.partner_invites
  FOR SELECT TO authenticated
  USING (lower(invitee_email) = lower((auth.jwt() ->> 'email')));
CREATE POLICY "Inviter creates invites" ON public.partner_invites
  FOR INSERT TO authenticated WITH CHECK (inviter_id = auth.uid());
CREATE POLICY "Inviter revokes own invites" ON public.partner_invites
  FOR UPDATE TO authenticated USING (inviter_id = auth.uid());
CREATE POLICY "Invitee accepts invite" ON public.partner_invites
  FOR UPDATE TO authenticated
  USING (lower(invitee_email) = lower((auth.jwt() ->> 'email')))
  WITH CHECK (accepted_by = auth.uid());
