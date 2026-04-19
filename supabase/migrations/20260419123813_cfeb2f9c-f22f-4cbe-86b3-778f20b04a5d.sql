-- hunter_conversations
CREATE TABLE IF NOT EXISTS public.hunter_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_linkedin_id text NOT NULL,
  lead_name text NOT NULL DEFAULT '',
  lead_headline text NOT NULL DEFAULT '',
  lead_profile_url text NOT NULL DEFAULT '',
  lead_picture_url text NOT NULL DEFAULT '',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text NOT NULL DEFAULT '',
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lead_linkedin_id)
);

CREATE INDEX IF NOT EXISTS idx_hunter_conversations_user_last ON public.hunter_conversations(user_id, last_message_at DESC);

ALTER TABLE public.hunter_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON public.hunter_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all conversations"
  ON public.hunter_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_hunter_conversations_updated
  BEFORE UPDATE ON public.hunter_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- hunter_messages_inbox (separada da hunter_messages existente)
CREATE TABLE IF NOT EXISTS public.hunter_messages_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.hunter_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sender text NOT NULL DEFAULT 'lead',
  content text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hunter_messages_inbox_conv ON public.hunter_messages_inbox(conversation_id, sent_at ASC);
CREATE INDEX IF NOT EXISTS idx_hunter_messages_inbox_user ON public.hunter_messages_inbox(user_id);

ALTER TABLE public.hunter_messages_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inbox messages"
  ON public.hunter_messages_inbox FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all inbox messages"
  ON public.hunter_messages_inbox FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hunter_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hunter_messages_inbox;