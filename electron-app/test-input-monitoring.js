// Test script for AI app input monitoring
const { exec } = require('child_process');

console.log('🚀 Complyze AI App Input Monitoring Test');
console.log('========================================\n');

console.log('📋 Prerequisites:');
console.log('1. Complyze Desktop Agent must be running');
console.log('2. Accessibility permissions must be granted');
console.log('3. ChatGPT Desktop or Claude Desktop must be installed\n');

console.log('🔧 How to Grant Accessibility Permissions:');
console.log('1. Open System Preferences > Security & Privacy');
console.log('2. Click on "Accessibility" in the left sidebar');
console.log('3. Click the lock icon and enter your password');
console.log('4. Add "Complyze Desktop Agent" to the list');
console.log('5. Make sure it\'s checked/enabled\n');

console.log('🧪 Testing Steps:');
console.log('1. Open ChatGPT Desktop or Claude Desktop');
console.log('2. Click in the text input field');
console.log('3. Start typing a prompt like:');
console.log('   "Please explain how machine learning works"');
console.log('4. Watch for Complyze notification popup');
console.log('5. Test the "🔄 Replace Text" button in the notification\n');

console.log('🎯 Expected Behavior:');
console.log('✅ Complyze detects text as you type in AI apps');
console.log('✅ Shows notification with enhanced prompt');
console.log('✅ "Replace Text" button updates the text in the AI app');
console.log('✅ Copy button still works for manual copying');
console.log('✅ Enhanced prompts follow AI best practices\n');

console.log('🔍 Test with Sensitive Data:');
console.log('Try typing: "Help me with my email john@company.com and SSN 123-45-6789"');
console.log('Expected: Blocking notification with sensitive data removed\n');

console.log('🚨 Troubleshooting:');
console.log('- If no notifications appear, check accessibility permissions');
console.log('- Make sure Complyze Desktop Agent is running');
console.log('- Try restarting the app after granting permissions');
console.log('- Check the app logs for "AI app input monitoring started"\n');

// Check if accessibility permissions are likely granted
exec('osascript -e "tell application \\"System Events\\" to get name of every process"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Accessibility permissions not granted or AppleScript not available');
    console.log('Please grant accessibility permissions to enable input monitoring\n');
  } else {
    console.log('✅ Accessibility permissions appear to be granted');
    console.log('Input monitoring should be active\n');
  }
  
  console.log('🎉 Ready to test! Open ChatGPT or Claude Desktop and start typing prompts.');
}); 