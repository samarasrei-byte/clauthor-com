import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceId } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ fallback: true, reason: "tts_provider_not_configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Voz mais jovem, inovadora e firme
    const selectedVoice = voiceId || "onwK4e9ZLuTAKqWW03F9"; // Daniel — voz masculina firme e profissional

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}/stream?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.38,
            similarity_boost: 0.8,
            style: 0.12,
            use_speaker_boost: true,
            speed: 1.12,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);

      let parsed: any = null;
      try {
        parsed = JSON.parse(errorText);
      } catch {
        // ignore
      }

      const providerStatus = parsed?.detail?.status || null;
      return new Response(
        JSON.stringify({
          fallback: true,
          reason: providerStatus || "tts_provider_unavailable",
          provider_status_code: response.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return new Response(JSON.stringify({ fallback: true, reason: "tts_runtime_error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
