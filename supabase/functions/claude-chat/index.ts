import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { corsHeaders, handleCors, jsonResponse, errorResponse, streamResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Please add your API key." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, system, model, max_tokens, temperature } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedModel = model || "claude-sonnet-4-20250514";
    const selectedMaxTokens = max_tokens || 4096;
    const selectedTemp = temperature ?? 0.7;

    const systemPrompt = system || `You are Claude, an AI assistant by Anthropic integrated into the CLAUTHOR platform. 
You are a Senior AI Planner — your role is strategic reasoning, complex analysis, and high-level orchestration.
Be concise, precise, and actionable. Use markdown formatting. 
Respond in the same language as the user.`;

    // Call Anthropic Messages API with streaming
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: selectedMaxTokens,
        temperature: selectedTemp,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid ANTHROPIC_API_KEY. Please check your API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Anthropic SSE to OpenAI-compatible SSE format for frontend consistency
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, newlineIdx);
              buffer = buffer.slice(newlineIdx + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const event = JSON.parse(jsonStr);
                
                // Anthropic content_block_delta → OpenAI format
                if (event.type === "content_block_delta" && event.delta?.text) {
                  const openaiFormat = {
                    choices: [{
                      delta: { content: event.delta.text },
                      index: 0,
                    }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
                }
                
                // Message stop
                if (event.type === "message_stop") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // partial JSON, put back
                buffer = line + "\n" + buffer;
                break;
              }
            }
          }

          // Final flush
          if (buffer.trim()) {
            for (let raw of buffer.split("\n")) {
              if (!raw || !raw.startsWith("data: ")) continue;
              const jsonStr = raw.slice(6).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;
              try {
                const event = JSON.parse(jsonStr);
                if (event.type === "content_block_delta" && event.delta?.text) {
                  const openaiFormat = {
                    choices: [{ delta: { content: event.delta.text }, index: 0 }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
                }
              } catch {}
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("claude-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
