-- Blueprints versionados criados pelo Arquiteto de Squads.
-- A definição completa permanece em JSONB para permitir evolução do contrato sem perda de histórico.
CREATE TABLE IF NOT EXISTS public.squad_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_id uuid NULL REFERENCES public.squads(id) ON DELETE SET NULL,
  objective text NOT NULL CHECK (char_length(objective) BETWEEN 15 AND 4000),
  client_profile text NULL CHECK (client_profile IS NULL OR char_length(client_profile) <= 2000),
  constraints text NULL CHECK (constraints IS NULL OR char_length(constraints) <= 2000),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'approved', 'archived')),
  blueprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squad_blueprints_tenant_created
  ON public.squad_blueprints (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_squad_blueprints_owner_created
  ON public.squad_blueprints (owner_id, created_at DESC);

ALTER TABLE public.squad_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read squad blueprints" ON public.squad_blueprints;
CREATE POLICY "Members can read squad blueprints"
ON public.squad_blueprints FOR SELECT TO authenticated
USING (public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Members can create own squad blueprints" ON public.squad_blueprints;
CREATE POLICY "Members can create own squad blueprints"
ON public.squad_blueprints FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND public.is_tenant_member(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Owners and admins can update squad blueprints" ON public.squad_blueprints;
CREATE POLICY "Owners and admins can update squad blueprints"
ON public.squad_blueprints FOR UPDATE TO authenticated
USING (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id))
WITH CHECK (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Owners and admins can delete squad blueprints" ON public.squad_blueprints;
CREATE POLICY "Owners and admins can delete squad blueprints"
ON public.squad_blueprints FOR DELETE TO authenticated
USING (owner_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE OR REPLACE FUNCTION public.touch_squad_blueprint_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_squad_blueprints_updated_at ON public.squad_blueprints;
CREATE TRIGGER trg_squad_blueprints_updated_at
BEFORE UPDATE ON public.squad_blueprints
FOR EACH ROW EXECUTE FUNCTION public.touch_squad_blueprint_updated_at();
