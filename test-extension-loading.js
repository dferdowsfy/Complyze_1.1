// Complyze Extension Loading Debug Script
// Paste this in the browser console to check what's happening

console.log('🔍 Complyze Extension Loading Diagnostic');
console.log('Current URL:', window.location.href);
console.log('Current hostname:', window.location.hostname);

// Check if Chrome extension APIs are available
console.log('Chrome runtime available:', !!chrome?.runtime);
console.log('Chrome storage available:', !!chrome?.storage);

// Check if content scripts are loaded
const contentScriptChecks = {
    'floating-ui.js': !!window.ComplyzeFloatingUI,
    'floating UI instance': !!window.complyzeFloatingUI,
    'content.js': !!window.complyzeStable,
    'prompt-interceptor.js': !!window.ComplyzePromptInterceptor
};

console.log('📋 Content Script Status:');
Object.entries(contentScriptChecks).forEach(([script, loaded]) => {
    console.log(`${loaded ? '✅' : '❌'} ${script}: ${loaded}`);
});

// Check for the floating icon
const floatingIcon = document.getElementById('complyze-floating-icon');
console.log('🎯 Floating Icon Element:', floatingIcon);

if (!floatingIcon) {
    console.log('❌ No floating icon found in DOM');
    
    // Check for any Complyze-related elements
    const complyzeElements = document.querySelectorAll('[id*="complyze"], [class*="complyze"]');
    console.log('🔍 Found Complyze elements:', complyzeElements.length);
    complyzeElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tagName} - ID: ${el.id} - Class: ${el.className}`);
    });
}

// Check if platform is supported
function checkPlatformSupport() {
    const hostname = window.location.hostname;
    const supportedDomains = [
        'chat.openai.com',
        'chatgpt.com',
        'claude.ai',
        'gemini.google.com',
        'bard.google.com',
        'poe.com',
        'character.ai',
        'huggingface.co',
        'replicate.com',
        'cohere.ai',
        'complyze.co'
    ];
    
    const isSupported = supportedDomains.some(domain => hostname.includes(domain));
    console.log('🌐 Platform Support Check:');
    console.log(`  Current hostname: ${hostname}`);
    console.log(`  Is supported: ${isSupported}`);
    
    return isSupported;
}

const platformSupported = checkPlatformSupport();

// Force initialize floating UI if possible
if (window.ComplyzeFloatingUI && !window.complyzeFloatingUI) {
    console.log('🔄 Attempting to force initialize FloatingUI...');
    try {
        window.complyzeFloatingUI = new window.ComplyzeFloatingUI();
        console.log('✅ FloatingUI force initialized');
    } catch (error) {
        console.error('❌ Force initialization failed:', error);
    }
}

// Check for any JavaScript errors
const originalError = console.error;
console.error = function(...args) {
    if (args[0] && args[0].toString().includes('Complyze')) {
        console.log('🚨 Complyze-related error detected:', ...args);
    }
    originalError.apply(console, args);
};

// DOM readiness check
console.log('📄 DOM State:', document.readyState);

// Manifest check
if (chrome?.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    console.log('📋 Extension Manifest Version:', manifest.version);
    console.log('📋 Extension Name:', manifest.name);
}

// Helper function to manually create floating icon for testing
function forceCreateFloatingIcon() {
    console.log('🔧 Force creating floating icon...');
    
    // Remove any existing icon
    const existing = document.getElementById('complyze-floating-icon');
    if (existing) existing.remove();
    
    // Create simple test icon
    const icon = document.createElement('div');
    icon.id = 'complyze-floating-icon';
    icon.style.cssText = `
        position: fixed;
        top: 50%;
        right: 10px;
        width: 40px;
        height: 40px;
        background: #f97316;
        border-radius: 50%;
        z-index: 9999999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
    `;
    icon.textContent = 'C';
    icon.title = 'Complyze (Test)';
    
    icon.addEventListener('click', () => {
        alert('Complyze test icon clicked! Extension is working.');
    });
    
    document.body.appendChild(icon);
    console.log('✅ Test floating icon created');
}

// Make helper available globally
window.forceCreateFloatingIcon = forceCreateFloatingIcon;

console.log('\n🔧 Available Commands:');
console.log('- forceCreateFloatingIcon() - Create test floating icon');

console.log('\n📊 Summary:');
console.log(`Platform Supported: ${platformSupported}`);
console.log(`FloatingUI Class Available: ${!!window.ComplyzeFloatingUI}`);
console.log(`FloatingUI Instance Exists: ${!!window.complyzeFloatingUI}`);
console.log(`Floating Icon in DOM: ${!!document.getElementById('complyze-floating-icon')}`); 