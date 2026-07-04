
-- 1. Table
CREATE TABLE public.user_activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uas_tenant_created ON public.user_activity_stream (tenant_id, created_at DESC);
CREATE INDEX idx_uas_user_created ON public.user_activity_stream (user_id, created_at DESC);
CREATE INDEX idx_uas_event_type ON public.user_activity_stream (event_type);

-- 2. Grants
GRANT SELECT, INSERT ON public.user_activity_stream TO authenticated;
GRANT ALL ON public.user_activity_stream TO service_role;

-- 3. RLS
ALTER TABLE public.user_activity_stream ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view stream"
  ON public.user_activity_stream FOR SELECT
  TO authenticated
  USING (
    tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id)
    OR user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users insert own activity"
  ON public.user_activity_stream FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Realtime
ALTER TABLE public.user_activity_stream REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_stream;

-- 5. Trigger helpers
CREATE OR REPLACE FUNCTION public.log_activity_community_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_stream (user_id, tenant_id, event_type, entity_type, entity_id, title, metadata)
  VALUES (
    NEW.user_id,
    public.get_user_tenant_id(NEW.user_id),
    'community_post_created',
    'community_post',
    NEW.id,
    COALESCE(LEFT(NEW.content, 120), 'Nova publicação'),
    jsonb_build_object('category', NEW.category)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_community_post
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.log_activity_community_post();

CREATE OR REPLACE FUNCTION public.log_activity_linkedin_post()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_stream (user_id, tenant_id, event_type, entity_type, entity_id, title)
  VALUES (
    NEW.user_id,
    public.get_user_tenant_id(NEW.user_id),
    'linkedin_post_published',
    'linkedin_post',
    NEW.id,
    COALESCE(LEFT(NEW.content, 120), 'Post no LinkedIn')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_linkedin_post
AFTER INSERT ON public.linkedin_posts
FOR EACH ROW EXECUTE FUNCTION public.log_activity_linkedin_post();

CREATE OR REPLACE FUNCTION public.log_activity_agent_task()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.user_activity_stream (user_id, tenant_id, event_type, entity_type, entity_id, title, metadata)
    VALUES (
      NEW.user_id,
      public.get_user_tenant_id(NEW.user_id),
      'task_completed',
      'agent_task',
      NEW.id,
      COALESCE(NEW.title, 'Tarefa concluída'),
      jsonb_build_object('agent_id', NEW.agent_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_agent_task
AFTER INSERT OR UPDATE ON public.agent_tasks
FOR EACH ROW EXECUTE FUNCTION public.log_activity_agent_task();

CREATE OR REPLACE FUNCTION public.log_activity_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.user_activity_stream (user_id, tenant_id, event_type, entity_type, entity_id, title, metadata)
    VALUES (
      COALESCE(NEW.reviewer_id, NEW.user_id),
      public.get_user_tenant_id(COALESCE(NEW.reviewer_id, NEW.user_id)),
      'approval_' || NEW.status,
      'approval',
      NEW.id,
      COALESCE(NEW.title, 'Aprovação atualizada'),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_approval
AFTER UPDATE ON public.approvals
FOR EACH ROW EXECUTE FUNCTION public.log_activity_approval();

CREATE OR REPLACE FUNCTION public.log_activity_execution()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_activity_stream (user_id, tenant_id, event_type, entity_type, entity_id, title, metadata)
  VALUES (
    NEW.user_id,
    public.get_user_tenant_id(NEW.user_id),
    'agent_executed',
    'agent',
    NEW.agent_id,
    COALESCE(NEW.action, 'Agente executou ação'),
    jsonb_build_object('status', NEW.status)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_execution
AFTER INSERT ON public.execution_logs
FOR EACH ROW EXECUTE FUNCTION public.log_activity_execution();
