// Background service worker for Complyze Chrome Extension
class ComplyzeBackground {
  constructor() {
    this.apiBase = null;
    this.dashboardUrl = null;
    this.accessToken = null;
    this.user = null;
    
    // Auto-detect the correct port
    this.detectServerPort().then(() => {
      // Initialize authentication state after port detection
      this.initializeAuth();
      
      // Periodic auth sync check every 30 seconds
      setInterval(() => this.periodicAuthSync(), 30000);
    });
    
    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'analyze_prompt') {
        this.handlePromptAnalysis(message.payload, sender.tab.id);
      }
      
      if (message.type === 'analyze_prompt_realtime') {
        this.handleRealTimeAnalysis(message.payload)
          .then(result => sendResponse(result));
        return true; // Keep message channel open for async response
      }
      
      if (message.type === 'login') {
        this.login(message.email, message.password)
          .then(result => sendResponse(result));
        return true; // Keep message channel open for async response
      }
      
      if (message.type === 'signup') {
        this.signup(message.email, message.password, message.fullName)
          .then(result => sendResponse(result));
        return true;
      }
      
      if (message.type === 'logout') {
        this.logout()
          .then(result => sendResponse(result));
        return true;
      }
      
      if (message.type === 'get_auth_status') {
        sendResponse({
          isAuthenticated: !!this.accessToken,
          user: this.user
        });
      }

      if (message.type === 'get_dashboard_url') {
        sendResponse({
          dashboardUrl: this.dashboardUrl,
          apiBase: this.apiBase
        });
      }

      if (message.type === 'sync_auth_from_website') {
        this.handleAuthSyncFromWebsite(message.token, message.user)
          .then(result => sendResponse(result));
        return true;
      }

      if (message.type === 'logout_from_website') {
        this.handleLogoutFromWebsite()
          .then(result => sendResponse(result));
        return true;
      }
    });
  }

  async detectServerPort() {
    const domains = [
      'https://complyze.co',
      'http://localhost:3002',
      'http://localhost:3001',
      'http://localhost:3000'
    ];
    
    for (const domain of domains) {
      try {
        console.log(`Complyze: Trying port ${domain}...`);
        const response = await fetch(`${domain}/api/test-db`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok || response.status === 401) { // 401 means server is running but not authenticated
          console.log(`Complyze: Found server on port ${domain}`);
          this.apiBase = `${domain}/api`;
          this.dashboardUrl = `${domain}/dashboard`;
          return;
        }
      } catch (error) {
        console.log(`Complyze: Port ${domain} not available:`, error.message);
      }
    }
    
    // Fallback to default port
    console.log('Complyze: No server found, using default port 3002');
    this.apiBase = 'http://localhost:3002/api';
    this.dashboardUrl = 'http://localhost:3002/dashboard';
  }

  async initializeAuth() {
    try {
      // Get stored authentication data from extension storage
      const result = await chrome.storage.local.get(['accessToken', 'user']);
      if (result.accessToken && result.user) {
        this.accessToken = result.accessToken;
        this.user = result.user;
        
        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (!isValid) {
          console.log('Complyze: Token verification failed, clearing auth');
          await this.clearAuth();
        } else {
          console.log('Complyze: Extension auth initialized successfully');
          return;
        }
      }

      // If no extension auth, try to sync from website localStorage
      console.log('Complyze: No extension auth found, checking website auth...');
      await this.syncFromWebsite();
    } catch (error) {
      console.error('Complyze: Failed to initialize auth:', error);
    }
  }

  async verifyToken() {
    if (!this.accessToken) return false;
    
    try {
      const response = await fetch(`${this.apiBase}/auth/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.authenticated;
      } else if (response.status === 401) {
        // Only clear auth if we get a definitive 401 (unauthorized)
        console.log('Complyze: Token is invalid (401), clearing auth');
        return false;
      } else {
        // For other errors (network issues, server down), assume token is still valid
        console.log('Complyze: Token verification failed with status', response.status, 'but keeping auth');
        return true;
      }
    } catch (error) {
      // Network errors - assume token is still valid to avoid unnecessary logouts
      console.log('Complyze: Token verification network error, keeping auth:', error.message);
      return true;
    }
  }

  async clearAuth() {
    this.accessToken = null;
    this.user = null;
    await chrome.storage.local.remove(['accessToken', 'user']);
  }

  async handlePromptAnalysis(promptData, tabId) {
    try {
      console.log('Complyze: Processing prompt analysis for:', promptData.platform);
      console.log('Complyze: Prompt text:', promptData.prompt.substring(0, 100) + '...');
      
      // Check if extension is enabled
      const settings = await chrome.storage.local.get(['extensionEnabled']);
      if (settings.extensionEnabled === false) {
        console.log('Complyze: Extension is disabled, skipping analysis');
        return;
      }
      
      // Step 1: Check user authentication
      const isAuthenticated = await this.checkUserAuth();
      if (!isAuthenticated) {
        console.log('Complyze: User not authenticated, showing auth required');
        this.showAuthenticationRequired(tabId);
        return;
      }

      console.log('Complyze: User authenticated, proceeding with analysis');

      // Step 2: Analyze, redact, and optimize the prompt (all in one call)
      const analysisResult = await this.analyzePrompt(promptData.prompt);
      console.log('Complyze: Analysis result:', analysisResult);
      
      // Step 3: Send to dashboard for logging
      await this.sendToDashboard({
        ...promptData,
        analysis: analysisResult
      });

      // Step 4: Update statistics
      await this.updateStats(analysisResult.risk_level, promptData.platform);

      // Step 5: Show results to user
      const combinedResult = {
        original_prompt: promptData.prompt,
        redacted_prompt: analysisResult.redacted_prompt || promptData.prompt,
        optimized_prompt: analysisResult.optimized_prompt || promptData.prompt,
        risk_level: analysisResult.risk_level || 'low',
        clarity_score: analysisResult.clarity_score || 0,
        quality_score: analysisResult.quality_score || 0,
        control_tags: analysisResult.control_tags || [],
        pii_detected: [], // Will be derived from redaction differences
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

    } catch (error) {
      console.error('Complyze: Analysis failed:', error);
      await chrome.storage.local.set({ 
        error: `Analysis failed: ${error.message}`,
        authRequired: false,
        analysisResult: null
      });
      this.injectUI(tabId);
    }
  }

  async checkUserAuth() {
    if (!this.accessToken || !this.user) {
      return false;
    }
    
    return await this.verifyToken();
  }

  async analyzePrompt(prompt) {
    try {
      console.log('Complyze: Calling analyze API...');
      const response = await fetch(`${this.apiBase}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      console.log('Complyze: Analyze API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Complyze: Analyze API result:', result);
      return result;
    } catch (error) {
      console.error('Complyze: Prompt analysis failed:', error);
      return { 
        redacted_prompt: prompt,
        optimized_prompt: prompt,
        risk_level: 'low', 
        clarity_score: 0, 
        quality_score: 0, 
        control_tags: [] 
      };
    }
  }

  async handleRealTimeAnalysis(promptData) {
    try {
      console.log('Complyze: Handling real-time analysis request');
      
      // Use the same analyze API but with special handling for real-time
      const analysisResult = await this.analyzePrompt(promptData.prompt);
      
      // ENHANCED: Auto-save high-risk prompts to dashboard as flagged
      if (analysisResult.risk_level === 'high' || analysisResult.risk_level === 'critical') {
        console.log('Complyze: High-risk prompt detected, saving to dashboard as flagged');
        await this.saveFlaggedPrompt({
          prompt: promptData.prompt,
          analysis: analysisResult,
          platform: 'real-time-detection',
          url: window.location?.href || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      return analysisResult;
    } catch (error) {
      console.error('Complyze: Real-time analysis failed:', error);
      return {
        risk_level: 'low',
        redacted_prompt: promptData.prompt,
        detectedPII: []
      };
    }
  }

  async sendToDashboard(data) {
    try {
      const response = await fetch(`${this.apiBase}/prompts/ingest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: data.prompt,
          platform: data.platform,
          url: data.url,
          timestamp: data.timestamp,
          source: 'chrome_extension'
        })
      });

      if (!response.ok) {
        throw new Error(`Dashboard logging failed: ${response.statusText}`);
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
            window.location.href = '/';
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
      // Get all tabs with the dashboard URL
      const tabs = await chrome.tabs.query({ url: `${this.dashboardUrl}*` });
      
      if (tabs.length > 0) {
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
            console.log('Complyze: Found website auth, syncing to extension...');
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
              console.log('Complyze: Website auth synced successfully');
            }
          }
        }
      }
    } catch (error) {
      console.log('Complyze: Could not sync from website (tab may not be open):', error.message);
    }
  }

  async syncToWebsite(token, user) {
    try {
      // Get all tabs with the dashboard URL
      const tabs = await chrome.tabs.query({ url: `${this.dashboardUrl}*` });
      
      for (const tab of tabs) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (token, user) => {
            localStorage.setItem('complyze_token', token);
            localStorage.setItem('complyze_user', JSON.stringify(user));
          },
          args: [token, user]
        });
      }
      console.log('Complyze: Auth synced to website tabs');
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
            window.location.href = '/';
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
      console.log('Complyze: Saving flagged prompt to database');
      
      // Check authentication first
      const isAuthenticated = await this.checkUserAuth();
      if (!isAuthenticated) {
        console.log('Complyze: User not authenticated, cannot save flagged prompt');
        return;
      }

      // Prepare the flagged prompt data
      const flaggedPromptData = {
        prompt: data.prompt,
        platform: data.platform,
        url: data.url,
        timestamp: data.timestamp,
        source: 'chrome_extension_realtime',
        risk_level: data.analysis.risk_level,
        status: 'flagged', // Force status to flagged for high-risk prompts
        analysis_metadata: {
          detection_method: 'real-time',
          detected_pii: data.analysis.detectedPII || [],
          risk_factors: data.analysis.risk_factors || [],
          mapped_controls: data.analysis.mapped_controls || []
        }
      };

      // Send to ingest API with forced flagged status
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
        console.log('Complyze: Flagged prompt saved with ID:', result.logId);
        
        // If we have a logId, update it to flagged status immediately
        if (result.logId) {
          await this.updatePromptStatus(result.logId, 'flagged', data.analysis);
        }
        
        // Update local statistics
        await this.updateStats('flagged', data.platform);
        
        return result.logId;
      } else {
        console.error('Complyze: Failed to save flagged prompt:', response.statusText);
      }
    } catch (error) {
      console.error('Complyze: Error saving flagged prompt:', error);
    }
  }

  // NEW: Update prompt status to flagged
  async updatePromptStatus(promptId, status, analysis) {
    try {
      console.log('Complyze: Updating prompt status to:', status);
      
      const updateData = {
        promptId: promptId,
        status: status,
        scores: {
          clarity: analysis.clarity_score || 0,
          quality: analysis.quality_score || 0
        },
        risk: analysis.risk_level || 'high',
        mappedControls: analysis.mapped_controls || [],
        suggestions: analysis.suggestions || [],
        additionalMetadata: {
          detection_method: 'real-time-prevention',
          flagged_at: new Date().toISOString(),
          platform_detected: analysis.platform || 'unknown'
        }
      };

      const response = await fetch(`${this.apiBase}/prompts/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        console.log('Complyze: Prompt status updated successfully');
      } else {
        console.error('Complyze: Failed to update prompt status:', response.statusText);
      }
    } catch (error) {
      console.error('Complyze: Error updating prompt status:', error);
    }
  }
}

// Initialize the background script
const complyzeBackground = new ComplyzeBackground();