
-- Company board: where users store company info for agents to access
CREATE TABLE public.company_board (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_board ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own board" ON public.company_board FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own board" ON public.company_board FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own board" ON public.company_board FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own board" ON public.company_board FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all board" ON public.company_board FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_company_board_updated_at BEFORE UPDATE ON public.company_board FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
