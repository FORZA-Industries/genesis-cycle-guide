
-- Tighten partner_invites UPDATE policies: route all mutations through server functions
DROP POLICY IF EXISTS "Inviter revokes own invites" ON public.partner_invites;
DROP POLICY IF EXISTS "Invitee accepts invite" ON public.partner_invites;

-- Inviter can only flip their own invite to 'revoked' — no other field changes allowed
CREATE POLICY "Inviter revokes own invites (strict)"
ON public.partner_invites
FOR UPDATE
TO authenticated
USING (inviter_id = auth.uid())
WITH CHECK (
  inviter_id = auth.uid()
  AND status = 'revoked'
);

-- Tighten profiles UPDATE so a user can never write partner_id directly.
-- Linking/unlinking the *other side* goes through the service-role server function.
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile (no partner_id write)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND (
    partner_id IS NULL
    OR partner_id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid())
  )
);
