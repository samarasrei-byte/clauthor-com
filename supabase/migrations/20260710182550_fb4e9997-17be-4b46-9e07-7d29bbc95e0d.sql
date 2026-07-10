
-- Revoke EXECUTE from anon on all app SECURITY DEFINER functions (defense in depth)
DO $$
DECLARE
  fn text;
  anon_revoke text[] := ARRAY[
    'seed_admin_agents(uuid)',
    'update_post_comments_count()',
    'increment_agent_executions(uuid)',
    'increment_coupon_usage()',
    'set_waitlist_position()',
    'get_user_tenant_id(uuid)',
    'increment_used_credits()',
    'verify_api_key(text)',
    'is_tenant_member(uuid,uuid)',
    'is_tenant_admin(uuid,uuid)',
    'lookup_coupon_by_code(text)',
    'has_role(uuid,app_role)',
    'check_token_thresholds()',
    'handle_new_user()',
    'handle_new_user_credits()',
    'log_api_call(uuid,text,integer)',
    'check_rate_limit(uuid,text)',
    'compute_outcome_charge()',
    'redeem_coupon(uuid,text)',
    'aggregate_agent_metric()',
    'log_activity_community_post()',
    'log_activity_linkedin_post()',
    'log_activity_approval()',
    'log_activity_agent_task()',
    'log_activity_execution()',
    'append_audit_entry(uuid,uuid,text,text,jsonb,jsonb,text,numeric,uuid)',
    'get_benchmark_percentiles(text,text,text)',
    'increment_agent_usage(uuid,text,text,integer)',
    'apply_memory_decay()',
    'recall_episodic_memories(uuid,uuid,vector,text,integer)',
    'search_knowledge(uuid,text,uuid,integer)'
  ];
  authed_revoke text[] := ARRAY[
    -- trigger-only, must not be callable via RPC
    'update_post_comments_count()',
    'increment_coupon_usage()',
    'set_waitlist_position()',
    'increment_used_credits()',
    'check_token_thresholds()',
    'handle_new_user()',
    'handle_new_user_credits()',
    'compute_outcome_charge()',
    'aggregate_agent_metric()',
    'log_activity_community_post()',
    'log_activity_linkedin_post()',
    'log_activity_approval()',
    'log_activity_agent_task()',
    'log_activity_execution()',
    -- service_role / edge only
    'verify_api_key(text)',
    'log_api_call(uuid,text,integer)',
    'check_rate_limit(uuid,text)',
    'append_audit_entry(uuid,uuid,text,text,jsonb,jsonb,text,numeric,uuid)',
    'apply_memory_decay()',
    'seed_admin_agents(uuid)',
    'increment_agent_executions(uuid)',
    'increment_agent_usage(uuid,text,text,integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY anon_revoke LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM anon, PUBLIC', fn);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;

  FOREACH fn IN ARRAY authed_revoke LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;
