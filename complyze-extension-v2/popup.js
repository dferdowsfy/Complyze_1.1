// Popup functionality for Complyze Chrome Extension
class ComplyzePopup {
  constructor() {
    this.apiBase = null;
    this.dashboardUrl = null;
    this.isAuthenticated = false;
    this.user = null;
    this.init();
  }

  async init() {
    // Get dashboard URL from background script instead of detecting independently
    await this.getDashboardUrlFromBackground();
    
    // Check authentication status
    await this.checkAuthStatus();
    
    if (this.isAuthenticated) {
      this.showMainInterface();
    } else {
      this.showAuthInterface();
    }
  }

  async getDashboardUrlFromBackground() {
    try {
      // Get the dashboard URL from background script which has proper port detection
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'get_dashboard_url' }, resolve);
      });
      
      if (response && response.dashboardUrl) {
        this.dashboardUrl = response.dashboardUrl;
        // Extract API base from dashboard URL
        this.apiBase = this.dashboardUrl.replace('/dashboard', '/api');
        console.log('Complyze Popup: Got dashboard URL from background:', this.dashboardUrl);
      } else {
        // Fallback to production
        console.log('Complyze Popup: No dashboard URL from background, using production');
        this.dashboardUrl = 'https://complyze.co/dashboard';
        this.apiBase = 'https://complyze.co/api';
      }
    } catch (error) {
      console.log('Complyze Popup: Failed to get dashboard URL from background, using production:', error);
      this.dashboardUrl = 'https://complyze.co/dashboard';
      this.apiBase = 'https://complyze.co/api';
    }
  }

  async checkAuthStatus() {
    try {
      // Get auth status from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'get_auth_status' }, resolve);
      });
      
      this.isAuthenticated = response.isAuthenticated;
      this.user = response.user;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      this.isAuthenticated = false;
    }
  }

  showAuthInterface() {
    document.body.innerHTML = `
      <div class="auth-container">
        <div class="header">
          <div class="logo">🔒 Complyze</div>
          <div class="subtitle">AI Prompt Security & Optimization</div>
        </div>
        
        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">Login</button>
          <button class="tab-btn" data-tab="signup">Sign Up</button>
        </div>
        
        <div class="auth-form" id="login-form">
          <input type="email" id="login-email" placeholder="Email" required>
          <input type="password" id="login-password" placeholder="Password" required>
          <button class="auth-btn" id="login-btn">Login</button>
          <div class="error-message" id="login-error"></div>
        </div>
        
        <div class="auth-form hidden" id="signup-form">
          <input type="text" id="signup-name" placeholder="Full Name">
          <input type="email" id="signup-email" placeholder="Email" required>
          <input type="password" id="signup-password" placeholder="Password" required>
          <button class="auth-btn" id="signup-btn">Sign Up</button>
          <div class="error-message" id="signup-error"></div>
          <div class="success-message" id="signup-success"></div>
        </div>
        
        <div class="footer">
          <a href="${this.dashboardUrl}" target="_blank">Open Dashboard</a>
        </div>
      </div>
    `;

    this.setupAuthEventListeners();
    this.applyAuthStyles();
  }

  showMainInterface() {
    document.body.innerHTML = `
      <div class="popup-container">
        <div class="header">
          <div class="logo">🔒 Complyze</div>
          <div class="user-info">
            <span class="user-name">${this.user?.full_name || this.user?.email || 'User'}</span>
            <button class="logout-btn" id="logout-btn">Logout</button>
          </div>
        </div>
        
        <div class="status-section">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value status-active" id="auth-status">Logged In</span>
          </div>
          <div class="status-item">
            <span class="status-label">Plan:</span>
            <span class="status-value">${this.user?.plan || 'Free'}</span>
          </div>
        </div>
        
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-number" id="daily-count">0</span>
            <span class="stat-label">Today's Prompts</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="total-count">0</span>
            <span class="stat-label">Total Analyzed</span>
          </div>
        </div>
        
        <div class="recent-activity">
          <h3>Recent Activity</h3>
          <div class="activity-list" id="activity-list">
            <div class="activity-item">No recent activity</div>
          </div>
        </div>
        
        <div class="actions">
          <button class="action-btn primary" id="dashboard-btn">
            Open Dashboard
          </button>
          <button class="action-btn secondary" id="settings-btn">
            Settings
          </button>
        </div>
      </div>
    `;

    this.setupMainEventListeners();
    this.loadStats();
    this.applyMainStyles();
  }

  setupAuthEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchAuthTab(tab);
      });
    });

    // Login form
    document.getElementById('login-btn').addEventListener('click', () => {
      this.handleLogin();
    });

    // Signup form
    document.getElementById('signup-btn').addEventListener('click', () => {
      this.handleSignup();
    });

    // Enter key handling
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const activeForm = document.querySelector('.auth-form:not(.hidden)');
        if (activeForm.id === 'login-form') {
          this.handleLogin();
        } else {
          this.handleSignup();
        }
      }
    });
  }

  setupMainEventListeners() {
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleLogout();
    });

    document.getElementById('dashboard-btn').addEventListener('click', () => {
      chrome.tabs.create({ url: this.dashboardUrl });
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      // TODO: Implement settings
      console.log('Settings clicked');
    });
  }

  switchAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update forms
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');

    // Clear error messages
    document.getElementById('login-error').textContent = '';
    document.getElementById('signup-error').textContent = '';
    document.getElementById('signup-success').textContent = '';
  }

  async handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btnEl = document.getElementById('login-btn');

    if (!email || !password) {
      errorEl.textContent = 'Please fill in all fields';
      return;
    }

    btnEl.textContent = 'Logging in...';
    btnEl.disabled = true;
    errorEl.textContent = '';

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'login', 
          email, 
          password 
        }, resolve);
      });

      if (result.success) {
        this.isAuthenticated = true;
        this.user = result.user;
        this.showMainInterface();
      } else {
        errorEl.textContent = result.error || 'Login failed';
      }
    } catch (error) {
      errorEl.textContent = 'Login failed. Please try again.';
    } finally {
      btnEl.textContent = 'Login';
      btnEl.disabled = false;
    }
  }

  async handleSignup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorEl = document.getElementById('signup-error');
    const successEl = document.getElementById('signup-success');
    const btnEl = document.getElementById('signup-btn');

    if (!email || !password) {
      errorEl.textContent = 'Email and password are required';
      return;
    }

    btnEl.textContent = 'Signing up...';
    btnEl.disabled = true;
    errorEl.textContent = '';
    successEl.textContent = '';

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'signup', 
          email, 
          password, 
          fullName: name 
        }, resolve);
      });

      if (result.success) {
        if (result.auto_login) {
          // User was automatically logged in
          this.isAuthenticated = true;
          this.user = result.user;
          this.showMainInterface();
        } else {
          // Email confirmation required
          successEl.textContent = result.message || 'Account created successfully! Please check your email for verification, then login.';
          this.switchAuthTab('login');
          document.getElementById('login-email').value = email;
        }
      } else {
        errorEl.textContent = result.error || 'Signup failed';
      }
    } catch (error) {
      errorEl.textContent = 'Signup failed. Please try again.';
    } finally {
      btnEl.textContent = 'Sign Up';
      btnEl.disabled = false;
    }
  }

  async handleLogout() {
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'logout' }, resolve);
      });
      
      this.isAuthenticated = false;
      this.user = null;
      this.showAuthInterface();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['dailyPromptCount', 'recentActivity']);
      
      document.getElementById('daily-count').textContent = result.dailyPromptCount || 0;
      
      const activities = result.recentActivity || [];
      document.getElementById('total-count').textContent = activities.length;
      
      this.updateActivityList(activities);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  updateActivityList(activities) {
    const listEl = document.getElementById('activity-list');
    
    if (activities.length === 0) {
      listEl.innerHTML = '<div class="activity-item">No recent activity</div>';
      return;
    }

    const recentActivities = activities.slice(-5).reverse();
    listEl.innerHTML = recentActivities.map(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      const riskColor = activity.riskLevel === 'high' ? '#e53935' : 
                       activity.riskLevel === 'medium' ? '#fbc02d' : '#388e3c';
      
      return `
        <div class="activity-item">
          <span class="activity-platform">${activity.platform}</span>
          <span class="activity-risk" style="color: ${riskColor}">
            ${activity.riskLevel} risk
          </span>
          <span class="activity-time">${time}</span>
        </div>
      `;
    }).join('');
  }

  applyAuthStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        width: 350px;
        min-height: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0E1E36;
        color: #333;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.2),
          0 0 10px rgba(255, 255, 255, 0.1),
          0 0 20px rgba(255, 255, 255, 0.05);
      }
      
      .auth-container {
        padding: 20px;
        color: white;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .subtitle {
        font-size: 12px;
        opacity: 0.9;
      }
      
      .auth-tabs {
        display: flex;
        margin-bottom: 20px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 4px;
      }
      
      .tab-btn {
        flex: 1;
        padding: 8px;
        border: none;
        background: transparent;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .tab-btn.active {
        background: rgba(255,255,255,0.2);
      }
      
      .auth-form {
        margin-bottom: 20px;
      }
      
      .auth-form.hidden {
        display: none;
      }
      
      .auth-form input {
        width: 100%;
        padding: 12px;
        margin-bottom: 12px;
        border: none;
        border-radius: 6px;
        background: rgba(255,255,255,0.9);
        box-sizing: border-box;
      }
      
      .auth-btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 6px;
        background: #ff6b35;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .auth-btn:hover {
        background: #e55a2b;
      }
      
      .auth-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .error-message {
        color: #ffcdd2;
        font-size: 12px;
        margin-top: 8px;
      }
      
      .success-message {
        color: #c8e6c9;
        font-size: 12px;
        margin-top: 8px;
      }
      
      .footer {
        text-align: center;
        margin-top: 20px;
      }
      
      .footer a {
        color: rgba(255,255,255,0.8);
        text-decoration: none;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  applyMainStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        width: 350px;
        min-height: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #0E1E36;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.2),
          0 0 10px rgba(255, 255, 255, 0.1),
          0 0 20px rgba(255, 255, 255, 0.05);
      }
      
      .popup-container {
        padding: 16px;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
      }
      
      .logo {
        font-size: 18px;
        font-weight: bold;
        color: white;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .user-name {
        font-size: 12px;
        color: rgba(255,255,255,0.8);
      }
      
      .logout-btn {
        padding: 4px 8px;
        border: 1px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.1);
        color: white;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }
      
      .logout-btn:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .status-section {
        margin-bottom: 20px;
      }
      
      .status-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .status-label {
        font-size: 13px;
        color: rgba(255,255,255,0.8);
      }
      
      .status-value {
        font-size: 13px;
        font-weight: 500;
        color: white;
      }
      
      .status-active {
        color: #22c55e;
      }
      
      .stats-section {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;
        padding: 16px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .stat-item {
        flex: 1;
        text-align: center;
      }
      
      .stat-number {
        display: block;
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
      
      .stat-label {
        font-size: 11px;
        color: rgba(255,255,255,0.7);
        text-transform: uppercase;
      }
      
      .recent-activity {
        margin-bottom: 20px;
      }
      
      .recent-activity h3 {
        font-size: 14px;
        margin: 0 0 12px 0;
        color: white;
      }
      
      .activity-list {
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .activity-item {
        padding: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: white;
      }
      
      .activity-item:last-child {
        border-bottom: none;
      }
      
      .activity-platform {
        font-weight: 500;
      }
      
      .activity-risk {
        font-size: 11px;
        text-transform: uppercase;
      }
      
      .activity-time {
        color: rgba(255,255,255,0.7);
      }
      
      .actions {
        display: flex;
        gap: 8px;
      }
      
      .action-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .action-btn.primary {
        background: #ff6f3c;
        color: white;
      }
      
      .action-btn.primary:hover {
        background: #ff8a5c;
      }
      
      .action-btn.secondary {
        background: rgba(255,255,255,0.1);
        color: white;
      }
      
      .action-btn.secondary:hover {
        background: rgba(255,255,255,0.2);
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new ComplyzePopup();
}); 