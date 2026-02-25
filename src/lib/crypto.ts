/**
 * Client-side AES-GCM encryption for agent credentials.
 * Uses Web Crypto API with a deterministic key derived from user ID + agent ID.
 * This adds a defense-in-depth layer — even if DB is compromised, values are encrypted.
 */

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

async function deriveKey(userId: string, agentId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${userId}::${agentId}::clauthor-vault`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("clauthor-credential-salt-v1"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptCredential(
  plaintext: string,
  userId: string,
  agentId: string
): Promise<string> {
  const key = await deriveKey(userId, agentId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoder.encode(plaintext)
  );

  // Format: base64(iv):base64(ciphertext)
  return `enc:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
}

export async function decryptCredential(
  encrypted: string,
  userId: string,
  agentId: string
): Promise<string> {
  if (!encrypted.startsWith("enc:")) {
    // Legacy unencrypted value — return as-is
    return encrypted;
  }

  const [, ivB64, cipherB64] = encrypted.split(":");
  const key = await deriveKey(userId, agentId);
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const ciphertext = base64ToArrayBuffer(cipherB64);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
