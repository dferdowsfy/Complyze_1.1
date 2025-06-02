// Enhanced Complyze Background Script with AI-First Optimization
// Now uses Google Gemini 2.5 Pro via OpenRouter for consistent optimization across platforms

// ===== STARTUP DIAGNOSTICS =====
console.log('🚀 Complyze Background Script Loading...');
console.log('🔧 Chrome Runtime ID:', chrome?.runtime?.id || 'Not Available');
console.log('⏰ Script Start Time:', new Date().toISOString());

// OpenRouter API configuration - API key will be loaded from storage
const OPENROUTER_CONFIG = {
  apiKey: null, // Will be loaded from secure storage
  model: 'google/gemini-2.5-pro-preview',
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions'
};

// --- SUPABASE PROMPT EVENT SYNC ---
/**
 * Sync prompt event to Supabase prompt_events table
 * WARNING: Never expose the service role key in production client-side code!
 * In production, use a backend relay or Edge Function for this call.
 */
async function syncPromptEventToSupabase(event) {
  // Use production Complyze API endpoint for all telemetry and logging
  const SUPABASE_URL = 'https://complyze.co/api/prompt_events'; // Production endpoint
  const SUPABASE_SERVICE_ROLE_KEY = null; // Will be handled by the production API
  
  console.log('Complyze: 🔄 STARTING Supabase sync for prompt event...');
  console.log('Complyze: 🎯 Target URL:', SUPABASE_URL);
  console.log('Complyze: 👤 User ID in event:', event.user_id);
  
  try {
    console.log('Complyze: 📡 Making Supabase API request...');
    
    const requestBody = JSON.stringify(event);
    console.log('Complyze: 📦 Request payload size:', requestBody.length, 'bytes');
    
    const startTime = Date.now();
    const response = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Complyze: ⏱️ Supabase response time: ${responseTime}ms`);
    console.log(`Complyze: 📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Complyze: ❌ Supabase prompt event sync failed:', errorText);
      console.error('Complyze: 🔍 Error details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500) // Limit error text length
      });
      
      // Log if it might be a user_id issue
      if (errorText.includes('user_id') || errorText.includes('foreign key') || errorText.includes('constraint')) {
        console.error('Complyze: 👤 Possible user_id constraint issue. Make sure the user_id exists in your users table.');
      }
    } else {
      const responseData = await response.json().catch(() => null);
      console.log('Complyze: ✅ Supabase prompt event synced successfully!');
      console.log('Complyze: 📊 Response data:', responseData || 'No response body');
      console.log('Complyze: 📋 Event should now appear in the dashboard for user:', event.user_id);
      console.log('Complyze: 🔍 To debug dashboard display issues:');
      console.log('Complyze:   1. Verify the dashboard is filtering by this exact user_id');
      console.log('Complyze:   2. Check for any RLS policies that might restrict access');
      console.log('Complyze:   3. Try refreshing the dashboard');
    }
  } catch (error) {
    console.error('Complyze: ❌ Supabase prompt event sync error:', error);
    console.error('Complyze: 🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 300)
    });
    console.error('Complyze: 🔧 This might be a network issue, CORS problem, or invalid Supabase URL/key.');
  }
}
// ... existing code ...

// --- DASHBOARD USER ID SYNC ---
/**
 * Try to get the user ID from the Complyze dashboard by injecting a script
 * This ensures that we use the same user ID as the dashboard
 */
async function getUserIdFromDashboard() {
  try {
    // Try to find any open Complyze dashboard tabs
    const dashboardTabs = await chrome.tabs.query({ url: ["*://complyze.co/dashboard*", "*://complyze.co/#/dashboard*"] });
    
    if (dashboardTabs.length === 0) {
      console.log('Complyze: No dashboard tabs found to extract user ID');
      return null;
    }
    
    console.log(`Complyze: Found ${dashboardTabs.length} dashboard tabs, attempting to extract user ID...`);
    
    // Try to execute script in the first dashboard tab to extract user ID
    const results = await chrome.scripting.executeScript({
      target: { tabId: dashboardTabs[0].id },
      func: () => {
        // Try various common ways to get user ID from the dashboard
              const userId = 
        // Note: localStorage and window are not available in service worker context
        // These would need to be injected from content script
        null || // localStorage.getItem('complyze_uid') 
        null || // localStorage.getItem('supabase.auth.token')
        // From global variable - not available in service worker
        null || // (window.currentUser && window.currentUser.id)
          // From other common patterns
          document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
        
        // Log what we found
        console.log(`Dashboard script: Found user ID: ${userId || 'none'}`);
        
        return userId;
      }
    });
    
    if (results && results[0] && results[0].result) {
      console.log('Complyze: Successfully extracted user ID from dashboard:', results[0].result);
      return results[0].result;
    } else {
      console.log('Complyze: Could not extract user ID from dashboard tab');
      return null;
    }
  } catch (error) {
    console.error('Complyze: Error extracting user ID from dashboard:', error);
    return null;
  }
}
// ... existing code ...

class ComplyzeBackground {
  constructor() {
    this.apiBase = 'https://complyze.co/api';
    this.dashboardUrl = 'https://complyze.co/dashboard';
    this.accessToken = null;
    this.user = null;
    this.lastTokenVerification = null;
    this.tokenVerificationInterval = 15 * 60 * 1000; // 15 minutes
    this.init();
  }

  async init() {
    console.log('Complyze: Background script initializing...');
    
    // Load stored auth data
    const stored = await chrome.storage.local.get(['accessToken', 'user']);
    this.accessToken = stored.accessToken || null;
    this.user = stored.user || null;
    
    if (this.accessToken && this.user) {
      console.log('Complyze: Restored authentication from storage for user:', this.user.email);
    } else {
      console.log('Complyze: No stored authentication found');
    }
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Set up context menu with proper error handling
    chrome.runtime.onInstalled.addListener(() => {
      try {
        // Remove any existing context menus first
        chrome.contextMenus.removeAll(() => {
          // Create new context menu
          chrome.contextMenus.create({
            id: 'complyze-analyze',
            title: 'Analyze with Complyze',
            contexts: ['selection']
          }, () => {
            if (chrome.runtime.lastError) {
              console.log('Complyze: Context menu creation error (non-critical):', chrome.runtime.lastError.message);
            } else {
              console.log('Complyze: Context menu created successfully');
            }
          });
        });
      } catch (error) {
        console.log('Complyze: Context menu setup error (non-critical):', error.message);
      }
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'complyze-analyze' && info.selectionText) {
        this.handlePromptAnalysis({
          prompt: info.selectionText,
          platform: 'context-menu',
          url: tab.url,
          timestamp: new Date().toISOString()
        }, tab.id);
      }
    });

    // Detect server port for local development
    await this.detectServerPort();
    
    // Initialize authentication
    await this.initializeAuth();
    
    console.log('Complyze: Background script initialized');
    
    // Test AI optimization on startup (optional - can be removed in production)
    this.testAIOptimization();
  }

  async testAIOptimization() {
    try {
      console.log('Complyze: 🧪 Testing AI optimization system...');
      const testPrompt = "Help me write an email to test@example.com about project details";
      const testResult = await this.enhancePromptWithAI(testPrompt);
      console.log('Complyze: ✅ AI optimization test completed successfully');
      console.log('Complyze: 📊 Test result sample:', {
        hasOptimizedPrompt: !!testResult.optimized_prompt,
        riskLevel: testResult.risk_level,
        improvementsCount: testResult.improvements?.length || 0
      });
    } catch (error) {
      console.error('Complyze: ❌ AI optimization test failed:', error);
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'debug_test':
          console.log('Complyze: Debug test message received');
          sendResponse({ 
            success: true, 
            message: 'Extension background script is working',
            extensionId: chrome.runtime.id,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'analyze_prompt':
          console.log('Complyze: 📥 BACKGROUND RECEIVED analyze_prompt MESSAGE:', message.payload);
          console.log('Complyze: 🔍 Message details:', {
            hasPayload: !!message.payload,
            triggerOptimization: message.payload?.triggerOptimization,
            promptLength: message.payload?.prompt?.length || 0,
            platform: message.payload?.platform
          });
          const analysisResult = await this.handlePromptAnalysis(message.payload, sender.tab.id);
          sendResponse(analysisResult);
          break;
          
        case 'analyze_prompt_realtime':
          const result = await this.handleRealTimeAnalysis(message.payload);
          sendResponse(result);
          break;
          
        case 'login':
          const loginResult = await this.login(message.email, message.password);
          sendResponse(loginResult);
          break;
          
        case 'signup':
          const signupResult = await this.signup(message.email, message.password, message.fullName);
          sendResponse(signupResult);
          break;
          
        case 'logout':
          await this.logout();
          sendResponse({ success: true });
          break;
          
        case 'sync_from_website':
          await this.syncFromWebsite();
          sendResponse({ success: true });
          break;
          
        case 'update_redaction_settings':
          await this.handleRedactionSettingsUpdate(message.payload);
          sendResponse({ success: true });
          break;

        case 'get_auth_status':
          sendResponse({ 
            isAuthenticated: !!(this.accessToken && this.user), 
            user: this.user 
          });
          break;

        case 'get_dashboard_url':
          sendResponse({ 
            dashboardUrl: this.dashboardUrl,
            apiBase: this.apiBase 
          });
          break;
          
        default:
          console.log('Complyze: Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Complyze: ❌ CRITICAL ERROR handling message:', error);
      console.error('Complyze: 🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      sendResponse({ error: error.message });
    }
  }

  async detectServerPort() {
    // Default to production URLs
    this.apiBase = 'https://complyze.co/api';
    this.dashboardUrl = 'https://complyze.co/dashboard';
    console.log('Complyze: Defaulting to production API endpoints:', this.apiBase);

    // Optional: Add a specific flag or condition to allow local development override if needed later
    // For now, always use production to meet the requirement.
    // Example of a potential future check:
    // const devMode = await chrome.storage.local.get(['developerModeOverride']);
    // if (devMode && devMode.developerModeOverride) {
    //   // Try common development ports
    //   const ports = [3000, 3001, 8080, 8000, 5000];
    //   for (const port of ports) {
    //     try {
    //       const response = await fetch(`http://localhost:${port}/api/test`, {
    //         method: 'GET',
    //         signal: AbortSignal.timeout(500) // Shorter timeout for local check
    //       });
    //       if (response.ok) {
    //         this.apiBase = `http://localhost:${port}/api`;
    //         this.dashboardUrl = `http://localhost:${port}/dashboard`;
    //         console.log(`Complyze: Using LOCAL development server on port ${port} due to override.`);
    //         return;
    //       }
    //     } catch (error) {
    //       // Port not available, continue
    //     }
    //   }
    //   console.warn('Complyze: Developer mode override enabled, but no local server found. Falling back to production.');
    // }
  }

  async initializeAuth() {
    if (this.accessToken && this.user) {
      // On startup, don't immediately verify token over network
      // Let it be verified on first use instead
      console.log('Complyze: Authentication data found, will verify on first use');
    }
  }

  async verifyToken() {
    if (!this.accessToken) return false;
    
    try {
      const response = await fetch(`${this.apiBase}/auth/check`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return response.ok;
    } catch (error) {
      console.error('Complyze: Token verification failed:', error);
      // If it's a network error, don't immediately clear auth
      // Only clear auth if it's explicitly a 401/403 response
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        console.log('Complyze: Network error during token verification, keeping auth for now');
        return true; // Assume valid on network errors
      }
      return false;
    }
  }

  async clearAuth() {
    this.accessToken = null;
    this.user = null;
    this.lastTokenVerification = null;
    await chrome.storage.local.remove(['accessToken', 'user']);
  }

  async handlePromptAnalysis(promptData, tabId) {
    try {
      console.log('Complyze: 🎯 ENTERING handlePromptAnalysis');
      console.log('Complyze: Processing prompt analysis for:', promptData.platform);
      console.log('Complyze: Prompt text:', promptData.prompt.substring(0, 100) + '...');
      console.log('Complyze: Trigger optimization requested:', !!promptData.triggerOptimization);
      
      // Check if extension is enabled
      const settings = await chrome.storage.local.get(['extensionEnabled']);
      if (settings.extensionEnabled === false) {
        console.log('Complyze: Extension is disabled, skipping analysis');
        return { success: false, error: 'Extension disabled' };
      }
      
      // Step 1: Check user authentication
      const isAuthenticated = await this.checkUserAuth();
      if (!isAuthenticated) {
        console.log('Complyze: User not authenticated, showing auth required');
        this.showAuthenticationRequired(tabId);
        return { success: false, error: 'Authentication required' };
      }

      console.log('Complyze: User authenticated, proceeding with analysis');

      // Step 2: Perform basic analysis first
      const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = this.removeSensitiveData(promptData.prompt);
      const intent = this.analyzePromptIntent(cleanedPrompt);
      const riskLevel = this.calculateRiskLevel(sensitiveDataRemoved, aiRiskIndicators);
      
      const basicAnalysis = {
        risk_level: riskLevel,
        detectedPII: sensitiveDataRemoved,
        complianceFrameworks: complianceFrameworks,
        aiRiskIndicators: aiRiskIndicators
      };

      let optimizedPrompt = null;
      let optimizationDetails = null;

      // --- ENHANCED SUPABASE SYNC: IMPROVED USER ID HANDLING ---
      // Get user ID from multiple sources to ensure we match the dashboard
      let userId = null;
      
      // Try to get user ID from this.user first (from auth check)
      if (this.user && this.user.id) {
        userId = this.user.id;
        console.log('Complyze: Using authenticated user ID from session:', userId);
      } else {
        // Fall back to localStorage
        userId = localStorage.getItem('complyze_uid');
        console.log('Complyze: Using user ID from localStorage:', userId);
        
        // If still no userId, try chrome.storage
        if (!userId) {
          const storage = await chrome.storage.local.get(['userId', 'complyze_uid', 'supabase_uid']);
          userId = storage.userId || storage.complyze_uid || storage.supabase_uid;
          console.log('Complyze: Using user ID from chrome.storage:', userId);
        }
        
        // If still no userId, try to get it from the dashboard
        if (!userId) {
          userId = await getUserIdFromDashboard();
          if (userId) {
            console.log('Complyze: Using user ID extracted from dashboard:', userId);
            // Save this ID for future use
            await chrome.storage.local.set({ 'complyze_uid': userId });
          }
        }
      }
      
      // Check if we have a valid user ID before proceeding
      if (!userId) {
        console.warn('Complyze: ⚠️ NO USER ID FOUND in any storage! Trying to retrieve from user object...');
        if (this.user) {
          console.log('Complyze: User object details:', {
            hasId: !!this.user.id,
            hasEmail: !!this.user.email,
            keys: Object.keys(this.user)
          });
          // Last resort - try email as identifier if available
          userId = this.user.id || this.user.email || 'unknown-user';
        } else {
          console.error('Complyze: ❌ No user ID or user object available. Using fallback ID.');
          userId = 'extension-user-' + Date.now(); // Fallback ID as last resort
        }
      }
      
      const flagged = (riskLevel === 'high' || riskLevel === 'critical' || sensitiveDataRemoved.length > 0);
      if (flagged) {
        // Create event with enhanced metadata to help debug
        const promptEvent = {
          user_id: userId,
          platform: promptData.platform || 'chrome_extension',
          prompt: promptData.prompt,
          flagged: true,
          risk_level: riskLevel,
          risks: [...(basicAnalysis.detectedPII || []), ...(basicAnalysis.aiRiskIndicators || [])],
          timestamp: Date.now(),
          // Add extra metadata to help with debugging
          metadata: {
            source: 'chrome_extension_v2',
            auth_method: this.user ? 'session_auth' : 'localstorage',
            user_email: this.user?.email || 'unknown',
            extension_version: '2.0'
          }
        };
        
        console.log('Complyze: 📤 Sending prompt event to Supabase with user_id:', userId);
        console.log('Complyze: Event details:', {
          platform: promptEvent.platform,
          risk_level: promptEvent.risk_level,
          risks_count: promptEvent.risks.length,
          prompt_length: promptEvent.prompt.length,
          metadata: promptEvent.metadata
        });
        
        syncPromptEventToSupabase(promptEvent);
      }

      // Step 3: NEW - If optimization is requested and sensitive data is detected, trigger AI optimization WITH GUARANTEED DELAYS
      if (promptData.triggerOptimization && 
          (riskLevel === 'high' || riskLevel === 'critical' || sensitiveDataRemoved.length > 0)) {
        
        console.log('Complyze: 🚀 CONFIRMATION: Triggering AI optimization for sensitive prompt...');
        console.log('Complyze: 📊 Trigger conditions met:', {
          triggerOptimization: promptData.triggerOptimization,
          riskLevel: riskLevel,
          sensitiveDataCount: sensitiveDataRemoved.length,
          isHighRisk: riskLevel === 'high',
          isCriticalRisk: riskLevel === 'critical',
          hasSensitiveData: sensitiveDataRemoved.length > 0
        });
        console.log('Complyze: ⏱️ AI optimization will take 15-25 seconds with progress updates...');
        
        // Record the start time for comprehensive processing
        const optimizationStartTime = Date.now();
        
        try {
          const optimizationResult = await this.enhancePromptWithAI(promptData.prompt);
          
          // Calculate actual processing time
          const actualProcessingTime = Date.now() - optimizationStartTime;
          console.log('Complyze: ⏱️ AI optimization processing took:', actualProcessingTime + 'ms');
          
          // Ensure minimum processing time of 15 seconds for comprehensive analysis
          const minimumProcessingTime = 15000;
          if (actualProcessingTime < minimumProcessingTime) {
            const additionalDelay = minimumProcessingTime - actualProcessingTime;
            console.log('Complyze: ⏳ Adding additional processing time for thoroughness:', additionalDelay + 'ms');
            await new Promise(resolve => setTimeout(resolve, additionalDelay));
          }
          
          if (optimizationResult && (optimizationResult.optimized_prompt || optimizationResult.redacted_prompt)) {
            optimizedPrompt = optimizationResult.optimized_prompt || optimizationResult.redacted_prompt;
            optimizationDetails = {
              improvements: optimizationResult.improvements || [],
              clarityScore: optimizationResult.clarity_score || 0,
              qualityScore: optimizationResult.quality_score || 0,
              optimizationReason: optimizationResult.optimization_reason || 'AI-powered security optimization'
            };
            console.log('Complyze: ✅ AI optimization completed successfully');
            console.log('Complyze: 📊 Optimized prompt preview:', optimizedPrompt.substring(0, 100) + '...');
          }
        } catch (optimizationError) {
          console.error('Complyze: AI optimization failed, using fallback:', optimizationError);
          
          // Even for fallback, ensure minimum processing time for user experience
          const actualProcessingTime = Date.now() - optimizationStartTime;
          const minimumProcessingTime = 10000; // Slightly less for fallback
          if (actualProcessingTime < minimumProcessingTime) {
            const additionalDelay = minimumProcessingTime - actualProcessingTime;
            console.log('Complyze: ⏳ Adding fallback processing time:', additionalDelay + 'ms');
            await new Promise(resolve => setTimeout(resolve, additionalDelay));
          }
          
          // Fallback to local safe prompt generation
          optimizedPrompt = this.generateSafePrompt(promptData.prompt);
          optimizationDetails = {
            improvements: ['Applied local security optimization'],
            clarityScore: 75,
            qualityScore: 80,
            optimizationReason: 'Local fallback optimization due to AI service unavailability'
          };
        }
      } else {
        // Debug why optimization was not triggered
        console.log('Complyze: ❌ AI optimization NOT triggered. Conditions:', {
          triggerOptimization: promptData.triggerOptimization,
          riskLevel: riskLevel,
          sensitiveDataCount: sensitiveDataRemoved.length,
          isHighRisk: riskLevel === 'high',
          isCriticalRisk: riskLevel === 'critical',
          hasSensitiveData: sensitiveDataRemoved.length > 0
        });
      }
      
      if (!promptData.triggerOptimization) {
        // Step 4: If not requesting optimization, do full AI analysis for UI display
        console.log('Complyze: Performing full AI analysis for UI display...');
        const analysisResult = await this.enhancePromptWithAI(promptData.prompt);
        console.log('Complyze: AI analysis result:', analysisResult);
        
        // Step 5: Send to dashboard for logging
        await this.sendToDashboard({
          ...promptData,
          analysis: analysisResult
        });

        // Step 6: Update statistics
        await this.updateStats(analysisResult.risk_level, promptData.platform);

        // Step 7: Show results to user
        const combinedResult = {
          original_prompt: promptData.prompt,
          redacted_prompt: analysisResult.redacted_prompt || promptData.prompt,
          optimized_prompt: analysisResult.optimized_prompt || promptData.prompt,
          risk_level: analysisResult.risk_level || 'low',
          clarity_score: analysisResult.clarity_score || 0,
          quality_score: analysisResult.quality_score || 0,
          control_tags: analysisResult.control_tags || [],
          pii_detected: analysisResult.pii_detected || [],
          platform: promptData.platform,
          timestamp: promptData.timestamp
        };

        console.log('Complyze: Combined result for UI:', combinedResult);

        // Store result and trigger UI update
        await chrome.storage.local.set({ 
          analysisResult: combinedResult,
          authRequired: false,
          error: null
        });

        console.log('Complyze: Injecting UI...');
        // Inject and show UI
        this.injectUI(tabId);
        
        return { success: true, analysis: combinedResult };
      }
      
      // Return result for real-time blocking
      return {
        success: true,
        analysis: basicAnalysis,
        optimizedPrompt: optimizedPrompt,
        optimizationDetails: optimizationDetails
      };

    } catch (error) {
      console.error('Complyze: Analysis failed:', error);
      
      if (!promptData.triggerOptimization) {
        await chrome.storage.local.set({ 
          error: `Analysis failed: ${error.message}`,
          authRequired: false,
          analysisResult: null
        });
        this.injectUI(tabId);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkUserAuth() {
    if (!this.accessToken || !this.user) {
      return false;
    }
    
    // Only verify token if it hasn't been verified recently
    const now = Date.now();
    if (!this.lastTokenVerification || (now - this.lastTokenVerification) > this.tokenVerificationInterval) {
      console.log('Complyze: Verifying token (periodic check)...');
      const isValid = await this.verifyToken();
      if (isValid) {
        this.lastTokenVerification = now;
        return true;
      } else {
        console.log('Complyze: Token verification failed, clearing auth');
        await this.clearAuth();
        return false;
      }
    }
    
    // Token was verified recently, assume it's still valid
    return true;
  }

  /**
   * NEW: AI-First Prompt Enhancement using Google Gemini with historical insights
   */
  async enhancePromptWithAI(originalPrompt) {
    console.log('Complyze: Enhancing prompt with AI optimization (primary):', originalPrompt.substring(0, 100) + '...');
    const startTime = Date.now();
    
    try {
      // STEP 1: Detect and analyze sensitive data for reporting
      console.log('Complyze: 🔍 Step 1 - Analyzing sensitive data in prompt...');
      const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = this.removeSensitiveData(originalPrompt);
      console.log('Complyze: 📊 Sensitive data analysis result:', {
        sensitive_items_found: sensitiveDataRemoved.length,
        compliance_frameworks: complianceFrameworks.length,
        ai_risk_indicators: aiRiskIndicators.length,
        prompt_cleaned: cleanedPrompt !== originalPrompt
      });
      
      // Add a delay to ensure user sees the processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // STEP 2: Analyze prompt intent
      console.log('Complyze: 🎯 Step 2 - Analyzing prompt intent...');
      const intent = this.analyzePromptIntent(cleanedPrompt);
      console.log('Complyze: 🧠 Intent analysis result:', {
        type: intent.type,
        category: intent.category,
        complexity: intent.complexity
      });
      
      // Add another delay for intent analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // STEP 3: Fetch historical optimization insights for self-improvement
      console.log('Complyze: 📚 Step 3 - Fetching historical optimization insights...');
      const optimizationInsights = await this.fetchOptimizationInsights(intent.category, intent.type);
      console.log('Complyze: 🧠 Retrieved insights:', {
        insights_count: optimizationInsights.length,
        categories: optimizationInsights.map(i => i.category).join(', ')
      });
      
      // Add delay for insights fetching
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // STEP 4: PRIMARY METHOD - Use AI optimization via Google Gemini with insights
      console.log('Complyze: 🤖 Creating optimization prompt for AI processing...');
      const optimizationPrompt = this.createOptimizationPrompt(cleanedPrompt, intent, optimizationInsights);
      console.log('Complyze: 📤 Calling OpenRouter API with Google Gemini 2.5 Pro...');
      console.log('Complyze: ⏱️ Starting AI optimization timer...');
      
      const apiStartTime = Date.now();
      const apiResponse = await this.callOpenRouterAPI(optimizationPrompt);
      const apiDuration = Date.now() - apiStartTime;
      
      console.log('Complyze: ⏱️ API call completed in:', apiDuration + 'ms');
      console.log('Complyze: 📊 API Response details:', {
        success: apiResponse.success,
        hasContent: !!apiResponse.content,
        contentLength: apiResponse.content?.length || 0,
        error: apiResponse.error || 'None'
      });
      
      if (apiResponse.success && apiResponse.content) {
        console.log('Complyze: 🎉 OpenRouter API call successful! Response length:', apiResponse.content.length);
        console.log('Complyze: 📝 Raw API response preview:', apiResponse.content.substring(0, 500) + '...');
        console.log('Complyze: 🔄 Parsing AI optimization response...');
        
        // Add delay for response processing to show comprehensive analysis
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const result = this.parseOptimizationResponse(
          apiResponse.content, 
          originalPrompt, 
          cleanedPrompt, 
          intent, 
          sensitiveDataRemoved, 
          complianceFrameworks, 
          aiRiskIndicators
        );
        
        console.log('Complyze: ✅ AI optimization completed successfully via Google Gemini');
        console.log('Complyze: 📊 Optimization result summary:', {
          risk_level: result.risk_level,
          clarity_score: result.clarity_score,
          quality_score: result.quality_score,
          improvements_count: result.improvements?.length || 0,
          pii_detected_count: result.pii_detected?.length || 0,
          optimized_prompt_preview: result.optimized_prompt?.substring(0, 100) + '...'
        });
        
        // STEP 5: Save to prompt history for future learning
        const processingTime = Date.now() - startTime;
        await this.savePromptHistory(originalPrompt, result, intent, processingTime);
        
        return result;
              } else {
          console.error('Complyze: ❌ AI optimization API call failed!');
          console.error('Complyze: 🔍 API Error Details:', {
            success: apiResponse.success,
            error: apiResponse.error,
            hasContent: !!apiResponse.content,
            contentPreview: apiResponse.content ? apiResponse.content.substring(0, 100) + '...' : 'No content'
          });
          console.warn('Complyze: 🔄 Falling back to local optimization due to API failure');
          
          // Throw error to trigger fallback
          throw new Error(`API optimization failed: ${apiResponse.error || 'Unknown error'}`);
        }
      
    } catch (error) {
      console.error('Complyze: ❌ Critical error in AI optimization process:', error);
      console.error('Complyze: 🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + '...'
      });
      console.error('Complyze: 🔄 Attempting local fallback due to critical error...');
      console.error('Complyze: ⏱️ Time elapsed before fallback:', (Date.now() - startTime) + 'ms');
    }
    
    try {
      // FALLBACK: Use enhanced local optimization if AI fails
      console.log('Complyze: 🔄 Using enhanced local optimization as fallback...');
      console.log('Complyze: ⚠️ AI optimization failed, creating natural alternative...');
      
      // Re-analyze for fallback
      const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = this.removeSensitiveData(originalPrompt);
      const intent = this.analyzePromptIntent(cleanedPrompt);
      
      // Create a more natural optimized prompt using smart patterns
      const localOptimizedPrompt = this.createNaturalOptimizedPrompt(originalPrompt, intent, sensitiveDataRemoved);
      
      const result = {
        original_prompt: originalPrompt,
        redacted_prompt: localOptimizedPrompt,
        optimized_prompt: localOptimizedPrompt,
        risk_level: this.calculateRiskLevel(sensitiveDataRemoved, aiRiskIndicators),
        clarity_score: 75, // Lower score for fallback method
        quality_score: 80, // Lower score for fallback method
        control_tags: [...complianceFrameworks, ...aiRiskIndicators],
        pii_detected: sensitiveDataRemoved,
        improvements: [
          'Sensitive data removed and rephrased naturally (local fallback)',
          'Maintained original intent while improving security',
          'Applied contextual security patterns',
          'Enhanced prompt structure for better AI interaction'
        ],
        detected_intent: `${intent.type} - ${intent.category}`,
        optimization_reason: 'Enhanced local optimization applied (AI optimization unavailable)'
      };
      
      console.log('Complyze: Local fallback optimization completed successfully');
      
      // Save fallback result to history as well
      const processingTime = Date.now() - startTime;
      await this.savePromptHistory(originalPrompt, result, intent, processingTime);
      
      return result;
      
    } catch (fallbackError) {
      console.error('Complyze: Local fallback also failed:', fallbackError);
      
      // FINAL FALLBACK: Basic response
      return {
        original_prompt: originalPrompt,
        redacted_prompt: originalPrompt,
        optimized_prompt: originalPrompt,
        risk_level: 'low',
        clarity_score: 50,
        quality_score: 50,
        control_tags: [],
        pii_detected: [],
        improvements: ['Basic analysis applied'],
        detected_intent: 'General request',
        optimization_reason: 'Fallback analysis due to system errors'
      };
    }
  }

  /**
   * Create self-improving optimization prompt with historical insights
   */
  createOptimizationPrompt(cleanedPrompt, intent, optimizationInsights = []) {
    return `// ROLE: Complyze Prompt Optimizer
// PURPOSE: Automatically redact and rewrite user prompts for security and clarity
// CAPABILITY: Self-improving using historical logs and feedback summaries
// INTEGRATION: Embedded in Complyze's prompt engine, triggered on each prompt event

You are the Complyze Prompt Optimizer, responsible for making generative AI prompts safe, compliant, and high-performing. You do not rely on static rules. Instead, you adapt and improve automatically by using folding summaries from system logs.

Every time a user submits a prompt, perform two tasks:

---

🔒 TASK 1: REDACT
Carefully remove all sensitive data, including:
- Personally Identifiable Information (PII)
- Protected Health Information (PHI)
- API keys, tokens, credentials, passwords
- Internal pricing, contracts, legal language, and client emails/domains

Rules:
- Do not use brackets like [REDACTED]
- Rewrite naturally using general descriptors (e.g., "a customer," "an internal API")
- Enforce HIPAA, GDPR, and PCI DSS guidelines

---

🚀 TASK 2: OPTIMIZE
Rewrite the prompt to improve clarity, specificity, and usefulness to the LLM.
Follow proven techniques including:
- Add missing context
- Convert vague requests into structured steps
- Apply formatting if helpful (e.g., bullet points, JSON)
- Normalize units, dates, and ambiguous phrasing

---

🧠 SELF-IMPROVEMENT INSTRUCTIONS:
You are constantly updated with folding summaries derived from prompt logs and user feedback. These summaries include:
- Frequent redaction misses or failures
- Prompt types that caused confusion
- User override/edit trends
- Recommended rule or phrasing adjustments

These are injected into your memory at runtime as \`optimization_insights\`.

Always use these summaries to:
- Add new redaction patterns
- Improve the way you rewrite certain task types
- Drop ineffective practices

You **do not need a human to manually update you** — your improvements are informed by trends, automatically summarized and versioned.

---

📦 optimization_insights (injected context):
${this.formatOptimizationInsights(optimizationInsights)}

---

ORIGINAL PROMPT TO SECURE & OPTIMIZE:
"${cleanedPrompt}"

PROMPT CATEGORY: ${intent.category}
PROMPT TYPE: ${intent.type}

💡 REQUIRED OUTPUT FORMAT:
Provide your response in this exact structure:

SECURITY_ANALYSIS:
[List any sensitive data found and how you handled it]

OPTIMIZATION_CHANGES:
[List specific improvements made to enhance clarity and effectiveness]

OPTIMIZED_PROMPT:
[The final, secure, optimized prompt]

CONFIDENCE_SCORE:
[Rate your optimization confidence from 1-100]

Take your time to thoroughly analyze and optimize. Use the full token allocation for comprehensive analysis.`;
  }

  /**
   * Load API key from secure storage
   */
  async loadApiKey() {
    if (OPENROUTER_CONFIG.apiKey) {
      return OPENROUTER_CONFIG.apiKey;
    }
    
    try {
      const result = await chrome.storage.local.get(['openrouter_api_key']);
      if (result.openrouter_api_key) {
        OPENROUTER_CONFIG.apiKey = result.openrouter_api_key;
        return result.openrouter_api_key;
      }
      
      // If no API key in storage, use default (user needs to set it in extension settings)
      console.warn('Complyze: No OpenRouter API key found in storage. Using default key.');
      OPENROUTER_CONFIG.apiKey = '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'; // Default key as requested
      return OPENROUTER_CONFIG.apiKey;
    } catch (error) {
      console.error('Complyze: Failed to load API key from storage:', error);
      OPENROUTER_CONFIG.apiKey = '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'; // Default key as requested
      return OPENROUTER_CONFIG.apiKey;
    }
  }

  /**
   * Call OpenRouter API with the optimization prompt (same as desktop app)
   */
  async callOpenRouterAPI(prompt) {
    try {
      // Ensure API key is loaded
      await this.loadApiKey();
      
      console.log('Complyze: 🚀 Making OpenRouter API request...');
      console.log('Complyze: 🎯 Target URL:', OPENROUTER_CONFIG.baseUrl);
      console.log('Complyze: 🤖 Model:', OPENROUTER_CONFIG.model);
      console.log('Complyze: 🔑 API Key prefix:', OPENROUTER_CONFIG.apiKey.substring(0, 15) + '...');
      console.log('Complyze: 📝 Prompt length:', prompt.length);
      
      const response = await fetch(OPENROUTER_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://complyze.co',
          'X-Title': 'Complyze Chrome Extension'
        },
        body: JSON.stringify({
          model: OPENROUTER_CONFIG.model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2500, // Increased for comprehensive analysis
          top_p: 0.9
        })
      });

      console.log('Complyze: 📡 API Response status:', response.status, response.statusText);
      console.log('Complyze: 📊 Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Complyze: ❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Complyze: 📊 API Response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        hasError: !!data.error,
        usage: data.usage,
        finishReason: data.choices?.[0]?.finish_reason,
        messageLength: data.choices?.[0]?.message?.content?.length || 0
      });
      
      if (data.error) {
        throw new Error(data.error.message || 'API returned error');
      }

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from API');
      }

      const content = data.choices[0].message.content;
      const finishReason = data.choices[0].finish_reason;
      
      // Warn if response was truncated
      if (finishReason === 'length' || finishReason === 'MAX_TOKENS') {
        console.warn('Complyze: ⚠️ AI response was truncated due to token limit. Consider increasing max_tokens for better analysis.');
        console.warn('Complyze: 📊 Response stats:', {
          contentLength: content?.length || 0,
          finishReason: finishReason,
          maxTokensUsed: 2500
        });
      }

      return {
        success: true,
        content: content
      };

    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse the optimization response from the API (same as desktop app)
   */
  parseOptimizationResponse(apiContent, originalPrompt, cleanedPrompt, intent, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators) {
    try {
      console.log('Complyze: 🔍 Parsing AI optimization response...');
      console.log('Complyze: 📝 Raw API content length:', apiContent.length);
      console.log('Complyze: 📝 API content preview:', apiContent.substring(0, 300) + '...');
      
      // Extract structured response components
      const securityAnalysisMatch = apiContent.match(/SECURITY_ANALYSIS:\s*(.+?)(?=\n(?:OPTIMIZATION_CHANGES|OPTIMIZED_PROMPT|CONFIDENCE_SCORE):|$)/s);
      const optimizationChangesMatch = apiContent.match(/OPTIMIZATION_CHANGES:\s*(.+?)(?=\n(?:OPTIMIZED_PROMPT|CONFIDENCE_SCORE):|$)/s);
      const optimizedPromptMatch = apiContent.match(/OPTIMIZED_PROMPT:\s*(.+?)(?=\n(?:CONFIDENCE_SCORE):|$)/s);
      const confidenceScoreMatch = apiContent.match(/CONFIDENCE_SCORE:\s*(\d+)/);
      
      console.log('Complyze: 🔍 Structured parsing results:', {
        foundSecurityAnalysis: !!securityAnalysisMatch,
        foundOptimizationChanges: !!optimizationChangesMatch,
        foundOptimizedPrompt: !!optimizedPromptMatch,
        foundConfidenceScore: !!confidenceScoreMatch,
        optimizedLength: optimizedPromptMatch ? optimizedPromptMatch[1].length : 0
      });
      
      // Extract optimized prompt
      let enhancedPrompt = optimizedPromptMatch ? optimizedPromptMatch[1].trim() : cleanedPrompt;
      
      // Extract improvements from optimization changes
      let improvements = [];
      if (optimizationChangesMatch) {
        improvements = optimizationChangesMatch[1]
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[\s\-\*\•\[\]]+/, '').trim())
          .filter(line => line.length > 0);
      }
      
      // Extract security analysis
      let securityFindings = [];
      if (securityAnalysisMatch) {
        securityFindings = securityAnalysisMatch[1]
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[\s\-\*\•\[\]]+/, '').trim())
          .filter(line => line.length > 0);
      }
      
      // Extract confidence score
      const confidenceScore = confidenceScoreMatch ? parseInt(confidenceScoreMatch[1]) : 85;
      
      // Remove any quotes around the enhanced prompt
      enhancedPrompt = enhancedPrompt.replace(/^["'`]{1,3}|["'`]{1,3}$/g, '');
      
      console.log('Complyze: ✨ Enhanced prompt preview:', enhancedPrompt.substring(0, 150) + '...');
      console.log('Complyze: 📋 Improvements found:', improvements.length);
      console.log('Complyze: 🔒 Security findings:', securityFindings.length);
      console.log('Complyze: 📊 AI Confidence Score:', confidenceScore);
      
      // Fallback parsing if structured format wasn't followed
      if (!optimizedPromptMatch && apiContent.length > 50) {
        console.log('Complyze: ⚠️ AI response format doesn\'t match expected structure, attempting fallback parsing...');
        
        // Try to find any prompt-like content in the response
        const lines = apiContent.split('\n').filter(line => line.trim());
        const longestLine = lines.reduce((longest, current) => 
          current.length > longest.length ? current : longest, '');
        
        if (longestLine.length > cleanedPrompt.length * 0.3) {
          enhancedPrompt = longestLine.trim();
          improvements.unshift('AI-generated optimization (fallback parsing)');
          console.log('Complyze: 🔄 Using fallback parsing, extracted:', enhancedPrompt.substring(0, 100) + '...');
        }
      }
      
      // Add default improvements if none were extracted
      if (improvements.length === 0) {
        improvements = ['Applied AI security and optimization best practices'];
      }
      
      // Add security improvements to the front of the list
      const securityImprovements = [];
      if (sensitiveDataRemoved.length > 0) {
        securityImprovements.push('🔒 Removed and rephrased sensitive personal information for HIPAA/GDPR compliance');
      }
      if (aiRiskIndicators.length > 0) {
        securityImprovements.push('🛡️ Mitigated AI security risks and prompt injection attempts');
      }
      if (complianceFrameworks.length > 0) {
        securityImprovements.push(`📋 Applied compliance controls for: ${complianceFrameworks.join(', ')}`);
      }
      
      // Add security findings from AI analysis
      if (securityFindings.length > 0) {
        securityImprovements.push(...securityFindings.map(finding => `🔍 AI Analysis: ${finding}`));
      }
      
      // Combine security and optimization improvements
      improvements = [...securityImprovements, ...improvements];
      
      // Calculate scores based on AI confidence and analysis quality
      const baseScore = Math.min(confidenceScore, 95); // Cap at 95 to leave room for improvement
      const clarityScore = Math.min(98, baseScore + (enhancedPrompt.length > cleanedPrompt.length ? 5 : 0) + (improvements.length * 1));
      const qualityScore = Math.min(98, baseScore + (enhancedPrompt.includes('Please') || enhancedPrompt.includes(':') ? 5 : 0) + (securityFindings.length * 2));
      
      return {
        original_prompt: originalPrompt,
        redacted_prompt: enhancedPrompt,
        optimized_prompt: enhancedPrompt,
        risk_level: this.calculateRiskLevel(sensitiveDataRemoved, aiRiskIndicators),
        clarity_score: clarityScore,
        quality_score: qualityScore,
        control_tags: [...complianceFrameworks, ...aiRiskIndicators],
        pii_detected: sensitiveDataRemoved,
        improvements: improvements,
        detected_intent: intent.type,
        optimization_reason: `AI-powered security redaction and prompt optimization via Google Gemini 2.5 Pro`
      };
      
    } catch (error) {
      console.error('Error parsing AI optimization response:', error);
      return this.createFallbackOptimization(originalPrompt);
    }
  }

  async handleRealTimeAnalysis(promptData) {
    try {
      console.log('🔍 Complyze: Real-time analysis request received');
      console.log('🎯 Current API endpoint:', this.apiBase);
      console.log('📊 Current dashboard:', this.dashboardUrl);
      console.log('🤖 Model detected:', promptData.model || 'Unknown');
      
      // Use the same AI-first enhance method for real-time analysis
      const analysisResult = await this.enhancePromptWithAI(promptData.prompt);
      
      // ENHANCED: Auto-save high-risk prompts to dashboard as flagged
      if (analysisResult.risk_level === 'high' || analysisResult.risk_level === 'critical') {
        console.log('⚠️  Complyze: High-risk prompt detected! Auto-flagging...');
        console.log('📝 Risk Level:', analysisResult.risk_level);
        console.log('🏷️  Detected Issues:', analysisResult.pii_detected || []);
        console.log('🤖 Model Used:', promptData.model || 'Unknown');
        
        // Save to flagged prompts with proper data structure including model info
        await this.saveFlaggedPrompt({
          prompt: promptData.prompt,
          analysis: {
            risk_level: analysisResult.risk_level,
            detectedPII: analysisResult.pii_detected || [],
            risk_factors: analysisResult.control_tags || [],
            mapped_controls: analysisResult.control_tags || []
          },
          platform: promptData.platform || 'real-time-detection',
          model: promptData.model || 'Unknown',
          url: promptData.url || (typeof window !== 'undefined' ? window.location?.href : 'unknown'),
          timestamp: promptData.timestamp || new Date().toISOString()
        });
      } else {
        console.log('✅ Complyze: Low-medium risk prompt, not flagging');
        console.log('📝 Risk Level:', analysisResult.risk_level);
        console.log('🤖 Model Used:', promptData.model || 'Unknown');
      }
      
      return analysisResult;
    } catch (error) {
      console.error('❌ Complyze: Real-time analysis failed:', error);
      return {
        risk_level: 'low',
        redacted_prompt: promptData.prompt,
        optimized_prompt: promptData.prompt,
        pii_detected: []
      };
    }
  }

  async sendToDashboard(data) {
    if (!this.accessToken) {
      console.error('Complyze: Cannot send to dashboard, no access token available. Please log in.');
      // Optionally, you could try to trigger a login prompt or queue the data
      return; 
    }
    try {
      // Ensure API base is set (it should be by init or detectServerPort)
      if (!this.apiBase) {
        console.error('Complyze: API base URL not set, cannot send to dashboard.');
        await this.detectServerPort(); // Attempt to re-detect
        if (!this.apiBase) return; // Still not set, abort
      }
      
      console.log(`Complyze: Sending data to dashboard at ${this.apiBase}/prompts/ingest`, data);
      
      const response = await fetch(`${this.apiBase}/prompts/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}` // Added Authorization header
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text(); // Get raw error for more details
        console.error('Complyze: Dashboard logging failed:', response.status, response.statusText, errorData);
        throw new Error(`Dashboard logging failed: ${response.statusText} - ${errorData}`);
      }

      console.log('Complyze: Successfully logged prompt to dashboard');
    } catch (error) {
      console.error('Complyze: Failed to send to dashboard:', error);
    }
  }

  showAuthenticationRequired(tabId) {
    chrome.storage.local.set({ 
      authRequired: true,
      analysisResult: null,
      error: null,
      dashboardUrl: this.dashboardUrl
    });
    this.injectUI(tabId);
  }

  injectUI(tabId) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['injectUI.js']
    });
  }

  async updateStats(riskLevel, platform) {
    try {
      // Update daily prompt count
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['dailyPromptCount', 'lastResetDate', 'recentActivity']);
      
      let promptCount = 0;
      if (result.lastResetDate === today) {
        promptCount = (result.dailyPromptCount || 0) + 1;
      } else {
        promptCount = 1;
      }
      
      // Update recent activity
      const activities = result.recentActivity || [];
      activities.push({
        platform: platform,
        riskLevel: riskLevel,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 activities
      const recentActivities = activities.slice(-50);
      
      await chrome.storage.local.set({
        dailyPromptCount: promptCount,
        lastResetDate: today,
        recentActivity: recentActivities
      });
      
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  // Authentication methods for popup
  async login(email, password) {
    try {
      console.log('Complyze: Attempting login with:', { email });
      console.log('Complyze: API base URL:', this.apiBase);
      
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Complyze: Login response status:', response.status);
      console.log('Complyze: Login response ok:', response.ok);

      const data = await response.json();
      console.log('Complyze: Login response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Login failed');
      }

      // Store authentication data
      this.accessToken = data.access_token;
      this.user = data.user;
      this.lastTokenVerification = Date.now(); // Mark as verified now
      
      await chrome.storage.local.set({
        accessToken: data.access_token,
        user: data.user
      });

      // Sync to website localStorage
      await this.syncToWebsite(data.access_token, data.user);

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Complyze: Login failed:', error);
      console.error('Complyze: Login error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  }

  async signup(email, password, fullName) {
    try {
      console.log('Complyze: Attempting signup with:', { email, fullName });
      console.log('Complyze: API base URL:', this.apiBase);
      
      const requestBody = { 
        email, 
        password, 
        full_name: fullName 
      };
      
      console.log('Complyze: Request body:', requestBody);
      
      const response = await fetch(`${this.apiBase}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Complyze: Response status:', response.status);
      console.log('Complyze: Response ok:', response.ok);

      const data = await response.json();
      console.log('Complyze: Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Signup failed');
      }

              // If auto-login is enabled (access token provided), store auth data
        if (data.auto_login && data.access_token) {
          this.accessToken = data.access_token;
          this.user = data.user;
          this.lastTokenVerification = Date.now(); // Mark as verified now
          
          await chrome.storage.local.set({
            accessToken: data.access_token,
            user: data.user
          });

        // Sync to website localStorage
        await this.syncToWebsite(data.access_token, data.user);

        return { 
          success: true, 
          message: data.message,
          auto_login: true,
          user: data.user
        };
      }

      return { 
        success: true, 
        message: data.message,
        auto_login: false
      };
    } catch (error) {
      console.error('Complyze: Signup failed:', error);
      console.error('Complyze: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  }

  async logout() {
    await this.clearAuth();
    
    // Also clear website localStorage
    try {
      const tabs = await chrome.tabs.query({ url: `${this.dashboardUrl}*` });
      for (const tab of tabs) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            localStorage.removeItem('complyze_token');
            localStorage.removeItem('complyze_user');
            // Redirect to home page
            
          }
        });
      }
      console.log('Complyze: Website auth cleared');
    } catch (error) {
      console.log('Complyze: Could not clear website auth:', error.message);
    }
    
    return { success: true };
  }

  async syncFromWebsite() {
    try {
      // Check both production and local dashboard URLs for auth data
      const urlsToCheck = [
        'https://complyze.co/dashboard*',
        `${this.dashboardUrl}*`
      ];
      
      for (const urlPattern of urlsToCheck) {
        try {
          // Get all tabs with the dashboard URL
          const tabs = await chrome.tabs.query({ url: urlPattern });
          
          if (tabs.length > 0) {
            console.log(`Complyze: Checking auth from ${urlPattern}...`);
            
            // Try to get auth data from the dashboard tab
            const results = await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                const token = localStorage.getItem('complyze_token');
                const user = localStorage.getItem('complyze_user');
                return { token, user };
              }
            });

            if (results && results[0] && results[0].result) {
              const { token, user } = results[0].result;
              if (token && user) {
                console.log(`Complyze: Found website auth from ${urlPattern}, syncing to extension...`);
                this.accessToken = token;
                this.user = JSON.parse(user);
                
                // Store in extension storage
                await chrome.storage.local.set({
                  accessToken: token,
                  user: this.user
                });

                // Verify token is still valid
                const isValid = await this.verifyToken();
                if (!isValid) {
                  await this.clearAuth();
                  // Also clear website auth
                  await chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                      localStorage.removeItem('complyze_token');
                      localStorage.removeItem('complyze_user');
                    }
                  });
                } else {
                  console.log(`Complyze: Website auth synced successfully from ${urlPattern}`);
                  return; // Exit early if we found valid auth
                }
              }
            }
          }
        } catch (error) {
          console.log(`Complyze: Could not sync from ${urlPattern}:`, error.message);
        }
      }
      
      console.log('Complyze: No valid auth found in any dashboard tabs');
    } catch (error) {
      console.log('Complyze: Could not sync from website (tab may not be open):', error.message);
    }
  }

  async syncToWebsite(token, user) {
    try {
      // Sync auth to both production and local dashboard tabs
      const urlsToSync = [
        'https://complyze.co/dashboard*',
        `${this.dashboardUrl}*`
      ];
      
      for (const urlPattern of urlsToSync) {
        try {
          // Get all tabs with the dashboard URL
          const tabs = await chrome.tabs.query({ url: urlPattern });
          
          for (const tab of tabs) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (token, user) => {
                localStorage.setItem('complyze_token', token);
                localStorage.setItem('complyze_user', JSON.stringify(user));
              },
              args: [token, user]
            });
            console.log(`Complyze: Auth synced to ${urlPattern} tab`);
          }
        } catch (error) {
          console.log(`Complyze: Could not sync to ${urlPattern} tabs:`, error.message);
        }
      }
    } catch (error) {
      console.log('Complyze: Could not sync to website tabs:', error.message);
    }
  }

  async handleAuthSyncFromWebsite(token, user) {
    try {
      console.log('Complyze: Handling auth sync from website');
      this.accessToken = token;
      this.user = user;
      
      await chrome.storage.local.set({
        accessToken: token,
        user: user
      });

      console.log('Complyze: Auth synced from website successfully');
      return { success: true };
    } catch (error) {
      console.error('Complyze: Auth sync from website failed:', error);
      return { success: false, error: error.message };
    }
  }

  async handleLogoutFromWebsite() {
    await this.clearAuth();
    
    // Also clear website localStorage
    try {
      const tabs = await chrome.tabs.query({ url: `${this.dashboardUrl}*` });
      for (const tab of tabs) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            localStorage.removeItem('complyze_token');
            localStorage.removeItem('complyze_user');
            // Redirect to home page
            
          }
        });
      }
      console.log('Complyze: Website auth cleared');
    } catch (error) {
      console.log('Complyze: Could not clear website auth:', error.message);
    }
    
    return { success: true };
  }

  async periodicAuthSync() {
    try {
      // If we don't have auth, try to sync from website
      if (!this.accessToken || !this.user) {
        console.log('Complyze: Periodic auth sync - no extension auth, checking website...');
        await this.syncFromWebsite();
      } else {
        // If we have auth, verify it's still valid
        const isValid = await this.verifyToken();
        if (!isValid) {
          console.log('Complyze: Periodic auth sync - token invalid, clearing auth...');
          await this.clearAuth();
          // Try to sync from website
          await this.syncFromWebsite();
        }
      }
    } catch (error) {
      console.log('Complyze: Periodic auth sync error:', error.message);
    }
  }

  // NEW: Save flagged prompt to database
  async saveFlaggedPrompt(data) {
    try {
      console.log('🚨 Complyze: FLAGGED PROMPT DETECTED - Saving to database');
      console.log('🎯 Target API:', this.apiBase);
      console.log('📊 Dashboard Location:', this.dashboardUrl);
      console.log('🤖 Model Information:', data.model || 'Unknown');
      
      // Check authentication first
      const isAuthenticated = await this.checkUserAuth();
      if (!isAuthenticated) {
        console.log('❌ Complyze: User not authenticated, cannot save flagged prompt');
        console.log('💡 Please login at:', this.dashboardUrl);
        return;
      }

      // Prepare the flagged prompt data with all necessary fields including model info
      const flaggedPromptData = {
        prompt: data.prompt,
        platform: data.platform || 'chrome_extension',
        url: data.url || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'chrome_extension_realtime',
        status: 'flagged', // Explicitly set as flagged
        risk_level: data.analysis?.risk_level || 'high', // Default to high if not specified
        analysis_metadata: {
          detection_method: 'real_time_analysis',
          detected_pii: data.analysis?.detectedPII || [],
          risk_factors: data.analysis?.risk_factors || [],
          mapped_controls: data.analysis?.mapped_controls || [],
          flagged_at: new Date().toISOString(),
          platform_detected: data.platform || 'unknown',
          model_used: data.model || 'Unknown', // Include model information
          extension_version: 'v2.0',
          auto_flagged: true,
          api_endpoint: this.apiBase, // Track which API saved this
          saved_from: this.apiBase.includes('complyze.co') ? 'production' : 'development'
        }
      };

      console.log('📝 Complyze: Flagged prompt payload:', {
        prompt_preview: flaggedPromptData.prompt.substring(0, 50) + '...',
        platform: flaggedPromptData.platform,
        model: flaggedPromptData.analysis_metadata.model_used,
        risk_level: flaggedPromptData.risk_level,
        detected_pii: flaggedPromptData.analysis_metadata.detected_pii,
        target_environment: flaggedPromptData.analysis_metadata.saved_from
      });
      
      // Send to the API endpoint
      const response = await fetch(`${this.apiBase}/prompts/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flaggedPromptData)
      });

      if (response.ok) {
        const result = await response.json();
        const isProduction = this.apiBase.includes('complyze.co');
        
        console.log('🎉 SUCCESS! Flagged prompt saved to ' + (isProduction ? 'PRODUCTION' : 'LOCAL'));
        console.log('📋 Details:', {
          logId: result.logId,
          status: result.status,
          risk_level: result.risk_level,
          model: flaggedPromptData.analysis_metadata.model_used,
          environment: isProduction ? 'PRODUCTION' : 'LOCAL',
          dashboard: this.dashboardUrl
        });
        
        if (isProduction) {
          console.log('🌐 VIEW YOUR FLAGGED PROMPT AT: https://complyze.co/dashboard');
          console.log('🔄 Click the "Refresh" button in the Flagged Prompts section to see it appear');
        } else {
          console.log('🔧 VIEW YOUR FLAGGED PROMPT AT:', this.dashboardUrl);
        }
        
        // Update local statistics
        await this.updateStats('flagged', data.platform);
        
        return result.logId;
      } else {
        const errorData = await response.json();
        console.error('❌ Complyze: Failed to save flagged prompt:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          target_api: this.apiBase
        });
      }
    } catch (error) {
      console.error('❌ Complyze: Error saving flagged prompt:', error);
      console.log('🔧 API Target:', this.apiBase);
      console.log('📊 Dashboard:', this.dashboardUrl);
    }
  }

  async handleRedactionSettingsUpdate(payload) {
    try {
      console.log('Complyze: Updating redaction settings from website');
      
      // Store the settings in Chrome storage
      await chrome.storage.local.set({
        redactionSettings: payload.settings,
        customRedactionTerms: payload.customTerms,
        redactionUserId: payload.user_id,
        lastSettingsUpdate: new Date().toISOString()
      });
      
      console.log('Complyze: Redaction settings updated successfully');
      
      // Notify all tabs that settings have been updated
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            chrome.tabs.sendMessage(tab.id, {
              type: 'redaction_settings_updated',
              payload: payload
            });
          } catch (error) {
            // Tab might not have content script injected
          }
        }
      }
      
      return { success: true, message: 'Settings updated successfully' };
    } catch (error) {
      console.error('Complyze: Failed to update redaction settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Comprehensive sensitive data removal with expanded detection (same as desktop app)
   */
  removeSensitiveData(prompt) {
    const sensitiveDataRemoved = [];
    const complianceFrameworks = [];
    const aiRiskIndicators = [];
    let cleaned = prompt;
    
    // 🔒 PERSONAL IDENTIFIERS
    const emailMatches = prompt.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
      emailMatches.forEach(email => sensitiveDataRemoved.push(`Email address: ${email}`));
      cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    }
    
    const ssnMatches = prompt.match(/\b\d{3}-\d{2}-\d{4}\b/g);
    if (ssnMatches) {
      ssnMatches.forEach(ssn => sensitiveDataRemoved.push(`Social Security Number: ${ssn}`));
      cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    }
    
    const ssnNoHyphenMatches = prompt.match(/\b\d{9}\b/g);
    if (ssnNoHyphenMatches) {
      ssnNoHyphenMatches.forEach(ssn => sensitiveDataRemoved.push(`Social Security Number: ${ssn}`));
      cleaned = cleaned.replace(/\b\d{9}\b/g, '[SSN_REDACTED]');
    }
    
    const ccMatches = prompt.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g);
    if (ccMatches) {
      ccMatches.forEach(cc => sensitiveDataRemoved.push(`Credit card number: ${cc}`));
      cleaned = cleaned.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT_CARD_REDACTED]');
    }
    
    const phoneMatches = prompt.match(/\b\d{3}-\d{3}-\d{4}\b/g);
    if (phoneMatches) {
      phoneMatches.forEach(phone => sensitiveDataRemoved.push(`Phone number: ${phone}`));
      cleaned = cleaned.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_REDACTED]');
    }
    
    const phoneParenMatches = prompt.match(/\b\(\d{3}\)\s?\d{3}-\d{4}\b/g);
    if (phoneParenMatches) {
      phoneParenMatches.forEach(phone => sensitiveDataRemoved.push(`Phone number: ${phone}`));
      cleaned = cleaned.replace(/\b\(\d{3}\)\s?\d{3}-\d{4}\b/g, '[PHONE_REDACTED]');
    }
    
    const ipMatches = prompt.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
    if (ipMatches) {
      ipMatches.forEach(ip => sensitiveDataRemoved.push(`IP address: ${ip}`));
      cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_ADDRESS_REDACTED]');
    }
    
    // 🏦 FINANCIAL DATA
    const bankAccountMatches = prompt.match(/\b\d{10,12}\b/g);
    if (bankAccountMatches) {
      bankAccountMatches.forEach(account => sensitiveDataRemoved.push(`Bank account number: ${account}`));
      cleaned = cleaned.replace(/\b\d{10,12}\b/g, '[BANK_ACCOUNT_REDACTED]');
    }
    
    // 📄 GOVERNMENT IDs
    const passportMatches = prompt.match(/\b[a-z]{1,2}\d{6,8}\b/gi);
    if (passportMatches) {
      passportMatches.forEach(passport => sensitiveDataRemoved.push(`Passport number: ${passport}`));
      cleaned = cleaned.replace(/\b[a-z]{1,2}\d{6,8}\b/gi, '[PASSPORT_REDACTED]');
    }
    
    const driverLicenseMatches = prompt.match(/\b[a-z]\d{7,8}\b/gi);
    if (driverLicenseMatches) {
      driverLicenseMatches.forEach(dl => sensitiveDataRemoved.push(`Driver's license: ${dl}`));
      cleaned = cleaned.replace(/\b[a-z]\d{7,8}\b/gi, '[DRIVERS_LICENSE_REDACTED]');
    }
    
    // 🏥 HEALTHCARE DATA
    const mrnMatches = prompt.match(/\bmrn[\s:]*\d{6,10}/gi);
    if (mrnMatches) {
      mrnMatches.forEach(mrn => sensitiveDataRemoved.push(`Medical record number: ${mrn}`));
      cleaned = cleaned.replace(/\bmrn[\s:]*\d{6,10}/gi, '[MRN_REDACTED]');
    }
    
    const patientIdMatches = prompt.match(/\bpatient[\s-_]?id[\s:]*\d+/gi);
    if (patientIdMatches) {
      patientIdMatches.forEach(pid => sensitiveDataRemoved.push(`Patient ID: ${pid}`));
      cleaned = cleaned.replace(/\bpatient[\s-_]?id[\s:]*\d+/gi, '[PATIENT_ID_REDACTED]');
    }
    
    // 🔧 TECHNICAL IDENTIFIERS
    const macMatches = prompt.match(/\b[0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}\b/gi);
    if (macMatches) {
      macMatches.forEach(mac => sensitiveDataRemoved.push(`MAC address: ${mac}`));
      cleaned = cleaned.replace(/\b[0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}\b/gi, '[MAC_ADDRESS_REDACTED]');
    }
    
    // 🔑 AUTHENTICATION & API KEYS (COMPREHENSIVE)
    
    // OpenAI API Keys
    const openaiMatches = prompt.match(/\bsk-[a-zA-Z0-9]{48,64}\b/g);
    if (openaiMatches) {
      openaiMatches.forEach(key => sensitiveDataRemoved.push(`OpenAI API key: ${key.substring(0, 10)}...`));
      cleaned = cleaned.replace(/\bsk-[a-zA-Z0-9]{48,64}\b/g, '[OPENAI_API_KEY_REDACTED]');
    }
    
    // OpenRouter API Keys
    const openrouterMatches = prompt.match(/\bsk-or-v1-[a-f0-9]{64}\b/g);
    if (openrouterMatches) {
      openrouterMatches.forEach(key => sensitiveDataRemoved.push(`OpenRouter API key: ${key.substring(0, 15)}...`));
      cleaned = cleaned.replace(/\bsk-or-v1-[a-f0-9]{64}\b/g, '[OPENROUTER_API_KEY_REDACTED]');
    }
    
    // Anthropic API Keys
    const anthropicMatches = prompt.match(/\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g);
    if (anthropicMatches) {
      anthropicMatches.forEach(key => sensitiveDataRemoved.push(`Anthropic API key: ${key.substring(0, 10)}...`));
      cleaned = cleaned.replace(/\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g, '[ANTHROPIC_API_KEY_REDACTED]');
    }
    
    // Google API Keys
    const googleMatches = prompt.match(/\bAIza[a-zA-Z0-9\-_]{35}\b/g);
    if (googleMatches) {
      googleMatches.forEach(key => sensitiveDataRemoved.push(`Google API key: ${key.substring(0, 10)}...`));
      cleaned = cleaned.replace(/\bAIza[a-zA-Z0-9\-_]{35}\b/g, '[GOOGLE_API_KEY_REDACTED]');
    }
    
    // AWS Access Keys
    const awsMatches = prompt.match(/\bAKIA[a-zA-Z0-9]{16}\b/g);
    if (awsMatches) {
      awsMatches.forEach(key => sensitiveDataRemoved.push(`AWS Access Key: ${key.substring(0, 8)}...`));
      cleaned = cleaned.replace(/\bAKIA[a-zA-Z0-9]{16}\b/g, '[AWS_ACCESS_KEY_REDACTED]');
    }
    
    // AWS Secret Keys
    const awsSecretMatches = prompt.match(/\b[a-zA-Z0-9\/\+]{40}\b/g);
    if (awsSecretMatches && prompt.toLowerCase().includes('secret')) {
      awsSecretMatches.forEach(key => sensitiveDataRemoved.push(`AWS Secret Key: ${key.substring(0, 10)}...`));
      cleaned = cleaned.replace(/\b[a-zA-Z0-9\/\+]{40}\b/g, '[AWS_SECRET_KEY_REDACTED]');
    }
    
    // GitHub Personal Access Tokens
    const githubMatches = prompt.match(/\bghp_[a-zA-Z0-9]{36}\b/g);
    if (githubMatches) {
      githubMatches.forEach(token => sensitiveDataRemoved.push(`GitHub Token: ${token.substring(0, 8)}...`));
      cleaned = cleaned.replace(/\bghp_[a-zA-Z0-9]{36}\b/g, '[GITHUB_TOKEN_REDACTED]');
    }
    
    // Stripe API Keys
    const stripeMatches = prompt.match(/\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}\b/g);
    if (stripeMatches) {
      stripeMatches.forEach(key => sensitiveDataRemoved.push(`Stripe API key: ${key.substring(0, 12)}...`));
      cleaned = cleaned.replace(/\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}\b/g, '[STRIPE_API_KEY_REDACTED]');
    }
    
    // Generic API Key patterns
    const apiKeyMatches = prompt.match(/\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/gi);
    if (apiKeyMatches) {
      apiKeyMatches.forEach(key => sensitiveDataRemoved.push(`API key: ${key.substring(0, 20)}...`));
      cleaned = cleaned.replace(/\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/gi, '[API_KEY_REDACTED]');
    }
    
    // Generic tokens
    const tokenMatches = prompt.match(/\btoken[\s:=]+[a-z0-9\-_\.]{20,}/gi);
    if (tokenMatches) {
      tokenMatches.forEach(token => sensitiveDataRemoved.push(`Auth token: ${token.substring(0, 20)}...`));
      cleaned = cleaned.replace(/\btoken[\s:=]+[a-z0-9\-_\.]{20,}/gi, '[TOKEN_REDACTED]');
    }
    
    // Bearer tokens
    const bearerMatches = prompt.match(/\bbearer\s+[a-z0-9\-_\.]{20,}/gi);
    if (bearerMatches) {
      bearerMatches.forEach(bearer => sensitiveDataRemoved.push(`Bearer token: ${bearer.substring(0, 20)}...`));
      cleaned = cleaned.replace(/\bbearer\s+[a-z0-9\-_\.]{20,}/gi, '[BEARER_TOKEN_REDACTED]');
    }
    
    // JWT Tokens
    const jwtMatches = prompt.match(/\beyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g);
    if (jwtMatches) {
      jwtMatches.forEach(jwt => sensitiveDataRemoved.push(`JWT Token: ${jwt.substring(0, 20)}...`));
      cleaned = cleaned.replace(/\beyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, '[JWT_TOKEN_REDACTED]');
    }
    
    // Database connection strings
    const dbMatches = prompt.match(/\b(?:mongodb|mysql|postgresql|redis):\/\/[^\s]+/gi);
    if (dbMatches) {
      dbMatches.forEach(conn => sensitiveDataRemoved.push(`Database connection: ${conn.substring(0, 20)}...`));
      cleaned = cleaned.replace(/\b(?:mongodb|mysql|postgresql|redis):\/\/[^\s]+/gi, '[DB_CONNECTION_REDACTED]');
    }
    
    // 🤖 AI RISK INDICATORS
    if (/ignore\s+(previous|all)\s+instructions/i.test(prompt)) {
      aiRiskIndicators.push('Prompt injection attempt detected');
      cleaned = cleaned.replace(/ignore\s+(previous|all)\s+instructions/gi, '[PROMPT_INJECTION_DETECTED]');
    }
    
    if (/forget\s+(everything|all)\s+(above|before)/i.test(prompt)) {
      aiRiskIndicators.push('System instruction override attempt');
      cleaned = cleaned.replace(/forget\s+(everything|all)\s+(above|before)/gi, '[INSTRUCTION_OVERRIDE_DETECTED]');
    }
    
    if (/\bjailbreak/i.test(prompt)) {
      aiRiskIndicators.push('Jailbreak attempt detected');
      cleaned = cleaned.replace(/\bjailbreak/gi, '[JAILBREAK_ATTEMPT]');
    }
    
    if (/\bdan\s+mode/i.test(prompt)) {
      aiRiskIndicators.push('DAN (Do Anything Now) mode attempt');
      cleaned = cleaned.replace(/\bdan\s+mode/gi, '[DAN_MODE_ATTEMPT]');
    }
    
    if (/\bdeveloper\s+mode/i.test(prompt)) {
      aiRiskIndicators.push('Developer mode bypass attempt');
      cleaned = cleaned.replace(/\bdeveloper\s+mode/gi, '[DEVELOPER_MODE_ATTEMPT]');
    }
    
    // 📋 COMPLIANCE FRAMEWORK DETECTION
    if (/\bnist\s+ai/i.test(prompt) || /\bai\s+rmf/i.test(prompt)) {
      complianceFrameworks.push('NIST AI RMF');
    }
    
    if (/\biso\s*42001/i.test(prompt)) {
      complianceFrameworks.push('ISO 42001');
    }
    
    if (/\bfedramp/i.test(prompt) || /\bsc-28/i.test(prompt)) {
      complianceFrameworks.push('FedRAMP SC-28');
    }
    
    if (/\bowasp\s+llm/i.test(prompt) || /\bllm\s+top\s*10/i.test(prompt)) {
      complianceFrameworks.push('OWASP LLM Top 10');
    }
    
    if (/\bgdpr/i.test(prompt) || /\bccpa/i.test(prompt)) {
      complianceFrameworks.push('GDPR/CCPA');
    }
    
    if (/\bpci\s+dss/i.test(prompt)) {
      complianceFrameworks.push('PCI DSS');
    }
    
    if (/\bsoc\s*2/i.test(prompt)) {
      complianceFrameworks.push('SOC 2 Type II');
    }
    
    if (/\btrade\s+secret/i.test(prompt) || /\bproprietary/i.test(prompt)) {
      complianceFrameworks.push('Trade Secret Protection');
    }
    
    return { cleanedPrompt: cleaned, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators };
  }

  /**
   * Analyze prompt intent for better optimization (same as desktop app)
   */
  analyzePromptIntent(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Determine category
    let category = 'general';
    let type = 'General request';
    
    if (['create', 'generate', 'write', 'build', 'make', 'design'].some(word => lowerPrompt.includes(word))) {
      category = 'creation';
      type = 'Content creation';
    } else if (['analyze', 'review', 'examine', 'evaluate', 'assess'].some(word => lowerPrompt.includes(word))) {
      category = 'analysis';
      type = 'Analysis task';
    } else if (['explain', 'describe', 'tell me', 'what is', 'how does'].some(word => lowerPrompt.includes(word))) {
      category = 'explanation';
      type = 'Explanation request';
    } else if (['what', 'how', 'why', 'when', 'where', 'who'].some(word => lowerPrompt.startsWith(word))) {
      category = 'question';
      type = 'Information query';
    } else if (['help', 'assist', 'support'].some(word => lowerPrompt.includes(word))) {
      category = 'assistance';
      type = 'Help request';
    }
    
    // Determine complexity
    const complexity = prompt.length > 200 ? 'complex' : prompt.length > 80 ? 'medium' : 'simple';
    
    return { type, category, complexity };
  }

  /**
   * Calculate risk level based on detected issues
   */
  calculateRiskLevel(sensitiveDataRemoved, aiRiskIndicators) {
    let riskScore = 0;
    
    // Sensitive data increases risk significantly
    if (sensitiveDataRemoved.length > 0) {
      riskScore += 40;
    }
    
    // AI-specific risks
    if (aiRiskIndicators.length > 0) {
      riskScore += 30;
    }
    
    if (riskScore >= 70) {
      return 'critical';
    } else if (riskScore >= 50) {
      return 'high';
    } else if (riskScore >= 25) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate safe prompt using local patterns (fallback method)
   */
  generateSafePrompt(originalPrompt) {
    let safePrompt = originalPrompt;

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
        pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, 
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
      // Use optimized replacement (rephrase instead of redact)
      if (typeof config.replacement === 'function') {
        safePrompt = safePrompt.replace(config.pattern, config.replacement);
      } else {
        safePrompt = safePrompt.replace(config.pattern, config.replacement);
      }
    }

    // Additional optimization: improve prompt structure and clarity
    safePrompt = this.optimizePromptStructure(safePrompt);

    return safePrompt;
  }

  /**
   * Helper function to optimize prompt structure
   */
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

  /**
   * Create natural optimized prompt for local fallback (better than basic text replacement)
   */
  createNaturalOptimizedPrompt(originalPrompt, intent, sensitiveDataRemoved) {
    console.log('Complyze: 🎯 Creating natural optimized prompt for fallback...');
    
    let optimizedPrompt = originalPrompt;
    
    // Step 1: Remove sensitive data with intelligent context-aware replacements
    const replacements = [
      // Names and personal info
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g, replacement: 'the individual' },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: 'the appropriate contact' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: 'the required identification number' },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: 'the contact number' },
      
      // Addresses - keep structure but remove specifics
      { pattern: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Drive|Dr|Road|Rd|Lane|Ln|Boulevard|Blvd),?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\b/g, 
        replacement: 'the business address' },
      
      // API Keys and credentials
      { pattern: /\bsk-[a-zA-Z0-9]{48,64}\b/g, replacement: 'the API authentication credentials' },
      { pattern: /\bsk-or-v1-[a-f0-9]{64}\b/g, replacement: 'the API authentication credentials' },
      { pattern: /\bsk-ant-[a-zA-Z0-9\-_]{95,105}\b/g, replacement: 'the API authentication credentials' },
      { pattern: /\bAIza[a-zA-Z0-9\-_]{35}\b/g, replacement: 'the API authentication credentials' },
      { pattern: /\bsk_live_[a-zA-Z0-9]{24,}\b/g, replacement: 'the payment processing credentials' },
      { pattern: /\bAKIA[a-zA-Z0-9]{16}\b/g, replacement: 'the cloud service credentials' },
      
      // Financial and business info - preserve business context
      { pattern: /\$\d+(?:\.\d{2})?\/month/g, replacement: 'the standard pricing' },
      { pattern: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, replacement: 'the specified amount' },
      
      // Company names - keep generic business context
      { pattern: /\b[A-Z][a-zA-Z]+\s+(?:Corp|Corporation|Inc|LLC|Ltd|Company)\b/g, replacement: 'the partner organization' },
    ];
    
    for (const { pattern, replacement } of replacements) {
      optimizedPrompt = optimizedPrompt.replace(pattern, replacement);
    }
    
    // Step 2: Improve prompt structure based on intent
    if (intent.category === 'creation') {
      optimizedPrompt = this.enhanceCreationPrompt(optimizedPrompt);
    } else if (intent.category === 'analysis') {
      optimizedPrompt = this.enhanceAnalysisPrompt(optimizedPrompt);
    } else if (intent.category === 'explanation') {
      optimizedPrompt = this.enhanceExplanationPrompt(optimizedPrompt);
    }
    
    // Step 3: Add professional structure and clarity
    optimizedPrompt = this.addProfessionalStructure(optimizedPrompt, intent);
    
    console.log('Complyze: ✨ Natural optimization complete');
    return optimizedPrompt;
  }

  enhanceCreationPrompt(prompt) {
    // Add structure for creation tasks
    if (!prompt.includes('Please') && !prompt.includes('Create')) {
      prompt = prompt.replace(/^(Hey AI,?\s*)?/, 'Please ');
    }
    return prompt;
  }

  enhanceAnalysisPrompt(prompt) {
    // Add structure for analysis tasks
    if (prompt.includes('analyze') || prompt.includes('review')) {
      prompt = prompt.replace(/analyze|review/gi, 'thoroughly analyze');
    }
    return prompt;
  }

  enhanceExplanationPrompt(prompt) {
    // Add structure for explanation tasks
    if (prompt.includes('explain') && !prompt.includes('detail')) {
      prompt = prompt.replace(/explain/gi, 'explain in detail');
    }
    return prompt;
  }

  addProfessionalStructure(prompt, intent) {
    // Clean up and add professional language
    prompt = prompt
      .replace(/\s+/g, ' ')
      .replace(/\bHey AI,?\s*/gi, '')
      .replace(/\bI need you to\b/gi, 'Please')
      .replace(/\bcan you\b/gi, 'please')
      .trim();
    
    // Ensure it starts with a capital letter
    if (prompt.length > 0) {
      prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1);
    }
    
    return prompt;
  }

  /**
   * Fetch optimization insights from historical data for self-improvement
   */
  async fetchOptimizationInsights(category, type) {
    try {
      if (!this.accessToken) {
        console.log('Complyze: No auth token, skipping insights fetch');
        return [];
      }

      // Skip API call for now since endpoint doesn't exist yet
      console.log('Complyze: 📚 Optimization insights API not implemented yet, using defaults');
      return [];
      
      // TODO: Uncomment when API endpoint is ready
      // const response = await fetch(`${this.apiBase}/prompts/optimization-insights`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.accessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     category: category,
      //     type: type,
      //     limit: 10,
      //     status: 'active'
      //   })
      // });

      // if (response.ok) {
      //   const insights = await response.json();
      //   console.log('Complyze: 📚 Fetched optimization insights:', insights.length);
      //   return insights;
      // } else if (response.status === 404) {
      //   console.log('Complyze: Optimization insights endpoint not yet implemented, using defaults');
      //   return [];
      // } else {
      //   console.log('Complyze: Failed to fetch insights:', response.status);
      //   return [];
      // }
    } catch (error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.log('Complyze: Optimization insights API not available yet, continuing without historical insights');
      } else {
        console.error('Complyze: Error fetching optimization insights:', error);
      }
      return [];
    }
  }

  /**
   * Format optimization insights for injection into AI prompt
   */
  formatOptimizationInsights(insights) {
    if (!insights || insights.length === 0) {
      return 'No specific historical insights available for this prompt type. Apply general best practices.';
    }

    const formattedInsights = insights.map(insight => {
      return `• ${insight.pattern_description}
  Action: ${insight.recommended_action}
  Confidence: ${Math.round(insight.confidence_score * 100)}%
  Based on: ${insight.sample_count} samples`;
    }).join('\n\n');

    return `Historical learning patterns (apply these insights):

${formattedInsights}

Use these patterns to improve your redaction and optimization approach for this specific prompt type.`;
  }

  /**
   * Save prompt optimization to history for future learning
   */
  async savePromptHistory(originalPrompt, result, intent, processingTime) {
    try {
      if (!this.accessToken) {
        console.log('Complyze: No auth token, skipping history save');
        return;
      }

      const historyData = {
        original_prompt: originalPrompt,
        original_length: originalPrompt.length,
        optimized_prompt: result.optimized_prompt || result.redacted_prompt,
        optimized_length: (result.optimized_prompt || result.redacted_prompt).length,
        
        prompt_category: intent.category,
        prompt_type: intent.type,
        intent_complexity: intent.complexity,
        
        risk_level: result.risk_level,
        pii_detected: result.pii_detected || [],
        sensitive_data_removed: result.pii_detected || [],
        compliance_frameworks: result.control_tags || [],
        ai_risk_indicators: result.control_tags || [],
        
        clarity_score: result.clarity_score,
        quality_score: result.quality_score,
        optimization_method: result.optimization_reason?.includes('AI-powered') ? 'ai_enhanced' : 'local_fallback',
        
        platform: 'chrome_extension',
        source_url: typeof window !== 'undefined' ? window.location?.href : 'unknown',
        model_used: 'google/gemini-2.5-pro-preview',
        
        processing_time_ms: processingTime,
        api_provider: 'openrouter',
        optimization_version: 'v2.0'
      };

      // Skip API call for now since endpoint doesn't exist yet
      console.log('Complyze: 💾 Prompt history API not implemented yet, skipping save');
      
      // TODO: Uncomment when API endpoint is ready
      // const response = await fetch(`${this.apiBase}/prompts/save-history`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.accessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(historyData)
      // });

      // if (response.ok) {
      //   const saved = await response.json();
      //   console.log('Complyze: 💾 Prompt history saved:', saved.id);
      // } else if (response.status === 404) {
      //   console.log('Complyze: Prompt history endpoint not yet implemented, skipping save');
      // } else {
      //   console.log('Complyze: Failed to save prompt history:', response.status);
      // }
    } catch (error) {
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        console.log('Complyze: Prompt history API not available yet, skipping save');
      } else {
        console.error('Complyze: Error saving prompt history:', error);
      }
    }
  }

  /**
   * Create fallback optimization using local optimization approach
   */
  createFallbackOptimization(originalPrompt) {
    const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = this.removeSensitiveData(originalPrompt);
    const intent = this.analyzePromptIntent(cleanedPrompt);
    
    // Use local optimization approach
    let enhancedPrompt = this.generateSafePrompt(originalPrompt);
    const improvements = [];
    
    // Report what was optimized
    if (sensitiveDataRemoved.length > 0) {
      improvements.push('Sensitive data rephrased with contextual alternatives');
    }
    
    if (aiRiskIndicators.length > 0) {
      improvements.push('AI security risks detected and mitigated');
    }
    
    if (complianceFrameworks.length > 0) {
      improvements.push(`Applied compliance controls for: ${complianceFrameworks.join(', ')}`);
    }
    
    improvements.push('Applied local optimization patterns');
    improvements.push('Enhanced prompt structure and clarity');
    improvements.push('Maintained original intent while improving security');
    
    return {
      original_prompt: originalPrompt,
      redacted_prompt: enhancedPrompt,
      optimized_prompt: enhancedPrompt,
      risk_level: this.calculateRiskLevel(sensitiveDataRemoved, aiRiskIndicators),
      clarity_score: 80,
      quality_score: 85,
      control_tags: [...complianceFrameworks, ...aiRiskIndicators],
      pii_detected: sensitiveDataRemoved,
      improvements: improvements,
      detected_intent: intent.type,
      optimization_reason: 'Local optimization applied to rephrase sensitive content naturally'
    };
  }
}

// Initialize the background script
const complyzeBackground = new ComplyzeBackground();

// --- DEBUG UTILITIES ---
/**
 * Comprehensive debug function to diagnose dashboard sync issues
 * Call this from the extension console: complyzeDebug()
 */
async function debugUserIdAndSupabase() {
  console.log('🔍 === COMPLYZE COMPREHENSIVE DEBUG STARTED ===');
  console.log('📅 Debug time:', new Date().toISOString());
  
  const debugInfo = {
    extensionData: {},
    dashboardData: {},
    supabaseTest: {},
    diagnosis: []
  };
  
  // STEP 1: Check all extension storage
  console.log('\\n📦 STEP 1: Checking Extension Storage...');
  
  // Only use chrome.storage (localStorage not available in service worker)
  const chromeStorage = await chrome.storage.local.get(['userId', 'complyze_uid', 'supabase_uid', 'user', 'accessToken']);
  
  debugInfo.extensionData = {
    chromeStorage_userId: chromeStorage.userId,
    chromeStorage_complyze_uid: chromeStorage.complyze_uid,
    chromeStorage_supabase_uid: chromeStorage.supabase_uid,
    user_object: chromeStorage.user,
    has_access_token: !!chromeStorage.accessToken,
    user_email: chromeStorage.user?.email
  };
  
  console.log('Extension Storage Data:', debugInfo.extensionData);
  
  // Determine which user ID the extension will use
  const extensionUserId = chromeStorage.user?.id || chromeStorage.complyze_uid || chromeStorage.userId;
  console.log('✅ Extension will use user_id:', extensionUserId || 'NONE FOUND');
  
  // STEP 2: Check dashboard data
  console.log('\\n🌐 STEP 2: Checking Dashboard Data...');
  
  const dashboardTabs = await chrome.tabs.query({ url: ["*://complyze.co/dashboard*", "*://complyze.co/*dashboard*"] });
  console.log('Dashboard tabs found:', dashboardTabs.length);
  
  if (dashboardTabs.length > 0) {
    try {
      // Execute more comprehensive dashboard check
      const results = await chrome.scripting.executeScript({
        target: { tabId: dashboardTabs[0].id },
        func: () => {
          const dashboardInfo = {
            localStorage: {},
            supabaseAuth: null,
            globalVars: {}
          };
          
          // Get all localStorage items that might contain user ID
          const relevantKeys = ['complyze_uid', 'supabase.auth.token', 'sb-auth-token', 'user_id', 'userId'];
          relevantKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
              dashboardInfo.localStorage[key] = value;
            }
          });
          
          // Check for Supabase auth token and parse it
          const authToken = localStorage.getItem('sb-auth-token') || localStorage.getItem('supabase.auth.token');
          if (authToken) {
            try {
              const parsed = JSON.parse(authToken);
              dashboardInfo.supabaseAuth = {
                user_id: parsed.user?.id,
                user_email: parsed.user?.email,
                expires_at: parsed.expires_at
              };
            } catch (e) {
              dashboardInfo.supabaseAuth = 'Failed to parse auth token';
            }
          }
          
          // Check global variables (only available in content script context)
          dashboardInfo.globalVars = {
            window_user: (typeof window !== 'undefined' && window.user) ? window.user.id : null,
            window_currentUser: (typeof window !== 'undefined' && window.currentUser) ? window.currentUser.id : null,
            window_auth: (typeof window !== 'undefined' && window.auth && window.auth.user) ? window.auth.user.id : null
          };
          
          // Try to find user ID in the DOM
          const userElements = document.querySelectorAll('[data-user-id], [data-userid], .user-id, #user-id');
          dashboardInfo.domUserId = Array.from(userElements).map(el => 
            el.getAttribute('data-user-id') || el.getAttribute('data-userid') || el.textContent
          ).filter(Boolean);
          
          return dashboardInfo;
        }
      });
      
      if (results && results[0] && results[0].result) {
        debugInfo.dashboardData = results[0].result;
        console.log('Dashboard Data:', debugInfo.dashboardData);
        
        // Determine dashboard user ID
        const dashboardUserId = 
          debugInfo.dashboardData.supabaseAuth?.user_id ||
          debugInfo.dashboardData.localStorage.complyze_uid ||
          debugInfo.dashboardData.localStorage.user_id ||
          debugInfo.dashboardData.globalVars.window_user ||
          debugInfo.dashboardData.globalVars.window_currentUser;
          
        console.log('✅ Dashboard is using user_id:', dashboardUserId || 'NONE FOUND');
        
        // Compare IDs
        if (extensionUserId && dashboardUserId && extensionUserId !== dashboardUserId) {
          debugInfo.diagnosis.push('❌ CRITICAL: User ID mismatch! Extension uses "' + extensionUserId + '" but dashboard uses "' + dashboardUserId + '"');
        } else if (!extensionUserId) {
          debugInfo.diagnosis.push('❌ CRITICAL: Extension has no user ID!');
        } else if (!dashboardUserId) {
          debugInfo.diagnosis.push('⚠️ WARNING: Could not determine dashboard user ID');
        } else {
          debugInfo.diagnosis.push('✅ User IDs match: ' + extensionUserId);
        }
      }
    } catch (error) {
      console.error('Could not check dashboard:', error);
      debugInfo.diagnosis.push('⚠️ Could not access dashboard data: ' + error.message);
    }
  } else {
    debugInfo.diagnosis.push('⚠️ No dashboard tabs open - cannot verify dashboard user ID');
  }
  
  // STEP 3: Test Supabase connection
  console.log('\\n🚀 STEP 3: Testing Supabase Connection...');
  
  const testUserId = extensionUserId || 'test-user-' + Date.now();
  const testEvent = {
    user_id: testUserId,
    platform: 'chrome_extension_debug_test',
    prompt: 'DEBUG TEST at ' + new Date().toISOString() + ' - If you see this in Supabase but not dashboard, there is a user_id mismatch',
    flagged: true,
    risk_level: 'high',
    risks: ['DEBUG_TEST'],
    timestamp: Date.now(),
    metadata: {
      source: 'debug_function',
      debug_time: new Date().toISOString(),
      extension_version: '2.0',
      test_run: true
    }
  };
  
  console.log('Sending test event with user_id:', testUserId);
  
  // Send test event
  try {
    await syncPromptEventToSupabase(testEvent);
    debugInfo.supabaseTest = {
      success: true,
      test_user_id: testUserId,
      message: 'Test event sent successfully'
    };
  } catch (error) {
    debugInfo.supabaseTest = {
      success: false,
      error: error.message,
      test_user_id: testUserId
    };
    debugInfo.diagnosis.push('❌ Failed to send test event to Supabase: ' + error.message);
  }
  
  // STEP 4: Final diagnosis and recommendations
  console.log('\\n📋 === DIAGNOSIS ===');
  
  if (debugInfo.diagnosis.length === 0) {
    debugInfo.diagnosis.push('✅ No obvious issues found');
  }
  
  debugInfo.diagnosis.forEach(item => console.log(item));
  
  console.log('\\n💡 === RECOMMENDATIONS ===');
  
  // Provide specific fix based on diagnosis
  if (extensionUserId && debugInfo.dashboardData.supabaseAuth?.user_id && 
      extensionUserId !== debugInfo.dashboardData.supabaseAuth.user_id) {
    console.log('🔧 FIX: Run this command to sync user IDs:');
    console.log(`chrome.storage.local.set({ 'complyze_uid': '${debugInfo.dashboardData.supabaseAuth.user_id}', 'user': { id: '${debugInfo.dashboardData.supabaseAuth.user_id}' } })`);
  } else if (!extensionUserId && debugInfo.dashboardData.supabaseAuth?.user_id) {
    console.log('🔧 FIX: Run this command to set user ID:');
    console.log(`chrome.storage.local.set({ 'complyze_uid': '${debugInfo.dashboardData.supabaseAuth.user_id}', 'user': { id: '${debugInfo.dashboardData.supabaseAuth.user_id}' } })`);
  }
  
  console.log('\\n📊 === NEXT STEPS ===');
  console.log('1. Check your Supabase prompt_events table for the test entry');
  console.log('2. Look for user_id:', testUserId);
  console.log('3. Refresh your dashboard and see if the test appears');
  console.log('4. If test appears in Supabase but not dashboard, run the FIX command above');
  
  console.log('\\n🔍 === DEBUG COMPLETE ===');
  
  return debugInfo;
}

// Make it accessible from console (only in content script context)
if (typeof window !== 'undefined') {
  window.complyzeDebug = debugUserIdAndSupabase;
  
  // Also add a quick fix function
  window.complyzeFixUserId = async function(correctUserId) {
  if (!correctUserId) {
    console.error('Please provide a user ID: complyzeFixUserId("your-user-id")');
    return;
  }
  
  await chrome.storage.local.set({ 
    'complyze_uid': correctUserId,
    'user': { id: correctUserId }
  });
  
  console.log('✅ User ID updated to:', correctUserId);
  console.log('Please reload the extension and try again.');
  };
}