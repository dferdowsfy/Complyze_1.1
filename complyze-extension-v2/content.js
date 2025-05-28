console.log("Complyze: Content script starting on", window.location.href);

// Enhanced prompt detection for multiple LLM platforms with REAL-TIME PREVENTION
class PromptWatcher {
  constructor() {
    this.isLoggedIn = false;
    this.lastPrompt = '';
    this.processedPrompts = new Set();
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
        promptInput: 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"]',
        submitButton: 'button[aria-label="Send Message"], button:has(svg[data-icon="send"])',
        loginCheck: '[data-testid="user-menu"], .user-avatar'
      },
      'gemini.google.com': {
        promptInput: 'rich-textarea div[contenteditable="true"], textarea[aria-label*="Enter a prompt"]',
        submitButton: 'button[aria-label="Send message"], button[data-test-id="send-button"]',
        loginCheck: '.gb_d, [data-ogsr-up]'
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
    
    // Enhanced debugging for ChatGPT
    this.enhancedChatGPTDebugging();
  }
  
  enhancedChatGPTDebugging() {
    console.log('Complyze: Setting up enhanced ChatGPT debugging');
    
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
      return element.innerText || element.textContent;
    }
    return '';
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
    
    // Check if extension is enabled
    const settings = await chrome.storage.local.get(['extensionEnabled']);
    if (settings.extensionEnabled === false) {
      console.log('Complyze: Extension is disabled, skipping analysis');
      return;
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
    const promptHash = btoa(userPrompt).substring(0, 20); // Simple hash for deduplication
    if (this.processedPrompts.has(promptHash)) {
      console.log('Complyze: Prompt already processed, skipping');
      return;
    }
    
    this.processedPrompts.add(promptHash);
    // Keep only last 50 processed prompts to prevent memory issues
    if (this.processedPrompts.size > 50) {
      const firstItem = this.processedPrompts.values().next().value;
      this.processedPrompts.delete(firstItem);
    }
    
    console.log('Complyze: Capturing prompt for analysis:', userPrompt.substring(0, 100) + '...');
    
    // Send to background script for processing
    chrome.runtime.sendMessage({
      type: 'analyze_prompt',
      payload: {
        prompt: userPrompt,
        platform: this.getCurrentPlatform(),
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
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
      if (!promptText || promptText.length < 10) return; // Only analyze substantial text
      
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
          await this.performRealTimeAnalysis(promptText, promptElement);
        }
      }, 100);
    });
  }

  // NEW: Perform real-time analysis without sending the prompt
  async performRealTimeAnalysis(promptText, promptElement) {
    if (this.isAnalyzing) return;
    
    try {
      this.isAnalyzing = true;
      console.log('Complyze: Performing real-time analysis on:', promptText.substring(0, 50) + '...');
      
      // Quick local analysis first (basic PII detection)
      const quickAnalysis = this.performQuickLocalAnalysis(promptText);
      
      if (quickAnalysis.hasHighRisk) {
        this.showRealTimeWarning(promptElement, quickAnalysis);
      }
      
      // Then perform full server-side analysis
      const fullAnalysis = await this.performServerAnalysis(promptText);
      
      if (fullAnalysis && (fullAnalysis.risk_level === 'high' || fullAnalysis.risk_level === 'critical')) {
        this.showRealTimeWarning(promptElement, fullAnalysis, true);
      } else if (fullAnalysis && fullAnalysis.risk_level === 'medium') {
        this.showRealTimeInfo(promptElement, fullAnalysis);
      } else {
        this.clearRealTimeWarnings(promptElement);
      }
      
    } catch (error) {
      console.error('Complyze: Real-time analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  // NEW: Quick local analysis for immediate feedback
  performQuickLocalAnalysis(text) {
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      apiKey: /\b[A-Za-z0-9]{32,}\b/g
    };
    
    const detectedPII = [];
    let hasHighRisk = false;
    
    for (const [type, pattern] of Object.entries(piiPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        detectedPII.push(type);
        if (type === 'ssn' || type === 'creditCard' || type === 'apiKey') {
          hasHighRisk = true;
        }
      }
    }
    
    // Check for sensitive keywords
    const sensitiveKeywords = ['password', 'secret', 'confidential', 'private key', 'token', 'credentials'];
    const hasSensitiveKeywords = sensitiveKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
    
    if (hasSensitiveKeywords) {
      hasHighRisk = true;
      detectedPII.push('sensitive_keywords');
    }
    
    return {
      hasHighRisk,
      detectedPII,
      risk_level: hasHighRisk ? 'high' : (detectedPII.length > 0 ? 'medium' : 'low')
    };
  }

  // NEW: Server-side analysis for comprehensive checking
  async performServerAnalysis(promptText) {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'analyze_prompt_realtime',
          payload: { prompt: promptText }
        }, resolve);
      });
      
      return response;
    } catch (error) {
      console.error('Complyze: Server analysis failed:', error);
      return null;
    }
  }

  // NEW: Show real-time warning overlay with side panel
  showRealTimeWarning(promptElement, analysis, isServerAnalysis = false) {
    this.clearRealTimeWarnings(promptElement);
    
    const warningId = 'complyze-realtime-warning';
    const warning = document.createElement('div');
    warning.id = warningId;
    warning.style.cssText = `
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      z-index: 999999;
      animation: slideDown 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    const riskLevel = analysis.risk_level || 'high';
    const riskColor = riskLevel === 'critical' ? '#7f1d1d' : '#dc2626';
    
    warning.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">⚠️</span>
          <div>
            <div style="font-weight: 700;">Security Risk Detected</div>
            <div style="font-size: 12px; opacity: 0.9;">
              ${analysis.detectedPII ? `PII found: ${analysis.detectedPII.join(', ')}` : 'High-risk content detected'}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="complyze-ignore" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Send Anyway
          </button>
          <button id="complyze-fix" style="background: rgba(255,255,255,0.9); border: none; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 600;">
            View Safe Version
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
      `;
      document.head.appendChild(style);
    }
    
    // Position relative to prompt element
    const rect = promptElement.getBoundingClientRect();
    const container = promptElement.closest('form, div') || promptElement.parentElement;
    
    if (container) {
      container.style.position = 'relative';
      container.appendChild(warning);
      
      // Add event listeners
      warning.querySelector('#complyze-ignore').addEventListener('click', () => {
        this.clearRealTimeWarnings(promptElement);
        this.preventSubmission = false;
      });
      
      warning.querySelector('#complyze-fix').addEventListener('click', () => {
        this.showFixSuggestions(promptElement, analysis);
      });
      
      // Set prevention flag for high-risk content
      if (riskLevel === 'high' || riskLevel === 'critical') {
        this.preventSubmission = true;
        this.blockSubmitButtons(true);
      }
    }
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
    
    if (existingWarning) existingWarning.remove();
    if (existingInfo) existingInfo.remove();
    
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
  showFixSuggestions(promptElement, analysis) {
    // Create side panel with safe prompt version
    this.createSafePromptPanel(promptElement, analysis);
  }

  // NEW: Create side panel with safe prompt
  createSafePromptPanel(promptElement, analysis) {
    // Remove existing panel if any
    const existingPanel = document.querySelector('#complyze-safe-prompt-panel');
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.id = 'complyze-safe-prompt-panel';
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border: 2px solid #3b82f6;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      animation: slideInRight 0.3s ease-out;
      overflow: hidden;
    `;

    const originalPrompt = this.getPromptText(promptElement);
    const safePrompt = analysis.redacted_prompt || this.generateSafePrompt(originalPrompt, analysis);

    panel.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid rgba(59, 130, 246, 0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #3b82f6;">
            🛡️ Safe Prompt Version
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

    // Add event listeners
    panel.querySelector('#complyze-close-panel').addEventListener('click', () => {
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
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    });

    panel.querySelector('#complyze-use-safe').addEventListener('click', () => {
      const safeText = panel.querySelector('#complyze-safe-text').value;
      
      // Replace the text in the prompt element
      if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
        promptElement.value = safeText;
        promptElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (promptElement.contentEditable === 'true') {
        promptElement.textContent = safeText;
        promptElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Clear warnings and re-enable submission
      this.clearRealTimeWarnings(promptElement);
      this.preventSubmission = false;
      this.blockSubmitButtons(false);

      // Close panel
      panel.remove();

      // Focus back on the prompt element
      promptElement.focus();
      
      // Move cursor to end
      if (promptElement.setSelectionRange) {
        promptElement.setSelectionRange(safeText.length, safeText.length);
      }
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !e.target.closest('#complyze-realtime-warning')) {
        panel.remove();
      }
    }, { once: true });
  }

  // NEW: Generate safe prompt by removing PII
  generateSafePrompt(originalPrompt, analysis) {
    let safePrompt = originalPrompt;

    // Remove common PII patterns
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      apiKey: /\b[A-Za-z0-9]{32,}\b/g
    };

    const replacements = {
      email: '[EMAIL_REMOVED]',
      phone: '[PHONE_REMOVED]',
      ssn: '[SSN_REMOVED]',
      creditCard: '[CREDIT_CARD_REMOVED]',
      apiKey: '[API_KEY_REMOVED]'
    };

    for (const [type, pattern] of Object.entries(piiPatterns)) {
      safePrompt = safePrompt.replace(pattern, replacements[type]);
    }

    // Remove sensitive keywords
    const sensitiveKeywords = [
      { pattern: /password\s*[:=]\s*\S+/gi, replacement: 'password: [REDACTED]' },
      { pattern: /secret\s*[:=]\s*\S+/gi, replacement: 'secret: [REDACTED]' },
      { pattern: /token\s*[:=]\s*\S+/gi, replacement: 'token: [REDACTED]' },
      { pattern: /key\s*[:=]\s*\S+/gi, replacement: 'key: [REDACTED]' }
    ];

    sensitiveKeywords.forEach(({ pattern, replacement }) => {
      safePrompt = safePrompt.replace(pattern, replacement);
    });

    return safePrompt;
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
  
  // Trigger analysis
  const mockAnalysis = {
    risk_level: 'high',
    detectedPII: ['email', 'ssn', 'sensitive_keywords'],
    redacted_prompt: null // Will use generateSafePrompt
  };
  
  promptWatcher.createSafePromptPanel(promptElement, mockAnalysis);
  console.log('Complyze: Safe prompt panel should now be visible');
};

console.log('Complyze: Test functions available:');
console.log('- complyzeTest() - Send test prompt');
console.log('- complyzeDebug() - Show debug info');
console.log('- complyzeForcePrompt() - Force capture current prompt');
console.log('- complyzeTestSafePanel() - Test safe prompt panel');

// Authentication sync functionality
class AuthSync {
  constructor() {
    this.lastToken = null;
    this.lastUser = null;
    this.init();
  }

  init() {
    // Only run on dashboard pages
    if (window.location.hostname === 'localhost' && (window.location.port === '3002' || window.location.port === '3001' || window.location.port === '3000')) {
      this.checkAuthChanges();
      // Check every 2 seconds for auth changes
      setInterval(() => this.checkAuthChanges(), 2000);
      console.log('Complyze: Auth sync initialized for dashboard on port', window.location.port);
    }
  }

  checkAuthChanges() {
    const currentToken = localStorage.getItem('complyze_token');
    const currentUser = localStorage.getItem('complyze_user');

    // Check if auth state changed
    if (currentToken !== this.lastToken || currentUser !== this.lastUser) {
      console.log('Complyze: Website auth state changed, syncing to extension...');
      
      if (currentToken && currentUser) {
        // User logged in on website, sync to extension
        chrome.runtime.sendMessage({
          type: 'sync_auth_from_website',
          token: currentToken,
          user: JSON.parse(currentUser)
        });
      } else if (this.lastToken && !currentToken) {
        // User logged out on website, sync to extension
        chrome.runtime.sendMessage({
          type: 'logout_from_website'
        });
      }

      this.lastToken = currentToken;
      this.lastUser = currentUser;
    }
  }
}

// Initialize auth sync
const authSync = new AuthSync();

// Enhanced debugging functions for real-time prevention
window.complyzeTestRealTime = () => {
  console.log('Complyze: Testing real-time analysis...');
  const platform = promptWatcher.getCurrentPlatform();
  if (platform) {
    const selectors = promptWatcher.platformSelectors[platform];
    const promptElement = document.querySelector(selectors.promptInput);
    if (promptElement) {
      const testPrompt = "Please help me with my SSN 123-45-6789 and credit card 4532-1234-5678-9012";
      
      // Set the text in the input
      if (promptElement.tagName === 'TEXTAREA' || promptElement.tagName === 'INPUT') {
        promptElement.value = testPrompt;
      } else {
        promptElement.textContent = testPrompt;
      }
      
      // Trigger real-time analysis
      promptWatcher.performRealTimeAnalysis(testPrompt, promptElement);
    } else {
      console.log('Complyze: No prompt input found for testing');
    }
  }
};

window.complyzeTogglePrevention = () => {
  promptWatcher.preventSubmission = !promptWatcher.preventSubmission;
  console.log('Complyze: Prevention toggled to:', promptWatcher.preventSubmission);
  promptWatcher.blockSubmitButtons(promptWatcher.preventSubmission);
}; 