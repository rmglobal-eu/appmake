/**
 * API Key Encryption Manager
 *
 * Handles encryption, decryption, and masking of API keys using AES-256-GCM.
 * This module is server-side only and must not be imported in client bundles.
 *
 * Requires the ENCRYPTION_KEY environment variable to be set.
 * The key must be a 64-character hex string (32 bytes).
 */

import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const ENCODING = "hex" as const;
const SEPARATOR = ":" as const;

/**
 * Derive the encryption key from the environment variable.
 *
 * Throws a descriptive error if the key is missing or malformed.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    throw new Error(
      "[api-key-manager] ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  // Accept hex-encoded 32-byte keys (64 hex chars)
  if (!/^[0-9a-fA-F]{64}$/.test(envKey)) {
    throw new Error(
      "[api-key-manager] ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        `Received ${envKey.length} characters.`
    );
  }

  return Buffer.from(envKey, "hex");
}

/**
 * Encrypt an API key using AES-256-GCM.
 *
 * Returns a string in the format: `iv:authTag:ciphertext` (all hex-encoded).
 * Each encryption produces a unique IV, so encrypting the same key twice
 * produces different outputs (which is the desired behavior).
 */
export function encryptApiKey(key: string): string {
  if (!key) {
    throw new Error("[api-key-manager] Cannot encrypt an empty key.");
  }

  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(key, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted,
  ].join(SEPARATOR);
}

/**
 * Decrypt an API key encrypted with `encryptApiKey`.
 *
 * Expects the input in the format: `iv:authTag:ciphertext` (all hex-encoded).
 * Throws if the data has been tampered with (GCM authentication fails).
 */
export function decryptApiKey(encrypted: string): string {
  if (!encrypted) {
    throw new Error("[api-key-manager] Cannot decrypt an empty string.");
  }

  const parts = encrypted.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error(
      "[api-key-manager] Invalid encrypted key format. Expected iv:authTag:ciphertext."
    );
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const encryptionKey = getEncryptionKey();
  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(authTagHex, ENCODING);

  if (iv.length !== IV_LENGTH) {
    throw new Error(
      `[api-key-manager] Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}.`
    );
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `[api-key-manager] Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}.`
    );
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted: string;
  try {
    decrypted = decipher.update(ciphertext, ENCODING, "utf8");
    decrypted += decipher.final("utf8");
  } catch (error) {
    throw new Error(
      "[api-key-manager] Decryption failed. The data may have been tampered with or the encryption key may be incorrect."
    );
  }

  return decrypted;
}

/**
 * Mask an API key for display purposes.
 *
 * Shows the first 4 and last 4 characters, with the middle replaced by asterisks.
 * For keys shorter than 12 characters, shows only the first 2 and last 2.
 * For keys shorter than 6 characters, returns all asterisks.
 */
export function maskApiKey(key: string): string {
  if (!key) return "***";

  if (key.length < 6) {
    return "*".repeat(key.length);
  }

  if (key.length < 12) {
    const start = key.slice(0, 2);
    const end = key.slice(-2);
    const masked = "*".repeat(key.length - 4);
    return `${start}${masked}${end}`;
  }

  const start = key.slice(0, 4);
  const end = key.slice(-4);
  const masked = "*".repeat(Math.min(key.length - 8, 20)); // Cap asterisks for readability

  return `${start}${masked}${end}`;
}
