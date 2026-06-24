CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.agent_memories_episodic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('conversation','tool_call','outcome','feedback','escalation')),
  subject_entity TEXT,
  content TEXT NOT NULL,
  embedding vector(1536),
  embedding_model TEXT NOT NULL DEFAULT 'openai/text-embedding-3-small',
  outcome TEXT CHECK (outcome IN ('success','failure','pending','neutral')),
  importance NUMERIC(3,2) NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  access_count INT NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decay_score NUMERIC(4,3) NOT NULL DEFAULT 1.0 CHECK (decay_score >= 0 AND decay_score <= 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_memories_episodic TO authenticated;
GRANT ALL ON public.agent_memories_episodic TO service_role;

ALTER TABLE public.agent_memories_episodic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_read_episodic"
  ON public.agent_memories_episodic FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant_members_insert_episodic"
  ON public.agent_memories_episodic FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant_members_update_episodic"
  ON public.agent_memories_episodic FOR UPDATE TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "tenant_admins_delete_episodic"
  ON public.agent_memories_episodic FOR DELETE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE INDEX idx_episodic_tenant_agent_recent
  ON public.agent_memories_episodic (tenant_id, agent_id, created_at DESC);
CREATE INDEX idx_episodic_subject
  ON public.agent_memories_episodic (tenant_id, subject_entity)
  WHERE subject_entity IS NOT NULL;
CREATE INDEX idx_episodic_embedding
  ON public.agent_memories_episodic
  USING hnsw (embedding vector_cosine_ops);

CREATE TRIGGER trg_episodic_updated_at
  BEFORE UPDATE ON public.agent_memories_episodic
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recall_episodic_memories(
  _tenant_id UUID,
  _agent_id UUID,
  _query_embedding vector(1536),
  _subject_entity TEXT DEFAULT NULL,
  _limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  event_type TEXT,
  outcome TEXT,
  subject_entity TEXT,
  importance NUMERIC,
  similarity FLOAT,
  composite_score FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_tenant_member(auth.uid(), _tenant_id) THEN
    RAISE EXCEPTION 'access denied to tenant memories';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.event_type,
    m.outcome,
    m.subject_entity,
    m.importance,
    (1 - (m.embedding <=> _query_embedding))::float AS similarity,
    (
      (1 - (m.embedding <=> _query_embedding)) * 0.6
      + m.importance::float * 0.25
      + m.decay_score::float * 0.15
    )::float AS composite_score,
    m.created_at
  FROM public.agent_memories_episodic m
  WHERE m.tenant_id = _tenant_id
    AND m.agent_id = _agent_id
    AND m.embedding IS NOT NULL
    AND m.decay_score > 0.05
    AND (_subject_entity IS NULL OR m.subject_entity = _subject_entity)
  ORDER BY composite_score DESC
  LIMIT _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recall_episodic_memories(UUID, UUID, vector, TEXT, INT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.apply_memory_decay()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.agent_memories_episodic
  SET decay_score = GREATEST(
    0,
    LEAST(
      1.0,
      EXP(-EXTRACT(EPOCH FROM (now() - last_accessed_at)) / (60*60*24*30))::numeric
      * (1.0 + LN(1.0 + access_count) / 10.0)
      * (0.5 + importance / 2)
    )
  )
  WHERE decay_score > 0;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_memory_decay() TO service_role;