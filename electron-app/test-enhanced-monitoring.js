// Enhanced monitoring test for ChatGPT/Claude Desktop apps
const { exec } = require('child_process');

console.log('🚀 Enhanced Complyze Desktop Agent Test');
console.log('Make sure Complyze Desktop Agent is running...\n');

console.log('📋 Testing Clipboard Monitoring:');
console.log('1. Copy a prompt to clipboard');
console.log('2. Watch for notification popup');
console.log('3. Test the copy button in the notification\n');

// Test with a simple prompt first
const testPrompt = 'Please explain how machine learning works in simple terms';
console.log('Copying test prompt:', testPrompt);

exec(`echo "${testPrompt}" | pbcopy`, (error) => {
  if (error) {
    console.error('Error copying to clipboard:', error);
    return;
  }
  
  console.log('✅ Simple prompt copied to clipboard');
  console.log('💡 Expected: Non-blocking notification with enhanced prompt\n');
  
  setTimeout(() => {
    // Test with sensitive data
    const sensitivePrompt = 'Help me draft an email to john.doe@company.com about my SSN 123-45-6789 and credit card 4532-1234-5678-9012';
    console.log('Testing with sensitive data:', sensitivePrompt);
    
    exec(`echo "${sensitivePrompt}" | pbcopy`, (error) => {
      if (error) {
        console.error('Error copying to clipboard:', error);
        return;
      }
      
      console.log('✅ Sensitive prompt copied to clipboard');
      console.log('💡 Expected: BLOCKING notification requiring user action');
      console.log('🔧 Test the copy button to copy enhanced version\n');
      
      setTimeout(() => {
        console.log('🎯 Next Steps:');
        console.log('1. Open ChatGPT Desktop or Claude Desktop');
        console.log('2. Switch to the AI app');
        console.log('3. Watch for workflow reminder notification');
        console.log('4. Use the built-in "Prompt Tester" in Complyze UI');
        console.log('5. Test copying enhanced prompts and pasting into AI apps\n');
        
        console.log('📱 App Detection Test:');
        console.log('- ChatGPT Desktop: Should be detected if running');
        console.log('- Claude Desktop: Should be detected if running');
        console.log('- Switch between apps to see workflow reminders\n');
        
        console.log('🧪 Manual Testing:');
        console.log('- Click "Show Prompt Tester" in Complyze UI');
        console.log('- Try the example prompts');
        console.log('- Watch notifications appear automatically');
        console.log('- Test copy buttons in notifications\n');
        
        console.log('✅ Test complete! Check notifications and UI for results.');
      }, 3000);
    });
  }, 5000);
}); 