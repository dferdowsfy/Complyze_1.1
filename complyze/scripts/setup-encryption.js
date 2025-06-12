#!/usr/bin/env node

/**
 * Complyze Encryption Key Setup Script
 * 
 * This script helps set up the encryption key required for prompt privacy compliance.
 * The key is used to encrypt sensitive prompt content before storing it in the database.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Complyze Encryption Key Setup');
console.log('================================');
console.log();

/**
 * Generate a new 256-bit encryption key
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(32); // 256 bits
  return key.toString('base64');
}

/**
 * Validate an existing encryption key
 */
function validateEncryptionKey(keyBase64) {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    return key.length === 32; // 256 bits
  } catch {
    return false;
  }
}

/**
 * Check if .env file exists and has encryption key
 */
function checkExistingEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    return { exists: false };
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const keyMatch = envContent.match(/COMPLYZE_ENCRYPTION_KEY=(.+)/);
  
  if (keyMatch && keyMatch[1]) {
    const existingKey = keyMatch[1].trim();
    const isValid = validateEncryptionKey(existingKey);
    return { 
      exists: true, 
      hasKey: true, 
      key: existingKey,
      isValid 
    };
  }
  
  return { exists: true, hasKey: false };
}

/**
 * Update or create .env file with encryption key
 */
function updateEnvFile(newKey) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update existing key or add if not present
    if (envContent.includes('COMPLYZE_ENCRYPTION_KEY=')) {
      envContent = envContent.replace(
        /COMPLYZE_ENCRYPTION_KEY=.*/,
        `COMPLYZE_ENCRYPTION_KEY=${newKey}`
      );
    } else {
      envContent += `\n# Prompt Encryption for Privacy Compliance\nCOMPLYZE_ENCRYPTION_KEY=${newKey}\n`;
    }
  } else {
    envContent = `# Complyze Dashboard Environment Variables

# Prompt Encryption for Privacy Compliance
# This key is required for encrypting/decrypting sensitive prompt content
COMPLYZE_ENCRYPTION_KEY=${newKey}

# Add your other environment variables below:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# OPENROUTER_API_KEY=your_openrouter_api_key
`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated ${envPath}`);
}

/**
 * Main setup function
 */
function main() {
  const existing = checkExistingEnv();
  
  if (existing.exists && existing.hasKey) {
    if (existing.isValid) {
      console.log('✅ Valid encryption key already exists in .env file');
      console.log(`🔑 Key: ${existing.key.substring(0, 8)}... (${existing.key.length} characters)`);
      console.log();
      console.log('If you want to generate a new key, delete the existing COMPLYZE_ENCRYPTION_KEY line and run this script again.');
      return;
    } else {
      console.log('⚠️  Invalid encryption key found in .env file');
      console.log('🔄 Generating a new valid key...');
    }
  } else if (existing.exists) {
    console.log('📁 .env file exists but no encryption key found');
    console.log('🔄 Adding encryption key...');
  } else {
    console.log('📁 No .env file found');
    console.log('🔄 Creating .env file with encryption key...');
  }
  
  // Generate new key
  const newKey = generateEncryptionKey();
  console.log();
  console.log('🔑 Generated new 256-bit encryption key:');
  console.log(`   ${newKey}`);
  console.log();
  
  // Update .env file
  updateEnvFile(newKey);
  
  console.log('🎉 Setup complete!');
  console.log();
  console.log('📋 Next steps:');
  console.log('   1. Ensure your .env file is in your .gitignore');
  console.log('   2. Set the same encryption key in your production environment');
  console.log('   3. Restart your Next.js development server');
  console.log();
  console.log('⚠️  IMPORTANT: Keep this encryption key secure and backed up!');
  console.log('   If you lose this key, encrypted prompt data cannot be recovered.');
  console.log();
  console.log('🔄 To test encryption/decryption, run:');
  console.log('   node scripts/test-encryption.js');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateEncryptionKey,
  validateEncryptionKey,
  checkExistingEnv,
  updateEnvFile
}; 