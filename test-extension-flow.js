// Complyze Extension Flow Test Script
// Run this in the browser console on a supported AI platform (like ChatGPT)

console.log('🚀 Starting Complyze Extension Flow Test...');

// Test 1: Check if extension components are loaded
function testExtensionLoaded() {
  console.log('\n📋 Test 1: Extension Components');
  
  const hasFloatingUI = !!window.complyzeFloatingUI;
  const hasContentScript = !!window.complyzeStable || document.querySelector('[id^="complyze-"]');
  const hasBackgroundConnection = typeof chrome !== 'undefined' && !!chrome.runtime;
  
  console.log('✅ Floating UI loaded:', hasFloatingUI);
  console.log('✅ Content script active:', hasContentScript);
  console.log('✅ Background script connection:', hasBackgroundConnection);
  
  return hasFloatingUI && hasBackgroundConnection;
}

// Test 2: Check authentication status
async function testAuthStatus() {
  console.log('\n🔐 Test 2: Authentication Status');
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'get_auth_status' }, resolve);
    });
    
    console.log('Auth response:', response);
    console.log('✅ Is authenticated:', response?.isAuthenticated || false);
    console.log('✅ User data:', response?.user || 'None');
    
    return response;
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return null;
  }
}

// Test 3: Trigger prompt analysis
async function testPromptAnalysis(testPrompt = "My email is john.doe@example.com and my SSN is 123-45-6789") {
  console.log('\n🔍 Test 3: Prompt Analysis');
  console.log('Test prompt:', testPrompt);
  
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'analyze_prompt',
        payload: {
          prompt: testPrompt,
          platform: 'test',
          url: window.location.href,
          timestamp: new Date().toISOString(),
          triggerOptimization: false
        }
      }, resolve);
    });
    
    console.log('Analysis response:', response);
    
    if (response.success) {
      console.log('✅ Analysis successful');
      console.log('  - Risk level:', response.analysis?.risk_level);
      console.log('  - PII detected:', response.analysis?.pii_detected);
      console.log('  - Optimized prompt:', response.analysis?.optimized_prompt?.substring(0, 100) + '...');
    } else {
      console.log('❌ Analysis failed:', response.error);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Analysis test failed:', error);
    return null;
  }
}

// Test 4: Check if floating UI responds
function testFloatingUI() {
  console.log('\n🎯 Test 4: Floating UI Response');
  
  if (window.complyzeFloatingUI) {
    try {
      // Try to open the sidebar
      window.complyzeFloatingUI.openSidebar();
      console.log('✅ Floating UI sidebar opened');
      
      // Check if sidebar is visible
      const sidebar = document.querySelector('#complyze-floating-sidebar');
      if (sidebar) {
        console.log('✅ Sidebar element found in DOM');
        console.log('  - Sidebar visible:', sidebar.style.display !== 'none');
        console.log('  - Sidebar position:', sidebar.style.right);
      } else {
        console.log('❌ Sidebar element not found in DOM');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Floating UI test failed:', error);
      return false;
    }
  } else {
    console.log('❌ Floating UI not available');
    return false;
  }
}

// Test 5: Check dashboard connection
async function testDashboardConnection() {
  console.log('\n📊 Test 5: Dashboard Connection');
  
  try {
    // Test if dashboard is accessible
    const dashboardUrl = 'https://complyze.co/dashboard';
    console.log('✅ Dashboard URL:', dashboardUrl);
    console.log('✅ You can open the dashboard in a new tab to check if prompts appear');
    
    // Test API connectivity
    const apiResponse = await fetch('https://complyze.co/api/ingest', {
      method: 'OPTIONS',
    }).catch(() => null);
    
    if (apiResponse) {
      console.log('✅ API endpoint accessible');
    } else {
      console.log('⚠️ API endpoint may not be accessible (CORS or network issue)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Dashboard connection test failed:', error);
    return false;
  }
}

// Run complete test suite
async function runCompleteTest() {
  console.log('🧪 Running Complete Complyze Extension Test Suite...\n');
  
  // Wait for page to be fully loaded
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const results = {
    extensionLoaded: testExtensionLoaded(),
    authStatus: await testAuthStatus(),
    floatingUI: testFloatingUI(),
    dashboardConnection: await testDashboardConnection(),
    promptAnalysis: null
  };
  
  // Only test prompt analysis if basic components are working
  if (results.extensionLoaded) {
    results.promptAnalysis = await testPromptAnalysis();
  }
  
  // Summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log('Extension loaded:', results.extensionLoaded ? '✅' : '❌');
  console.log('User authenticated:', results.authStatus?.isAuthenticated ? '✅' : '❌');
  console.log('Floating UI working:', results.floatingUI ? '✅' : '❌');
  console.log('Dashboard accessible:', results.dashboardConnection ? '✅' : '❌');
  console.log('Prompt analysis:', results.promptAnalysis?.success ? '✅' : '❌');
  
  if (results.authStatus?.isAuthenticated) {
    console.log('\n✅ USER IS AUTHENTICATED - Prompts should sync to dashboard');
    console.log('Check your dashboard at: https://complyze.co/dashboard');
  } else {
    console.log('\n⚠️ USER NOT AUTHENTICATED - Sidebar should show login screen');
    console.log('Expected behavior: Floating sidebar opens with login form');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. If not authenticated: Test login flow in the floating sidebar');
  console.log('2. If authenticated: Try entering a prompt with PII in the input field');
  console.log('3. Check dashboard at https://complyze.co/dashboard for prompt data');
  
  return results;
}

// Auto-run the test
runCompleteTest(); 