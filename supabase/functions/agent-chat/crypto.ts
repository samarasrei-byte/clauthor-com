// ─── AES-256-GCM decryption bridge for agent-chat credential execution ───
// Isolated helper module. Consumes SUPABASE_SERVICE_ROLE_KEY as PBKDF2 material
// (matching the credential-manager write path) so the agent can decrypt values
// on-the-fly during tool execution without leaking plaintext to the DB.

const ALGO = "AES-GCM";
const IV_LENGTH = 12; // exported for parity with the write side; unused here.
export const ENC_PREFIX = "senc:v1:";

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("clauthor-server-credential-salt-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGO, length: 256 },
    false,
    ["decrypt"],
  );
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Decrypt a value produced by the `senc:v1:` server-side envelope.
 * Returns the input unchanged if it does not carry the prefix (plaintext or
 * client-encrypted). Throws on tampered / wrong-key ciphertexts — callers must
 * decide whether to fail the tool call or degrade gracefully.
 */
export async function decryptValueForExecution(encrypted: string): Promise<string> {
  if (!encrypted.startsWith(ENC_PREFIX)) return encrypted;
  const payload = encrypted.slice(ENC_PREFIX.length);
  const [ivB64, cipherB64] = payload.split(":");
  const key = await getEncryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv: new Uint8Array(base64ToArrayBuffer(ivB64)) },
    key,
    base64ToArrayBuffer(cipherB64),
  );
  return new TextDecoder().decode(plaintext);
}

// Re-export for tooling that needs the constant (rare, but kept for compat).
export const _internal = { ALGO, IV_LENGTH };
