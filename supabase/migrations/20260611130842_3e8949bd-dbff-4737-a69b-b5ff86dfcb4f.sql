
-- 1) Lock partner_id changes from the client side. Linking must go through the
--    server-side accept_partner_invite / unlinkPartner flow (service role).
DROP POLICY IF EXISTS "Users update own profile (no partner_id write)" ON public.profiles;
CREATE POLICY "Users update own profile (no partner_id write)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND partner_id IS NOT DISTINCT FROM (
    SELECT p.partner_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- 2) Require a verified email before an invitee can read invites addressed to
--    their email via RLS. Prevents forged/unverified email JWT claims from
--    exposing pending invite codes.
DROP POLICY IF EXISTS "Invitee sees invites by email" ON public.partner_invites;
CREATE POLICY "Invitee sees invites by email"
ON public.partner_invites
FOR SELECT
TO authenticated
USING (
  lower(invitee_email) = lower((auth.jwt() ->> 'email'))
  AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
);
