// Simple text encoding/decoding for prompt text
// Note: This is Base64 encoding, not encryption. In production, implement proper AES encryption.

export function encryptText(text: string): string {
  try {
    // If text appears to already be encoded (starts with enc:), return as-is
    if (text.startsWith('enc:')) {
      return text;
    }

    // Use Base64 encoding with a prefix to identify encoded content
    const encoded = Buffer.from(text, 'utf8').toString('base64');
    return `enc:${encoded}`;
  } catch (error) {
    console.error('Encoding error:', error);
    return text; // Return original text if encoding fails
  }
}

export function decryptText(encryptedText: string): string {
  try {
    // If text doesn't appear to be encoded, return as-is
    if (!encryptedText || !encryptedText.startsWith('enc:')) {
      return encryptedText || 'No prompt text available';
    }

    // Remove the 'enc:' prefix and decode
    const encoded = encryptedText.substring(4);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    
    return decoded;
  } catch (error) {
    console.error('Decoding error:', error);
    return 'Decoding failed - content may not be encoded';
  }
}

export function createSafePreview(text: string, maxLength: number = 80): string {
  try {
    const decoded = decryptText(text);
    if (decoded.length <= maxLength) {
      return decoded;
    }
    return decoded.substring(0, maxLength) + '...';
  } catch (error) {
    return 'Preview unavailable';
  }
} 