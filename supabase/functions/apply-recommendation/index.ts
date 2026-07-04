import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { agentSlug, recommendation } = await req.json();
    if (!agentSlug || !recommendation?.title || !recommendation?.action) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tpl, error: tplErr } = await supabase
      .from("agent_templates")
      .select("id, system_prompt, instructions")
      .eq("slug", agentSlug)
      .maybeSingle();
    if (tplErr || !tpl) {
      return new Response(JSON.stringify({ error: "template_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Gemini to rewrite the system_prompt integrating the recommendation
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um engenheiro de prompts. Reescreva o system prompt de um agente incorporando uma recomendação, preservando estrutura e tom originais. Retorne APENAS o novo system prompt em texto puro, sem markdown, sem comentários.",
          },
          {
            role: "user",
            content: `SYSTEM PROMPT ATUAL:\n"""${tpl.system_prompt}"""\n\nRECOMENDAÇÃO A INCORPORAR:\nTítulo: ${recommendation.title}\nAção: ${recommendation.action}\n\nGere o novo system prompt completo.`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: "ai_failed", detail: errText }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const newPrompt = aiJson.choices?.[0]?.message?.content?.trim();
    if (!newPrompt) {
      return new Response(JSON.stringify({ error: "empty_ai_response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save previous as version
    const { data: maxRow } = await supabase
      .from("agent_prompt_versions")
      .select("version")
      .eq("agent_slug", agentSlug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (maxRow?.version ?? 0) + 1;

    await supabase.from("agent_prompt_versions").insert({
      agent_slug: agentSlug,
      version: nextVersion,
      system_prompt: tpl.system_prompt,
      instructions: tpl.instructions,
      source: "ai_recommendation",
      reason: `${recommendation.title} — ${recommendation.action}`.slice(0, 500),
      created_by: user.id,
    });

    // Apply new prompt
    const { error: updErr } = await supabase
      .from("agent_templates")
      .update({ system_prompt: newPrompt, updated_at: new Date().toISOString() })
      .eq("id", tpl.id);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ success: true, version: nextVersion, new_prompt: newPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
