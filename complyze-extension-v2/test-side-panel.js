// Comprehensive test script for Complyze extension debugging
// Run this in the browser console on any supported platform

console.log('🛡️ Complyze Extension Test Suite');
console.log('================================');

// Test 1: Check if extension is loaded
function testExtensionLoaded() {
  console.log('\n1. Testing Extension Load Status:');
  console.log('- Content script loaded:', typeof window.complyzeTest === 'function');
  console.log('- PromptWatcher available:', typeof promptWatcher !== 'undefined');
  console.log('- Current URL:', window.location.href);
  console.log('- Platform detected:', promptWatcher ? promptWatcher.getCurrentPlatform() : 'N/A');
}

// Test 2: Check authentication status
async function testAuthStatus() {
  console.log('\n2. Testing Authentication Status:');
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get_auth_status' }, resolve);
    });
    console.log('- Extension auth status:', response);
    
    // Check local storage for website auth
    const websiteToken = localStorage.getItem('complyze_token');
    const websiteUser = localStorage.getItem('complyze_user');
    console.log('- Website auth token:', websiteToken ? 'Present' : 'Missing');
    console.log('- Website user data:', websiteUser ? 'Present' : 'Missing');
  } catch (error) {
    console.error('- Auth check failed:', error);
  }
}

// Test 3: Check platform-specific elements
function testPlatformElements() {
  console.log('\n3. Testing Platform Elements:');
  if (!promptWatcher) {
    console.log('- PromptWatcher not available');
    return;
  }
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('- No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  console.log(`- Platform: ${platform}`);
  console.log(`- Prompt inputs found: ${document.querySelectorAll(selectors.promptInput).length}`);
  console.log(`- Submit buttons found: ${document.querySelectorAll(selectors.submitButton).length}`);
  console.log(`- Login elements found: ${document.querySelectorAll(selectors.loginCheck).length}`);
  
  // Test specific elements
  const promptElement = document.querySelector(selectors.promptInput);
  if (promptElement) {
    console.log('- Main prompt element:', promptElement);
    console.log('- Element type:', promptElement.tagName);
    console.log('- Element classes:', promptElement.className);
    console.log('- Element ID:', promptElement.id);
  } else {
    console.log('- No prompt element found');
  }
}

// Test 4: Test real-time analysis
async function testRealTimeAnalysis() {
  console.log('\n4. Testing Real-Time Analysis:');
  if (!promptWatcher) {
    console.log('- PromptWatcher not available');
    return;
  }
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('- No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('- No prompt element found for testing');
    return;
  }
  
  // Set test content with PII
  const testContent = "Test: my email is john@example.com and SSN is 123-45-6789";
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = testContent;
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = testContent;
  }
  
  console.log('- Set test content with PII');
  console.log('- Triggering real-time analysis...');
  
  // Trigger analysis
  await promptWatcher.performRealTimeAnalysis(testContent, promptElement);
  console.log('- Real-time analysis completed');
}

// Test 5: Test prompt submission detection
function testPromptSubmission() {
  console.log('\n5. Testing Prompt Submission Detection:');
  if (!promptWatcher) {
    console.log('- PromptWatcher not available');
    return;
  }
  
  console.log('- Last prompt captured:', promptWatcher.lastPrompt || 'None');
  console.log('- Processed prompts count:', promptWatcher.processedPrompts.size);
  console.log('- Prevention active:', promptWatcher.preventSubmission);
  
  // Test manual capture
  console.log('- Running manual test capture...');
  promptWatcher.testPromptCapture();
}

// Test 6: Test side panel functionality
function testSidePanel() {
  console.log('\n6. Testing Side Panel:');
  
  // Remove any existing panels
  const existingPanel = document.querySelector('#complyze-safe-prompt-panel');
  if (existingPanel) {
    existingPanel.remove();
    console.log('- Removed existing panel');
  }
  
  // Test direct panel creation
  console.log('- Testing direct panel creation...');
  if (typeof complyzeTestPanelDirect === 'function') {
    complyzeTestPanelDirect();
    console.log('- Panel creation function called');
  } else {
    console.log('- Panel test function not available');
  }
}

// Run all tests
async function runAllTests() {
  testExtensionLoaded();
  await testAuthStatus();
  testPlatformElements();
  await testRealTimeAnalysis();
  testPromptSubmission();
  testSidePanel();
  
  console.log('\n🎯 Test Suite Complete!');
  console.log('Check the results above for any issues.');
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.complyzeTestSuite = {
  runAll: runAllTests,
  testExtensionLoaded,
  testAuthStatus,
  testPlatformElements,
  testRealTimeAnalysis,
  testPromptSubmission,
  testSidePanel
}; 