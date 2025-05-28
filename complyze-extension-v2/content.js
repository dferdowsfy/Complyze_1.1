console.log("Complyze: Content script starting on", window.location.href);

// Enhanced prompt detection for multiple LLM platforms with REAL-TIME PREVENTION
class PromptWatcher {
  constructor() {
    this.isLoggedIn = false;
    this.lastPrompt = '';
    this.processedPrompts = new Set();
    this.safePrompts = new Set(); // Track safe prompts to avoid re-analysis
    this.lastClearTime = null;
    this.isAnalyzing = false;
    this.preventSubmission = false;
    this.realTimeAnalysisEnabled = true;
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
        submitButton: 'button[aria-label="Send Message"], button:has(svg[data-icon="send"]), button[data-testid="send-button"], button:has(svg), button[type="submit"], button[aria-label*="Send"], button:contains("Send")',
        loginCheck: '[data-testid="user-menu"], .user-avatar, button[aria-label*="User"], [data-testid="profile-button"], button[aria-label*="Account"], .avatar'
      },
      'gemini.google.com': {
        promptInput: 'rich-textarea div[contenteditable="true"], textarea[aria-label*="Enter a prompt"], div[contenteditable="true"], textarea[placeholder*="Enter a prompt"], div[role="textbox"]',
        submitButton: 'button[aria-label="Send message"], button[data-test-id="send-button"], button:has(svg), button[type="submit"], button[aria-label*="Send"]',
        loginCheck: '.gb_d, [data-ogsr-up], .gb_A, button[aria-label*="Google Account"]'
      },
      'complyze.co': {
        promptInput: 'textarea, input[type="text"], div[contenteditable="true"], [role="textbox"]',
        submitButton: 'button[type="submit"], button:contains("Send"), button:contains("Submit"), .submit-btn',
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
    
    // Special handling for localhost development
    if (hostname === 'localhost') {
      return 'complyze.co'; // Treat localhost as complyze.co for development
    }
    
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
    
    // For subsequent messages, be less strict about deduplication
    // Clear processed prompts if we have too many or if enough time has passed
    const now = Date.now();
    if (!this.lastClearTime) this.lastClearTime = now;
    
    if (this.processedPrompts.size > 10 || (now - this.lastClearTime) > 30000) { // Clear every 30 seconds
      console.log('Complyze: Clearing processed prompts cache');
      this.processedPrompts.clear();
      this.lastClearTime = now;
    }
    
    if (this.processedPrompts.has(promptHash)) {
      console.log('Complyze: Prompt already processed recently, skipping');
      return;
    }
    
    this.processedPrompts.add(promptHash);
    
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
    let analysisTimeout;
    
    // Monitor text input in real-time
    document.addEventListener('input', async (e) => {
      const promptElement = e.target.closest(selectors.promptInput);
      if (!promptElement) return;
      
      const promptText = this.getPromptText(promptElement).trim();
      if (!promptText || promptText.length < 10) {
        // ENHANCED: Clear warnings for short/empty text and mark as safe
        this.clearRealTimeWarnings(promptElement);
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
        return;
      }
      
      // ENHANCED: Quick check if this is already a known safe prompt
      const promptHash = this.createSafeHash(promptText);
      if (this.safePrompts.has(promptHash)) {
        console.log('Complyze: Input matches known safe prompt, clearing warnings');
        this.clearRealTimeWarnings(promptElement);
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
        return;
      }
      
      // Debounce analysis - wait for user to stop typing
      clearTimeout(analysisTimeout);
      analysisTimeout = setTimeout(async () => {
        await this.performRealTimeAnalysis(promptText, promptElement);
      }, 1000); // Analyze 1 second after user stops typing
    });
    
    // Monitor paste events for immediate analysis
    document.addEventListener('paste', async (e) => {
      const promptElement = e.target.closest(selectors.promptInput);
      if (!promptElement) return;
      
      // Wait a bit for paste to complete
      setTimeout(async () => {
        const promptText = this.getPromptText(promptElement).trim();
        if (promptText && promptText.length > 10) {
          // ENHANCED: Quick check if this is already a known safe prompt
          const promptHash = this.createSafeHash(promptText);
          if (this.safePrompts.has(promptHash)) {
            console.log('Complyze: Pasted text matches known safe prompt, clearing warnings');
            this.clearRealTimeWarnings(promptElement);
            this.preventSubmission = false;
            this.blockSubmitButtons(false);
            return;
          }
          
          await this.performRealTimeAnalysis(promptText, promptElement);
        }
      }, 100);
    });
  }

  // NEW: Perform real-time analysis without sending the prompt
  async performRealTimeAnalysis(promptText, promptElement) {
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
      console.log('Complyze: Local analysis result:', localAnalysis);
      
      // If local analysis finds issues, show warning immediately
      if (localAnalysis.risk_level === 'high' || localAnalysis.risk_level === 'critical') {
        this.hideLoadingIndicator(promptElement);
        this.showRealTimeWarning(promptElement, localAnalysis, false);
        
        // Still try server analysis in background for better results
        this.performServerAnalysisBackground(promptText, promptElement, localAnalysis);
        return;
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
        
        // If server fails but local found medium risk, show info
        if (localAnalysis.risk_level === 'medium') {
          this.showRealTimeInfo(promptElement, localAnalysis);
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
  }

  // NEW: Background server analysis for better UX
  async performServerAnalysisBackground(promptText, promptElement, fallbackAnalysis) {
    try {
      const serverAnalysis = await this.performServerAnalysis(promptText);
      
      // If server analysis provides better results, update the warning
      if (serverAnalysis && serverAnalysis.detectedPII && serverAnalysis.detectedPII.length > fallbackAnalysis.detectedPII.length) {
        console.log('Complyze: Server analysis found more issues, updating warning');
        
        // Remove old warning and show updated one
        const existingWarning = document.querySelector('#complyze-realtime-warning');
        if (existingWarning) {
          existingWarning.remove();
          this.showRealTimeWarning(promptElement, serverAnalysis, true);
        }
      }
    } catch (error) {
      console.log('Complyze: Background server analysis failed, keeping local results');
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

    // ✅ Core PII/PHI/PCI (Standard Compliance)
    const corePatterns = {
      // Personal Identifiers
      email: { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, risk: 'medium' },
      phone: { pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, risk: 'medium' },
      fullName: { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g, risk: 'low' },
      
      // Financial Data
      ssn: { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, risk: 'critical' },
      creditCard: { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, risk: 'critical' },
      bankAccount: { pattern: /\b\d{8,17}\b/g, risk: 'high' },
      routingNumber: { pattern: /\b[0-9]{9}\b/g, risk: 'high' },
      
      // Government IDs
      driverLicense: { pattern: /\b[A-Z]{1,2}\d{6,8}\b/g, risk: 'high' },
      passport: { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, risk: 'high' },
      
      // Health Information
      healthInfo: { pattern: /\b(?:diagnosis|treatment|prescription|medical|health|patient|doctor|hospital|clinic)\b/gi, risk: 'high' },
      insurancePolicy: { pattern: /\b[A-Z]{2,4}\d{6,12}\b/g, risk: 'medium' },
      
      // Network/Device
      ipAddress: { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, risk: 'medium' },
      macAddress: { pattern: /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g, risk: 'medium' }
    };

    // 🏢 Enterprise-Specific Company Data
    const enterprisePatterns = {
      // Technical Assets
      apiKey: { pattern: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g, risk: 'critical' },
      jwtToken: { pattern: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, risk: 'critical' },
      oauthSecret: { pattern: /\b(?:client_secret|oauth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_-]+/gi, risk: 'critical' },
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

    // Check all patterns
    const allPatterns = { ...corePatterns, ...enterprisePatterns, ...sensitiveKeywords };
    
    for (const [type, config] of Object.entries(allPatterns)) {
      const matches = text.match(config.pattern);
      if (matches) {
        detectedPII.push(type);
        
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
      const response = await new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            type: 'analyze_prompt_realtime',
            payload: { prompt: promptText }
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
  showRealTimeWarning(promptElement, analysis, isServerAnalysis = false) {
    // Clear existing warnings but keep loading indicator briefly
    const existingWarning = document.querySelector('#complyze-realtime-warning');
    const existingInfo = document.querySelector('#complyze-realtime-info');
    if (existingWarning) existingWarning.remove();
    if (existingInfo) existingInfo.remove();
    
    const warningId = 'complyze-realtime-warning';
    const warning = document.createElement('div');
    warning.id = warningId;
    
    // Get the position of the prompt element
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
    const detectedPII = analysis.detectedPII || [];
    
    warning.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
          <span style="font-size: 20px;">🛡️</span>
          <div style="flex: 1;">
            <div style="font-weight: 700; margin-bottom: 2px;">Security Risk Detected</div>
            <div style="font-size: 12px; opacity: 0.95; line-height: 1.3;">
              ${detectedPII.length > 0 ? `PII found: ${detectedPII.join(', ')}` : 'Sensitive content detected'}
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
    
    // Add animation styles
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
    
    // Append to body for maximum visibility
    document.body.appendChild(warning);
    console.log('Complyze: Warning displayed, adding event listeners...');
    
    // Add event listeners with better error handling
    const ignoreButton = warning.querySelector('#complyze-ignore');
    const fixButton = warning.querySelector('#complyze-fix');
    
    if (ignoreButton) {
      ignoreButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Complyze: Ignore button clicked');
        this.clearRealTimeWarnings(promptElement);
        this.preventSubmission = false;
        this.blockSubmitButtons(false);
      });
    }
    
    if (fixButton) {
      fixButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Complyze: Fix button clicked, creating safe prompt panel...');
        
        // Ensure we have the analysis data needed for the panel
        const enhancedAnalysis = {
          ...analysis,
          detectedPII: detectedPII,
          risk_level: riskLevel,
          original_prompt: this.getPromptText(promptElement)
        };
        
        this.createSafePromptPanel(promptElement, enhancedAnalysis);
      });
    }
    
    // Set prevention flag for high-risk content
    if (riskLevel === 'high' || riskLevel === 'critical') {
      this.preventSubmission = true;
      this.blockSubmitButtons(true);
      console.log('Complyze: Blocking submission for high-risk content');
    }
    
    // Update position on scroll/resize with better performance
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
    
    // Clean up listeners when warning is removed
    const originalRemove = warning.remove;
    warning.remove = function() {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(updateTimeout);
      originalRemove.call(this);
    };
    
    console.log('Complyze: Warning created successfully with enhanced functionality');
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

  // NEW: Create side panel with safe prompt
  createSafePromptPanel(promptElement, analysis) {
    console.log('Complyze: Creating safe prompt panel...', { promptElement, analysis });
    
    try {
      // Remove existing panel if any
      const existingPanel = document.querySelector('#complyze-safe-prompt-panel');
      if (existingPanel) {
        console.log('Complyze: Removing existing panel');
        existingPanel.remove();
      }

      const panel = document.createElement('div');
      panel.id = 'complyze-safe-prompt-panel';
      
      // Enhanced styling with better visibility and positioning
      panel.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        width: 450px !important;
        max-height: 85vh !important;
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
        border: 2px solid #3b82f6 !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        color: white !important;
        animation: slideInRight 0.3s ease-out !important;
        overflow: hidden !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;

      const originalPrompt = this.getPromptText(promptElement);
      const safePrompt = analysis.redacted_prompt || this.generateSafePrompt(originalPrompt, analysis);
      
      console.log('Complyze: Original prompt:', originalPrompt.substring(0, 100));
      console.log('Complyze: Safe prompt:', safePrompt.substring(0, 100));

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid rgba(59, 130, 246, 0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #3b82f6;">
            🛡️ Security Analysis Results
          </h3>
          <button id="complyze-close-panel" style="background: none; border: none; color: #9ca3af; font-size: 20px; cursor: pointer; padding: 4px;">
            ×
          </button>
        </div>
        <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.4;">
          We've created a safer version of your prompt by removing sensitive information.
        </p>
      </div>

      <div style="padding: 20px; max-height: 50vh; overflow-y: auto;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            Safe Prompt (Ready to Use)
          </label>
          <textarea id="complyze-safe-text" style="
            width: 100%;
            min-height: 120px;
            padding: 12px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            line-height: 1.5;
            resize: vertical;
            font-family: inherit;
          " readonly>${safePrompt}</textarea>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <button id="complyze-copy-safe" style="
            flex: 1;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            color: white;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">
            📋 Copy Safe Version
          </button>
          <button id="complyze-use-safe" style="
            flex: 1;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: none;
            color: white;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          ">
            ✅ Use This Version
          </button>
        </div>

        ${analysis.detectedPII && analysis.detectedPII.length > 0 ? `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 600; color: #ef4444; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            Removed Sensitive Data
          </div>
          <div style="font-size: 13px; color: #fca5a5;">
            ${analysis.detectedPII.map(pii => `• ${pii.replace('_', ' ')}`).join('<br>')}
          </div>
        </div>
        ` : ''}

        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px;">
          <div style="font-size: 12px; font-weight: 600; color: #3b82f6; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            💡 How to Use
          </div>
          <div style="font-size: 13px; color: #93c5fd; line-height: 1.4;">
            1. Click "Use This Version" to replace your current prompt<br>
            2. Or copy the safe version and paste it manually<br>
            3. The submit button will be re-enabled automatically
          </div>
        </div>
      </div>
    `;

    // Add animation styles
    if (!document.querySelector('#complyze-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'complyze-panel-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        #complyze-copy-safe:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        #complyze-use-safe:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
      `;
      document.head.appendChild(style);
    }

      document.body.appendChild(panel);
      console.log('Complyze: Panel added to DOM');

      // Add event listeners
      panel.querySelector('#complyze-close-panel').addEventListener('click', () => {
        console.log('Complyze: Close button clicked');
        panel.remove();
      });

      panel.querySelector('#complyze-copy-safe').addEventListener('click', async () => {
        const safeText = panel.querySelector('#complyze-safe-text').value;
        try {
          await navigator.clipboard.writeText(safeText);
          const button = panel.querySelector('#complyze-copy-safe');
          const originalText = button.textContent;
          button.textContent = '✅ Copied!';
          button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          }, 2000);
          console.log('Complyze: Text copied to clipboard');
        } catch (err) {
          console.error('Complyze: Failed to copy text:', err);
        }
      });

      panel.querySelector('#complyze-use-safe').addEventListener('click', () => {
        console.log('Complyze: Use safe version clicked');
        const safeText = panel.querySelector('#complyze-safe-text').value;
        
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

        // Close panel
        panel.remove();

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
        
        console.log('Complyze: Safe text applied, warnings cleared, and panel closed');
      });

      // Close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !e.target.closest('#complyze-realtime-warning')) {
          console.log('Complyze: Clicked outside panel, closing');
          panel.remove();
        }
      }, { once: true });
      
      console.log('Complyze: Side panel created successfully!');
      
    } catch (error) {
      console.error('Complyze: Error creating side panel:', error);
      // Fallback: show alert with safe prompt
      const originalPrompt = this.getPromptText(promptElement);
      const safePrompt = this.generateSafePrompt(originalPrompt, analysis);
      alert(`Safe Prompt:\n\n${safePrompt}\n\nCopy this text and paste it into the input field.`);
    }
  }

  // NEW: Generate safe prompt by removing PII
  generateSafePrompt(originalPrompt, analysis) {
    let safePrompt = originalPrompt;

    // ✅ Core PII/PHI/PCI Redaction Patterns
    const coreReplacements = {
      // Personal Identifiers
      email: { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
      phone: { pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, replacement: '[PHONE_REDACTED]' },
      fullName: { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g, replacement: '[NAME_REDACTED]' },
      
      // Financial Data
      ssn: { pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: '[SSN_REDACTED]' },
      creditCard: { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g, replacement: '[CREDIT_CARD_REDACTED]' },
      bankAccount: { pattern: /\b\d{8,17}\b/g, replacement: '[BANK_ACCOUNT_REDACTED]' },
      routingNumber: { pattern: /\b[0-9]{9}\b/g, replacement: '[ROUTING_NUMBER_REDACTED]' },
      
      // Government IDs
      driverLicense: { pattern: /\b[A-Z]{1,2}\d{6,8}\b/g, replacement: '[DRIVER_LICENSE_REDACTED]' },
      passport: { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, replacement: '[PASSPORT_REDACTED]' },
      
      // Health Information
      healthInfo: { pattern: /\b(?:diagnosis|treatment|prescription|medical|health|patient|doctor|hospital|clinic)\b/gi, replacement: '[HEALTH_INFO_REDACTED]' },
      insurancePolicy: { pattern: /\b[A-Z]{2,4}\d{6,12}\b/g, replacement: '[INSURANCE_POLICY_REDACTED]' },
      
      // Network/Device
      ipAddress: { pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, replacement: '[IP_ADDRESS_REDACTED]' },
      macAddress: { pattern: /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g, replacement: '[MAC_ADDRESS_REDACTED]' }
    };

    // 🏢 Enterprise-Specific Company Data
    const enterprisePatterns = {
      // Technical Assets
      apiKey: { pattern: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g, replacement: '[API_KEY_REDACTED]' },
      jwtToken: { pattern: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, replacement: '[JWT_TOKEN_REDACTED]' },
      oauthSecret: { pattern: /\b(?:client_secret|oauth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_-]+/gi, replacement: '[OAUTH_SECRET_REDACTED]' },
      sshKey: { pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, replacement: '[SSH_KEY_REDACTED]' },
      
      // Internal URLs and Services
      internalUrl: { pattern: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g, replacement: '[INTERNAL_URL_REDACTED]' },
      internalService: { pattern: /\b(?:ServiceNow|Snowflake|Redshift|Databricks|Splunk|Tableau)\s+(?:instance|database|server)/gi, replacement: '[INTERNAL_SERVICE_REDACTED]' },
      
      // Project and Code Names
      projectName: { pattern: /\b(?:Project|Operation|Initiative)\s+[A-Z][a-zA-Z]+\b/g, replacement: '[PROJECT_NAME_REDACTED]' },
      codeNames: { pattern: /\b[A-Z][a-zA-Z]+(?:DB|API|Service|Platform)\b/g, replacement: '[CODE_NAMES_REDACTED]' },
      
      // Financial and Strategic
      revenueData: { pattern: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion|M|B|revenue|profit|loss)/gi, replacement: '[REVENUE_DATA_REDACTED]' },
      financialProjections: { pattern: /\b(?:Q[1-4]|FY\d{2,4})\s+(?:revenue|earnings|profit|forecast)/gi, replacement: '[FINANCIAL_PROJECTIONS_REDACTED]' },
      
      // IP Ranges and Network
      cidrRange: { pattern: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g, replacement: '[CIDR_RANGE_REDACTED]' },
      
      // Regulatory and Compliance
      exportControl: { pattern: /\b(?:ITAR|EAR|export.controlled|dual.use)\b/gi, replacement: '[EXPORT_CONTROL_REDACTED]' },
      cui: { pattern: /\b(?:CUI|Controlled Unclassified Information)\b/gi, replacement: '[CUI_REDACTED]' },
      whistleblower: { pattern: /\b(?:whistleblower|insider.threat|investigation|compliance.violation)\b/gi, replacement: '[WHISTLEBLOWER_REDACTED]' }
    };

    // Sensitive Keywords (Context-Aware)
    const sensitiveKeywords = {
      credentials: { pattern: /\b(?:password|secret|token|key|credential|auth|login)\s*[:=]\s*\S+/gi, replacement: '[CREDENTIALS_REDACTED]' },
      confidential: { pattern: /\b(?:confidential|private|internal.only|restricted|classified)\b/gi, replacement: '[CONFIDENTIAL_REDACTED]' },
      security: { pattern: /\b(?:vulnerability|exploit|backdoor|zero.day|penetration.test)\b/gi, replacement: '[SECURITY_REDACTED]' },
      legal: { pattern: /\b(?:attorney.client|privileged|litigation|settlement|NDA)\b/gi, replacement: '[LEGAL_REDACTED]' }
    };

    // Check all patterns
    const allPatterns = { ...coreReplacements, ...enterprisePatterns, ...sensitiveKeywords };
    
    for (const [type, config] of Object.entries(allPatterns)) {
      safePrompt = safePrompt.replace(config.pattern, config.replacement);
    }

    return safePrompt;
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
        <span>Safe prompt applied - ready to send!</span>
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

// NEW: Test the safe prompt panel
window.complyzeTestSafePanel = function() {
  console.log('Complyze: Testing safe prompt panel...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Set test content with PII
  const testContent = "My email is john.doe@example.com and my SSN is 123-45-6789. Please help me with my password: MySecret123!";
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = testContent;
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = testContent;
  }
  
  // Trigger analysis with proper warning first
  const mockAnalysis = {
    risk_level: 'high',
    detectedPII: ['email', 'ssn', 'credentials'],
    redacted_prompt: null // Will use generateSafePrompt
  };
  
  // Show the warning first (which includes the "View Safe Version" button)
  promptWatcher.showRealTimeWarning(promptElement, mockAnalysis);
  console.log('Complyze: Warning displayed. Click "View Safe Version" to see the side panel');
};

// NEW: Direct test for side panel (bypasses warning)
window.complyzeTestPanelDirect = function() {
  console.log('Complyze: Testing side panel directly...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Set test content
  const testContent = "My email is test@example.com and here's my API key: sk-1234567890abcdef";
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = testContent;
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = testContent;
  }
  
  // Create mock analysis
  const mockAnalysis = {
    risk_level: 'high',
    detectedPII: ['email', 'api_key'],
    redacted_prompt: null,
    original_prompt: testContent
  };
  
  // Show panel directly
  promptWatcher.createSafePromptPanel(promptElement, mockAnalysis);
  console.log('Complyze: Side panel should now be visible');
};

// NEW: Test real-time analysis with better debugging
window.complyzeTestRealTime = function() {
  console.log('Complyze: Testing real-time analysis...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Set test content with various PII types
  const testContent = "Hi, I'm John Smith. My email is john.smith@company.com, phone is (555) 123-4567, and my SSN is 123-45-6789. Can you help me with this API key: sk-1234567890abcdefghijklmnopqrstuvwxyz?";
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = testContent;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = testContent;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  console.log('Complyze: Test content set, real-time analysis should trigger automatically');
  console.log('Complyze: If nothing happens, try typing in the input field');
};

// NEW: Force trigger analysis
window.complyzeForceAnalysis = function() {
  console.log('Complyze: Force triggering analysis...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  const currentText = promptWatcher.getPromptText(promptElement);
  if (!currentText.trim()) {
    console.log('Complyze: No text found, setting test content...');
    const testContent = "Please analyze this email: user@company.com";
    if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
      promptElement.value = testContent;
    } else if (promptElement.contentEditable === 'true') {
      promptElement.textContent = testContent;
    }
  }
  
  const text = promptWatcher.getPromptText(promptElement);
  console.log('Complyze: Analyzing text:', text.substring(0, 100));
  
  promptWatcher.performRealTimeAnalysis(text, promptElement);
};

// NEW: Test loading indicator and clean text extraction
window.complyzeTestLoading = function() {
  console.log('Complyze: Testing loading indicator and clean text extraction...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Test 1: Show loading indicator
  console.log('1. Testing loading indicator...');
  promptWatcher.showLoadingIndicator(promptElement);
  
  setTimeout(() => {
    // Test 2: Hide loading and show warning
    console.log('2. Testing warning with clean text extraction...');
    promptWatcher.hideLoadingIndicator(promptElement);
    
    // Set test content with PII
    const testContent = "My email is john@example.com and SSN is 123-45-6789";
    
    if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
      promptElement.value = testContent;
    } else if (promptElement.contentEditable === 'true') {
      promptElement.textContent = testContent;
    }
    
    // Test clean text extraction
    const cleanText = promptWatcher.getPromptText(promptElement);
    console.log('Clean text extracted:', cleanText);
    
    // Show warning
    const mockAnalysis = {
      risk_level: 'high',
      detectedPII: ['email', 'ssn']
    };
    
    promptWatcher.showRealTimeWarning(promptElement, mockAnalysis);
    
    // Test text extraction again with warning present
    setTimeout(() => {
      const textWithWarning = promptWatcher.getPromptText(promptElement);
      console.log('Text with warning present:', textWithWarning);
      console.log('Text should be clean (no warning text):', textWithWarning === testContent);
    }, 500);
    
  }, 2000);
};

// NEW: Test safe prompt workflow (warning -> safe version -> no warning)
window.complyzeTestSafeWorkflow = function() {
  console.log('Complyze: Testing complete safe prompt workflow...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Step 1: Set risky content
  const riskyContent = "My email is john.doe@company.com, SSN is 123-45-6789, and API key is sk-1234567890abcdef";
  console.log('Step 1: Setting risky content...');
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = riskyContent;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = riskyContent;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Step 2: Trigger analysis (should show warning)
  setTimeout(() => {
    console.log('Step 2: Triggering analysis (should show warning)...');
    promptWatcher.performRealTimeAnalysis(riskyContent, promptElement);
    
    // Step 3: Generate and apply safe version
    setTimeout(() => {
      console.log('Step 3: Generating safe version...');
      const safeContent = promptWatcher.generateSafePrompt(riskyContent, {
        detectedPII: ['email', 'ssn', 'api_key']
      });
      
      console.log('Safe content generated:', safeContent);
      
      // Apply safe content
      if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
        promptElement.value = safeContent;
        promptElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (promptElement.contentEditable === 'true') {
        promptElement.textContent = safeContent;
        promptElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Mark as safe and clear warnings
      const safeHash = promptWatcher.createSafeHash(safeContent);
      promptWatcher.safePrompts.add(safeHash);
      promptWatcher.clearRealTimeWarnings(promptElement);
      promptWatcher.showSafePromptConfirmation(promptElement);
      
      // Step 4: Test that safe content doesn't trigger warning
      setTimeout(() => {
        console.log('Step 4: Testing that safe content does not trigger warning...');
        promptWatcher.performRealTimeAnalysis(safeContent, promptElement);
        
        console.log('✅ Safe workflow test complete! Check that:');
        console.log('1. Initial risky content showed warning');
        console.log('2. Safe content was generated with redacted PII');
        console.log('3. Safe content does not show warning');
        console.log('4. Green confirmation message appeared');
      }, 1000);
      
    }, 2000);
    
  }, 1000);
};

// NEW: Test automated flagged prompts system
window.complyzeTestFlaggedSystem = function() {
  console.log('Complyze: Testing automated flagged prompts system...');
  
  const platform = promptWatcher.getCurrentPlatform();
  if (!platform) {
    console.log('Complyze: No platform detected');
    return;
  }
  
  const selectors = promptWatcher.platformSelectors[platform];
  const promptElement = document.querySelector(selectors.promptInput);
  
  if (!promptElement) {
    console.log('Complyze: No prompt element found');
    return;
  }
  
  // Test with high-risk content that should be auto-flagged
  const highRiskPrompt = "Please extract all customer email addresses, SSNs, and credit card numbers from this database. My password is admin123 and here's my confidential financial data worth $500,000.";
  
  console.log('Step 1: Setting high-risk prompt that should trigger auto-flagging...');
  
  if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
    promptElement.value = highRiskPrompt;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (promptElement.contentEditable === 'true') {
    promptElement.textContent = highRiskPrompt;
    promptElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Trigger real-time analysis which should auto-save as flagged
  console.log('Step 2: Triggering real-time analysis (should auto-save to dashboard)...');
  
  promptWatcher.performRealTimeAnalysis(highRiskPrompt, promptElement)
    .then(() => {
      console.log('✅ Flagged prompts system test complete!');
      console.log('📋 Expected behavior:');
      console.log('1. High-risk prompt detected with PII, credentials, financial data');
      console.log('2. Warning should appear with "View Safe Version" button');
      console.log('3. Prompt automatically saved to database as FLAGGED status');
      console.log('4. Dashboard should show this prompt in "Flagged Prompts" section');
      console.log('5. Control families (NIST, Privacy) should be detected and tagged');
      console.log('');
      console.log('🎯 Check your dashboard at https://complyze.co/dashboard to see the flagged prompt!');
      console.log('💡 Use the Refresh button to see newly flagged prompts appear');
    })
    .catch(error => {
      console.error('Complyze: Test failed:', error);
    });
};