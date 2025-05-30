// Simple test for clipboard monitoring
const { exec } = require('child_process');

console.log('🧪 Testing Clipboard Monitoring');
console.log('Make sure Complyze Desktop Agent is running...\n');

// Test with a simple prompt
const testPrompt = 'Please explain how machine learning works';
console.log('Copying test prompt to clipboard:', testPrompt);

exec(`echo "${testPrompt}" | pbcopy`, (error) => {
  if (error) {
    console.error('Error copying to clipboard:', error);
    return;
  }
  
  console.log('✅ Copied to clipboard');
  console.log('⏳ Check if a notification popup appears...');
  console.log('\n💡 Expected: Non-blocking notification with enhanced prompt');
  
  setTimeout(() => {
    // Test with sensitive data
    const sensitivePrompt = 'Help me write an email to john.doe@company.com about my SSN 123-45-6789';
    console.log('\nTesting with sensitive data:', sensitivePrompt);
    
    exec(`echo "${sensitivePrompt}" | pbcopy`, (error) => {
      if (error) {
        console.error('Error copying to clipboard:', error);
        return;
      }
      
      console.log('✅ Copied sensitive prompt to clipboard');
      console.log('⏳ Check if a BLOCKING notification appears...');
      console.log('\n💡 Expected: Blocking notification requiring user action');
    });
  }, 5000);
}); 