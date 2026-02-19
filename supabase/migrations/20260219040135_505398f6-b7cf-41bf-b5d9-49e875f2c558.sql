
-- 1. Tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 2. Tenant members table
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- 3. Squads table
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

-- 4. Squad agents table
CREATE TABLE public.squad_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(squad_id, agent_id)
);
ALTER TABLE public.squad_agents ENABLE ROW LEVEL SECURITY;

-- 5. Agent memory table
CREATE TABLE public.agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  squad_id uuid REFERENCES public.squads(id) ON DELETE SET NULL,
  memory_type text NOT NULL DEFAULT 'conversation',
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_agent_memory_tenant ON public.agent_memory(tenant_id);
CREATE INDEX idx_agent_memory_lookup ON public.agent_memory(tenant_id, user_id, agent_id);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_squads_tenant ON public.squads(tenant_id);
CREATE INDEX idx_squad_agents_tenant ON public.squad_agents(tenant_id);

-- Security definer function: get tenant_id for a user
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Security definer: check tenant membership
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- Security definer: check tenant admin/owner
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role IN ('owner', 'admin')
  )
$$;

-- RLS: tenants
CREATE POLICY "Members can view own tenant" ON public.tenants
  FOR SELECT USING (is_tenant_member(auth.uid(), id));
CREATE POLICY "Admins can update own tenant" ON public.tenants
  FOR UPDATE USING (is_tenant_admin(auth.uid(), id));
CREATE POLICY "Authenticated can create tenant" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS: tenant_members
CREATE POLICY "Members can view tenant members" ON public.tenant_members
  FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins can manage members" ON public.tenant_members
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can insert themselves" ON public.tenant_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: squads
CREATE POLICY "Members can view squads" ON public.squads
  FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins can manage squads" ON public.squads
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: squad_agents
CREATE POLICY "Members can view squad agents" ON public.squad_agents
  FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins can manage squad agents" ON public.squad_agents
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: agent_memory (strict isolation)
CREATE POLICY "Users can view own agent memory" ON public.agent_memory
  FOR SELECT USING (
    auth.uid() = user_id AND is_tenant_member(auth.uid(), tenant_id)
  );
CREATE POLICY "Users can insert own agent memory" ON public.agent_memory
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND is_tenant_member(auth.uid(), tenant_id)
  );
CREATE POLICY "Users can update own agent memory" ON public.agent_memory
  FOR UPDATE USING (
    auth.uid() = user_id AND is_tenant_member(auth.uid(), tenant_id)
  );
CREATE POLICY "Users can delete own agent memory" ON public.agent_memory
  FOR DELETE USING (
    auth.uid() = user_id AND is_tenant_member(auth.uid(), tenant_id)
  );

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_squads_updated_at BEFORE UPDATE ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON public.agent_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
