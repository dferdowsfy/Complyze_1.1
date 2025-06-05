// Complyze Authentication Debug Script
// Run this in the browser console to debug login issues

console.log('🚀 Starting Complyze Authentication Debug...');

async function debugAuthFlow() {
    console.log('\\n📋 Debug 1: Extension Status');
    
    // Check if extension components are loaded
    const hasFloatingUI = !!window.complyzeFloatingUI;
    const hasContentScript = !!window.complyzeStable || document.querySelector('[id^=\"complyze-\"]');
    const hasBackgroundConnection = typeof chrome !== 'undefined' && !!chrome.runtime;
    
    console.log('✅ Floating UI loaded:', hasFloatingUI);
    console.log('✅ Content script active:', hasContentScript);
    console.log('✅ Background script connection:', hasBackgroundConnection);
    
    if (!hasFloatingUI) {
        console.error('❌ Floating UI not found! Extension may not be loaded properly.');
        return;
    }
    
    console.log('\\n📋 Debug 2: Current Authentication State');
    
    // Check current storage state
    try {
        const storage = await chrome.storage.local.get([
            'complyze_token', 
            'complyze_user', 
            'complyze_login_time',
            'accessToken',
            'user'
        ]);
        
        console.log('📦 Storage Contents:', storage);
        
        // Check login status using floating UI method
        const isLoggedIn = await window.complyzeFloatingUI.checkLoginStatus();
        console.log('🔐 Login Status (Floating UI):', isLoggedIn);
        
    } catch (error) {
        console.error('❌ Error checking storage:', error);
    }
    
    console.log('\\n📋 Debug 3: Background Script Communication Test');
    
    // Test background script communication
    try {
        const authResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'get_auth_status' }, resolve);
        });
        console.log('🔄 Background auth status:', authResponse);
        
        // Test a simple debug message
        const debugResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'debug_test' }, resolve);
        });
        console.log('🔧 Background debug response:', debugResponse);
        
    } catch (error) {
        console.error('❌ Background communication error:', error);
    }
    
    console.log('\\n📋 Debug 4: Login Form Analysis');
    
    // Check for login form and its state
    const loginForm = document.getElementById('complyze-login-form');
    if (loginForm) {
        console.log('📝 Login form found');
        console.log('🔄 Form submitting:', loginForm.hasAttribute('data-submitting'));
        console.log('🔧 Handler attached:', loginForm.hasAttribute('data-complyze-handler-attached'));
        console.log('⏰ Last attempt:', loginForm.getAttribute('data-last-attempt'));
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        console.log('📧 Email value:', emailInput?.value);
        console.log('🔒 Password length:', passwordInput?.value?.length || 0);
    } else {
        console.log('❌ No login form found');
    }
    
    console.log('\\n📋 Debug 5: Clear Auth Data (if needed)');
    console.log('To clear auth data and reset, run: clearAuthData()');
}

// Helper function to clear authentication data
async function clearAuthData() {
    console.log('🧹 Clearing all authentication data...');
    try {
        await chrome.storage.local.clear();
        console.log('✅ Storage cleared');
        
        // Reload the floating UI
        if (window.complyzeFloatingUI && window.complyzeFloatingUI.sidebar) {
            const container = window.complyzeFloatingUI.sidebar.querySelector('.complyze-sidebar-content');
            if (container) {
                await window.complyzeFloatingUI.loadPopupContent(container);
                console.log('✅ Floating UI refreshed');
            }
        }
    } catch (error) {
        console.error('❌ Error clearing auth data:', error);
    }
}

// Helper function to simulate successful login for testing
async function simulateLogin() {
    console.log('🎭 Simulating successful login...');
    try {
        await chrome.storage.local.set({
            complyze_token: 'demo_test_token',
            complyze_user: { 
                name: 'Test User', 
                email: 'test@example.com',
                id: 'test_user_123'
            },
            complyze_login_time: Date.now()
        });
        
        console.log('✅ Test login data set');
        
        // Refresh UI
        if (window.complyzeFloatingUI && window.complyzeFloatingUI.sidebar) {
            const container = window.complyzeFloatingUI.sidebar.querySelector('.complyze-sidebar-content');
            if (container) {
                await window.complyzeFloatingUI.loadPopupContent(container);
                console.log('✅ UI refreshed with test login');
            }
        }
    } catch (error) {
        console.error('❌ Error simulating login:', error);
    }
}

// Helper function to test real login
async function testRealLogin(email, password) {
    console.log('🔐 Testing real login for:', email);
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'login',
                email: email,
                password: password
            }, resolve);
        });
        
        console.log('📨 Login response:', response);
        return response;
    } catch (error) {
        console.error('❌ Login test error:', error);
        return { success: false, error: error.message };
    }
}

// Run the debug automatically
debugAuthFlow();

// Make functions available globally for manual testing
window.debugAuthFlow = debugAuthFlow;
window.clearAuthData = clearAuthData;
window.simulateLogin = simulateLogin;
window.testRealLogin = testRealLogin;

console.log('\\n🔧 Available Functions:');
console.log('- debugAuthFlow() - Run full debug analysis');
console.log('- clearAuthData() - Clear all auth data and reset');
console.log('- simulateLogin() - Set test login data');
console.log('- testRealLogin(email, password) - Test actual login'); 