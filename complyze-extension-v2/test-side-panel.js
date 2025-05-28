// Complyze Side Panel Test Script
// Run this in the browser console on any supported platform

console.log('🛡️ Complyze Side Panel Test Script');
console.log('=====================================');

// Test 1: Check if extension is loaded
if (typeof promptWatcher !== 'undefined') {
  console.log('✅ Extension loaded successfully');
} else {
  console.log('❌ Extension not loaded. Please reload the extension.');
  return;
}

// Test 2: Check platform detection
const platform = promptWatcher.getCurrentPlatform();
console.log('🌐 Platform detected:', platform || 'None');

if (!platform) {
  console.log('❌ No platform detected. Supported platforms: ChatGPT, Claude, Gemini, Complyze Dashboard');
  return;
}

// Test 3: Check for prompt input
const selectors = promptWatcher.platformSelectors[platform];
const promptElement = document.querySelector(selectors.promptInput);

if (!promptElement) {
  console.log('❌ No prompt input found. Available inputs:', document.querySelectorAll('textarea, div[contenteditable="true"]').length);
  return;
}

console.log('✅ Prompt input found:', promptElement.tagName);

// Test 4: Test side panel directly
console.log('🧪 Testing side panel...');

// Create test content with multiple PII types
const testContent = "My email is john.doe@example.com, SSN is 123-45-6789, and API key is sk-1234567890abcdef. This contains confidential information.";

// Set the content
if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
  promptElement.value = testContent;
} else if (promptElement.contentEditable === 'true') {
  promptElement.textContent = testContent;
}

// Create comprehensive analysis
const testAnalysis = {
  risk_level: 'critical',
  detectedPII: ['email', 'ssn', 'api_key', 'confidential'],
  redacted_prompt: null
};

// Show the side panel
promptWatcher.createSafePromptPanel(promptElement, testAnalysis);

console.log('🎉 Side panel should now be visible on the right side of the screen!');
console.log('');
console.log('Expected behavior:');
console.log('- Beautiful gradient panel on the right');
console.log('- Safe prompt with [EMAIL_REDACTED], [SSN_REDACTED], etc.');
console.log('- Copy and "Use This Version" buttons');
console.log('- List of detected PII types');
console.log('');
console.log('If you don\'t see the panel, check:');
console.log('1. Browser zoom level (try 100%)');
console.log('2. Screen resolution');
console.log('3. Browser console for errors'); 