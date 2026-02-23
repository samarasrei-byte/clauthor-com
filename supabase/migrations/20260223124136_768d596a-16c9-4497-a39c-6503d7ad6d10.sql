
-- ══════════════════════════════════════════
-- FIX 1: Recreate missing triggers
-- ══════════════════════════════════════════

-- Trigger: auto-create profile + role + tenant on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-create credits on signup
CREATE OR REPLACE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- Trigger: auto-set waitlist position
CREATE OR REPLACE TRIGGER on_waitlist_insert
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.set_waitlist_position();

-- Trigger: update comments count
CREATE OR REPLACE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.community_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger: updated_at for all relevant tables
CREATE OR REPLACE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_squads_updated_at
  BEFORE UPDATE ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════
-- FIX 2: Protect agent_templates system prompts from public
-- Only show basic metadata publicly, full data for authenticated
-- ══════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can view active templates" ON public.agent_templates;

CREATE POLICY "Authenticated can view active templates"
  ON public.agent_templates
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════
-- FIX 3: Fix waitlist - already has admin-only SELECT, 
-- but the "Anyone can join" INSERT is fine. No changes needed
-- (waitlist SELECT is already admin-only via has_role)
-- ══════════════════════════════════════════

-- ══════════════════════════════════════════
-- FIX 4: Add missing performance indexes
-- ══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_execution_logs_user_id ON public.execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_id ON public.execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_created_at ON public.execution_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
