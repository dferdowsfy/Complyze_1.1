// Test script to verify clipboard monitoring functionality
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testClipboardMonitoring() {
  console.log('🧪 Testing Clipboard Monitoring System\n');
  
  const testPrompts = [
    {
      name: 'Simple AI prompt',
      content: 'Please explain how machine learning works'
    },
    {
      name: 'Prompt with sensitive data',
      content: 'Can you help me write an email to john.doe@company.com about my SSN 123-45-6789?'
    },
    {
      name: 'Creative task prompt',
      content: 'Generate a blog post about artificial intelligence and its impact on society'
    },
    {
      name: 'Analysis prompt',
      content: 'Analyze this data and provide insights about customer behavior patterns'
    }
  ];
  
  console.log('📋 This script will copy test prompts to your clipboard.');
  console.log('Make sure the Complyze Desktop Agent is running to see the notifications.\n');
  
  for (let i = 0; i < testPrompts.length; i++) {
    const test = testPrompts[i];
    console.log(`${i + 1}. Testing: ${test.name}`);
    console.log(`   Content: ${test.content}`);
    
    try {
      // Copy to clipboard using pbcopy on macOS
      await execAsync(`echo "${test.content}" | pbcopy`);
      console.log('   ✅ Copied to clipboard');
      
      // Wait 3 seconds before next test
      console.log('   ⏳ Waiting 3 seconds for monitoring...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('🎉 Test completed! Check if notifications appeared for each prompt.');
  console.log('\n💡 Expected behavior:');
  console.log('- Simple prompts: Non-blocking notification with enhanced version');
  console.log('- Sensitive data prompts: Blocking notification requiring user action');
  console.log('- All prompts: Should show optimized versions with insights');
}

testClipboardMonitoring().catch(console.error); 