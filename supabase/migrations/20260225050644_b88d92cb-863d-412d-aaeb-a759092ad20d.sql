-- 1. Create chat_messages table for persistent chat history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  squad_id UUID REFERENCES public.squads(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  agent_name TEXT,
  agent_tier TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_chat_messages_tenant ON public.chat_messages(tenant_id);
CREATE INDEX idx_chat_messages_squad ON public.chat_messages(squad_id) WHERE squad_id IS NOT NULL;
CREATE INDEX idx_chat_messages_agent ON public.chat_messages(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Tenant members can view messages in their tenant
CREATE POLICY "Tenant members can view chat messages"
  ON public.chat_messages FOR SELECT
  USING (is_tenant_member(auth.uid(), tenant_id));

-- Tenant members can insert messages in their tenant
CREATE POLICY "Tenant members can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_tenant_member(auth.uid(), tenant_id));

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all messages in their tenant
CREATE POLICY "Admins can manage tenant messages"
  ON public.chat_messages FOR ALL
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- 2. Enable Realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;