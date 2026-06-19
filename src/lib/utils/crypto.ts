/**
 * Client-Side Obfuscation & Encryption Utility
 * Used exclusively for browser localStorage convenience persistence ("Remember Me").
 *
 * SECURITY LIMITATIONS & TRADEOFFS:
 * Since this code runs entirely in the browser, any secret keys must be bundled
 * in the client-side build. A motivated actor with physical/local access to the device
 * or local storage could inspect the client bundle, extract the salt/passphrase, and
 * decrypt the password.
 *
 * Therefore, this client-side encryption is an obfuscation mechanism intended solely
 * to prevent simple plain-text visual exposure of credentials in localStorage (e.g.,
 * from casual inspect element or basic disk dumps). It is NOT a replacement for
 * server-side authentication security.
 */

const SECRET_SALT = "kidoza-local-obfuscation-salt-77293";
const SECRET_PASS = "kidoza-local-obfuscation-passphrase-00281";

/**
 * Encrypts a plain-text password using AES-GCM (Web Crypto API)
 */
export async function encryptPassword(password: string): Promise<string> {
  if (!password) return "";
  try {
    const enc = new TextEncoder();

    // Import raw key material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET_PASS),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive AES-GCM Key using PBKDF2
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(SECRET_SALT),
        iterations: 1000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // Generate a random 12-byte Initialization Vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the password data
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      enc.encode(password)
    );

    // Package IV and Ciphertext as Base64 JSON
    const ivArray = Array.from(iv);
    const encryptedArray = Array.from(new Uint8Array(encrypted));
    const combined = JSON.stringify({ iv: ivArray, data: encryptedArray });
    return btoa(combined);
  } catch (err) {
    console.error("Local credential encryption failed:", err);
    return "";
  }
}

/**
 * Decrypts an AES-GCM encrypted password string
 */
export async function decryptPassword(ciphertext: string): Promise<string> {
  if (!ciphertext) return "";
  try {
    const enc = new TextEncoder();

    // Import raw key material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET_PASS),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive AES-GCM Key using PBKDF2
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(SECRET_SALT),
        iterations: 1000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // Decode Base64 string and extract IV/Data
    const rawJSON = atob(ciphertext);
    const { iv, data } = JSON.parse(rawJSON);

    // Decrypt data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      new Uint8Array(data)
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error("Local credential decryption failed:", err);
    return "";
  }
}
