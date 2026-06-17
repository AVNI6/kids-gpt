-- Create child_invitations table
CREATE TABLE IF NOT EXISTS public.child_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email VARCHAR NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_child_invitations_token ON public.child_invitations(token);
CREATE INDEX IF NOT EXISTS idx_child_invitations_email ON public.child_invitations(lower(invitee_email));

-- Enable RLS
ALTER TABLE public.child_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS select_invitations_by_token ON public.child_invitations;
CREATE POLICY select_invitations_by_token ON public.child_invitations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS manage_invitations_by_parent ON public.child_invitations;
CREATE POLICY manage_invitations_by_parent ON public.child_invitations
  FOR ALL
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS update_invitations_by_invitee ON public.child_invitations;
CREATE POLICY update_invitations_by_invitee ON public.child_invitations
  FOR UPDATE
  TO authenticated
  USING (
    lower(invitee_email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.profile p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) = lower(invitee_email)
    )
  )
  WITH CHECK (
    lower(invitee_email) = lower(auth.jwt() ->> 'email')
    OR EXISTS (
      SELECT 1 FROM public.profile p
      WHERE p.user_id = auth.uid()
        AND lower(p.email) = lower(invitee_email)
    )
  );
