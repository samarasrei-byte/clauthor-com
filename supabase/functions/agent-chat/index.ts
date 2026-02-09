import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId, actionType = "chat" } = await req.json();

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    // Check user credits
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (creditsError || !credits) {
      return new Response(JSON.stringify({ error: "Credits not found. Please contact support." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remainingCredits = credits.total_credits - credits.used_credits;
    if (remainingCredits <= 0) {
      return new Response(JSON.stringify({ 
        error: "Créditos esgotados. Faça upgrade do seu plano.",
        remaining_credits: 0 
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get agent instructions if agentId provided
    let systemPrompt = "Você é um assistente de IA útil e profissional. Responda em português do Brasil.";
    
    if (agentId) {
      const { data: agent } = await supabase
        .from("agents")
        .select("name, instructions, objective")
        .eq("id", agentId)
        .single();
      
      if (agent?.instructions) {
        systemPrompt = `Você é o agente "${agent.name}". 
Objetivo: ${agent.objective || "Ajudar o usuário"}
Instruções: ${agent.instructions}

Responda sempre em português do Brasil de forma profissional.`;
      }
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "";
    
    // Estimate tokens used (rough estimate: 1 token ≈ 4 chars)
    const inputTokens = messages.reduce((acc: number, m: any) => acc + Math.ceil((m.content?.length || 0) / 4), 0);
    const outputTokens = Math.ceil(assistantMessage.length / 4);
    const totalTokens = inputTokens + outputTokens + Math.ceil(systemPrompt.length / 4);

    // Update user credits
    const { error: updateError } = await supabase
      .from("user_credits")
      .update({ used_credits: credits.used_credits + totalTokens })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating credits:", updateError);
    }

    // Log token usage
    const { error: logError } = await supabase.from("token_usage").insert({
      user_id: userId,
      agent_id: agentId || null,
      tokens_used: totalTokens,
      action_type: actionType,
    });

    if (logError) {
      console.error("Error logging usage:", logError);
    }

    return new Response(JSON.stringify({
      message: assistantMessage,
      tokens_used: totalTokens,
      remaining_credits: remainingCredits - totalTokens,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("agent-chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
