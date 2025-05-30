// Test script to demonstrate the new prompt optimization
const { enhancePrompt } = require('./dist/shared/promptEnhancer.js');

async function testPromptOptimization() {
  console.log('🚀 Testing Prompt Optimization System\n');
  
  const testPrompts = [
    {
      name: 'Prompt with sensitive data',
      prompt: 'Can you help me write an email to john.doe@company.com about my SSN 123-45-6789 and credit card 4532-1234-5678-9012?'
    },
    {
      name: 'Simple creation request',
      prompt: 'Please write a blog post about AI'
    },
    {
      name: 'Analysis request with personal info',
      prompt: 'Analyze my performance review for jane.smith@company.com and provide feedback about my API key abc123def456'
    },
    {
      name: 'Question with sensitive data',
      prompt: 'What should I do with my password 123456 and phone number 555-123-4567?'
    },
    {
      name: 'Task with redacted content',
      prompt: 'Help me create a report that includes [REDACTED_EMAIL] and [REDACTED_SSN]'
    }
  ];
  
  for (const test of testPrompts) {
    console.log(`\n📝 ${test.name}`);
    console.log(`Original: ${test.prompt}`);
    console.log('---');
    
    try {
      const result = await enhancePrompt(test.prompt);
      console.log(`✨ Optimized Prompt:\n${result.enhancedPrompt}`);
      console.log(`\n📊 Intent: ${result.detectedIntent}`);
      console.log(`📈 Quality Score: ${result.qualityScore}%`);
      console.log(`🎯 Clarity Score: ${result.clarityScore}%`);
      console.log(`🔧 Improvements: ${result.improvements.join(', ')}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

testPromptOptimization().catch(console.error); 