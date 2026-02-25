
-- Tasks table for real task persistence
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  category text DEFAULT 'other',
  due_date date,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.agent_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.agent_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.agent_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.agent_tasks FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tasks" ON public.agent_tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Meetings table for real scheduling
CREATE TABLE IF NOT EXISTS public.agent_meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL,
  meeting_date date NOT NULL,
  meeting_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  meeting_type text DEFAULT 'video_call',
  participants text[] DEFAULT '{}',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings" ON public.agent_meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meetings" ON public.agent_meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meetings" ON public.agent_meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meetings" ON public.agent_meetings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all meetings" ON public.agent_meetings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Reports table
CREATE TABLE IF NOT EXISTS public.agent_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.agents(id),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  title text NOT NULL,
  report_type text NOT NULL DEFAULT 'custom',
  period text DEFAULT '',
  sections jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.agent_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.agent_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reports" ON public.agent_reports FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
