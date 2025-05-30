import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface ElectronAPI {
  // Monitoring
  getMonitoringStatus: () => Promise<{
    enabled: boolean;
    monitoredApps: Array<{ name: string; enabled: boolean }>;
    monitoredWebURLs: Array<{ name: string; pattern: string; enabled: boolean }>;
  }>;
  toggleMonitoring: () => Promise<boolean>;

  // Authentication
  checkAuth: () => Promise<{ authenticated: boolean; userEmail?: string }>;

  // Activity
  getRecentActivity: () => Promise<Array<{
    timestamp: string;
    action: string;
    riskLevel: 'low' | 'medium' | 'high';
  }>>;

  // Dashboard
  openDashboard: () => Promise<void>;

  // Events
  onPromptProcessed: (callback: (data: any) => void) => void;
  removeAllListeners: (channel: string) => void;

  // Internal monitoring (for capturing prompts)
  reportPrompt: (data: { prompt: string; sourceApp: string }) => Promise<void>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  processPrompt: (data: any) => ipcRenderer.invoke('process-prompt', data),
  interceptPrompt: (data: any) => ipcRenderer.invoke('intercept-prompt', data),
  testPromptProcessing: (testPrompt?: string) => ipcRenderer.invoke('test-prompt-processing', testPrompt),
  testPromptInterception: (testPrompt?: string) => ipcRenderer.invoke('test-prompt-interception', testPrompt),
  getActiveMonitoring: () => ipcRenderer.invoke('get-active-monitoring'),
  
  // Add the missing test notification handlers
  testSimpleNotification: () => ipcRenderer.invoke('test-simple-notification'),
  testInputDetection: () => ipcRenderer.invoke('test-input-detection'),
  testNotification: () => ipcRenderer.invoke('test-notification'),
  
  // Add the missing reportPrompt method
  reportPrompt: (data: { prompt: string; sourceApp: string }) => ipcRenderer.invoke('prompt-captured', data),
  
  // Existing API methods
  checkAuth: () => ipcRenderer.invoke('check-auth'),
  login: (credentials: any) => ipcRenderer.invoke('login', credentials),
  signup: (signupData: any) => ipcRenderer.invoke('signup', signupData),
  logout: () => ipcRenderer.invoke('logout'),
  openDashboard: () => ipcRenderer.invoke('open-dashboard'),
  getMonitoringStatus: () => ipcRenderer.invoke('get-monitoring-status'),
  toggleMonitoring: () => ipcRenderer.invoke('toggle-monitoring'),
  getRecentActivity: () => ipcRenderer.invoke('get-recent-activity'),
  
  // Event listeners
  onAppDetected: (callback: (data: any) => void) => {
    ipcRenderer.on('app-detected', (event, data) => callback(data));
  },
  onPromptProcessed: (callback: (data: any) => void) => {
    ipcRenderer.on('prompt-processed', (event, data) => callback(data));
  }
});

// Inject prompt monitoring script into web pages
window.addEventListener('DOMContentLoaded', () => {
  injectPromptMonitoring();
});

/**
 * Inject monitoring script into web pages
 */
function injectPromptMonitoring() {
  // Only inject into monitored websites
  const currentUrl = window.location.href;
  
  // List of monitored URL patterns (simplified check)
  const monitoredPatterns = [
    'chat.openai.com',
    'claude.ai',
    'gemini.google.com',
    'aistudio.google.com',
    'meta.ai',
    'poe.com',
    'huggingface.co/chat',
    'phind.com',
    'you.com/chat',
    'notion.so',
    'github.com/features/copilot/chat',
    'chat.forefront.ai',
    'beta.character.ai'
  ];

  const shouldMonitor = monitoredPatterns.some(pattern => currentUrl.includes(pattern));
  
  if (!shouldMonitor) {
    return;
  }

  console.log('Complyze: Injecting prompt monitoring for', currentUrl);

  // Create monitoring script
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('Complyze: Prompt monitoring active');
      
      // Platform-specific selectors
      const platformSelectors = {
        'chat.openai.com': {
          promptInput: '#prompt-textarea, div[contenteditable="true"], textarea[placeholder*="Message"], div[role="textbox"]',
          submitButton: '[data-testid="send-button"], button[aria-label*="Send"], button:has(svg)'
        },
        'claude.ai': {
          promptInput: 'div[contenteditable="true"], textarea',
          submitButton: 'button[aria-label*="Send"], button:has(svg)'
        },
        'gemini.google.com': {
          promptInput: 'rich-textarea, div[contenteditable="true"], textarea',
          submitButton: 'button[aria-label*="Send"], button:has(svg)'
        }
        // Add more platform-specific selectors as needed
      };

      // Get current platform
      const currentPlatform = Object.keys(platformSelectors).find(platform => 
        window.location.href.includes(platform)
      );

      if (!currentPlatform) {
        console.log('Complyze: No specific selectors for current platform, using generic');
      }

      const selectors = platformSelectors[currentPlatform] || {
        promptInput: 'textarea, div[contenteditable="true"], input[type="text"]',
        submitButton: 'button[type="submit"], button:has(svg), input[type="submit"]'
      };

      // Monitor for prompt submissions
      let lastPrompt = '';
      let isMonitoring = false;
      let isProcessingPrompt = false;

      function getPromptText(element) {
        if (!element) return '';
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          return element.value || '';
        } else if (element.contentEditable === 'true') {
          return element.textContent || element.innerText || '';
        }
        return '';
      }

      async function capturePrompt(promptText, isSubmission = false) {
        if (!promptText || promptText.length < 3 || promptText === lastPrompt || isProcessingPrompt) {
          return true; // Allow by default
        }

        lastPrompt = promptText;
        console.log('Complyze: Captured prompt:', promptText.substring(0, 100) + '...');

        try {
          isProcessingPrompt = true;
          
          if (isSubmission) {
            // For submissions, use interception (blocking mode)
            console.log('Complyze: Intercepting prompt submission...');
            
            if (window.electronAPI && window.electronAPI.interceptPrompt) {
              const result = await window.electronAPI.interceptPrompt({
                prompt: promptText,
                sourceApp: window.location.hostname,
                url: window.location.href,
                timestamp: new Date().toISOString()
              });
              
              console.log('Complyze: Interception result:', result);
              
              if (result.action === 'block') {
                console.log('Complyze: Prompt blocked by user');
                return false; // Block the submission
              } else if (result.action === 'replace' && result.enhancedPrompt) {
                console.log('Complyze: Replacing prompt with safe version');
                // Replace the prompt text in the input
                const promptInput = document.querySelector(selectors.promptInput);
                if (promptInput) {
                  if (promptInput.tagName === 'TEXTAREA' || promptInput.tagName === 'INPUT') {
                    promptInput.value = result.enhancedPrompt;
                  } else if (promptInput.contentEditable === 'true') {
                    promptInput.textContent = result.enhancedPrompt;
                  }
                  
                  // Trigger input event to update the UI
                  promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return true; // Allow with replaced content
              }
              
              return true; // Allow if user chose to proceed
            }
          } else {
            // For typing, use non-blocking processing
            if (window.electronAPI && window.electronAPI.reportPrompt) {
              await window.electronAPI.reportPrompt({
                prompt: promptText,
                sourceApp: window.location.hostname
              });
            }
            return true;
          }
        } catch (error) {
          console.error('Complyze: Error processing prompt:', error);
          return true; // Allow on error
        } finally {
          isProcessingPrompt = false;
        }
        
        return true; // Default allow
      }

      // Monitor input changes
      function setupInputMonitoring() {
        const promptInputs = document.querySelectorAll(selectors.promptInput);
        
        promptInputs.forEach(input => {
          // Monitor typing (non-blocking)
          input.addEventListener('input', () => {
            const currentText = getPromptText(input);
            if (currentText && currentText.length > 10) {
              // Debounce capture
              clearTimeout(window.complyzeDebounce);
              window.complyzeDebounce = setTimeout(() => {
                capturePrompt(currentText, false); // Non-blocking for typing
              }, 1000);
            }
          });

          // Monitor Enter key (blocking)
          input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              const currentText = getPromptText(input);
              if (currentText) {
                e.preventDefault(); // Prevent default submission
                
                const shouldAllow = await capturePrompt(currentText, true); // Blocking for submission
                
                if (shouldAllow) {
                  // Allow the submission to proceed
                  setTimeout(() => {
                    // Re-trigger the Enter key event
                    const newEvent = new KeyboardEvent('keydown', {
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                      which: 13,
                      bubbles: true,
                      cancelable: true
                    });
                    
                    // Temporarily remove our listener to avoid recursion
                    input.removeEventListener('keydown', arguments.callee);
                    input.dispatchEvent(newEvent);
                    
                    // Re-add our listener after a short delay
                    setTimeout(() => {
                      input.addEventListener('keydown', arguments.callee);
                    }, 100);
                  }, 100);
                }
                // If shouldAllow is false, the submission is blocked
              }
            }
          });
        });

        // Monitor submit buttons (blocking)
        const submitButtons = document.querySelectorAll(selectors.submitButton);
        submitButtons.forEach(button => {
          button.addEventListener('click', async (e) => {
            const promptInput = document.querySelector(selectors.promptInput);
            if (promptInput) {
              const currentText = getPromptText(promptInput);
              if (currentText) {
                e.preventDefault(); // Prevent default submission
                e.stopPropagation(); // Stop event propagation
                
                const shouldAllow = await capturePrompt(currentText, true); // Blocking for submission
                
                if (shouldAllow) {
                  // Allow the submission to proceed
                  setTimeout(() => {
                    // Re-trigger the click event
                    const newEvent = new MouseEvent('click', {
                      bubbles: true,
                      cancelable: true,
                      view: window
                    });
                    
                    // Temporarily remove our listener to avoid recursion
                    button.removeEventListener('click', arguments.callee);
                    button.dispatchEvent(newEvent);
                    
                    // Re-add our listener after a short delay
                    setTimeout(() => {
                      button.addEventListener('click', arguments.callee);
                    }, 100);
                  }, 100);
                }
                // If shouldAllow is false, the submission is blocked
              }
            }
          }, true); // Use capture phase to intercept before other handlers
        });
      }

      // Initial setup
      setupInputMonitoring();

      // Re-setup monitoring when new elements are added (for SPAs)
      const observer = new MutationObserver(() => {
        if (!isMonitoring) {
          isMonitoring = true;
          setTimeout(() => {
            setupInputMonitoring();
            isMonitoring = false;
          }, 500);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('Complyze: Monitoring setup complete for', window.location.hostname);
    })();
  `;

  // Inject the script
  document.head.appendChild(script);
}

// Type declaration for global
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    complyzeDebounce: number;
  }
} 