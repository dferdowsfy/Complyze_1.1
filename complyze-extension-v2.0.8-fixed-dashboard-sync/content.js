console.log("Complyze: Content script starting on", window.location.href);

// Enhanced prompt detection for multiple LLM platforms with REAL-TIME PREVENTION
class PromptWatcher {
  constructor() {
    this.isLoggedIn = false;
    this.lastPrompt = '';
    this.processedPrompts = new Map(); // Changed to Map to store timestamps
    this.safePrompts = new Set(); // Track safe prompts to avoid re-analysis
    this.lastClearTime = null;
    this.isAnalyzing = false;
    this.preventSubmission = false;
    this.realTimeAnalysisEnabled = true;
    this.redactionSettings = {}; // Store redaction settings
    this.customRedactionTerms = '';
    this.isOptimizing = false; // NEW: Prevent multiple optimization processes
    this.platformSelectors = {
      'chat.openai.com': {
        promptInput: '#prompt-textarea, div[contenteditable="true"], textarea[placeholder*="Message"], [data-id] div[contenteditable="true"], div[data-testid="composer-text-input"], textarea[data-testid="prompt-textarea"], div[role="textbox"]',
        submitButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"], button[type="submit"], button:has(svg), button[aria-label*="Send"], button[title*="Send"], button[aria-label*="send"], button svg[data-icon="send"]',
        loginCheck: '[data-testid="profile-button"], .avatar, button[data-testid="profile-button"], [data-headlessui-state], button[aria-haspopup="menu"]'
      },
      'chatgpt.com': {
        promptInput: '#prompt-textarea, div[contenteditable="true"], textarea[placeholder*="Message"], [data-id] div[contenteditable="true"], div[data-testid="composer-text-input"], textarea[data-testid="prompt-textarea"], div[role="textbox"]',
        submitButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"], button[type="submit"], button:has(svg), button[aria-label*="Send"], button[title*="Send"], button[aria-label*="send"], button svg[data-icon="send"]',
        loginCheck: '[data-testid="profile-button"], .avatar, button[data-testid="profile-button"], [data-headlessui-state], button[aria-haspopup="menu"]'
      },
      'claude.ai': {
        promptInput: 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"], div[data-testid="composer-input"], div[role="textbox"], div[contenteditable="true"][data-testid], .ProseMirror, div[contenteditable="true"].ProseMirror',
        submitButton: 'button[aria-label="Send Message"], button:has(svg[data-icon="send"]), button[data-testid="send-button"], button:has(svg), button[type="submit"], button[aria-label*="Send"], button[title*="Send"]',
        loginCheck: '[data-testid="user-menu"], .user-avatar, button[aria-label*="User"], [data-testid="profile-button"], button[aria-label*="Account"], .avatar'
      },
      'gemini.google.com': {
        promptInput: 'rich-textarea div[contenteditable="true"], textarea[aria-label*="Enter a prompt"], div[contenteditable="true"], textarea[placeholder*="Enter a prompt"], div[role="textbox"]',
        submitButton: 'button[aria-label="Send message"], button[data-test-id="send-button"], button:has(svg), button[type="submit"], button[aria-label*="Send"]',
        loginCheck: '.gb_d, [data-ogsr-up], .gb_A, button[aria-label*="Google Account"]'
      },
      'complyze.co': {
        promptInput: 'textarea, input[type="text"], div[contenteditable="true"], [role="textbox"]',
        submitButton: 'button[type="submit"], button.submit-btn, .submit-btn, button[aria-label*="Send"], button[aria-label*="Submit"]',
        loginCheck: '.user-menu, [data-testid="user-menu"], .logout-btn, .user-avatar'
      }
    };
    this.init();
  }

  init() {
    console.log('Complyze: Initializing PromptWatcher with REAL-TIME PREVENTION');
    this.checkLoginStatus();
    this.setupRealTimeAnalysis();
    this.setupPromptWatching();
    
    // Re-check login status periodically
    setInterval(() => this.checkLoginStatus(), 5000);
    
    // Debug: Log available elements periodically
    setInterval(() => this.debugElements(), 10000);
    
    // Monitor input changes to detect when text is cleared (indicating send)
    this.monitorInputChanges();
    
    // Enhanced debugging for all platforms
    this.enhancedPlatformDebugging();
    
    // Check for extension context invalidation
    this.setupContextValidationCheck();
    
    // Listen for settings updates from the website
    this.listenForSettingsUpdates();
    
    // Use MutationObserver to watch for new input elements (for follow-up messages)
    this.watchForNewInputElements();
    
    // Listen for settings updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'redaction_settings_updated') {
        console.log('Complyze: Received redaction settings update from background');
        this.redactionSettings = message.payload.settings || {};
        this.customRedactionTerms = message.payload.customTerms || '';
      }
    });
    
    // Load existing settings from storage
    this.loadRedactionSettings();
  }
  
  // NEW: Load redaction settings from storage
  async loadRedactionSettings() {
    try {
      const result = await chrome.storage.local.get(['redactionSettings', 'customRedactionTerms']);
      if (result.redactionSettings) {
        this.redactionSettings = result.redactionSettings;
        this.customRedactionTerms = result.customRedactionTerms || '';
        console.log('Complyze: Loaded redaction settings from storage');
      }
    } catch (error) {
      console.error('Complyze: Failed to load redaction settings:', error);
    }
  }
  
  // NEW: Setup context validation check
  setupContextValidationCheck() {
    // Check every 30 seconds if extension context is still valid
    setInterval(() => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          // Context is valid
          return;
        }
      } catch (error) {
        console.log('Complyze: Extension context invalidated, attempting to reinitialize...');
        this.handleContextInvalidation();
      }
    }, 30000);
  }
  
  // NEW: Handle context invalidation
  handleContextInvalidation() {
    console.log('Complyze: Handling context invalidation - clearing intervals and reinitializing...');
    
    // Clear any existing intervals/timeouts
    this.isAnalyzing = false;
    this.preventSubmission = false;
    
    // Clear any UI elements
    const complyzeElements = document.querySelectorAll('[id^="complyze-"]');
    complyzeElements.forEach(el => el.remove());
    
    // Try to reinitialize after a short delay
    setTimeout(() => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          console.log('Complyze: Context restored, reinitializing...');
          this.init();
        }
      } catch (error) {
        console.log('Complyze: Context still invalid, will retry later');
      }
    }, 5000);
  }
  
  enhancedPlatformDebugging() {
    console.log('Complyze: Setting up enhanced platform debugging');
    
    // Log all input events
    document.addEventListener('input', (e) => {
      if (e.target.matches('textarea, div[contenteditable="true"], input')) {
        console.log('Complyze: Input event detected on:', e.target, 'Value:', e.target.value || e.target.textContent);
      }
    });
    
    // Log all keydown events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        console.log('Complyze: Enter key pressed on:', e.target);
        console.log('Complyze: Active element:', document.activeElement);
        console.log('Complyze: Shift key held:', e.shiftKey);
      }
    });
    
    // Monitor for new messages being added to the conversation
    const messageObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this looks like a new message
              if (node.textContent && node.textContent.length > 10) {
                console.log('Complyze: New content added to page:', node.textContent.substring(0, 100));
                
                // If we have a last prompt and new content was added, process it
                if (this.lastPrompt && this.lastPrompt.length > 10) {
                  console.log('Complyze: Detected message submission via DOM change');
                  const platform = this.getCurrentPlatform();
                  if (platform) {
                    const selectors = this.platformSelectors[platform];
                    setTimeout(() => this.handlePromptSubmission(selectors), 500);
                  }
                }
              }
            }
          });
        }
      });
    });
    
    messageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  debugElements() {
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    console.log('Complyze Debug: Available elements on page:');
    console.log('- Current URL:', window.location.href);
    console.log('- Platform detected:', platform);
    console.log('- Prompt inputs found:', document.querySelectorAll(selectors.promptInput).length);
    console.log('- Submit buttons found:', document.querySelectorAll(selectors.submitButton).length);
    console.log('- Login elements found:', document.querySelectorAll(selectors.loginCheck).length);
    
    // Log some common ChatGPT elements
    console.log('- All contenteditable divs:', document.querySelectorAll('div[contenteditable="true"]').length);
    console.log('- All textareas:', document.querySelectorAll('textarea').length);
    console.log('- All buttons:', document.querySelectorAll('button').length);
    
    // Specifically look for the main input area
    const mainInput = document.querySelector('#prompt-textarea') || 
                     document.querySelector('textarea[data-testid="prompt-textarea"]') ||
                     document.querySelector('div[contenteditable="true"]');
    
    if (mainInput) {
      console.log('Complyze Debug: Main input found:', mainInput);
      console.log('- Input type:', mainInput.tagName);
      console.log('- Input ID:', mainInput.id);
      console.log('- Input classes:', mainInput.className);
      console.log('- Input placeholder:', mainInput.placeholder);
      console.log('- Input current value:', mainInput.value || mainInput.textContent);
    } else {
      console.log('Complyze Debug: No main input found!');
    }
    
    // Look for send buttons
    const sendButtons = document.querySelectorAll('button');
    console.log('Complyze Debug: Analyzing buttons for send functionality:');
    sendButtons.forEach((btn, index) => {
      if (index < 5) { // Only log first 5 buttons
        const hasIcon = btn.querySelector('svg');
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute('aria-label');
        
        if (hasIcon || text.toLowerCase().includes('send') || ariaLabel?.toLowerCase().includes('send')) {
          console.log(`Potential send button ${index}:`, {
            text: text,
            ariaLabel: ariaLabel,
            hasIcon: hasIcon,
            element: btn
          });
        }
      }
    });
  }

  getCurrentPlatform() {
    const hostname = window.location.hostname;
    
    // Production-only: no localhost handling
    
    return Object.keys(this.platformSelectors).find(platform => 
      hostname === platform || hostname.endsWith(platform.replace('*.', ''))
    );
  }

  checkLoginStatus() {
    const platform = this.getCurrentPlatform();
    if (!platform) {
      console.log('Complyze: No platform detected for hostname:', window.location.hostname);
      return;
    }

    const loginSelector = this.platformSelectors[platform].loginCheck;
    const loginElement = document.querySelector(loginSelector);
    this.isLoggedIn = !!loginElement;
    
    console.log(`Complyze: Platform detected: ${platform}`);
    console.log(`Complyze: Login status for ${platform} (${window.location.hostname}):`, this.isLoggedIn);
    console.log(`Complyze: Current URL:`, window.location.href);
    console.log(`Complyze: Login selector used:`, loginSelector);
    console.log(`Complyze: Login element found:`, loginElement);
  }

  getPromptText(element) {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      return element.value;
    } else if (element.contentEditable === 'true') {
      // For contenteditable elements, first try to get text without cloning
      let text = element.innerText || element.textContent || '';
      
      // Only if we detect warning elements, then use the safer clone method
      if (text.includes('Security Risk Detected') || text.includes('Complyze analyzing')) {
        try {
          // Clone the element to avoid modifying the original
          const clone = element.cloneNode(true);
          
          // Remove any Complyze warning elements from the clone
          const warnings = clone.querySelectorAll('#complyze-realtime-warning, #complyze-realtime-info, #complyze-loading-indicator, [id^="complyze-"]');
          warnings.forEach(warning => warning.remove());
          
          // Get clean text content
          return clone.innerText || clone.textContent || '';
        } catch (error) {
          console.log('Complyze: Error cleaning text, using original:', error.message);
          return text;
        }
      }
      
      return text;
    }
    return '';
  }

  // NEW: Safe hash function that handles Unicode characters
  createSafeHash(text) {
    try {
      // Try btoa first for ASCII text
      return btoa(text).substring(0, 20);
    } catch (error) {
      // Fallback for Unicode text: create a simple hash
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36).substring(0, 20);
    }
  }

  setupPromptWatching() {
    const platform = this.getCurrentPlatform();
    if (!platform) {
      console.log('Complyze: Cannot setup prompt watching - no platform detected');
      return;
    }

    const selectors = this.platformSelectors[platform];
    console.log(`Complyze: Setting up prompt watching for ${platform}`);
    console.log(`Complyze: Using selectors:`, selectors);

    // Watch for Enter key presses with prevention capability
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        console.log('Complyze: Enter key detected, checking for prompt submission');
        
        // Check if submission should be prevented
        if (this.preventSubmission) {
          console.log('Complyze: Submission prevented due to security risk');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        // Capture text immediately before submission
        const promptElement = document.querySelector(selectors.promptInput);
        if (promptElement) {
          const promptText = this.getPromptText(promptElement).trim();
          if (promptText) {
            this.lastPrompt = promptText;
            console.log('Complyze: Pre-captured prompt:', promptText.substring(0, 100) + '...');
          }
        }
        // Small delay to ensure submission is processed
        setTimeout(() => this.handlePromptSubmission(selectors), 100);
      }
    });

    // Watch for button clicks with prevention capability
    document.addEventListener('click', (e) => {
      console.log('Complyze: Click detected on:', e.target);
      const submitButton = e.target.closest(selectors.submitButton);
      if (submitButton) {
        console.log('Complyze: Submit button clicked:', submitButton);
        
        // Check if submission should be prevented
        if (this.preventSubmission) {
          console.log('Complyze: Button click prevented due to security risk');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        // Capture text immediately before submission
        const promptElement = document.querySelector(selectors.promptInput);
        if (promptElement) {
          const promptText = this.getPromptText(promptElement).trim();
          if (promptText) {
            this.lastPrompt = promptText;
            console.log('Complyze: Pre-captured prompt:', promptText.substring(0, 100) + '...');
          }
        }
        // Small delay to ensure submission is processed
        setTimeout(() => this.handlePromptSubmission(selectors), 100);
      } else {
        // Check if it's any button that might be a send button
        const isButton = e.target.tagName === 'BUTTON' || e.target.closest('button');
        if (isButton) {
          const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
          console.log('Complyze: Button clicked (checking if send):', button);
          
          // Check if this button is near a prompt input
          const promptElement = document.querySelector(selectors.promptInput);
          if (promptElement) {
            const promptText = this.getPromptText(promptElement).trim();
            if (promptText) {
              console.log('Complyze: Button clicked with prompt text present, treating as potential send');
              this.lastPrompt = promptText;
              setTimeout(() => this.handlePromptSubmission(selectors), 100);
            }
          }
        }
      }
    });

    // Watch for form submissions
    document.addEventListener('submit', (e) => {
      console.log('Complyze: Form submission detected');
      this.handlePromptSubmission(selectors);
    });
  }

  async handlePromptSubmission(selectors) {
    console.log('Complyze: handlePromptSubmission called');
    
    // Check if extension is enabled (with error handling)
    try {
    const settings = await chrome.storage.local.get(['extensionEnabled']);
    if (settings.extensionEnabled === false) {
      console.log('Complyze: Extension is disabled, skipping analysis');
      return;
      }
    } catch (error) {
      console.log('Complyze: Could not access extension settings (context may be invalidated):', error.message);
      // Continue anyway - don't block functionality
    }

    if (!this.isLoggedIn) {
      console.log('Complyze: User not logged in, skipping prompt analysis');
      return;
    }

    // Use pre-captured prompt if available, otherwise try to get it from the element
    let userPrompt = this.lastPrompt;
    
    if (!userPrompt) {
      console.log('Complyze: No pre-captured prompt, looking for prompt input with selector:', selectors.promptInput);
      const promptElement = document.querySelector(selectors.promptInput);
      console.log('Complyze: Prompt element found:', promptElement);
      
      if (promptElement) {
        userPrompt = this.getPromptText(promptElement).trim();
        console.log('Complyze: Extracted prompt text:', userPrompt);
      }
    } else {
      console.log('Complyze: Using pre-captured prompt:', userPrompt.substring(0, 100) + '...');
    }
    
    // If still no prompt, try alternative methods
    if (!userPrompt) {
      console.log('Complyze: Trying alternative prompt detection methods...');
      
      // Try to find any textarea or contenteditable div with text
      const allInputs = document.querySelectorAll('textarea, div[contenteditable="true"], input[type="text"]');
      for (const input of allInputs) {
        const text = this.getPromptText(input).trim();
        if (text && text.length > 5) {
          console.log('Complyze: Found text in alternative input:', text.substring(0, 50));
          userPrompt = text;
          break;
        }
      }
    }
    
    if (!userPrompt) {
      console.log('Complyze: No prompt text found after all attempts');
      return;
    }
    
    // Check if we've already processed this exact prompt
    // Use a safer hash function that handles Unicode characters
    const promptHash = this.createSafeHash(userPrompt);
    
    // Clear processed prompts more frequently to allow follow-up messages
    const now = Date.now();
    if (!this.lastClearTime) this.lastClearTime = now;
    
    // Clear cache more aggressively - every 10 seconds or after 3 prompts
    if (this.processedPrompts.size > 3 || (now - this.lastClearTime) > 10000) {
      console.log('Complyze: Clearing processed prompts cache to allow follow-up messages');
      this.processedPrompts.clear();
      this.lastClearTime = now;
    }
    
    // Only skip if this exact prompt was processed very recently (within 5 seconds)
    if (this.processedPrompts.has(promptHash)) {
      const recentPromptTime = this.processedPrompts.get(promptHash);
      if (recentPromptTime && (now - recentPromptTime) < 5000) {
        console.log('Complyze: Prompt processed very recently, skipping');
        return;
      }
    }
    
    // Store prompt with timestamp instead of just adding to set
    this.processedPrompts.set(promptHash, now);
    
    console.log('Complyze: Capturing prompt for analysis:', userPrompt.substring(0, 100) + '...');
    
    // Send to background script for processing (with error handling)
    try {
    chrome.runtime.sendMessage({
      type: 'analyze_prompt',
      payload: {
        prompt: userPrompt,
        platform: this.getCurrentPlatform(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
    } catch (error) {
      console.log('Complyze: Could not send message to background script (context may be invalidated):', error.message);
    }
  }
  
  monitorInputChanges() {
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    let lastInputValue = '';
    
    setInterval(() => {
      const promptElement = document.querySelector(selectors.promptInput);
      if (promptElement) {
        const currentValue = this.getPromptText(promptElement).trim();
        
        // If input was cleared (indicating message was sent), reset prevention state
        if (lastInputValue && !currentValue) {
          console.log('Complyze: Input cleared - message likely sent, resetting prevention state');
          this.preventSubmission = false;
          this.blockSubmitButtons(false);
          this.clearRealTimeWarnings(promptElement);
          this.lastPrompt = ''; // Clear last prompt to allow fresh detection
        }
        
        // If we had text before and now it's empty, a message was likely sent
        if (lastInputValue && !currentValue && lastInputValue !== this.lastPrompt) {
          console.log('Complyze: Input cleared, processing last prompt:', lastInputValue.substring(0, 100) + '...');
          this.lastPrompt = lastInputValue;
          this.handlePromptSubmission(selectors);
        }
        
        lastInputValue = currentValue;
      }
    }, 500); // Check every 500ms
  }

  // Manual test function for debugging
  testPromptCapture() {
    console.log('Complyze: Manual test triggered');
    const platform = this.getCurrentPlatform();
    if (!platform) {
      console.log('Complyze: No platform detected');
      return;
    }
    
    const selectors = this.platformSelectors[platform];
    const promptElement = document.querySelector(selectors.promptInput);
    
    if (promptElement) {
      const text = this.getPromptText(promptElement);
      console.log('Complyze: Manual test - found input element:', promptElement);
      console.log('Complyze: Manual test - current text:', text);
      
      if (text.trim()) {
        this.lastPrompt = text.trim();
        this.handlePromptSubmission(selectors);
      } else {
        console.log('Complyze: Manual test - no text in input');
      }
    } else {
      console.log('Complyze: Manual test - no input element found');
    }
  }

  // NEW: Real-time analysis as user types
  setupRealTimeAnalysis() {
    console.log('Complyze: Setting up real-time prompt analysis');
    
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    
    // Find all existing input elements and attach listeners
    const existingInputs = document.querySelectorAll(selectors.promptInput);
    if (existingInputs.length > 0) {
      console.log('Complyze: Found existing input elements:', existingInputs.length);
      this.attachRealTimeAnalysisToElements(existingInputs);
    }
    
    // Also set up global event listeners for submit prevention
    this.setupSubmitPrevention();
  }
  
  // NEW: Setup submit prevention listeners
  setupSubmitPrevention() {
    // Prevent Enter key submission if high risk detected
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && this.preventSubmission) {
        console.log('Complyze: Preventing Enter key submission due to security risk');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }, true); // Use capture phase to intercept early
    
    // Prevent button click submission if high risk detected
    document.addEventListener('click', (e) => {
      if (this.preventSubmission) {
        const platform = this.getCurrentPlatform();
        if (platform) {
          const selectors = this.platformSelectors[platform];
          const submitButton = e.target.closest(selectors.submitButton);
          if (submitButton) {
            console.log('Complyze: Preventing button click submission due to security risk');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }
        }
      }
    }, true); // Use capture phase to intercept early
  }

  // NEW: Perform real-time analysis without sending the prompt
  async performRealTimeAnalysis(promptText, promptElement) {
    console.log('Complyze: 🎯 performRealTimeAnalysis CALLED');
    console.log('Complyze: 📝 Prompt text preview:', promptText.substring(0, 100) + '...');
    console.log('Complyze: 🎯 Prompt element:', promptElement);
    
    // Prevent multiple analysis processes for the same prompt
    if (this.isAnalyzing) {
      console.log('Complyze: ⚠️ Analysis already in progress, skipping duplicate request');
      return;
    }
    
    this.isAnalyzing = true;
    
    try {
      // Skip analysis for safe prompts
      const promptHash = this.createSafeHash(promptText);
      if (this.safePrompts.has(promptHash)) {
        console.log('Complyze: Skipping analysis for safe prompt');
        return;
      }

      console.log('Complyze: Starting real-time analysis for:', promptText.substring(0, 50) + '...');
      
      // Show loading indicator
      this.showLoadingIndicator(promptElement);
      
      try {
        // First, perform quick local analysis
        const localAnalysis = this.performQuickLocalAnalysis(promptText);
        console.log('Complyze: 📊 LOCAL ANALYSIS COMPLETE:', {
          risk_level: localAnalysis.risk_level,
          detectedPII: localAnalysis.detectedPII,
          detectedCount: localAnalysis.detectedPII?.length || 0,
          fullResult: localAnalysis
        });
        
        // IMMEDIATE BLOCKING: If sensitive data is detected, block immediately
        console.log('Complyze: 🔍 CHECKING BLOCKING CONDITIONS:', {
          risk_level: localAnalysis.risk_level,
          isHigh: localAnalysis.risk_level === 'high',
          isCritical: localAnalysis.risk_level === 'critical',
          detectedPII: localAnalysis.detectedPII,
          detectedPIILength: localAnalysis.detectedPII?.length || 0,
          shouldBlock: localAnalysis.risk_level === 'high' || localAnalysis.risk_level === 'critical' || 
                      (localAnalysis.detectedPII && localAnalysis.detectedPII.length > 0)
        });
        
        if (localAnalysis.risk_level === 'high' || localAnalysis.risk_level === 'critical' || 
            (localAnalysis.detectedPII && localAnalysis.detectedPII.length > 0)) {
          
          console.log('Complyze: 🚨 IMMEDIATE BLOCKING - Sensitive data detected!');
          console.log('Complyze: 🎯 BLOCKING CONDITIONS MET - Instant blocking mode');
          
          // BLOCK USER IMMEDIATELY - NO DELAYS, NO AI PROCESSING
          this.preventSubmission = true;
          this.blockSubmitButtons(true);
          
          // Hide loading and show blocking warning instantly
          this.hideLoadingIndicator(promptElement);
          this.showRealTimeWarning(promptElement, localAnalysis, true); // true = blocking mode
          
          // Send basic data to Supabase immediately (quick sync, non-blocking)
          this.syncBasicPromptToSupabase(promptText, localAnalysis);
          
          // Start AI optimization in background AFTER blocking is shown
          setTimeout(() => {
            console.log('Complyze: 🤖 Starting AI optimization after blocking displayed');
            this.performAIOptimizationAfterBlocking(promptText, promptElement, localAnalysis);
          }, 100); // Small delay to ensure UI is updated first
          
          return; // Exit immediately from real-time analysis - AI runs separately
        } else {
          console.log('Complyze: ✅ NO IMMEDIATE BLOCKING NEEDED - Risk level too low');
        }
        
        // If local analysis is clean, try server analysis
        try {
          const serverAnalysis = await this.performServerAnalysis(promptText);
          this.hideLoadingIndicator(promptElement);
          
          if (serverAnalysis && (serverAnalysis.risk_level === 'high' || serverAnalysis.risk_level === 'critical')) {
            this.showRealTimeWarning(promptElement, serverAnalysis, true);
          } else if (serverAnalysis && serverAnalysis.risk_level === 'medium') {
            this.showRealTimeInfo(promptElement, serverAnalysis);
          } else {
            console.log('Complyze: No significant risks detected');
          }
        } catch (serverError) {
          console.error('Complyze: Server analysis failed, falling back to local analysis:', serverError);
          this.hideLoadingIndicator(promptElement);
          
          // If server fails but local found any risk, show blocking warning
          if (localAnalysis.risk_level === 'high' || localAnalysis.risk_level === 'critical') {
            this.showRealTimeWarning(promptElement, localAnalysis, true);
          } else if (localAnalysis.risk_level === 'medium' || localAnalysis.detectedPII.length > 0) {
            this.showRealTimeWarning(promptElement, localAnalysis, true); // Block even for medium risk when server unavailable
          }
          
          // Create a fallback analysis with better error handling
          const fallbackAnalysis = {
            ...localAnalysis,
            error: 'Server analysis unavailable - using local detection only',
            detectedPII: localAnalysis.detectedPII || [],
            risk_level: localAnalysis.risk_level || 'low'
          };
          
          // If local found any PII, still show warning
          if (fallbackAnalysis.detectedPII.length > 0) {
            this.showRealTimeWarning(promptElement, fallbackAnalysis, false);
          }
        }
      } catch (error) {
        console.error('Complyze: Real-time analysis failed:', error);
        this.hideLoadingIndicator(promptElement);
        
        // Show a user-friendly error message but don't block the user
        this.showAnalysisError(promptElement);
      }
    } finally {
      this.isAnalyzing = false;
    }
  }

  // NEW: Quick Supabase sync for immediate blocking (no AI processing delays)
  syncBasicPromptToSupabase(promptText, localAnalysis) {
    try {
      console.log('Complyze: 🚀 Quick sync to Supabase for blocked prompt');
      
      // Send to background script for immediate Supabase sync (no AI processing)
      const syncPayload = {
        type: 'sync_prompt_immediate',
        payload: {
          prompt: promptText,
          platform: this.getCurrentPlatform(),
          url: window.location.href,
          timestamp: new Date().toISOString(),
          risk_level: localAnalysis.risk_level,
          detected_pii: localAnalysis.detectedPII || [],
          blocked: true
        }
      };
      
      // Fire and forget - don't wait for response to avoid delays
      chrome.runtime.sendMessage(syncPayload).catch(error => {
        console.log('Complyze: Quick sync failed (non-blocking):', error);
      });
      
    } catch (error) {
      console.log('Complyze: Quick sync error (non-blocking):', error);
    }
  }

  // NEW: AI optimization after blocking is displayed (separate from real-time analysis)
  async performAIOptimizationAfterBlocking(promptText, promptElement, localAnalysis) {
    try {
      // Prevent multiple optimization processes
      if (this.isOptimizing) {
        console.log('Complyze: ⚠️ AI optimization already in progress, skipping');
        return;
      }
      
      this.isOptimizing = true;
      console.log('Complyze: 🚀 Starting AI optimization for blocked prompt');
      
      // Send to background script for OpenRouter AI optimization
      const messagePayload = {
        type: 'analyze_prompt',
        payload: {
          prompt: promptText,
          platform: this.getCurrentPlatform(),
          url: window.location.href,
          timestamp: new Date().toISOString(),
          triggerOptimization: true // Request AI optimization via OpenRouter
        }
      };
      
      console.log('Complyze: 📤 Sending AI optimization request to background');
      
      try {
        const response = await chrome.runtime.sendMessage(messagePayload);
        
        if (response && response.success && response.optimizedPrompt) {
          console.log('Complyze: ✅ AI optimization completed, updating blocked warning');
          
          // Update the existing warning with optimized prompt
          const analysis = response.analysis || localAnalysis;
          analysis.optimized_prompt = response.optimizedPrompt;
          analysis.optimization_details = response.optimizationDetails;
          
          // Only update if the warning is still showing and no modal is open
          const existingWarning = document.querySelector('#complyze-realtime-warning');
          const hasModal = document.querySelector('#complyze-safe-prompt-modal');
          
          if (existingWarning && !hasModal) {
            // Remove old warning and show updated one with AI-optimized prompt
            existingWarning.remove();
            this.showRealTimeWarning(promptElement, analysis, true);
          }
          
        } else {
          console.log('Complyze: AI optimization failed, keeping local analysis');
        }
        
      } catch (error) {
        console.error('Complyze: AI optimization request failed:', error);
      }
      
    } catch (error) {
      console.error('Complyze: AI optimization process failed:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  // NEW: Background server analysis and AI optimization for better UX
  async performServerAnalysisBackground(promptText, promptElement, fallbackAnalysis) {
    // Prevent multiple optimization processes from running simultaneously
    if (this.isOptimizing) {
      console.log('Complyze: ⚠️ AI optimization already in progress, skipping duplicate request');
      return;
    }
    
    this.isOptimizing = true;
    let optimizationTimeout;
    
    try {
      console.log('Complyze: Starting background server analysis and AI optimization...');
      
      // Only show progress indicator if no blocking warning is already shown
      const hasBlockingWarning = document.querySelector('#complyze-realtime-warning');
      if (!hasBlockingWarning) {
        console.log('Complyze: 🚀 Starting AI optimization process - showing progress indicator');
        this.showAIOptimizationProgress(promptElement);
      } else {
        console.log('Complyze: 🔇 Blocking warning already shown - skipping progress indicator');
      }
      
      // Set a maximum timeout of 45 seconds for the entire process
      optimizationTimeout = setTimeout(() => {
        console.log('Complyze: ⚠️ AI optimization timed out after 45 seconds');
        this.hideAIOptimizationProgress();
        
        // Fallback: Generate local safe prompt if server takes too long
        const safePrompt = this.generateSafePrompt(promptText, fallbackAnalysis);
        fallbackAnalysis.optimized_prompt = safePrompt;
        fallbackAnalysis.optimization_details = {
          improvements: ['Applied local security optimization due to timeout'],
          optimizationReason: 'Local fallback due to AI service timeout'
        };
        
        // Only update if no modal is open
        if (!document.querySelector('#complyze-safe-prompt-modal')) {
          const existingWarning = document.querySelector('#complyze-realtime-warning');
          if (existingWarning) {
            existingWarning.remove();
          }
          this.showRealTimeWarning(promptElement, fallbackAnalysis, true);
        }
        
        // Reset optimization flag on timeout
        this.isOptimizing = false;
      }, 45000); // 45 second timeout
      
      // Send to background script for full analysis AND AI optimization
      // The background script will handle all timing delays (15-25 seconds total)
      const messagePayload = {
        type: 'analyze_prompt',
        payload: {
          prompt: promptText,
          platform: this.getCurrentPlatform(),
          url: window.location.href,
          timestamp: new Date().toISOString(),
          triggerOptimization: true // NEW: Request AI optimization
        }
      };
      
      console.log('Complyze: 📤 SENDING MESSAGE TO BACKGROUND:', messagePayload);
      
      // Use Promise.race to handle both response and timeout
      const response = await Promise.race([
        chrome.runtime.sendMessage(messagePayload),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Message timeout')), 40000)
        )
      ]);
      
      // Clear the timeout since we got a response
      if (optimizationTimeout) {
        clearTimeout(optimizationTimeout);
        optimizationTimeout = null;
      }
      
      console.log('Complyze: 📥 RECEIVED RESPONSE FROM BACKGROUND:', response);
      console.log('Complyze: ⏱️ Background AI optimization completed, response received');
      
      if (response && response.success) {
        console.log('Complyze: Background server analysis completed');
        
        // Always hide the progress indicator first
        console.log('Complyze: 🎯 Hiding AI optimization progress indicator');
        this.hideAIOptimizationProgress();
        
        // If we have an optimized prompt, update the UI immediately
        if (response.optimizedPrompt) {
          console.log('Complyze: ✨ AI optimization completed, updating UI with safe prompt');
          
          // Update the warning panel with the optimized prompt
          const analysis = response.analysis || fallbackAnalysis;
          analysis.optimized_prompt = response.optimizedPrompt;
          analysis.optimization_details = response.optimizationDetails;
          
          // Only update if no modal is open
          if (!document.querySelector('#complyze-safe-prompt-modal')) {
            const existingWarning = document.querySelector('#complyze-realtime-warning');
            if (existingWarning) {
              existingWarning.remove();
            }
            this.showRealTimeWarning(promptElement, analysis, true);
          }
        } else if (response.analysis && 
                   response.analysis.detectedPII && 
                   response.analysis.detectedPII.length > fallbackAnalysis.detectedPII.length &&
                   !document.querySelector('#complyze-safe-prompt-modal')) {
          
          console.log('Complyze: Server analysis found more issues, updating warning');
          
          // Remove old warning and show updated one ONLY if no modal exists
          const existingWarning = document.querySelector('#complyze-realtime-warning');
          if (existingWarning) {
            existingWarning.remove();
            this.showRealTimeWarning(promptElement, response.analysis, true);
          }
        }
      } else {
        // Handle failed response
        console.log('Complyze: ❌ Background analysis failed or returned unsuccessful response');
        this.hideAIOptimizationProgress();
        
        // Fallback: Generate local safe prompt
        const safePrompt = this.generateSafePrompt(promptText, fallbackAnalysis);
        fallbackAnalysis.optimized_prompt = safePrompt;
        fallbackAnalysis.optimization_details = {
          improvements: ['Applied local security optimization'],
          optimizationReason: 'Local fallback due to AI service failure'
        };
        
        // Only update if no modal is open
        if (!document.querySelector('#complyze-safe-prompt-modal')) {
          const existingWarning = document.querySelector('#complyze-realtime-warning');
          if (existingWarning) {
            existingWarning.remove();
          }
          this.showRealTimeWarning(promptElement, fallbackAnalysis, true);
        }
      }
    } catch (error) {
      console.log('Complyze: Background server analysis failed, generating fallback safe prompt:', error);
      
      // Clear timeout if it exists
      if (optimizationTimeout) {
        clearTimeout(optimizationTimeout);
        optimizationTimeout = null;
      }
      
      // Always hide the progress indicator on error
      console.log('Complyze: 🎯 Hiding AI optimization progress indicator (error case)');
      this.hideAIOptimizationProgress();
      
      // Fallback: Generate local safe prompt if server fails
      const safePrompt = this.generateSafePrompt(promptText, fallbackAnalysis);
      fallbackAnalysis.optimized_prompt = safePrompt;
      fallbackAnalysis.optimization_details = {
        improvements: ['Applied local security optimization due to error'],
        optimizationReason: 'Local fallback due to AI service error'
      };
      
      // Only update if no modal is open
      if (!document.querySelector('#complyze-safe-prompt-modal')) {
        const existingWarning = document.querySelector('#complyze-realtime-warning');
        if (existingWarning) {
          existingWarning.remove();
        }
        this.showRealTimeWarning(promptElement, fallbackAnalysis, true);
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  // NEW: Show analysis error message
  showAnalysisError(promptElement) {
    const errorId = 'complyze-analysis-error';
    const error = document.createElement('div');
    error.id = errorId;
    
    const rect = promptElement.getBoundingClientRect();
    
    error.style.cssText = `
      position: fixed;
      top: ${rect.top - 60}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      z-index: 999999;
      animation: slideDown 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    error.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span>
          <span>Complyze analysis temporarily unavailable</span>
        </div>
        <button id="complyze-error-dismiss" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
      </div>
    `;
    
    document.body.appendChild(error);
    
    error.querySelector('#complyze-error-dismiss').addEventListener('click', () => {
      error.remove();
    });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (error.parentNode) error.remove();
    }, 5000);
  }

  // NEW: Comprehensive local analysis with all PII/PHI/PCI and enterprise patterns
  performQuickLocalAnalysis(text) {
    const detectedPII = [];
    let hasHighRisk = false;
    let hasCriticalRisk = false;

    // Check context-sensitive patterns FIRST (most specific)
    const contextSensitivePatterns = {
      // API Keys and Secrets (check these first!)
      openaiApiKey: { pattern: /\bsk-[a-zA-Z0-9]{48,64}\b/g, risk: 'critical' },
      openrouterApiKey: { pattern: /\bsk-or-v1-[a-f0-9]{64}\b/g, risk: 'critical' },
      anthropicApiKey: { pattern: /\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g, risk: 'critical' },
      googleApiKey: { pattern: /\bAIza[a-zA-Z0-9\-_]{35}\b/g, risk: 'critical' },
      awsAccessKey: { pattern: /\bAKIA[a-zA-Z0-9]{16}\b/g, risk: 'critical' },
      githubToken: { pattern: /\bghp_[a-zA-Z0-9]{36}\b/g, risk: 'critical' },
      stripeKey: { pattern: /\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}\b/g, risk: 'critical' },
      jwtToken: { pattern: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, risk: 'critical' },
      
      // Context-aware credential detection
      apiKeyWithContext: { pattern: /\b(?:api[\s_-]?key|secret[\s_-]?key|access[\s_-]?token)[\s:=]+[a-zA-Z0-9\-_]{16,}/gi, risk: 'critical' },
      secretWithContext: { pattern: /\b(?:secret|password|token|credential)[\s:=]+[a-zA-Z0-9\-_]{8,}/gi, risk: 'critical' },
      
      // Specific API key patterns (company_KEY=value format)
      namedApiKey: { pattern: /\b\w+_?(?:key|api|token|secret)[\s:=]+(?:sk-|pk-|api-)?[a-zA-Z0-9\-_]{8,}/gi, risk: 'critical' },
      
      // Named entity detection (check before generic patterns)
      personName: { pattern: /\b(?:name|called|named)[\s:]+[A-Z][a-z]+ [A-Z][a-z]+/gi, risk: 'medium' },
    };

    // ✅ Core PII/PHI/PCI (Standard Compliance) - More specific patterns
    const corePatterns = {
      // Personal Identifiers (made more specific)
      email: { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, risk: 'high' },
      // SSN patterns (check before phone to avoid conflicts)
      ssnWithDashes: { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, risk: 'critical' },
      ssnNoDashes: { pattern: /\b(?<![\d-])\d{9}(?![\d-])\b/g, risk: 'critical' },
      // Phone patterns (more specific to avoid false positives with API keys)
      phoneWithDashes: { pattern: /\b(?:phone|tel|telephone|call|contact|mobile|cell)[\s:]*\d{3}-\d{3}-\d{4}\b/gi, risk: 'medium' },
      phoneWithParens: { pattern: /\b\(\d{3}\)\s?\d{3}-?\d{4}\b/g, risk: 'medium' },
      phoneInternational: { pattern: /\+\d{1,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g, risk: 'medium' },
      
      // Financial Data
      creditCard: { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, risk: 'critical' },
      
      // Government IDs
      driverLicense: { pattern: /\b[A-Z]{1,2}\d{6,8}\b/g, risk: 'high' },
      passport: { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, risk: 'high' },
      
      // Network/Device
      ipAddress: { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, risk: 'medium' },
      macAddress: { pattern: /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g, risk: 'medium' }
    };

    // 🏢 Enterprise-Specific Company Data
    const enterprisePatterns = {
      // Technical Assets
      sshKey: { pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, risk: 'critical' },
      
      // Internal URLs and Services
      internalUrl: { pattern: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g, risk: 'high' },
      internalService: { pattern: /\b(?:ServiceNow|Snowflake|Redshift|Databricks|Splunk|Tableau)\s+(?:instance|database|server)/gi, risk: 'medium' },
      
      // Project and Code Names
      projectName: { pattern: /\b(?:Project|Operation|Initiative)\s+[A-Z][a-zA-Z]+\b/g, risk: 'medium' },
      codeNames: { pattern: /\b[A-Z][a-zA-Z]+(?:DB|API|Service|Platform)\b/g, risk: 'medium' },
      
      // Financial and Strategic
      revenueData: { pattern: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion|M|B|revenue|profit|loss)/gi, risk: 'high' },
      financialProjections: { pattern: /\b(?:Q[1-4]|FY\d{2,4})\s+(?:revenue|earnings|profit|forecast)/gi, risk: 'high' },
      
      // IP Ranges and Network
      cidrRange: { pattern: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g, risk: 'medium' },
      
      // Regulatory and Compliance
      exportControl: { pattern: /\b(?:ITAR|EAR|export.controlled|dual.use)\b/gi, risk: 'critical' },
      cui: { pattern: /\b(?:CUI|Controlled Unclassified Information)\b/gi, risk: 'critical' },
      whistleblower: { pattern: /\b(?:whistleblower|insider.threat|investigation|compliance.violation)\b/gi, risk: 'critical' }
    };

    // Sensitive Keywords (Context-Aware)
    const sensitiveKeywords = {
      credentials: { pattern: /\b(?:password|secret|token|key|credential|auth|login)\s*[:=]\s*\S+/gi, risk: 'critical' },
      confidential: { pattern: /\b(?:confidential|private|internal.only|restricted|classified)\b/gi, risk: 'high' },
      security: { pattern: /\b(?:vulnerability|exploit|backdoor|zero.day|penetration.test)\b/gi, risk: 'high' },
      legal: { pattern: /\b(?:attorney.client|privileged|litigation|settlement|NDA)\b/gi, risk: 'high' }
    };

    // Check patterns in order of specificity (most specific first)
    const patternGroups = [
      { name: 'context-sensitive', patterns: contextSensitivePatterns },
      { name: 'core', patterns: corePatterns },
      { name: 'enterprise', patterns: enterprisePatterns },
      { name: 'keywords', patterns: sensitiveKeywords }
    ];
    
    // Track which parts of text have been matched to avoid double-detection
    let processedText = text;
    
    for (const group of patternGroups) {
      for (const [type, config] of Object.entries(group.patterns)) {
        const matches = processedText.match(config.pattern);
        if (matches) {
          detectedPII.push(type);
          
          // Remove matched portions to prevent double-detection
          for (const match of matches) {
            processedText = processedText.replace(match, ' '.repeat(match.length));
          }
          
          switch (config.risk) {
            case 'critical':
              hasCriticalRisk = true;
              hasHighRisk = true;
              break;
            case 'high':
              hasHighRisk = true;
              break;
            case 'medium':
              // Medium risk doesn't set hasHighRisk
              break;
          }
        }
      }
    }

    // Additional context-based analysis
    const contextAnalysis = this.analyzeContext(text);
    if (contextAnalysis.hasRisk) {
      detectedPII.push(...contextAnalysis.risks);
      if (contextAnalysis.level === 'critical') {
        hasCriticalRisk = true;
        hasHighRisk = true;
      } else if (contextAnalysis.level === 'high') {
        hasHighRisk = true;
      }
    }

    return {
      hasHighRisk,
      hasCriticalRisk,
      detectedPII,
      risk_level: hasCriticalRisk ? 'critical' : (hasHighRisk ? 'high' : (detectedPII.length > 0 ? 'medium' : 'low'))
    };
  }

  // NEW: Context-aware analysis for complex patterns
  analyzeContext(text) {
    const risks = [];
    let level = 'low';

    // Check for company-specific contexts
    const companyContexts = [
      { pattern: /\b(?:Meta|Google|Microsoft|Amazon|Apple)\s+(?:internal|confidential|proprietary)/gi, risk: 'high' },
      { pattern: /\b(?:board|executive|C-suite)\s+(?:meeting|decision|strategy)/gi, risk: 'high' },
      { pattern: /\b(?:M&A|merger|acquisition|due.diligence)/gi, risk: 'critical' },
      { pattern: /\b(?:layoffs|restructuring|downsizing)\s+(?:plan|strategy)/gi, risk: 'high' }
    ];

    // Check for AI/ML specific risks
    const aiContexts = [
      { pattern: /\b(?:model|weights|architecture|training.data)\s+(?:proprietary|internal)/gi, risk: 'high' },
      { pattern: /\b(?:prompt|template|chain)\s+(?:engineering|optimization)/gi, risk: 'medium' },
      { pattern: /\b(?:fine.tuned|custom.model|private.dataset)/gi, risk: 'high' }
    ];

    // Check for regulatory contexts
    const regulatoryContexts = [
      { pattern: /\b(?:GDPR|CCPA|HIPAA|SOX|FERPA)\s+(?:violation|compliance|audit)/gi, risk: 'critical' },
      { pattern: /\b(?:data.breach|security.incident|privacy.violation)/gi, risk: 'critical' }
    ];

    const allContexts = [...companyContexts, ...aiContexts, ...regulatoryContexts];
    
    for (const context of allContexts) {
      if (text.match(context.pattern)) {
        risks.push(`context_${context.pattern.source.substring(0, 20)}`);
        if (context.risk === 'critical' && level !== 'critical') {
          level = 'critical';
        } else if (context.risk === 'high' && level === 'low') {
          level = 'high';
        }
      }
    }

    return {
      hasRisk: risks.length > 0,
      risks,
      level
    };
  }

  // NEW: Server-side analysis for comprehensive checking
  async performServerAnalysis(promptText) {
    try {
      const currentModel = this.detectCurrentModel();
      const platform = this.getCurrentPlatform();
      
      const response = await new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            type: 'analyze_prompt_realtime',
            payload: { 
              prompt: promptText,
              model: currentModel,
              platform: platform,
              url: window.location.href,
              timestamp: new Date().toISOString()
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          reject(error);
        }
      });
      
      // ENHANCED: Auto-save high-risk prompts as flagged
      if (response && (response.risk_level === 'high' || response.risk_level === 'critical')) {
        console.log('Complyze: High-risk prompt detected, will be saved as flagged');
        // The background script will handle saving to database
        // We just need to ensure the prompt gets flagged properly
      }
      
      return response;
    } catch (error) {
      console.error('Complyze: Server analysis failed (context may be invalidated):', error.message);
      return null;
    }
  }

  // NEW: Show real-time warning overlay with side panel
  showRealTimeWarning(promptElement, analysis, forceBlocking = false) {
    // If we're currently showing an optimization progress bar, don't show a warning
    if (document.getElementById('complyze-ai-progress-bar')) {
      console.log('Complyze: AI optimization in progress, skipping warning display.');
      return;
    }

    this.clearRealTimeWarnings(promptElement);

    const warningId = 'complyze-real-time-warning';
    let warning = document.getElementById(warningId);

    if (!warning) {
        warning = document.createElement('div');
        warning.id = warningId;
        document.body.appendChild(warning);
    }
    
    const rect = promptElement.getBoundingClientRect();
     
    warning.style.cssText = `
        position: fixed;
        top: ${rect.top - 80}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        color: white;
        padding: 14px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
        z-index: 2147483647;
        animation: slideDown 0.3s ease-out;
        border: 2px solid rgba(255, 255, 255, 0.3);
        pointer-events: auto;
        min-height: 60px;
      `;
      
    const riskLevel = analysis.risk_level || 'high';
    const isHighRisk = forceBlocking || riskLevel === 'high' || riskLevel === 'critical';

    const detectedItems = (analysis.detectedPII || analysis.pii_detected || []).map(item =>
      item.split(':')[0].trim().replace(/ number$/i, '').replace(/ address$/i, '')
    );
    const uniqueItems = [...new Set(detectedItems)];

    let warningText;
    if (uniqueItems.length > 0) {
      const capitalizedItems = uniqueItems.map(item => item.charAt(0).toUpperCase() + item.slice(1));
      
      let itemsString;
      if (capitalizedItems.length > 2) {
        itemsString = `${capitalizedItems.slice(0, -1).join(', ')}, and ${capitalizedItems.slice(-1)}`;
      } else {
        itemsString = capitalizedItems.join(' and ');
      }
      warningText = `${itemsString} detected`;
    } else {
      warningText = 'Sensitive content detected';
    }

    warning.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
          <span style="font-size: 20px;">🛡️</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; margin-bottom: 2px;">Security Risk: ${warningText}</div>
            <div style="font-size: 12px; opacity: 0.95; line-height: 1.3;">
              Review your prompt or let Complyze create a safe version.
              ${analysis.error ? `<br><span style="opacity: 0.8;">${analysis.error}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; min-width: 140px;">
          <button id="complyze-fix" style="
            background: rgba(255,255,255,0.95); 
            border: none; 
            color: #dc2626; 
            padding: 8px 12px; 
            border-radius: 5px; 
            font-size: 13px; 
            cursor: pointer; 
            font-weight: 700;
            transition: all 0.2s;
            width: 100%;
          ">
            🔒 View Safe Version
          </button>
          <button id="complyze-ignore" style="
            background: rgba(255,255,255,0.15); 
            border: 1px solid rgba(255,255,255,0.3); 
            color: white; 
            padding: 6px 12px; 
            border-radius: 5px; 
            font-size: 12px; 
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
          ">
            Send Anyway
          </button>
        </div>
      </div>
    `;
    
    if (!document.querySelector('#complyze-realtime-styles')) {
        const style = document.createElement('style');
        style.id = 'complyze-realtime-styles';
        style.textContent = `
          @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          #complyze-fix:hover {
            background: white !important;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          #complyze-ignore:hover {
            background: rgba(255,255,255,0.25) !important;
            border-color: rgba(255,255,255,0.5);
          }
        `;
        document.head.appendChild(style);
      }
      
    const ignoreButton = warning.querySelector('#complyze-ignore');
    const fixButton = warning.querySelector('#complyze-fix');
    
    if (ignoreButton) {
      ignoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Complyze: User clicked "Send Anyway" button');
        
        // Clear the warning modal
        this.clearRealTimeWarnings(promptElement);
        
        // Unblock submission
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
        
        // Log the user override action
        const promptText = this.getPromptText(promptElement);
        if (promptText) {
          this.syncUserOverrideToSupabase(promptText, analysis, 'send_anyway');
        }
        
        console.log('Complyze: Warning dismissed, submission unblocked');
      });
    }
    
    if (fixButton) {
        fixButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Complyze: User clicked "View Safe Version" button');
            
            // Clear the warning modal first
            this.clearRealTimeWarnings(promptElement);
            
            const enhancedAnalysis = {
              ...analysis,
              original_prompt: this.getPromptText(promptElement)
            };
            
            // Create the safe prompt panel
            this.createSafePromptPanel(promptElement, enhancedAnalysis);
            
            // Log the user action
            this.syncUserOverrideToSupabase(enhancedAnalysis.original_prompt, analysis, 'view_safe_version');
          });
    }

    if (isHighRisk) {
      this.preventSubmission = true;
      this.blockSubmitButtons(true);
      console.log('Complyze: Blocking submission for ' + (forceBlocking ? 'force-blocked' : 'high-risk') + ' content');
    }

    let updateTimeout;
    const updatePosition = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        if (warning.parentNode) {
          const newRect = promptElement.getBoundingClientRect();
          warning.style.top = `${newRect.top - 80}px`;
          warning.style.left = `${newRect.left}px`;
          warning.style.width = `${newRect.width}px`;
        }
      }, 10);
    };
    
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    const originalRemove = warning.remove;
    warning.remove = function() {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(updateTimeout);
      originalRemove.call(this);
    };
  }

  // NEW: Show informational overlay for medium risk
  showRealTimeInfo(promptElement, analysis) {
    this.clearRealTimeWarnings(promptElement);
    
    const infoId = 'complyze-realtime-info';
    const info = document.createElement('div');
    info.id = infoId;
    info.style.cssText = `
      position: absolute;
      top: -50px;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      z-index: 999999;
      animation: slideDown 0.3s ease-out;
    `;
    
    info.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>💡</span>
          <span>Potential privacy concerns detected - review before sending</span>
        </div>
        <button id="complyze-dismiss" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; opacity: 0.8;">&times;</button>
      </div>
    `;
    
    const container = promptElement.closest('form, div') || promptElement.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(info);
      
      info.querySelector('#complyze-dismiss').addEventListener('click', () => {
        info.remove();
      });
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        if (info.parentNode) info.remove();
      }, 5000);
    }
  }

  // NEW: Clear all real-time warnings
  clearRealTimeWarnings(promptElement) {
    const existingWarning = document.querySelector('#complyze-realtime-warning');
    const existingInfo = document.querySelector('#complyze-realtime-info');
    const existingLoading = document.querySelector('#complyze-loading-indicator');
    
    if (existingWarning) existingWarning.remove();
    if (existingInfo) existingInfo.remove();
    if (existingLoading) existingLoading.remove();
    
    this.preventSubmission = false;
    this.blockSubmitButtons(false);
  }

  // NEW: Block/unblock submit buttons
  blockSubmitButtons(block) {
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    const submitButtons = document.querySelectorAll(selectors.submitButton);
    
    submitButtons.forEach(button => {
      if (block) {
        button.style.opacity = '0.5';
        button.style.pointerEvents = 'none';
        button.setAttribute('data-complyze-blocked', 'true');
      } else {
        button.style.opacity = '';
        button.style.pointerEvents = '';
        button.removeAttribute('data-complyze-blocked');
      }
    });
  }

  // NEW: Show fix suggestions with side panel
  // REMOVED: This was causing duplicate panels - the Fix button calls createSafePromptPanel directly
  // showFixSuggestions(promptElement, analysis) {
  //   // Create side panel with safe prompt version
  //   this.createSafePromptPanel(promptElement, analysis);
  // }

  // NEW: Create modal popup with safe prompt
  createSafePromptPanel(promptElement, analysis) {
    console.log('Complyze: Creating safe prompt modal...', { promptElement, analysis });
    
    try {
      // Remove existing modal if any
      const existingModal = document.querySelector('#complyze-safe-prompt-modal');
      if (existingModal) {
        console.log('Complyze: Removing existing modal');
        existingModal.remove();
      }

      const modal = document.createElement('div');
      modal.id = 'complyze-safe-prompt-modal';
      
      // Full-screen modal overlay styling
      modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.8) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        animation: fadeIn 0.3s ease-out !important;
      `;

      const panel = document.createElement('div');
      panel.style.cssText = `
        background: white !important;
        border-radius: 12px !important;
        padding: 24px !important;
        max-width: 600px !important;
        width: 90% !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
        color: #1f2937 !important;
        animation: slideIn 0.3s ease-out !important;
      `;

      const originalPrompt = this.getPromptText(promptElement);
      // FIX: Use optimized_prompt instead of redacted_prompt to avoid [REDACTED] placeholders
      const safePrompt = analysis.optimized_prompt || analysis.redacted_prompt || this.generateSafePrompt(originalPrompt, analysis);
      
      console.log('Complyze: Original prompt:', originalPrompt.substring(0, 100));
      console.log('Complyze: Safe prompt (optimized):', safePrompt.substring(0, 100));

    panel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div style="width: 40px; height: 40px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">⚠️</div>
        <div>
          <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">Security Risk Detected</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Sensitive information found in your prompt</p>
        </div>
        <button id="complyze-close-panel" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 4px; margin-left: auto;">×</button>
      </div>
      
      ${analysis.detectedPII && analysis.detectedPII.length > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 16px;">Detected Issues:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
          ${analysis.detectedPII.map(type => `<li>${type.toUpperCase().replace('_', ' ')}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #16a34a; font-size: 16px;">✅ Optimized Prompt:</h3>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; font-family: monospace; font-size: 14px; line-height: 1.5; color: #374151; max-height: 200px; overflow-y: auto;">
          ${safePrompt || 'Processing...'}
        </div>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="complyze-cancel" style="padding: 10px 20px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Cancel
        </button>
        <button id="complyze-copy-safe" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          📋 Copy Optimized
        </button>
        <button id="complyze-use-safe" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          ✅ Use Optimized Version
        </button>
      </div>
    `;

    // Add animation styles
    if (!document.querySelector('#complyze-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'complyze-modal-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        #complyze-copy-safe:hover {
          background: #2563eb !important;
          transform: translateY(-1px);
        }
        #complyze-use-safe:hover {
          background: #059669 !important;
          transform: translateY(-1px);
        }
        #complyze-cancel:hover {
          background: #e5e7eb !important;
        }
      `;
      document.head.appendChild(style);
    }

      modal.appendChild(panel);
      document.body.appendChild(modal);
      console.log('Complyze: Modal added to DOM');

      // Add event listeners
      const closeButton = panel.querySelector('#complyze-close-panel');
      const cancelButton = panel.querySelector('#complyze-cancel');
      const copyButton = panel.querySelector('#complyze-copy-safe');
      const useButton = panel.querySelector('#complyze-use-safe');

      // Close modal handlers
      const closeModal = () => {
        console.log('Complyze: Modal closed');
        modal.remove();
      };

      closeButton.addEventListener('click', closeModal);
      cancelButton.addEventListener('click', closeModal);

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Close on ESC key
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(safePrompt);
          const originalText = copyButton.textContent;
          copyButton.textContent = '✅ Copied!';
          copyButton.style.background = '#10b981';
          setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.style.background = '#3b82f6';
          }, 2000);
          console.log('Complyze: Text copied to clipboard');
        } catch (err) {
          console.error('Complyze: Failed to copy text:', err);
        }
      });

      useButton.addEventListener('click', () => {
        console.log('Complyze: Use safe version clicked');
        const safeText = safePrompt;
        
        // ENHANCED: Mark this safe prompt to avoid re-analysis
        const safeHash = this.createSafeHash(safeText);
        this.safePrompts.add(safeHash);
        console.log('Complyze: Marked safe prompt hash:', safeHash);
        
        // Replace the text in the prompt element
        if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
          promptElement.value = safeText;
          promptElement.dispatchEvent(new Event('input', { bubbles: true }));
          promptElement.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (promptElement.contentEditable === 'true') {
          promptElement.textContent = safeText;
          promptElement.dispatchEvent(new Event('input', { bubbles: true }));
          promptElement.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // ENHANCED: Clear warnings and re-enable submission immediately
        this.clearRealTimeWarnings(promptElement);
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
        
        // ENHANCED: Force clear any existing warnings and show success indicator
        this.showSafePromptConfirmation(promptElement);

        // Close modal
        closeModal();

        // Focus back on the prompt element
        promptElement.focus();
        
        // Move cursor to end
        if (promptElement.setSelectionRange) {
          promptElement.setSelectionRange(safeText.length, safeText.length);
        } else if (promptElement.contentEditable === 'true') {
          // For contenteditable elements, set cursor to end
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(promptElement);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        console.log('Complyze: Safe text applied, warnings cleared, and modal closed');
      });
      
      console.log('Complyze: Modal created successfully!');
      
    } catch (error) {
      console.error('Complyze: Error creating modal:', error);
      // Fallback: show alert with safe prompt
      const originalPrompt = this.getPromptText(promptElement);
      const safePrompt = this.generateSafePrompt(originalPrompt, analysis);
      alert(`Safe Prompt:\n\n${safePrompt}\n\nCopy this text and paste it into the input field.`);
    }
  }

  // NEW: Generate safe prompt by removing PII
  generateSafePrompt(originalPrompt, analysis) {
    let safePrompt = originalPrompt;

    // Map redaction keys to settings keys
    const patternToSettingsKey = {
      email: 'PII.Email',
      phone: 'PII.Phone Number',
      fullName: 'PII.Name',
      ssn: 'PII.SSN',
      passport: 'PII.Passport Number',
      ipAddress: 'PII.IP Address',
      apiKey: 'Credentials & Secrets.API Keys',
      oauthSecret: 'Credentials & Secrets.OAuth Tokens',
      sshKey: 'Credentials & Secrets.SSH Keys',
      internalUrl: 'Company Internal.Internal URLs',
      projectName: 'Company Internal.Project Codenames',
      codeNames: 'Company Internal.Internal Tools',
      cidrRange: 'Company Internal.System IP Ranges',
      // Add more mappings as needed
    };

    // Core PII/PHI/PCI Optimization Patterns (rephrase instead of redact)
    const coreReplacements = {
      email: { 
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
        replacement: (match) => {
          // Extract domain for context if it's a common service
          const domain = match.split('@')[1];
          if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('outlook')) {
            return 'a personal email address';
          } else if (domain.includes('company') || domain.includes('corp') || domain.includes('enterprise')) {
            return 'a corporate email address';
          }
          return 'an email address';
        }
      },
      phone: { 
        pattern: /\b(?:phone|tel|telephone|call|contact|mobile|cell)[\s:]*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/gi, 
        replacement: 'a phone number'
      },
      fullName: { 
        pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g, 
        replacement: (match) => {
          // Try to preserve context
          const words = match.split(' ');
          if (words.length === 2) {
            return 'a person\'s name';
          } else {
            return 'someone\'s full name';
          }
        }
      },
      ssn: { 
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, 
        replacement: 'a social security number'
      },
      passport: { 
        pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, 
        replacement: 'a passport number'
      },
      ipAddress: { 
        pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, 
        replacement: (match) => {
          // Preserve context for internal vs external IPs
          if (match.startsWith('192.168.') || match.startsWith('10.') || match.startsWith('172.')) {
            return 'an internal IP address';
          }
          return 'an IP address';
        }
      }
    };

    // Enterprise-Specific Company Data (rephrase instead of redact)
    const enterprisePatterns = {
      apiKey: { 
        pattern: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g, 
        replacement: 'an API key'
      },
      oauthSecret: { 
        pattern: /\b(?:client_secret|oauth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_-]+/gi, 
        replacement: 'authentication credentials'
      },
      sshKey: { 
        pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, 
        replacement: 'SSH private key credentials'
      },
      internalUrl: { 
        pattern: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g, 
        replacement: (match) => {
          if (match.includes('dev-')) return 'a development environment URL';
          if (match.includes('staging-')) return 'a staging environment URL';
          if (match.includes('internal-')) return 'an internal system URL';
          if (match.includes('admin-')) return 'an admin panel URL';
          return 'an internal URL';
        }
      },
      projectName: { 
        pattern: /\b(?:Project|Operation|Initiative)\s+[A-Z][a-zA-Z]+\b/g, 
        replacement: 'a project codename'
      },
      codeNames: { 
        pattern: /\b[A-Z][a-zA-Z]+(?:DB|API|Service|Platform)\b/g, 
        replacement: (match) => {
          if (match.includes('DB')) return 'a database system';
          if (match.includes('API')) return 'an API service';
          if (match.includes('Service')) return 'a service component';
          if (match.includes('Platform')) return 'a platform system';
          return 'an internal system';
        }
      },
      cidrRange: { 
        pattern: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g, 
        replacement: 'a private network range'
      }
    };

    // Merge all patterns
    const allPatterns = { ...coreReplacements, ...enterprisePatterns };

    for (const [type, config] of Object.entries(allPatterns)) {
      const settingsKey = patternToSettingsKey[type];
      // Default to enabled if not specified
      const enabled = this.redactionSettings && settingsKey ? this.redactionSettings[settingsKey] !== false : true;
      if (enabled) {
        // Use optimized replacement (rephrase instead of redact)
        if (typeof config.replacement === 'function') {
          safePrompt = safePrompt.replace(config.pattern, config.replacement);
        } else {
          safePrompt = safePrompt.replace(config.pattern, config.replacement);
        }
      } else {
        // If disabled, wrap in asterisks for visibility
        safePrompt = safePrompt.replace(config.pattern, (match) => `*${match}*`);
      }
    }

    // Additional optimization: improve prompt structure and clarity
    safePrompt = this.optimizePromptStructure(safePrompt);

    return safePrompt;
  }

  // Helper function to optimize prompt structure
  optimizePromptStructure(prompt) {
    let optimized = prompt;
    
    // Remove redundant phrases
    const redundantPhrases = [
      /\b(?:please|kindly|if you could|would you mind)\b/gi,
      /\b(?:as an AI|as a language model|I understand that you are)\b/gi
    ];
    
    redundantPhrases.forEach(pattern => {
      optimized = optimized.replace(pattern, '');
    });

    // Improve clarity and specificity
    optimized = optimized
      .replace(/\bthing\b/gi, 'item')
      .replace(/\bstuff\b/gi, 'content')
      .replace(/\bdo this\b/gi, 'complete this task');

    // Clean up extra whitespace
    optimized = optimized
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    return optimized;
  }

  // NEW: Show loading indicator
  showLoadingIndicator(promptElement) {
    // Remove any existing loading indicator
    this.hideLoadingIndicator(promptElement);
    
    const loadingId = 'complyze-loading-indicator';
    const loading = document.createElement('div');
    loading.id = loadingId;
    
    // Get the position of the prompt element
    const rect = promptElement.getBoundingClientRect();
    
    loading.style.cssText = `
      position: fixed;
      top: ${rect.top - 50}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      z-index: 999998;
      animation: slideDown 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: none;
    `;
    
    loading.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div class="complyze-spinner" style="
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span>🛡️ Complyze analyzing...</span>
      </div>
    `;
    
    // Add spinner animation styles if not already present
    if (!document.querySelector('#complyze-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'complyze-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Append to body instead of container to avoid text interference
    document.body.appendChild(loading);
    
    // Update position on scroll/resize
    const updatePosition = () => {
      const newRect = promptElement.getBoundingClientRect();
      loading.style.top = `${newRect.top - 50}px`;
      loading.style.left = `${newRect.left}px`;
      loading.style.width = `${newRect.width}px`;
    };
    
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Clean up listeners when loading is removed
    const originalRemove = loading.remove;
    loading.remove = function() {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      originalRemove.call(this);
    };
  }

  // NEW: Hide loading indicator
  hideLoadingIndicator(promptElement) {
    const existingLoading = document.querySelector('#complyze-loading-indicator');
    if (existingLoading) {
      existingLoading.remove();
    }
  }

  // NEW: Show AI optimization progress indicator
  showAIOptimizationProgress(promptElement) {
    const progressId = 'complyze-ai-progress';
    
    // Remove any existing progress indicator
    const existing = document.getElementById(progressId);
    if (existing) existing.remove();
    
    const progress = document.createElement('div');
    progress.id = progressId;
    
    const rect = promptElement.getBoundingClientRect();
    
    progress.style.cssText = `
      position: fixed;
      top: ${rect.top - 80}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      z-index: 999999;
      animation: slideDown 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    progress.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div>
          <div style="font-weight: 600; margin-bottom: 2px;">🤖 AI Optimization in Progress</div>
          <div style="font-size: 12px; opacity: 0.9;" id="progress-status">Analyzing sensitive data patterns...</div>
        </div>
      </div>
    `;
    
    // Add CSS animation for spinner
    if (!document.getElementById('complyze-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'complyze-spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(progress);
    
    // Position update function
    const updatePosition = () => {
      const newRect = promptElement.getBoundingClientRect();
      progress.style.top = `${newRect.top - 80}px`;
      progress.style.left = `${newRect.left}px`;
      progress.style.width = `${newRect.width}px`;
    };
    
    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Update progress status messages
    const statusElement = progress.querySelector('#progress-status');
    const statusMessages = [
      'Analyzing sensitive data patterns...',
      'Detecting compliance requirements...',
      'Fetching optimization insights...',
      'Generating secure alternatives...',
      'Applying AI-powered optimization...',
      'Finalizing secure prompt...'
    ];
    
    let messageIndex = 0;
    const statusInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % statusMessages.length;
      if (statusElement) {
        statusElement.textContent = statusMessages[messageIndex];
      }
    }, 2500);
    
    // Store interval reference for proper cleanup
    progress._statusInterval = statusInterval;
    
    // Store cleanup function
    progress._cleanup = () => {
      if (progress._statusInterval) {
        clearInterval(progress._statusInterval);
        progress._statusInterval = null;
      }
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (progress.parentNode) {
        progress.remove();
      }
    };
    
    // Reduced auto-cleanup timeout to prevent infinite loops (20 seconds instead of 30)
    const autoCleanupTimeout = setTimeout(() => {
      console.log('Complyze: ⚠️ Auto-cleanup triggered for AI optimization progress after 20 seconds');
      if (progress._cleanup) progress._cleanup();
    }, 20000);
  }

  // NEW: Hide AI optimization progress indicator
  hideAIOptimizationProgress() {
    const progress = document.getElementById('complyze-ai-progress');
    if (progress) {
      // Clear any cleanup timeouts or intervals associated with this progress indicator
      if (progress._cleanup) {
        console.log('Complyze: Calling cleanup for AI optimization progress');
        progress._cleanup();
      }
      
      // Additional safety: Clear any intervals that might be running
      if (progress._statusInterval) {
        clearInterval(progress._statusInterval);
        progress._statusInterval = null;
      }
      
      // Remove from DOM if still present
      if (progress.parentNode) {
        progress.remove();
      }
      
      console.log('Complyze: ✅ AI optimization progress indicator removed');
    } else {
      console.log('Complyze: No AI optimization progress indicator found to remove');
    }
    
    // Extra safety: Remove any orphaned progress indicators
    const orphanedProgress = document.querySelectorAll('[id*="complyze-ai-progress"], [id*="complyze-progress"]');
    orphanedProgress.forEach(element => {
      console.log('Complyze: Removing orphaned progress indicator:', element.id);
      element.remove();
    });
  }

  // NEW: Show confirmation that safe prompt was applied
  showSafePromptConfirmation(promptElement) {
    // Remove any existing confirmations
    const existingConfirmation = document.querySelector('#complyze-safe-confirmation');
    if (existingConfirmation) existingConfirmation.remove();
    
    const confirmationId = 'complyze-safe-confirmation';
    const confirmation = document.createElement('div');
    confirmation.id = confirmationId;
    
    // Get the position of the prompt element
    const rect = promptElement.getBoundingClientRect();
    
    confirmation.style.cssText = `
      position: fixed;
      top: ${rect.top - 60}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      z-index: 999999;
      animation: slideDown 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
      pointer-events: none;
    `;
    
    confirmation.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">✅</span>
        <span>Optimized prompt applied - ready to send!</span>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(confirmation);
    
    // Update position on scroll/resize
    const updatePosition = () => {
      const newRect = promptElement.getBoundingClientRect();
      confirmation.style.top = `${newRect.top - 60}px`;
      confirmation.style.left = `${newRect.left}px`;
      confirmation.style.width = `${newRect.width}px`;
    };
    
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (confirmation.parentNode) {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
        confirmation.remove();
      }
    }, 3000);
  }

  // NEW: Listen for settings updates from the website
  listenForSettingsUpdates() {
    window.addEventListener('message', async (event) => {
      // Only accept messages from the same origin
      if (event.origin !== window.location.origin) return;
      
      // Check if it's a Complyze settings update message
      if (event.data && event.data.type === 'COMPLYZE_UPDATE_REDACTION_SETTINGS' && 
          event.data.source === 'complyze-website') {
        console.log('Complyze: Received redaction settings update from website');
        
        try {
          // Store the settings in Chrome storage
          await chrome.storage.local.set({
            redactionSettings: event.data.payload.settings,
            customRedactionTerms: event.data.payload.customTerms,
            redactionUserId: event.data.payload.user_id
          });
          
          console.log('Complyze: Redaction settings saved to extension storage');
          
          // Send to background script for server-side storage if needed
          chrome.runtime.sendMessage({
            type: 'update_redaction_settings',
            payload: event.data.payload
          });
        } catch (error) {
          console.error('Complyze: Failed to save redaction settings:', error);
        }
      }
    });
  }

  // NEW: Watch for new input elements that appear after page load (for follow-up messages)
  watchForNewInputElements() {
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    console.log('Complyze: Setting up MutationObserver to watch for new inputs');
    
    // Create a mutation observer to watch for new input elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node is an input element or contains one
              const inputs = node.matches ? 
                (node.matches(selectors.promptInput) ? [node] : node.querySelectorAll(selectors.promptInput)) :
                [];
              
              if (inputs.length > 0) {
                console.log('Complyze: New input element detected, reattaching listeners');
                // Reattach real-time analysis to new inputs
                this.attachRealTimeAnalysisToElements(inputs);
              }
            }
          });
        }
      });
    });
    
    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('Complyze: MutationObserver started');
  }

  // NEW: Attach real-time analysis to specific elements
  attachRealTimeAnalysisToElements(elements) {
    const platform = this.getCurrentPlatform();
    if (!platform) return;
    
    const selectors = this.platformSelectors[platform];
    let analysisTimeout;
    
    elements.forEach(element => {
      // Check if we've already attached listeners to this element
      if (element.dataset.complyzeAttached) return;
      
      // Mark element as having listeners attached
      element.dataset.complyzeAttached = 'true';
      
      console.log('Complyze: Attaching real-time analysis to element:', element);
      
      // Add input event listener
      element.addEventListener('input', async (e) => {
        const promptText = this.getPromptText(element).trim();
        if (!promptText || promptText.length < 10) {
          this.clearRealTimeWarnings(element);
          this.preventSubmission = false;
          this.blockSubmitButtons(false);
          return;
        }
        
        // Check if this is a known safe prompt
        const promptHash = this.createSafeHash(promptText);
        if (this.safePrompts.has(promptHash)) {
          this.clearRealTimeWarnings(element);
          this.preventSubmission = false;
          this.blockSubmitButtons(false);
          return;
        }
        
        // Clear previous analysis state for fresh start
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
        
        // Debounce analysis
        clearTimeout(analysisTimeout);
        analysisTimeout = setTimeout(async () => {
          await this.performRealTimeAnalysis(promptText, element);
        }, 1000);
      });
      
      // Add paste event listener
      element.addEventListener('paste', async (e) => {
        setTimeout(async () => {
          const promptText = this.getPromptText(element).trim();
          if (promptText && promptText.length > 10) {
            const promptHash = this.createSafeHash(promptText);
            if (!this.safePrompts.has(promptHash)) {
              await this.performRealTimeAnalysis(promptText, element);
            }
          }
        }, 100);
      });
    });
  }

  // NEW: Detect current model being used on the platform
  detectCurrentModel() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      if (pathname.includes('gpt-4')) return 'GPT-4';
      if (pathname.includes('gpt-3.5')) return 'GPT-3.5';
      return 'ChatGPT';
    } else if (hostname.includes('claude.ai')) {
      return 'Claude';
    } else if (hostname.includes('gemini.google.com')) {
      return 'Gemini';
    } else if (hostname.includes('complyze.co')) {
      return 'Complyze';
    }
    
    return 'Unknown';
  }

  // NEW: Sync user override actions to Supabase for analytics
  async syncUserOverrideToSupabase(promptText, analysis, action) {
    try {
      console.log(`Complyze: Syncing user override action: ${action}`);
      
      const response = await chrome.runtime.sendMessage({
        type: 'sync_prompt_immediate',
        payload: {
          prompt: promptText,
          platform: this.getCurrentPlatform() || 'unknown',
          url: window.location.href,
          timestamp: new Date().toISOString(),
          risk_level: analysis.risk_level || 'high',
          detected_pii: analysis.detectedPII || analysis.pii_detected || [],
          blocked: false, // User chose to override
          user_action: action,
          model: this.detectCurrentModel()
        }
      });
      
      if (response && response.success) {
        console.log('Complyze: User override action synced successfully');
      }
    } catch (error) {
      console.log('Complyze: Failed to sync user override action:', error);
    }
  }
}

// Initialize the prompt watcher
const promptWatcher = new PromptWatcher();

// Expose for debugging
window.complyzeTest = () => {
  console.log('Complyze: Running manual test...');
  promptWatcher.testPromptCapture();
};

window.complyzeDebug = () => {
  console.log('Complyze: Debug info:');
  console.log('- Current platform:', promptWatcher.getCurrentPlatform());
  console.log('- Login status:', promptWatcher.isLoggedIn);
  console.log('- Last prompt:', promptWatcher.lastPrompt);
  promptWatcher.debugElements();
};

console.log('Complyze: Content script loaded. Use complyzeTest() or complyzeDebug() in console for manual testing.');

// Handle dynamic content loading (SPAs)
const observer = new MutationObserver((mutations) => {
  promptWatcher.checkLoginStatus();
  
  // Check for new messages being added (indicating a prompt was sent)
  mutations.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Look for message containers that might indicate a new message
          const isMessage = node.querySelector && (
            node.querySelector('[data-message-author-role]') ||
            node.querySelector('.message') ||
            node.matches('[data-message-author-role]') ||
            node.matches('.message')
          );
          
          if (isMessage && promptWatcher.lastPrompt) {
            console.log('Complyze: New message detected, processing last captured prompt');
            const platform = promptWatcher.getCurrentPlatform();
            if (platform) {
              const selectors = promptWatcher.platformSelectors[platform];
              promptWatcher.handlePromptSubmission(selectors);
            }
          }
        }
      });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Global test functions for debugging
window.complyzeTest = function(testPrompt = "Hello, my name is John Doe and my email is john@example.com") {
  console.log('Complyze: Manual test triggered with prompt:', testPrompt);
  
  const promptData = {
    prompt: testPrompt,
    platform: window.location.hostname,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  console.log('Complyze: Sending test prompt to background script:', promptData);
  
  chrome.runtime.sendMessage({
    type: 'analyze_prompt',
    payload: promptData
  }, (response) => {
    console.log('Complyze: Test response from background:', response);
  });
};

window.complyzeDebug = function() {
  console.log('Complyze: Debug info:');
  console.log('- Current URL:', window.location.href);
  console.log('- Platform detected:', promptWatcher.getCurrentPlatform());
  console.log('- Login status:', promptWatcher.isLoggedIn);
  console.log('- Available prompt inputs:', document.querySelectorAll('textarea, div[contenteditable="true"]').length);
  console.log('- Available buttons:', document.querySelectorAll('button').length);
  
  // Test storage access
  chrome.storage.local.get(['analysisResult', 'authRequired', 'error', 'accessToken', 'user'], (data) => {
    console.log('Complyze: Current storage data:', data);
  });

  // Test auth status
  chrome.runtime.sendMessage({ type: 'get_auth_status' }, (response) => {
    console.log('Complyze: Auth status from background:', response);
  });
};

window.complyzeForcePrompt = function() {
  console.log('Complyze: Force prompt capture triggered');
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (promptElement) {
    const text = promptWatcher.getPromptText(promptElement);
    console.log('Complyze: Found input element:', promptElement);
    console.log('Complyze: Current text:', text);
    
    if (text.trim()) {
      promptWatcher.lastPrompt = text.trim();
      promptWatcher.handlePromptSubmission(selectors);
    } else {
      console.log('Complyze: No text in input, using test prompt');
      window.complyzeTest();
    }
  } else {
    console.log('Complyze: No input element found, using test prompt');
    window.complyzeTest();
  }
};