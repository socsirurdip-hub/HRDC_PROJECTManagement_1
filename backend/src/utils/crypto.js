const crypto = require('crypto');

// Default fallback for development; in production, set ENCRYPTION_KEY (32-byte hex/string)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  : crypto.scryptSync(process.env.JWT_SECRET || 'hrdc_dpdpa_encryption_secret_key', 'salt_dpdpa_2023', 32);

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts plain text using AES-256-GCM
 * @param {string} text - Plain text
 * @returns {string} - Formatted as iv:authTag:ciphertext
 */
const encrypt = (text) => {
  if (!text || typeof text !== 'string') return text;
  // If already encrypted, avoid double-encrypting
  if (text.startsWith('enc:')) return text;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts AES-256-GCM cipher text
 * @param {string} cipherText - Formatted as enc:iv:authTag:ciphertext
 * @returns {string} - Decrypted plain text
 */
const decrypt = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:')) {
    return cipherText;
  }

  try {
    const parts = cipherText.slice(4).split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // If decryption fails, return original
    return cipherText;
  }
};

/**
 * Masks phone number for non-admin viewers (e.g., 9811111006 -> 98XXXX1006)
 * @param {string} phone
 * @returns {string}
 */
const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  const clean = decrypt(phone).trim();
  if (clean.length < 6) return 'XXXXXX';
  return `${clean.slice(0, 2)}XXXXXX${clean.slice(-2)}`;
};

/**
 * Masks email address for privacy (e.g., deepak.joshi@example.com -> d***i@example.com)
 * @param {string} email
 * @returns {string}
 */
const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  const clean = decrypt(email).trim();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 2) return clean;
  const name = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex);
  return `${name.charAt(0)}***${name.charAt(name.length - 1)}${domain}`;
};

module.exports = {
  encrypt,
  decrypt,
  maskPhone,
  maskEmail,
};

