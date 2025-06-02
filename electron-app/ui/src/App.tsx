import React, { useState, useEffect } from 'react';
import './App.css';

// Add TypeScript declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      processPrompt: (data: any) => Promise<any>;
      getActiveMonitoring: () => Promise<any>;
      checkAuth: () => Promise<any>;
      login: (credentials: any) => Promise<any>;
      signup: (signupData: any) => Promise<any>;
      logout: () => Promise<any>;
      openDashboard: () => Promise<any>;
      getMonitoringStatus: () => Promise<any>;
      toggleMonitoring: () => Promise<any>;
      getRecentActivity: () => Promise<any>;
      onAppDetected: (callback: (data: any) => void) => void;
      onPromptProcessed: (callback: (data: any) => void) => void;
      onMonitoringToggled: (callback: (data: any) => void) => void;
      testSimpleNotification: () => Promise<any>;
      testInputDetection: () => Promise<any>;
      testNotification: () => Promise<any>;
    };
  }
}

interface User {
  id: string;
  email: string;
  username: string;
  companyName?: string;
}

interface LoginForm {
  username: string;
  password: string;
}

interface SignupForm extends LoginForm {
  email: string;
  confirmPassword: string;
  companyName: string;
}

interface MonitoredApp {
  name: string;
  executableName: string;
  processName: string;
  platform: string;
  enabled: boolean;
}

interface MonitoredWebURL {
  name: string;
  pattern: string;
  enabled: boolean;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
    companyName: ''
  });
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>([]);
  const [monitoredWebURLs, setMonitoredWebURLs] = useState<MonitoredWebURL[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeMonitoring, setActiveMonitoring] = useState({
    activeProcesses: [],
    webContentsCount: 0,
    clipboardMonitoring: false
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [manualPrompt, setManualPrompt] = useState('');
  const [lastResult, setLastResult] = useState<string>('');

  useEffect(() => {
    // Initialize app data
    const initializeApp = async () => {
      try {
        // Check authentication
        const { authenticated, user } = await window.electronAPI.checkAuth();
        setIsLoggedIn(authenticated);
        setUser(user || null);

        // Get monitoring status
        const monitoringStatus = await window.electronAPI.getMonitoringStatus();
        setMonitoringEnabled(monitoringStatus.enabled);
        setMonitoredApps(monitoringStatus.monitoredApps || []);
        setMonitoredWebURLs(monitoringStatus.monitoredWebURLs || []);
        
        // Get active monitoring status
        const activeStatus = await window.electronAPI.getActiveMonitoring();
        setActiveMonitoring(activeStatus);
        
        // Get recent activity
        const activity = await window.electronAPI.getRecentActivity();
        setRecentActivity(activity || []);
      } catch (err) {
        console.error('App initialization failed:', err);
      }
    };
    
    initializeApp();
    
    // Set up event listeners for real-time updates
    const handleAppDetected = (data: any) => {
      console.log('App detected:', data);
      // Update active monitoring status
      window.electronAPI.getActiveMonitoring().then(setActiveMonitoring);
    };
    
    const handlePromptProcessed = (data: any) => {
      console.log('Prompt processed:', data);
      // Update recent activity
      setRecentActivity(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 items
    };
    
    const handleBrowsersDetected = (data: any) => {
      console.log('Browsers detected:', data);
      // Could show a notification about Chrome extension
    };
    
    const handleClipboardPromptDetected = (data: any) => {
      console.log('Clipboard prompt detected:', data);
      // Update recent activity with clipboard detection
      const clipboardActivity = {
        sourceApp: 'Clipboard',
        timestamp: new Date().toISOString(),
        data: {
          rawPrompt: data.promptPreview,
          hasPromptIndicators: data.hasPromptIndicators,
          hasSensitiveData: data.hasSensitiveData
        }
      };
      setRecentActivity(prev => [clipboardActivity, ...prev.slice(0, 9)]);
    };
    
    const handleMonitoringToggled = (data: any) => {
      console.log('Monitoring toggled:', data);
      setMonitoringEnabled(data.enabled);
      
      // Update active monitoring status
      window.electronAPI.getActiveMonitoring().then(setActiveMonitoring);
      
      // Add to recent activity
      const monitoringActivity = {
        sourceApp: 'System',
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        data: {
          action: `Monitoring ${data.enabled ? 'enabled' : 'disabled'}`,
          source: 'Tray Menu or Settings'
        }
      };
      setRecentActivity(prev => [monitoringActivity, ...prev.slice(0, 9)]);
    };
    
    // Add event listeners
    if (window.electronAPI) {
      window.electronAPI.onAppDetected(handleAppDetected);
      window.electronAPI.onPromptProcessed(handlePromptProcessed);
      window.electronAPI.onMonitoringToggled(handleMonitoringToggled);
    }
    
    // Cleanup function
    return () => {
      // Event listeners are automatically cleaned up by Electron
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await window.electronAPI.login(loginForm);
      if (result.success) {
        setIsLoggedIn(true);
        setUser(result.user);
        setShowLogin(false);
        setLoginForm({ username: '', password: '' });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await window.electronAPI.signup(signupForm);
      if (result.success) {
        if (result.emailConfirmationRequired) {
          // Email confirmation required
          setError(''); // Clear any previous errors
          setShowSignup(false);
          setSignupForm({
            username: '',
            password: '',
            email: '',
            confirmPassword: '',
            companyName: ''
          });
          // Show a success message instead of error
          alert(result.message || 'Account created! Please check your email for verification, then try logging in.');
        } else {
          // User was automatically logged in
          setIsLoggedIn(true);
          setUser(result.user);
          setShowSignup(false);
          setSignupForm({
            username: '',
            password: '',
            email: '',
            confirmPassword: '',
            companyName: ''
          });
        }
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await window.electronAPI.logout();
      setIsLoggedIn(false);
      setUser(null);
    } catch (err) {
      setError('Logout failed');
    }
  };

  const handleOpenDashboard = async () => {
    if (!isLoggedIn) {
      setError('Please log in to access your dashboard');
      return;
    }
    
    try {
      await window.electronAPI.openDashboard();
    } catch (err) {
      setError('Failed to open dashboard');
    }
  };

  const toggleMonitoring = async () => {
    try {
      const enabled = await window.electronAPI.toggleMonitoring();
      setMonitoringEnabled(enabled);
      
      // Update active monitoring status
      const activeStatus = await window.electronAPI.getActiveMonitoring();
      setActiveMonitoring(activeStatus);
    } catch (err) {
      setError('Failed to toggle monitoring');
    }
  };

  const handleManualPromptTest = async () => {
    if (!manualPrompt.trim()) {
      setError('Please enter a prompt to test');
      return;
    }
    
    setLoading(true);
    try {
      // Copy the prompt to clipboard to trigger monitoring
      await navigator.clipboard.writeText(manualPrompt);
      
      // Clear the input
      setManualPrompt('');
      
      // Show success message
      console.log('Prompt copied to clipboard and will be processed');
    } catch (err) {
      setError('Failed to copy prompt to clipboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">COMPLYZE</div>
        <div className="actions">
          {!isLoggedIn ? (
            <>
              <button onClick={() => setShowLogin(true)} className="login-btn">
                Login
              </button>
              <button onClick={() => setShowSignup(true)} className="signup-btn">
                Sign Up
              </button>
            </>
          ) : (
            <>
              <span className="user-info">
                Welcome, {user?.username || user?.email}
              </span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main">
        <h1>LLM risk is invisible—until it's not.</h1>
        <p>Monitor and enhance your AI prompts with real-time compliance protection</p>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}

        <div className="status-section">
          {!isLoggedIn ? (
            <div className="auth-status">
              <span className="status-dot red"></span>
              Not logged in - Please log in to access all features
            </div>
          ) : (
            <div className="auth-status">
              <span className="status-dot green"></span>
              Logged in as {user?.username}
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleOpenDashboard} 
            className="dashboard-btn"
            disabled={!isLoggedIn}
          >
            Open Dashboard
          </button>
          
          <button 
            onClick={() => setShowMonitoring(!showMonitoring)}
            className="monitoring-settings-btn"
          >
            {showMonitoring ? 'Hide' : 'Show'} Monitoring Settings
          </button>
          
          <button 
            onClick={() => setShowPromptInput(!showPromptInput)}
            className="prompt-input-btn"
          >
            {showPromptInput ? 'Hide' : 'Show'} Prompt Tester
          </button>
        </div>

        {showPromptInput && (
          <div className="prompt-input-section">
            <h3>🧪 Test Prompt Enhancement</h3>
            <p>Enter a prompt below to see how Complyze enhances it. The prompt will be copied to clipboard and processed automatically.</p>
            <div className="input-container">
              <textarea
                value={manualPrompt}
                onChange={(e) => setManualPrompt(e.target.value)}
                placeholder="Enter your prompt here... (e.g., 'Help me write an email to john@company.com about my project')"
                className="prompt-textarea"
                rows={4}
              />
              <div className="input-actions">
                <button 
                  onClick={handleManualPromptTest}
                  className="test-btn"
                  disabled={loading || !manualPrompt.trim()}
                >
                  {loading ? 'Processing...' : '✨ Enhance Prompt'}
                </button>
                <button 
                  onClick={() => setManualPrompt('')}
                  className="clear-btn"
                  disabled={!manualPrompt.trim()}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="example-prompts">
              <h4>Quick Examples:</h4>
              <div className="example-buttons">
                <button 
                  onClick={() => setManualPrompt('Please explain how machine learning works')}
                  className="example-btn"
                >
                  Simple Question
                </button>
                <button 
                  onClick={() => setManualPrompt('Help me write an email to john.doe@company.com about my SSN 123-45-6789')}
                  className="example-btn"
                >
                  With Sensitive Data
                </button>
                <button 
                  onClick={() => setManualPrompt('Generate a comprehensive blog post about artificial intelligence')}
                  className="example-btn"
                >
                  Creative Task
                </button>
              </div>
            </div>
            
            <div className="test-notifications">
              <h4>🧪 Test Notifications:</h4>
              <div className="test-buttons">
                <button 
                  onClick={async () => {
                    try {
                      const result = await window.electronAPI.testSimpleNotification();
                      setLastResult(`Test notification: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
                    } catch (error: any) {
                      setLastResult(`Test notification error: ${error.message}`);
                    }
                  }}
                  className="test-btn test-notification"
                >
                  🔔 Test Simple Notification
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const result = await window.electronAPI.testInputDetection();
                      setLastResult(`Input detection test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
                    } catch (error: any) {
                      setLastResult(`Input detection error: ${error.message}`);
                    }
                  }}
                  className="test-btn test-detection"
                >
                  🎯 Test Input Detection
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const result = await window.electronAPI.testNotification();
                      setLastResult(`Full notification test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message || result.userChoice}`);
                    } catch (error: any) {
                      setLastResult(`Full notification error: ${error.message}`);
                    }
                  }}
                  className="test-btn test-full"
                >
                  🚀 Test Full Notification
                </button>
              </div>
              <div className="test-instructions">
                <p><strong>Use these buttons to verify the notification system is working:</strong></p>
                <ul>
                  <li><strong>Simple:</strong> Shows a basic notification popup</li>
                  <li><strong>Input Detection:</strong> Simulates detecting text input from ChatGPT</li>
                  <li><strong>Full:</strong> Shows a complete notification with sensitive data</li>
                </ul>
              </div>
              {lastResult && (
                <div className="test-results">
                  <h5>Last Test Result:</h5>
                  <p className="result-text">{lastResult}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="capabilities-notice">
          <h3>🛡️ What Complyze Desktop Agent Can Do</h3>
          <div className="capability-grid">
            <div className="capability-item working">
              <span className="capability-status">✅</span>
              <div>
                <strong>Real-time Input Monitoring</strong>
                <p>Monitors text as you type in ChatGPT and Claude desktop apps (requires accessibility permissions)</p>
              </div>
            </div>
            <div className="capability-item working">
              <span className="capability-status">✅</span>
              <div>
                <strong>Clipboard Protection</strong>
                <p>Real-time blocking when you copy sensitive prompts</p>
              </div>
            </div>
            <div className="capability-item working">
              <span className="capability-status">✅</span>
              <div>
                <strong>App Detection</strong>
                <p>Monitors when AI apps like ChatGPT Desktop and Claude are running</p>
              </div>
            </div>
            <div className="capability-item working">
              <span className="capability-status">✅</span>
              <div>
                <strong>Prompt Enhancement</strong>
                <p>Shows optimized versions of your prompts with insights</p>
              </div>
            </div>
            <div className="capability-item working">
              <span className="capability-status">✅</span>
              <div>
                <strong>Text Replacement</strong>
                <p>Can replace text directly in AI apps with enhanced versions</p>
              </div>
            </div>
          </div>
          <div className="recommendation">
            <strong>💡 New Feature:</strong> With accessibility permissions, Complyze can now monitor and enhance your prompts as you type in ChatGPT and Claude desktop apps!
          </div>
        </div>

        <div className="monitoring-section">
          <div className="monitoring-header">
            <h2>Prompt Monitoring</h2>
            <button 
              onClick={toggleMonitoring}
              className={`toggle-btn ${monitoringEnabled ? 'enabled' : 'disabled'}`}
            >
              {monitoringEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <p>
            {monitoringEnabled 
              ? `Actively monitoring ${monitoredApps.length} apps and ${monitoredWebURLs.length} websites`
              : 'Monitoring is currently disabled'
            }
          </p>
          
          {monitoringEnabled && (
            <div className="monitoring-settings">
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="setting-checkbox"
                  />
                  <span className="setting-text">Show desktop notifications for flagged prompts</span>
                </label>
              </div>
            </div>
          )}
          
          {monitoringEnabled && (
            <div className="active-monitoring-status">
              <h3>Live Monitoring Status</h3>
              <div className="monitoring-stats">
                <div className="stat-item">
                  <span className="stat-label">Active Apps:</span>
                  <span className="stat-value">{activeMonitoring.activeProcesses.length}</span>
                  {activeMonitoring.activeProcesses.length > 0 && (
                    <span className="stat-detail">({activeMonitoring.activeProcesses.join(', ')})</span>
                  )}
                </div>
                <div className="stat-item">
                  <span className="stat-label">Web Sessions:</span>
                  <span className="stat-value">{activeMonitoring.webContentsCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Clipboard Monitor:</span>
                  <span className={`stat-value ${activeMonitoring.clipboardMonitoring ? 'active' : 'inactive'}`}>
                    {activeMonitoring.clipboardMonitoring ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="monitoring-instructions">
                <h4>How Monitoring Works:</h4>
                <ul>
                  <li><strong>🔥 NEW: Real-time Input Monitoring:</strong> Monitors text as you type in ChatGPT/Claude desktop apps</li>
                  <li><strong>✅ Clipboard Protection:</strong> Real-time enhancement of prompts copied to clipboard</li>
                  <li><strong>✅ Desktop Apps:</strong> Detects ChatGPT Desktop, Claude Desktop, and other AI apps</li>
                  <li><strong>✅ Smart Enhancement:</strong> Shows optimized prompts with AI best practices</li>
                  <li><strong>✅ Sensitive Data Protection:</strong> Removes emails, SSNs, credit cards automatically</li>
                  <li><strong>🔄 Text Replacement:</strong> Can replace text directly in AI apps with enhanced versions</li>
                </ul>
                <div className="protection-levels">
                  <div className="protection-item">
                    <span className="protection-icon">🛡️</span>
                    <div>
                      <strong>Full Protection:</strong> Real-time input monitoring + clipboard protection (requires accessibility permissions)
                    </div>
                  </div>
                  <div className="protection-item">
                    <span className="protection-icon">👁️</span>
                    <div>
                      <strong>App Awareness:</strong> Desktop app detection and activity logging
                    </div>
                  </div>
                </div>
                <p className="instruction-note">
                  💡 <strong>Grant Accessibility Permissions:</strong> Go to System Preferences {'>'}  Security & Privacy {'>'}  Accessibility and add Complyze for real-time input monitoring!
                </p>
              </div>
            </div>
          )}
        </div>

        {showMonitoring && (
          <div className="monitoring-details">
            <div className="monitored-apps">
              <h3>Monitored Applications ({monitoredApps.length})</h3>
              <div className="app-list">
                {monitoredApps.map((app, index) => (
                  <div key={index} className="app-item">
                    <span className="app-name">{app.name}</span>
                    <span className={`app-status ${app.enabled ? 'enabled' : 'disabled'}`}>
                      {app.enabled ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="monitored-websites">
              <h3>Monitored Websites ({monitoredWebURLs.length})</h3>
              <div className="website-list">
                {monitoredWebURLs.map((site, index) => (
                  <div key={index} className="website-item">
                    <span className="website-name">{site.name}</span>
                    <span className={`website-status ${site.enabled ? 'enabled' : 'disabled'}`}>
                      {site.enabled ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-content">
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-header">
                      <span className="activity-source">{activity.sourceApp || activity.data?.sourceApp}</span>
                      <span className="activity-time">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString() : 'Now'}
                      </span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-prompt">
                        {activity.data?.rawPrompt?.substring(0, 100) || activity.prompt?.substring(0, 100) || 'Prompt processed'}...
                      </span>
                      {activity.data?.riskScore && (
                        <span className={`risk-score ${activity.data.riskScore > 70 ? 'high' : activity.data.riskScore > 40 ? 'medium' : 'low'}`}>
                          Risk: {activity.data.riskScore}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent activity. Start using monitored apps or copy prompts to clipboard to see enhancement here.</p>
            )}
          </div>
        </div>
      </main>

      {showLogin && (
        <div className="modal">
          <div className="modal-content">
            <h2>Login to Complyze</h2>
            <p className="login-info">
              Use your existing Complyze account credentials to access the desktop agent.
            </p>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username or Email"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required
                disabled={loading}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setShowLogin(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
            <div className="signup-link">
              <p>
                Don't have an account? 
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLogin(false);
                    setShowSignup(true);
                  }}
                  className="link-btn"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="modal">
          <div className="modal-content">
            <h2>Sign Up for Complyze</h2>
            <p className="signup-info">
              Create your Complyze account to start monitoring and enhancing your AI prompts.
            </p>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={e => setSignupForm({...signupForm, username: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={e => setSignupForm({...signupForm, email: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={e => setSignupForm({...signupForm, password: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={signupForm.confirmPassword}
                onChange={e => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Company Name"
                value={signupForm.companyName}
                onChange={e => setSignupForm({...signupForm, companyName: e.target.value})}
                required
                disabled={loading}
              />
              <div className="form-actions">
                <button type="button" onClick={() => setShowSignup(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>
            </form>
            <div className="login-link">
              <p>
                Already have an account? 
                <button 
                  type="button" 
                  onClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                  }}
                  className="link-btn"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 