#!/usr/bin/env node

/**
 * Complyze Encryption Test Script
 * 
 * This script tests the encryption and decryption functionality
 * to ensure prompt privacy compliance is working correctly.
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import encryption functions
const { 
  encryptPromptText, 
  decryptPromptText, 
  getPromptPreview, 
  isEncrypted,
  validateEncryptionKey
} = require('../src/lib/encryption');

console.log('🧪 Complyze Encryption Test');
console.log('===========================');
console.log();

/**
 * Test encryption/decryption with sample data
 */
async function testEncryption() {
  console.log('🔍 Checking encryption key configuration...');
  
  // Check if encryption key is set
  const encryptionKey = process.env.COMPLYZE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error('❌ COMPLYZE_ENCRYPTION_KEY not found in environment variables');
    console.log('💡 Run: node scripts/setup-encryption.js');
    return false;
  }
  
  // Validate key format
  if (!validateEncryptionKey(encryptionKey)) {
    console.error('❌ Invalid encryption key format');
    console.log('💡 Run: node scripts/setup-encryption.js to generate a new key');
    return false;
  }
  
  console.log('✅ Encryption key found and validated');
  console.log(`🔑 Key: ${encryptionKey.substring(0, 8)}... (${encryptionKey.length} characters)`);
  console.log();
  
  // Test data
  const testPrompts = [
    'Hello, how are you?',
    'My email is john.doe@example.com and my phone is 555-123-4567',
    'Please analyze this credit card number: 4532-1234-5678-9012',
    'Can you help me with my SSN: 123-45-6789?',
    'This is a longer prompt with multiple sensitive data points including my email user@company.com, my phone (555) 987-6543, and my IP address 192.168.1.100. Please be careful with this information.',
  ];
  
  let allTestsPassed = true;
  
  for (let i = 0; i < testPrompts.length; i++) {
    const testPrompt = testPrompts[i];
    console.log(`🧪 Test ${i + 1}: Testing encryption/decryption`);
    console.log(`📝 Original: ${testPrompt}`);
    
    try {
      // Test encryption
      const encrypted = encryptPromptText(testPrompt);
      console.log(`🔐 Encrypted: ${encrypted.substring(0, 32)}... (${encrypted.length} chars)`);
      
      // Test encryption detection
      const isEncryptedResult = isEncrypted(encrypted);
      console.log(`🔍 Is encrypted: ${isEncryptedResult}`);
      
      // Test decryption
      const decrypted = decryptPromptText(encrypted);
      console.log(`🔓 Decrypted: ${decrypted}`);
      
      // Verify data integrity
      const isIntact = testPrompt === decrypted;
      console.log(`✅ Data integrity: ${isIntact ? 'PASS' : 'FAIL'}`);
      
      // Test preview function
      const preview = getPromptPreview(encrypted, 50);
      console.log(`👁️  Preview: ${preview}`);
      
      if (!isIntact) {
        console.error(`❌ Test ${i + 1} FAILED: Data integrity check failed`);
        allTestsPassed = false;
      } else {
        console.log(`✅ Test ${i + 1} PASSED`);
      }
      
    } catch (error) {
      console.error(`❌ Test ${i + 1} FAILED:`, error.message);
      allTestsPassed = false;
    }
    
    console.log();
  }
  
  // Test edge cases
  console.log('🔬 Testing edge cases...');
  
  // Empty string
  const emptyEncrypted = encryptPromptText('');
  const emptyDecrypted = decryptPromptText(emptyEncrypted);
  console.log(`Empty string test: "${emptyDecrypted}" (should be empty)`);
  
  // Null/undefined
  const nullEncrypted = encryptPromptText(null);
  const undefinedEncrypted = encryptPromptText(undefined);
  console.log(`Null test: "${nullEncrypted}" (should be empty)`);
  console.log(`Undefined test: "${undefinedEncrypted}" (should be empty)`);
  
  // Invalid encrypted data
  const invalidDecrypted = decryptPromptText('invalid-base64-data');
  console.log(`Invalid data test: "${invalidDecrypted}" (should be [DECRYPTION_FAILED])`);
  
  console.log();
  
  if (allTestsPassed) {
    console.log('🎉 All encryption tests PASSED!');
    console.log('✅ Prompt privacy compliance is working correctly');
    return true;
  } else {
    console.log('❌ Some encryption tests FAILED!');
    console.log('⚠️  Prompt privacy compliance may not be working correctly');
    return false;
  }
}

/**
 * Test database integration scenario
 */
async function testDatabaseScenario() {
  console.log('🗄️ Testing database integration scenario...');
  
  const samplePrompt = 'Analyze this customer data: email john@example.com, phone 555-0123';
  
  // Simulate extension encryption (before sending to database)
  console.log('📱 Extension: Encrypting prompt before sending to database...');
  const encrypted = encryptPromptText(samplePrompt);
  console.log(`🔐 Encrypted data: ${encrypted.substring(0, 32)}...`);
  
  // Simulate database storage (this would be stored in Supabase)
  console.log('💾 Database: Storing encrypted prompt...');
  
  // Simulate dashboard retrieval (reading from database)
  console.log('📊 Dashboard: Retrieving and decrypting prompt...');
  const decrypted = decryptPromptText(encrypted);
  const preview = getPromptPreview(encrypted, 80);
  
  console.log(`🔓 Full content: ${decrypted}`);
  console.log(`👁️  Preview: ${preview}`);
  
  const success = samplePrompt === decrypted;
  console.log(`✅ End-to-end test: ${success ? 'PASSED' : 'FAILED'}`);
  
  return success;
}

/**
 * Main test function
 */
async function main() {
  try {
    const encryptionTest = await testEncryption();
    console.log('─'.repeat(50));
    const databaseTest = await testDatabaseScenario();
    
    console.log('─'.repeat(50));
    if (encryptionTest && databaseTest) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Complyze encryption is ready for production use');
      console.log();
      console.log('📋 Next steps:');
      console.log('   1. Deploy the dashboard with the same encryption key');
      console.log('   2. Update the Chrome extension if needed');
      console.log('   3. Verify encrypted prompts appear correctly in the dashboard');
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log('⚠️  Please fix the issues before deploying');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
} 