import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const ALGO = "AES-GCM";
const IV_LENGTH = 12;

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("LEX_ENCRYPTION_KEY");
  if (!raw) throw new Error("LEX_ENCRYPTION_KEY not configured");
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(raw),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("lex-credential-salt-v1"), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ["encrypt"]
  );
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, encoded);
  return `enc:v1:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { nome, cpf, oab_numero, oab_estado, whatsapp, govbr_login, govbr_senha } = body;

    // Validate required fields
    if (!nome || !cpf || !oab_numero || !oab_estado || !whatsapp || !govbr_login || !govbr_senha) {
      return errorResponse("Todos os campos são obrigatórios", 400);
    }

    if (typeof cpf !== "string" || cpf.replace(/\D/g, "").length !== 11) {
      return errorResponse("CPF inválido", 400);
    }

    if (typeof whatsapp !== "string" || whatsapp.replace(/\D/g, "").length < 10) {
      return errorResponse("WhatsApp inválido", 400);
    }

    // Encrypt govbr_senha
    const govbr_senha_encrypted = await encrypt(govbr_senha);

    const { data, error } = await supabase
      .from("lex_advogados")
      .insert({
        user_id: user.id,
        nome: nome.trim().slice(0, 255),
        cpf: cpf.replace(/\D/g, "").slice(0, 11),
        oab_numero: oab_numero.trim().slice(0, 20),
        oab_estado: oab_estado.trim().slice(0, 2),
        whatsapp: whatsapp.replace(/\D/g, "").slice(0, 15),
        govbr_login: govbr_login.replace(/\D/g, "").slice(0, 11),
        govbr_senha_encrypted,
      })
      .select("id")
      .single();

    if (error) return errorResponse(error.message, 400);

    return jsonResponse({ success: true, advogado_id: data.id });
  } catch (e) {
    return errorResponse(e.message || "Internal error", 500);
  }
});
