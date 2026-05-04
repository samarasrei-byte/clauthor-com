/**
 * ThorStreaming.ts - SSE parser, stall timeout, response clamping, reconnection logic
 */

export const THOR_MAX_RESPONSE_CHARS = 900;
export const THOR_MAX_RESPONSE_PARAGRAPHS = 5;
export const THOR_STREAM_UPDATE_INTERVAL_MS = 100;
export const THOR_HARD_TIMEOUT_MS = 25_000;

export const normalizeThorResponse = (value: string) =>
  value
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const clampThorResponse = (value: string) => {
  const normalized = normalizeThorResponse(value);
  const paragraphs = normalized.split(/\n\s*\n/).filter(Boolean).slice(0, THOR_MAX_RESPONSE_PARAGRAPHS);
  let result = paragraphs.join("\n\n");
  if (result.length > THOR_MAX_RESPONSE_CHARS) {
    result = result.slice(0, THOR_MAX_RESPONSE_CHARS);
    const lastSpace = result.lastIndexOf(" ");
    if (lastSpace > THOR_MAX_RESPONSE_CHARS * 0.8) result = result.slice(0, lastSpace);
  }
  return result.trim();
};

export const exceededThorResponseLimit = (value: string) => {
  const normalized = normalizeThorResponse(value);
  const paragraphCount = normalized.split(/\n\s*\n/).filter(Boolean).length;
  return normalized.length > THOR_MAX_RESPONSE_CHARS || paragraphCount > THOR_MAX_RESPONSE_PARAGRAPHS;
};

export interface ThorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamThorOptions {
  messages: ThorMessage[];
  supabaseUrl: string;
  supabaseKey: string;
  context: {
    area: string;
    route: string;
    authenticated: boolean;
    persona: string;
    diagnostics?: string;
  };
  signal: AbortSignal;
  onFlush: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (reason: "stalled" | "timeout" | "network" | "abort") => void;
}

/**
 * Streams a Thor response via SSE, handling:
 * - 15s stall timeout
 * - Hard timeout (THOR_HARD_TIMEOUT_MS)
 * - Response length clamping
 * - Malformed JSON recovery
 */
export async function streamThorResponse(opts: StreamThorOptions): Promise<void> {
  const { messages, supabaseUrl, supabaseKey, context, signal, onFlush, onDone, onError } = opts;

  let streamStallTimer: ReturnType<typeof setTimeout> | null = null;
  let hardTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (streamStallTimer) clearTimeout(streamStallTimer);
    if (hardTimeoutTimer) clearTimeout(hardTimeoutTimer);
  };

  try {
    const requestStartedAt = Date.now();
    const response = await fetch(
      `${supabaseUrl}/functions/v1/support-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          context,
        }),
        signal,
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream");

    const decoder = new TextDecoder();
    let buffer = "";
    let assistantText = "";
    let lastFlushedText = "";
    let lastUiFlushAt = 0;
    let reachedResponseLimit = false;
    let receivedDoneSignal = false;

    const flushAssistantMessage = (force = false) => {
      if (!assistantText.trim()) return;
      const now = Date.now();
      const snapshot = clampThorResponse(assistantText);
      if (!snapshot || snapshot === lastFlushedText) return;
      if (!force && now - lastUiFlushAt < THOR_STREAM_UPDATE_INTERVAL_MS) return;
      lastUiFlushAt = now;
      lastFlushedText = snapshot;
      onFlush(snapshot);
    };

    const resetStallTimer = () => {
      if (streamStallTimer) clearTimeout(streamStallTimer);
      streamStallTimer = setTimeout(() => {
        console.warn("[Thor] Stream stalled for 15s, aborting");
        onError("stalled");
      }, 15_000);
    };

    hardTimeoutTimer = setTimeout(() => {
      console.warn("[Thor] Hard timeout reached, aborting stream");
      onError("timeout");
    }, THOR_HARD_TIMEOUT_MS);

    resetStallTimer();

    while (true) {
      if (signal.aborted) break;
      if (Date.now() - requestStartedAt > THOR_HARD_TIMEOUT_MS) {
        onError("timeout");
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;
      resetStallTimer();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.replace(/\r$/, "");
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          receivedDoneSignal = true;
          break;
        }
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantText += delta;
            if (exceededThorResponseLimit(assistantText)) {
              assistantText = clampThorResponse(assistantText);
              reachedResponseLimit = true;
              flushAssistantMessage(true);
              break;
            }
            flushAssistantMessage();
          }
        } catch {
          // Skip malformed JSON lines
        }
      }

      if (receivedDoneSignal || reachedResponseLimit) break;
    }

    cleanup();
    flushAssistantMessage(true);
    onDone(clampThorResponse(assistantText));
  } catch (err) {
    cleanup();
    if (err instanceof DOMException && err.name === "AbortError") {
      onError("abort");
    } else {
      onError("network");
    }
  }
}
