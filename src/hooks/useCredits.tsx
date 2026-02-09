import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserCredits {
  id: string;
  user_id: string;
  total_credits: number;
  used_credits: number;
  plan_type: string;
  credits_reset_at: string;
}

export interface CreditPlan {
  id: string;
  name: string;
  monthly_credits: number;
  price_cents: number;
  features: string[];
}

export interface TokenUsage {
  id: string;
  tokens_used: number;
  action_type: string;
  model: string;
  created_at: string;
}

export function useCredits() {
  const { user } = useAuth();

  const { data: credits, isLoading, refetch } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as UserCredits;
    },
    enabled: !!user?.id,
  });

  const remainingCredits = credits 
    ? credits.total_credits - credits.used_credits 
    : 0;

  const usagePercentage = credits 
    ? Math.round((credits.used_credits / credits.total_credits) * 100) 
    : 0;

  return {
    credits,
    remainingCredits,
    usagePercentage,
    isLoading,
    refetch,
  };
}

export function useCreditPlans() {
  return useQuery({
    queryKey: ["credit-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_plans")
        .select("*")
        .order("monthly_credits", { ascending: true });

      if (error) throw error;
      return data as CreditPlan[];
    },
  });
}

export function useTokenUsage() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["token-usage", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("token_usage")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as TokenUsage[];
    },
    enabled: !!user?.id,
  });
}
