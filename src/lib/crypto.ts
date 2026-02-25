/**
 * Client-side AES-GCM encryption for agent credentials.
 * Uses Web Crypto API with a deterministic key derived from user ID + agent ID.
 * This adds a defense-in-depth layer — even if DB is compromised, values are encrypted.
 * 
 * Security features:
 * - AES-256-GCM with 12-byte random IV per encryption
 * - PBKDF2 key derivation (100k iterations, SHA-256)
 * - Key material scoped to user+agent (isolation by design)
 * - Versioned format for future key rotation (enc:v1:iv:ciphertext)
 */

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const CURRENT_VERSION = "v1";

// Salt per version for key rotation support
const SALT_VERSIONS: Record<string, string> = {
  v1: "clauthor-credential-salt-v1",
};

async function deriveKey(userId: string, agentId: string, version = CURRENT_VERSION): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = SALT_VERSIONS[version] || SALT_VERSIONS.v1;
  
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
      salt: encoder.encode(salt),
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
  const key = await deriveKey(userId, agentId, CURRENT_VERSION);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoder.encode(plaintext)
  );

  // Versioned format: enc:v1:base64(iv):base64(ciphertext)
  return `enc:${CURRENT_VERSION}:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(ciphertext)}`;
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

  const parts = encrypted.split(":");
  let version: string;
  let ivB64: string;
  let cipherB64: string;

  if (parts.length === 4) {
    // New versioned format: enc:v1:iv:cipher
    [, version, ivB64, cipherB64] = parts;
  } else if (parts.length === 3) {
    // Legacy format: enc:iv:cipher (assume v1)
    [, ivB64, cipherB64] = parts;
    version = "v1";
  } else {
    throw new Error("Invalid encrypted credential format");
  }

  const key = await deriveKey(userId, agentId, version);
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const ciphertext = base64ToArrayBuffer(cipherB64);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Mask a sensitive value for display. Never show full credentials in UI.
 * Shows first 3 and last 3 characters, rest are dots.
 */
export function maskCredential(value: string): string {
  if (!value || value.length <= 8) return "••••••••";
  return `${value.slice(0, 3)}${"•".repeat(Math.min(value.length - 6, 12))}${value.slice(-3)}`;
}
