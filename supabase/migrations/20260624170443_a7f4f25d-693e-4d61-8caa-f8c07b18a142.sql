
-- ============== FILES ==============
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video','audio','image','pdf','doc','brandbook','logo','marketing','other')),
  bucket_path TEXT NOT NULL,
  size_bytes BIGINT,
  mime TEXT,
  folder TEXT DEFAULT 'root',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_files_tenant ON public.files(tenant_id);
CREATE INDEX idx_files_type ON public.files(file_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;
GRANT ALL ON public.files TO service_role;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant members read files" ON public.files FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant members write files" ON public.files FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());
CREATE POLICY "tenant members update files" ON public.files FOR UPDATE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant members delete files" ON public.files FOR DELETE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_files_updated BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== APPROVALS ==============
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID,
  agent_id UUID,
  task_id UUID,
  title TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('creative','video','article','post','email','landing','report','automation','other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','in_revision')),
  preview_url TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  current_version INT NOT NULL DEFAULT 1,
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approvals_tenant ON public.approvals(tenant_id);
CREATE INDEX idx_approvals_status ON public.approvals(status);
CREATE INDEX idx_approvals_agent ON public.approvals(agent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant read approvals" ON public.approvals FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant insert approvals" ON public.approvals FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant update approvals" ON public.approvals FOR UPDATE TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant delete approvals" ON public.approvals FOR DELETE TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE TRIGGER trg_approvals_updated BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== APPROVAL VERSIONS ==============
CREATE TABLE public.approval_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  version_number INT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb,
  preview_url TEXT,
  generated_by_agent UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_av_approval ON public.approval_versions(approval_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_versions TO authenticated;
GRANT ALL ON public.approval_versions TO service_role;
ALTER TABLE public.approval_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant read versions" ON public.approval_versions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant insert versions" ON public.approval_versions FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

-- ============== APPROVAL COMMENTS ==============
CREATE TABLE public.approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  version_number INT,
  user_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_rejection_reason BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ac_approval ON public.approval_comments(approval_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_comments TO authenticated;
GRANT ALL ON public.approval_comments TO service_role;
ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant read comments" ON public.approval_comments FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant insert comments" ON public.approval_comments FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());

-- ============== APPROVAL ACTIONS (audit) ==============
CREATE TABLE public.approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approve','reject','request_changes','new_version','submit')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_aa_approval ON public.approval_actions(approval_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_actions TO authenticated;
GRANT ALL ON public.approval_actions TO service_role;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant read actions" ON public.approval_actions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant insert actions" ON public.approval_actions FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND user_id = auth.uid());

-- ============== PROJECT APPROVAL SETTINGS ==============
CREATE TABLE public.project_approval_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'required' CHECK (mode IN ('required','optional','auto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_approval_settings TO authenticated;
GRANT ALL ON public.project_approval_settings TO service_role;
ALTER TABLE public.project_approval_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant read pas" ON public.project_approval_settings FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "tenant write pas" ON public.project_approval_settings FOR ALL TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id)) WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_pas_updated BEFORE UPDATE ON public.project_approval_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== STORAGE POLICIES for approval-files ==============
-- Path convention: {tenant_id}/{...}
CREATE POLICY "tenant read approval-files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'approval-files' AND public.is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant insert approval-files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'approval-files' AND public.is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant update approval-files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'approval-files' AND public.is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
CREATE POLICY "tenant delete approval-files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'approval-files' AND public.is_tenant_member(auth.uid(), (storage.foldername(name))[1]::uuid));
