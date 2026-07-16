
-- ── whatsapp_config: 1 por tenant ──────────────────────────────────────────
CREATE TABLE public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT,
  display_phone_number TEXT,
  verify_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id),
  UNIQUE (phone_number_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_config TO authenticated;
GRANT ALL ON public.whatsapp_config TO service_role;

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read whatsapp_config"
  ON public.whatsapp_config FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_config.tenant_id AND tm.user_id = auth.uid()));

CREATE POLICY "tenant admins manage whatsapp_config"
  ON public.whatsapp_config FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_config.tenant_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_config.tenant_id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin')));

-- ── whatsapp_conversations ────────────────────────────────────────────────
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  is_owner_channel BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, contact_phone)
);

CREATE INDEX idx_wa_conv_tenant_last ON public.whatsapp_conversations (tenant_id, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read wa conversations"
  ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_conversations.tenant_id AND tm.user_id = auth.uid()));

CREATE POLICY "tenant members write wa conversations"
  ON public.whatsapp_conversations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_conversations.tenant_id AND tm.user_id = auth.uid()));

CREATE POLICY "tenant members update wa conversations"
  ON public.whatsapp_conversations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_conversations.tenant_id AND tm.user_id = auth.uid()));

-- ── whatsapp_messages ─────────────────────────────────────────────────────
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text','audio','image','video','document','template','system')),
  text_body TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  audio_transcript TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','sent','delivered','read','failed','queued')),
  thor_run_id UUID,
  thor_intent TEXT,
  processed_at TIMESTAMPTZ,
  error TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_msg_conv ON public.whatsapp_messages (conversation_id, created_at DESC);
CREATE INDEX idx_wa_msg_tenant ON public.whatsapp_messages (tenant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members read wa messages"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_messages.tenant_id AND tm.user_id = auth.uid()));

CREATE POLICY "tenant members insert wa messages"
  ON public.whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm WHERE tm.tenant_id = whatsapp_messages.tenant_id AND tm.user_id = auth.uid()));

-- ── updated_at triggers ───────────────────────────────────────────────────
CREATE TRIGGER trg_wa_config_updated_at BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_wa_conv_updated_at BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── realtime ──────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
