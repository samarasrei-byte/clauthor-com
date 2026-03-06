
-- =============================================
-- RAG: Knowledge Documents with Full-Text Search
-- =============================================
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate tsvector from title + content
CREATE OR REPLACE FUNCTION public.knowledge_documents_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER knowledge_documents_search_update
  BEFORE INSERT OR UPDATE ON public.knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.knowledge_documents_search_vector_update();

-- GIN index for fast full-text search
CREATE INDEX idx_knowledge_documents_search ON public.knowledge_documents USING GIN(search_vector);
CREATE INDEX idx_knowledge_documents_user ON public.knowledge_documents(user_id);
CREATE INDEX idx_knowledge_documents_agent ON public.knowledge_documents(agent_id);

-- RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON public.knowledge_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.knowledge_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.knowledge_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.knowledge_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents"
  ON public.knowledge_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- FEEDBACK LOOP: Chat Feedback
-- =============================================
CREATE TABLE public.chat_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  message_content TEXT NOT NULL DEFAULT '',
  response_content TEXT NOT NULL DEFAULT '',
  rating TEXT NOT NULL DEFAULT 'neutral',
  feedback_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_feedback_user ON public.chat_feedback(user_id);
CREATE INDEX idx_chat_feedback_agent ON public.chat_feedback(agent_id);
CREATE INDEX idx_chat_feedback_rating ON public.chat_feedback(rating);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.chat_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.chat_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback"
  ON public.chat_feedback FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Search function for RAG
-- =============================================
CREATE OR REPLACE FUNCTION public.search_knowledge(
  _user_id UUID,
  _query TEXT,
  _agent_id UUID DEFAULT NULL,
  _limit INT DEFAULT 5
)
RETURNS TABLE(id UUID, title TEXT, content TEXT, category TEXT, rank REAL)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    kd.id,
    kd.title,
    kd.content,
    kd.category,
    ts_rank(kd.search_vector, websearch_to_tsquery('portuguese', _query)) AS rank
  FROM public.knowledge_documents kd
  WHERE kd.user_id = _user_id
    AND (_agent_id IS NULL OR kd.agent_id = _agent_id OR kd.agent_id IS NULL)
    AND kd.search_vector @@ websearch_to_tsquery('portuguese', _query)
  ORDER BY rank DESC
  LIMIT _limit;
$$;
