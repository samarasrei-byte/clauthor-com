
-- Índices compostos para performance em queries frequentes

-- chat_messages: busca por usuário + ordenação por data
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON public.chat_messages (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_created 
ON public.chat_messages (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_created 
ON public.chat_messages (agent_id, created_at DESC) WHERE agent_id IS NOT NULL;

-- execution_logs: busca por agente + status + data
CREATE INDEX IF NOT EXISTS idx_execution_logs_user_created 
ON public.execution_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_execution_logs_agent_status 
ON public.execution_logs (agent_id, status, created_at DESC);

-- notifications: busca por usuário + não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, created_at DESC) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC);

-- agent_tasks: busca por tenant + status
CREATE INDEX IF NOT EXISTS idx_agent_tasks_tenant_status 
ON public.agent_tasks (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_status 
ON public.agent_tasks (user_id, status, created_at DESC);

-- token_usage: busca por usuário + data (billing)
CREATE INDEX IF NOT EXISTS idx_token_usage_user_created 
ON public.token_usage (user_id, created_at DESC);

-- agents: busca por usuário + status
CREATE INDEX IF NOT EXISTS idx_agents_user_status 
ON public.agents (user_id, status);

-- pending_actions: busca por tenant + status pendente
CREATE INDEX IF NOT EXISTS idx_pending_actions_tenant_status 
ON public.pending_actions (tenant_id, status, created_at DESC) WHERE status = 'pending';

-- knowledge_documents: busca por tenant + agente
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_user_agent 
ON public.knowledge_documents (user_id, agent_id);

-- payment_history: busca por usuário + data
CREATE INDEX IF NOT EXISTS idx_payment_history_user_created 
ON public.payment_history (user_id, created_at DESC);
