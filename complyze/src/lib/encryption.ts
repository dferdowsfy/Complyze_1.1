import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Generate encryption key from environment variable or create a secure default
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.COMPLYZE_ENCRYPTION_KEY;
  
  if (envKey) {
    // Use provided key, ensure it's 32 bytes
    const keyBuffer = Buffer.from(envKey, 'base64');
    if (keyBuffer.length !== KEY_LENGTH) {
      throw new Error('COMPLYZE_ENCRYPTION_KEY must be exactly 32 bytes (256 bits) when base64 decoded');
    }
    return keyBuffer;
  }
  
  // For development/fallback - in production, always use environment variable
  console.warn('⚠️ COMPLYZE_ENCRYPTION_KEY not set, using default key (NOT for production!)');
  return crypto.scryptSync('complyze-default-key-change-in-production', 'salt', KEY_LENGTH);
}

/**
 * Encrypt sensitive prompt text for database storage
 * Returns base64 encoded string in format: iv.tag.encryptedData
 */
export function encryptPromptText(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    const combined = Buffer.concat([
      iv,
      tag,
      encrypted
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt prompt text');
  }
}

/**
 * Decrypt prompt text retrieved from database
 * Expects base64 encoded string in format: iv.tag.encryptedData
 */
export function decryptPromptText(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipher(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    // Return indication that decryption failed rather than throwing
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Safely get a truncated version of encrypted prompt for display
 * This ensures no sensitive data is exposed in logs or UI
 */
export function getPromptPreview(encryptedPrompt: string, maxLength: number = 100): string {
  try {
    const decrypted = decryptPromptText(encryptedPrompt);
    
    if (decrypted === '[DECRYPTION_FAILED]') {
      return 'Encrypted prompt (decryption unavailable)';
    }
    
    if (decrypted.length <= maxLength) {
      return decrypted;
    }
    
    return decrypted.substring(0, maxLength) + '...';
  } catch (error) {
    return 'Encrypted prompt (preview unavailable)';
  }
}

/**
 * Check if a string appears to be encrypted (base64 format check)
 */
export function isEncrypted(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // Check if it's valid base64 and reasonable length for encrypted data
  try {
    const decoded = Buffer.from(text, 'base64');
    // Should be at least IV + TAG + some encrypted content
    return decoded.length >= IV_LENGTH + TAG_LENGTH + 16;
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key for setup/rotation
 * Returns base64 encoded key suitable for COMPLYZE_ENCRYPTION_KEY environment variable
 */
export function generateNewEncryptionKey(): string {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
}

/**
 * Validate encryption key format
 */
export function validateEncryptionKey(keyBase64: string): boolean {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    return key.length === KEY_LENGTH;
  } catch {
    return false;
  }
} 