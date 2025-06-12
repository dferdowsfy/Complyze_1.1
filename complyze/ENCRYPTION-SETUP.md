# Complyze Prompt Encryption Setup

## Overview

Complyze implements end-to-end encryption for sensitive prompt content to ensure privacy compliance. All user prompts containing sensitive data are encrypted before being stored in the database and can only be decrypted by authorized dashboard users.

## Architecture

```
Chrome Extension → Encrypt Prompt → Supabase Database → Dashboard → Decrypt for Display
```

### Components

1. **Chrome Extension Encryption** (`background.js`)
   - Encrypts prompts using AES-GCM algorithm before sending to database
   - Uses Web Crypto API for secure client-side encryption
   - Generates unique encryption key per browser installation

2. **Dashboard Encryption Library** (`src/lib/encryption.ts`)
   - Server-side encryption/decryption using Node.js crypto module
   - Handles encrypted prompt retrieval and display
   - Provides safe preview functions

3. **API Endpoints**
   - `/api/prompts/flagged` - Lists prompts with encrypted previews
   - `/api/prompts/decrypt` - Decrypts individual prompts for authorized users

## Setup Instructions

### 1. Generate Encryption Key

Run the setup script to generate a secure encryption key:

```bash
cd complyze
node scripts/setup-encryption.js
```

This will:
- Generate a 256-bit encryption key
- Create/update `.env` file with `COMPLYZE_ENCRYPTION_KEY`
- Provide setup instructions

### 2. Configure Environment

Ensure your `.env` file contains:

```env
# Required for prompt encryption
COMPLYZE_ENCRYPTION_KEY=your_base64_encoded_256bit_key

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Test Encryption

Verify everything is working:

```bash
node scripts/test-encryption.js
```

This will test:
- Key validation
- Encryption/decryption integrity
- Edge cases
- Database integration scenario

### 4. Deploy

**Important:** Use the same encryption key in all environments:

- Development: `.env` file
- Production: Environment variables
- Chrome Extension: Generates own keys per installation

## Security Features

### Encryption Algorithm
- **Algorithm**: AES-256-GCM
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 96 bits (12 bytes) - randomly generated per encryption
- **Authentication**: Built-in with GCM mode

### Key Management
- **Dashboard**: Uses `COMPLYZE_ENCRYPTION_KEY` environment variable
- **Extension**: Generates unique key per browser, stored in chrome.storage.local
- **Rotation**: Keys can be rotated using setup script

### Data Flow Security
1. **Chrome Extension**:
   - Detects sensitive content in prompts
   - Encrypts using browser-generated key
   - Sends encrypted data to Supabase

2. **Database Storage**:
   - Only encrypted prompt text is stored
   - Metadata (risk scores, categories) stored in plaintext
   - No access to original sensitive content

3. **Dashboard Display**:
   - Shows encrypted previews by default
   - Full decryption only for authorized users
   - Audit logging for decryption access

## API Usage

### Retrieving Flagged Prompts

```javascript
// GET /api/prompts/flagged?userId=uuid
// Returns prompts with encrypted previews
{
  "prompts": [
    {
      "id": "123",
      "prompt_text": "Preview of encrypted content...",
      "risk_level": "high",
      "category": "financial",
      // ... other metadata
    }
  ]
}
```

### Decrypting Individual Prompts

```javascript
// POST /api/prompts/decrypt
{
  "promptId": "123",
  "userId": "user-uuid"
}

// Response
{
  "success": true,
  "decryptedText": "Full prompt content here...",
  "isEncrypted": true,
  "accessTime": "2024-01-01T12:00:00Z"
}
```

## Compliance Benefits

### Privacy Protection
- **Zero-Knowledge**: Dashboard cannot see raw prompt content without explicit decryption
- **User Control**: Only authenticated users can decrypt their own prompts
- **Audit Trail**: All decryption access is logged

### Regulatory Compliance
- **GDPR Article 25**: Privacy by design and default
- **HIPAA Safeguards**: Technical safeguards for PHI protection
- **SOC 2**: Confidentiality and privacy controls

### Data Minimization
- Only necessary metadata stored in plaintext
- Sensitive content encrypted at source
- Secure key management practices

## Troubleshooting

### Extension Not Encrypting
1. Check browser console for encryption errors
2. Verify chrome.storage.local permissions
3. Regenerate extension encryption key

### Dashboard Decryption Failures
1. Verify `COMPLYZE_ENCRYPTION_KEY` is set
2. Check key format (base64, 32 bytes when decoded)
3. Test with `node scripts/test-encryption.js`

### Key Rotation
1. Generate new key: `node scripts/setup-encryption.js`
2. Deploy to all environments
3. Note: Old encrypted data cannot be decrypted with new key

## Development

### Adding New Encryption Features

1. Update `src/lib/encryption.ts` for server-side functions
2. Update `background.js` PromptEncryption class for client-side
3. Add tests to `scripts/test-encryption.js`
4. Update API endpoints as needed

### Testing

```bash
# Run encryption tests
node scripts/test-encryption.js

# Run with specific environment
NODE_ENV=test node scripts/test-encryption.js
```

## Security Considerations

### Do's ✅
- Always encrypt prompts containing sensitive data
- Use environment variables for encryption keys
- Log decryption access for audit purposes
- Rotate keys periodically
- Test encryption integrity regularly

### Don'ts ❌
- Never store encryption keys in code
- Don't log decrypted prompt content
- Avoid sending unencrypted sensitive data
- Don't use weak encryption algorithms
- Never expose keys in client-side code

## Support

For encryption-related issues:
1. Check console logs for specific errors
2. Run test scripts to verify configuration
3. Review security policies and key management
4. Ensure compliance with data protection regulations 