#!/usr/bin/env node

const fetch = require('node-fetch');

// Test configuration
const API_BASE_URL = 'https://complyze.co/api';
const TEST_USER_ID = 'test-user-123'; // Replace with a valid user ID from your database

// Test data
const testPromptEvent = {
  user_id: TEST_USER_ID,
  original_prompt: "Can you help me analyze customer data for john.doe@example.com with SSN 123-45-6789?",
  optimized_prompt: "Can you help me analyze customer data for [EMAIL] with SSN [SSN]?",
  risk_level: 'high',
  platform: 'chat.openai.com',
  llm_used: 'gpt-4',
  flagged: true,
  pii_detected: ['EMAIL', 'SSN'],
  compliance_frameworks: ['NIST', 'Privacy'],
  ai_risk_indicators: ['PII_EXPOSURE'],
  improvements: [
    { type: 'redaction', description: 'Removed email address' },
    { type: 'redaction', description: 'Removed SSN' }
  ]
};

async function testPromptEventSync() {
  console.log('🧪 Testing Prompt Event Sync...\n');
  
  try {
    // Test 1: Create a prompt event
    console.log('📤 Test 1: Creating prompt event...');
    const createResponse = await fetch(`${API_BASE_URL}/prompt_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPromptEvent)
    });
    
    const createResult = await createResponse.json();
    console.log('Response status:', createResponse.status);
    console.log('Response data:', JSON.stringify(createResult, null, 2));
    
    if (!createResponse.ok) {
      console.error('❌ Failed to create prompt event:', createResult.error);
      return;
    }
    
    console.log('✅ Prompt event created successfully!');
    console.log('📊 Metrics:', createResult.metrics);
    
    // Test 2: Fetch prompt events
    console.log('\n📥 Test 2: Fetching prompt events...');
    const fetchResponse = await fetch(`${API_BASE_URL}/prompt_events?user_id=${TEST_USER_ID}&limit=5`);
    const fetchResult = await fetchResponse.json();
    
    console.log('Response status:', fetchResponse.status);
    console.log('Number of events:', fetchResult.count);
    
    if (fetchResult.data && fetchResult.data.length > 0) {
      console.log('\n📋 Recent prompt events:');
      fetchResult.data.forEach((event, index) => {
        console.log(`\n${index + 1}. Event ID: ${event.id}`);
        console.log(`   Platform: ${event.platform}`);
        console.log(`   Risk Level: ${event.risk_level}`);
        console.log(`   Tokens Saved: ${event.tokens_saved}`);
        console.log(`   Cost Saved: $${event.cost_saved?.toFixed(4) || '0.0000'}`);
        console.log(`   Timestamp: ${new Date(event.timestamp).toLocaleString()}`);
      });
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testPromptEventSync();

console.log('\n💡 To test real-time sync:');
console.log('1. Make sure the Chrome extension is installed and active');
console.log('2. Navigate to ChatGPT, Claude, or Gemini');
console.log('3. Submit a prompt with sensitive data (e.g., email, phone, SSN)');
console.log('4. Check the Complyze dashboard for real-time updates');
console.log('\n🔍 Dashboard URL: https://complyze.co/dashboard');