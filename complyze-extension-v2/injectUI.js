// Enhanced UI injection for Complyze analysis results
class ComplyzeUI {
  constructor() {
    this.dashboardUrl = null;
    this.getDashboardUrlFromBackground().then(() => {
      this.init();
    });
  }

  async getDashboardUrlFromBackground() {
    try {
      // Get the dashboard URL from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'get_dashboard_url' }, resolve);
      });
      
      if (response && response.dashboardUrl) {
        this.dashboardUrl = response.dashboardUrl;
        console.log('Complyze UI: Got dashboard URL from background:', this.dashboardUrl);
      } else {
        // Fallback to production
        console.log('Complyze UI: No dashboard URL from background, using production');
        this.dashboardUrl = 'https://complyze.co/dashboard';
      }
    } catch (error) {
      console.log('Complyze UI: Failed to get dashboard URL from background, using production:', error);
      this.dashboardUrl = 'https://complyze.co/dashboard';
    }
  }

  async init() {
    // Remove any existing Complyze UI
    this.removeExistingUI();

    // Get stored data
    const data = await chrome.storage.local.get([
      'analysisResult', 
      'authRequired', 
      'error', 
      'dashboardUrl'
    ]);

    if (data.authRequired) {
      this.showAuthRequired(data.dashboardUrl || this.dashboardUrl);
    } else if (data.error) {
      this.showError(data.error);
    } else if (data.analysisResult) {
      this.showAnalysisResult(data.analysisResult);
    }
  }

  removeExistingUI() {
    const existing = document.querySelectorAll('[data-complyze-ui]');
    existing.forEach(el => el.remove());
  }

  createContainer() {
    const container = document.createElement('div');
    container.setAttribute('data-complyze-ui', 'true');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 420px;
      max-height: 80vh;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      z-index: 999999;
      border-radius: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    if (!document.querySelector('#complyze-styles')) {
      const style = document.createElement('style');
      style.id = 'complyze-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .complyze-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .complyze-btn:hover {
          transform: translateY(-1px);
        }
        .complyze-primary {
          background: #ff6f3c;
          color: white;
        }
        .complyze-primary:hover {
          background: #ff8a5c;
        }
        .complyze-secondary {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .complyze-secondary:hover {
          background: rgba(255,255,255,0.2);
        }
      `;
      document.head.appendChild(style);
    }

    return container;
  }

  showAuthRequired(dashboardUrl) {
    const container = this.createContainer();
    
    container.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #ff6f3c; font-size: 18px;">🔐 Complyze</h3>
          <button id="complyze-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
          <h4 style="margin: 0 0 8px 0; color: white;">Authentication Required</h4>
          <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 14px;">
            Please log in to Complyze to analyze your prompts
          </p>
          <button id="complyze-login" class="complyze-btn complyze-primary" style="width: 100%;">
            Open Complyze Dashboard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachEventListeners(container, { dashboardUrl });
  }

  showError(errorMessage) {
    const container = this.createContainer();
    
    container.innerHTML = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #ef4444; font-size: 18px;">⚠️ Complyze Error</h3>
          <button id="complyze-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px;">
          <p style="margin: 0; color: #fca5a5; font-size: 14px;">${errorMessage}</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachEventListeners(container);
  }

  showAnalysisResult(result) {
    const container = this.createContainer();
    
    const riskColor = this.getRiskColor(result.risk_level);
    const hasOptimization = result.optimized_prompt !== result.original_prompt;
    const hasPII = result.pii_detected && result.pii_detected.length > 0;

    container.innerHTML = `
      <div style="padding: 20px; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #ff6f3c; font-size: 18px;">🔐 Complyze Analysis</h3>
          <button id="complyze-close" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">&times;</button>
        </div>

        <!-- Risk Assessment -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 600;">Risk Level</span>
            <span style="background: ${riskColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              ${result.risk_level.toUpperCase()}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div>
              <span style="color: #94a3b8;">Clarity:</span>
              <span style="color: white; font-weight: 600; margin-left: 8px;">${result.clarity_score}/10</span>
            </div>
            <div>
              <span style="color: #94a3b8;">Quality:</span>
              <span style="color: white; font-weight: 600; margin-left: 8px;">${result.quality_score}/10</span>
            </div>
          </div>
        </div>

        ${hasPII ? `
        <!-- PII Detection -->
        <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #fca5a5; font-size: 14px; font-weight: 600;">⚠️ PII Detected</h4>
          <div style="font-size: 12px; color: #fca5a5;">
            ${result.pii_detected.map(pii => `<span style="background: rgba(239,68,68,0.2); padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${pii}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${hasOptimization ? `
        <!-- Optimized Prompt -->
        <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; color: #86efac; font-size: 14px; font-weight: 600;">✨ Optimized Prompt</h4>
            <button id="copy-optimized" class="complyze-btn complyze-secondary" style="font-size: 12px; padding: 4px 8px;">Copy</button>
          </div>
          <div style="background: rgba(0,0,0,0.2); border-radius: 6px; padding: 12px; font-size: 13px; line-height: 1.4; max-height: 120px; overflow-y: auto;">
            ${this.truncateText(result.optimized_prompt, 300)}
          </div>
        </div>
        ` : ''}

        <!-- Controls -->
        ${result.control_tags && result.control_tags.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #94a3b8; font-size: 14px; font-weight: 600;">Compliance Controls</h4>
          <div style="font-size: 12px;">
            ${result.control_tags.slice(0, 3).map(tag => `<span style="background: rgba(99,102,241,0.2); color: #c7d2fe; padding: 2px 6px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${tag}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Actions -->
        <div style="display: flex; gap: 8px;">
          <button id="copy-redacted" class="complyze-btn complyze-secondary" style="flex: 1;">
            Copy Secure Version
          </button>
          <button id="open-dashboard" class="complyze-btn complyze-primary" style="flex: 1;">
            View Dashboard
          </button>
        </div>

        <div style="margin-top: 12px; font-size: 11px; color: #64748b; text-align: center;">
          Platform: ${result.platform} • ${new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachEventListeners(container, result);
  }

  getRiskColor(riskLevel) {
    const colors = {
      'low': '#22c55e',
      'medium': '#f59e0b', 
      'high': '#ef4444',
      'critical': '#dc2626'
    };
    return colors[riskLevel?.toLowerCase()] || '#6b7280';
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  attachEventListeners(container, data = {}) {
    // Close button
    const closeBtn = container.querySelector('#complyze-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        container.remove();
        chrome.storage.local.clear();
      });
    }

    // Login button
    const loginBtn = container.querySelector('#complyze-login');
    if (loginBtn && data.dashboardUrl) {
      loginBtn.addEventListener('click', () => {
        window.open(data.dashboardUrl, '_blank');
      });
    }

    // Copy buttons
    const copyOptimized = container.querySelector('#copy-optimized');
    if (copyOptimized && data.optimized_prompt) {
      copyOptimized.addEventListener('click', () => {
        navigator.clipboard.writeText(data.optimized_prompt);
        copyOptimized.textContent = 'Copied!';
        setTimeout(() => copyOptimized.textContent = 'Copy', 2000);
      });
    }

    const copyRedacted = container.querySelector('#copy-redacted');
    if (copyRedacted && data.redacted_prompt) {
      copyRedacted.addEventListener('click', () => {
        navigator.clipboard.writeText(data.redacted_prompt);
        copyRedacted.textContent = 'Copied!';
        setTimeout(() => copyRedacted.textContent = 'Copy Secure Version', 2000);
      });
    }

    // Dashboard button
    const dashboardBtn = container.querySelector('#open-dashboard');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        window.open(data.dashboardUrl || this.dashboardUrl, '_blank');
      });
    }

    // Auto-hide after 30 seconds
    setTimeout(() => {
      if (container.parentNode) {
        container.style.opacity = '0.7';
      }
    }, 30000);
  }
}

// Initialize the UI
new ComplyzeUI();