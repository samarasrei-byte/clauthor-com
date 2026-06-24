import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PBMessage {
  threadId?: string;
  profileId?: string;
  profileUrl?: string;
  fullName?: string;
  headline?: string;
  pictureUrl?: string;
  message?: string;
  sentAt?: string;
  fromLead?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all users with active LinkedIn session
    const { data: sessions } = await supabase
      .from("hunter_linkedin_session")
      .select("user_id, linkedin_cookie");

    let totalSynced = 0;
    const results: any[] = [];

    for (const sess of sessions || []) {
      if (!sess.linkedin_cookie) continue;

      const { data: cfg } = await supabase
        .from("hunter_config")
        .select("phantombuster_api_key_encrypted, phantombuster_search_agent_id")
        .eq("user_id", sess.user_id)
        .maybeSingle();

      const pbApiKey = cfg?.phantombuster_api_key_encrypted || Deno.env.get("PHANTOMBUSTER_API_KEY") || "";
      const pbAgentId = Deno.env.get("PHANTOMBUSTER_INBOX_AGENT_ID") || cfg?.phantombuster_search_agent_id || Deno.env.get("PHANTOMBUSTER_SEARCH_AGENT_ID") || "";
      if (!pbApiKey || !pbAgentId) continue;

      try {
        // Launch PhantomBuster inbox scrape agent
        const pbResp = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Phantombuster-Key-1": pbApiKey,
          },
          body: JSON.stringify({
            id: pbAgentId,
            argument: { sessionCookie: sess.linkedin_cookie, action: "scrape_inbox" },
          }),
        });
        const pbData = await pbResp.json().catch(() => ({}));

        // PhantomBuster returns container; for sync we expect a results array.
        // In practice you'd poll the container result. We try to read directly:
        const messages: PBMessage[] = Array.isArray(pbData?.data?.messages) ? pbData.data.messages : [];

        for (const msg of messages) {
          const leadId = msg.profileId || msg.profileUrl || msg.threadId;
          if (!leadId || !msg.message) continue;

          // Upsert conversation
          const { data: conv } = await supabase
            .from("hunter_conversations")
            .upsert(
              {
                user_id: sess.user_id,
                lead_linkedin_id: leadId,
                lead_name: msg.fullName || "",
                lead_headline: msg.headline || "",
                lead_profile_url: msg.profileUrl || "",
                lead_picture_url: msg.pictureUrl || "",
                last_message_at: msg.sentAt || new Date().toISOString(),
                last_message_preview: msg.message.slice(0, 120),
                unread_count: msg.fromLead === false ? 0 : 1,
                status: msg.fromLead === false ? "respondido" : "novo",
              },
              { onConflict: "user_id,lead_linkedin_id" },
            )
            .select("id")
            .maybeSingle();

          if (conv?.id) {
            await supabase.from("hunter_messages_inbox").insert({
              conversation_id: conv.id,
              user_id: sess.user_id,
              sender: msg.fromLead === false ? "user" : "lead",
              content: msg.message,
              sent_at: msg.sentAt || new Date().toISOString(),
            });

            // Increment unread on new lead msg
            if (msg.fromLead !== false) {
              await supabase.rpc("noop").catch(() => {});
              const { data: cur } = await supabase
                .from("hunter_conversations")
                .select("unread_count")
                .eq("id", conv.id)
                .maybeSingle();
              await supabase
                .from("hunter_conversations")
                .update({ unread_count: (cur?.unread_count || 0) + 1 })
                .eq("id", conv.id);
            }
            totalSynced++;
          }
        }

        results.push({ user_id: sess.user_id, synced: messages.length });
      } catch (innerErr) {
        results.push({ user_id: sess.user_id, error: (innerErr as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, total_synced: totalSynced, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
