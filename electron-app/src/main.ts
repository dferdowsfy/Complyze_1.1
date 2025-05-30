import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, screen, shell, net, clipboard, session } from 'electron';
import * as path from 'path';
import * as os from 'os';
import Store from 'electron-store';
import log from 'electron-log';
import { monitoredApps, monitoredWebURLs } from './monitoringTargets';
import { comprehensiveRedact, calculateRiskScore } from './shared/redactionEngine';
import { enhancePrompt } from './shared/promptEnhancer';
import { dispatchToComplyze, checkComplyzeAuth, PromptLogData } from './shared/dispatch';

// Add monitoring system imports
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Add monitoring state
let monitoringInterval: NodeJS.Timeout | null = null;
let lastClipboardContent = '';
let originalClipboardContent = ''; // Store original content for restoration
let activeProcesses = new Set<string>();
let webContentsMonitoring = new Map<number, boolean>();

// Helper function to make HTTP requests using Electron's net module
interface HttpResponse {
  ok: boolean;
  statusCode: number;
  json: () => Promise<any>;
}

const makeRequest = async (url: string, options: any = {}): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: options.method || 'GET',
      url: url,
      headers: options.headers || {}
    });

    if (options.body) {
      request.write(options.body);
    }

    request.on('response', (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ 
            ok: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode,
            json: () => Promise.resolve(parsedData)
          });
        } catch (error) {
          resolve({ 
            ok: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode,
            json: () => Promise.resolve({})
          });
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
};

// Add auth configuration for complyze.co integration
const AUTH_CONFIG = {
  // Use the actual complyze.co API endpoints
  API_URL: 'https://complyze.co/api',
  DASHBOARD_URL: 'https://complyze.co/dashboard',
  MOCK_MODE: false
};

// Add interfaces for API responses and store schema
interface AuthResponse {
  token: string;
  user: UserData;
  message?: string;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  companyName?: string;
}

interface StoreSchema {
  auth: {
    token: string | null;
    user: UserData | null;
  };
  monitoring: {
    enabled: boolean;
  };
}

// Update store configuration
const store = new Store<StoreSchema>({
  defaults: {
    auth: {
      token: null,
      user: null
    },
    monitoring: {
      enabled: true
    }
  }
});

// Global variables
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let notificationWindows: BrowserWindow[] = []; // Track notification windows

// App configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isMonitoringEnabled = () => store.get('monitoring.enabled', true) as boolean;

/**
 * Create the main application window
 */
function createMainWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1200, width * 0.8),
    height: Math.min(800, height * 0.8),
    center: true,
    title: 'Complyze',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDevelopment
    },
    show: false,
    icon: getIconPath(),
    backgroundColor: '#0E1E36'
  });

  // Set the app name
  app.name = 'Complyze';
  
  // Load the React app
  const startUrl = isDevelopment 
    ? 'http://localhost:3001' 
    : `file://${path.join(__dirname, '../ui/build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Window event handlers
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Development tools
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * Create system tray
 */
function createTray(): void {
  try {
    const iconPath = getIconPath();
    if (!iconPath) {
      console.warn('No icon path available, skipping tray creation');
      return;
    }
    
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Complyze Desktop Agent',
        type: 'normal',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show Window',
        type: 'normal',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createMainWindow();
          }
        },
      },
      {
        label: isMonitoringEnabled() ? 'Disable Monitoring' : 'Enable Monitoring',
        type: 'normal',
        click: () => {
          const currentStatus = isMonitoringEnabled();
          store.set('monitoring.enabled', !currentStatus);
          updateTrayMenu();
          log.info(`Monitoring ${!currentStatus ? 'enabled' : 'disabled'}`);
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        type: 'normal',
        accelerator: 'Cmd+Q',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Complyze Desktop Agent');
    
    // Handle tray click
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createMainWindow();
      }
    });
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

/**
 * Update tray menu based on current state
 */
function updateTrayMenu(): void {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Complyze Desktop Agent',
      type: 'normal',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      type: 'normal',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: isMonitoringEnabled() ? 'Disable Monitoring' : 'Enable Monitoring',
      type: 'normal',
      click: () => {
        const currentStatus = isMonitoringEnabled();
        store.set('monitoring.enabled', !currentStatus);
        updateTrayMenu();
        log.info(`Monitoring ${!currentStatus ? 'enabled' : 'disabled'}`);
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      type: 'normal',
      accelerator: 'Cmd+Q',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Get icon path based on platform
 */
function getIconPath(): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const iconName = os.platform() === 'darwin' ? 'icon.png' : 'icon.png';
  
  // In development, use the absolute path to the assets directory
  const iconPath = path.join(__dirname, '..', 'assets', iconName);
  
  // Ensure the icon exists
  try {
    if (require('fs').existsSync(iconPath)) {
      return iconPath;
    }
    // Fallback to a default icon if the custom one doesn't exist
    return path.join(__dirname, '..', 'assets', 'icon.png');
  } catch (error) {
    console.error('Error loading icon:', error);
    return '';
  }
}

/**
 * Intercept and potentially block a prompt before it's sent
 */
async function interceptPrompt(data: {
  prompt: string;
  sourceApp: string;
  userId?: string;
}): Promise<{ action: 'allow' | 'block' | 'replace'; enhancedPrompt?: string }> {
  try {
    console.log(`Complyze Debug: Intercepting prompt from ${data.sourceApp}`);

    // 1. Quick risk assessment
    const redactionResult = await comprehensiveRedact(data.prompt);
    const riskScore = calculateRiskScore(redactionResult.redactionDetails);
    
    // 2. Generate enhanced prompt if needed
    let enhancementResult = null;
    if (riskScore > 30 || redactionResult.redactionDetails.length > 0) {
      enhancementResult = await enhancePrompt(redactionResult.redactedText);
    }
    
    // 3. Determine if blocking is needed
    const shouldBlock = riskScore > 50 || redactionResult.redactionDetails.length > 0;
    
    if (shouldBlock) {
      console.log(`Complyze Debug: Blocking prompt with risk score ${riskScore}`);
      
      // Show blocking notification and wait for user decision
      const userChoice = await createNotificationWindow({
        prompt: data.prompt,
        riskScore,
        redactionDetails: redactionResult.redactionDetails,
        sourceApp: data.sourceApp,
        enhancedPrompt: enhancementResult?.enhancedPrompt,
        blockingMode: true
      });
      
      // Log the interaction
      await logPromptInteraction({
        ...data,
        riskScore,
        redactionDetails: redactionResult.redactionDetails,
        userChoice,
        enhancedPrompt: enhancementResult?.enhancedPrompt
      });
      
      return {
        action: userChoice,
        enhancedPrompt: enhancementResult?.enhancedPrompt
      };
    } else {
      // Low risk, just show notification but allow
      createNotificationWindow({
        prompt: data.prompt,
        riskScore,
        redactionDetails: redactionResult.redactionDetails,
        sourceApp: data.sourceApp,
        enhancedPrompt: enhancementResult?.enhancedPrompt,
        blockingMode: false
      });
      
      return { action: 'allow' };
    }
  } catch (error) {
    console.error('Complyze Debug: Error intercepting prompt:', error);
    return { action: 'allow' }; // Default to allow on error
  }
}

/**
 * Log prompt interaction for analytics
 */
async function logPromptInteraction(data: {
  prompt: string;
  sourceApp: string;
  userId?: string;
  riskScore: number;
  redactionDetails: any[];
  userChoice: string;
  enhancedPrompt?: string;
}): Promise<void> {
  try {
    const logData: PromptLogData = {
      userId: data.userId || 'unknown',
      rawPrompt: data.prompt,
      enhancedPrompt: data.enhancedPrompt || '',
      redactedFields: data.redactionDetails.map(detail => ({
        original: detail.original,
        redacted: detail.redacted,
        type: detail.type,
        reason: `Redacted ${detail.type} for compliance`,
      })),
      riskScore: data.riskScore,
      timestamp: new Date().toISOString(),
      sourceApp: data.sourceApp,
      clarityScore: 0,
      qualityScore: 0,
    };

    // Add user choice to the log
    (logData as any).userChoice = data.userChoice;
    (logData as any).wasBlocked = data.userChoice === 'block';

    await dispatchToComplyze(logData);
    console.log(`Complyze Debug: Logged interaction - User chose: ${data.userChoice}`);
  } catch (error) {
    console.error('Error logging prompt interaction:', error);
  }
}

/**
 * Process captured prompt (non-blocking, for logging and notifications only)
 */
async function processPrompt(data: {
  prompt: string;
  sourceApp: string;
  userId?: string;
}): Promise<void> {
  try {
    log.info(`Processing prompt from ${data.sourceApp}:`, data.prompt.substring(0, 100) + '...');

    // 1. Redact sensitive data
    const redactionResult = await comprehensiveRedact(data.prompt);
    
    // 2. Enhance prompt (only if redacted content is safe)
    const enhancementResult = await enhancePrompt(redactionResult.redactedText);
    
    // 3. Calculate risk score
    const riskScore = calculateRiskScore(redactionResult.redactionDetails);
    
    // 4. Prepare log data
    const logData: PromptLogData = {
      userId: data.userId || 'unknown',
      rawPrompt: data.prompt,
      enhancedPrompt: enhancementResult.enhancedPrompt,
      redactedFields: redactionResult.redactionDetails.map(detail => ({
        original: detail.original,
        redacted: detail.redacted,
        type: detail.type,
        reason: `Redacted ${detail.type} for compliance`,
      })),
      riskScore,
      timestamp: new Date().toISOString(),
      sourceApp: data.sourceApp,
      clarityScore: enhancementResult.clarityScore,
      qualityScore: enhancementResult.qualityScore,
    };

    // 5. Send to dashboard
    const success = await dispatchToComplyze(logData);
    
    // 6. Show desktop notification if prompt is flagged (non-blocking)
    const shouldShowNotification = riskScore > 30 || redactionResult.redactionDetails.length > 0;
    
    if (shouldShowNotification) {
      console.log('Complyze Debug: Showing desktop notification for flagged prompt');
      createNotificationWindow({
        prompt: data.prompt,
        riskScore,
        redactionDetails: redactionResult.redactionDetails,
        sourceApp: data.sourceApp,
        enhancedPrompt: enhancementResult.enhancedPrompt,
        blockingMode: false
      });
    }
    
    // 7. Notify main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('prompt-processed', {
        success,
        data: logData,
        enhancementResult,
        redactionResult,
        notificationShown: shouldShowNotification
      });
    }

    log.info(`Prompt processing ${success ? 'successful' : 'failed'} for ${data.sourceApp}`);
  } catch (error) {
    log.error('Error processing prompt:', error);
  }
}

// IPC handlers
ipcMain.handle('get-monitoring-status', () => {
  return {
    enabled: isMonitoringEnabled(),
    monitoredApps: monitoredApps.filter(app => app.enabled),
    monitoredWebURLs: monitoredWebURLs.filter(url => url.enabled),
  };
});

ipcMain.handle('toggle-monitoring', () => {
  const currentStatus = isMonitoringEnabled();
  const newStatus = !currentStatus;
  
  store.set('monitoring.enabled', newStatus);
  
  if (newStatus) {
    startMonitoring();
  } else {
    stopMonitoring();
  }
  
  updateTrayMenu();
  log.info(`Monitoring ${newStatus ? 'enabled' : 'disabled'}`);
  
  return newStatus;
});

ipcMain.handle('check-auth', async () => {
  try {
    const auth = store.get('auth');
    if (!auth.token) return { authenticated: false };

    // Use the exact API endpoint from the website
    const response = await makeRequest(`${AUTH_CONFIG.API_URL}/auth/check`, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.authenticated && data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.full_name || data.user.email?.split('@')[0],
          companyName: data.user.company_name || ''
        };
        store.set('auth', { ...auth, user });
        return { authenticated: true, user };
      }
    }
    
    store.set('auth', { token: null, user: null });
    return { authenticated: false };
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false };
  }
});

ipcMain.handle('get-recent-activity', () => {
  return store.get('recentActivity', []);
});

ipcMain.handle('login', async (event, credentials) => {
  try {
    console.log('Attempting login with:', { email: credentials.username });
    
    // Use the exact API endpoint from the website
    const endpoint = `${AUTH_CONFIG.API_URL}/auth/login`;
    
    console.log('Using endpoint:', endpoint);
    
    const response = await makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.username,
        password: credentials.password
      })
    });

    console.log('Response status:', response.statusCode);
    const data = await response.json() as any;
    console.log('Response data:', data);
    
    if (response.ok && data.success && data.access_token) {
      const user = {
        id: data.user.id,
        email: data.user.email,
        username: data.user.full_name || data.user.email?.split('@')[0],
        companyName: data.user.company_name || ''
      };
      
      store.set('auth', { token: data.access_token, user });
      return { success: true, user };
    }
    
    return { success: false, error: data.error || data.details || 'Invalid credentials' };
    
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Unable to connect to Complyze. Please check your internet connection.' };
  }
});

ipcMain.handle('signup', async (event, signupData) => {
  try {
    console.log('Attempting signup with:', { email: signupData.email });
    
    // Use the exact API endpoint from the website
    const endpoint = `${AUTH_CONFIG.API_URL}/auth/signup`;
    
    const response = await makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: signupData.email,
        password: signupData.password,
        full_name: signupData.username
      })
    });

    console.log('Signup response status:', response.statusCode);
    const data = await response.json() as any;
    console.log('Signup response data:', data);
    
    if (response.ok && data.success) {
      if (data.auto_login && data.access_token) {
        // User was automatically logged in
        const user = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.full_name || signupData.username,
          companyName: signupData.companyName || ''
        };
        
        store.set('auth', { token: data.access_token, user });
        return { success: true, user };
      } else {
        // Email confirmation required
        return { 
          success: true, 
          message: data.message || 'Please check your email for verification, then try logging in.',
          emailConfirmationRequired: true
        };
      }
    }
    
    return { success: false, error: data.error || data.details || 'Signup failed' };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Unable to connect to Complyze. Please check your internet connection.' };
  }
});

ipcMain.handle('logout', () => {
  store.set('auth', { token: null, user: null });
  return true;
});

ipcMain.handle('open-dashboard', async () => {
  const auth = store.get('auth');
  
  if (!auth.token || !auth.user) {
    throw new Error('Please log in to access your dashboard');
  }

  // Open user's dashboard on complyze.co
  const dashboardUrl = `${AUTH_CONFIG.DASHBOARD_URL}?token=${auth.token}`;
  await shell.openExternal(dashboardUrl);
});

// Handle prompt capture from preload script
ipcMain.handle('prompt-captured', async (event, data) => {
  if (isMonitoringEnabled()) {
    await processPrompt(data);
  }
});

// Handle prompt processing from web content
ipcMain.handle('process-prompt', async (event, data) => {
  if (isMonitoringEnabled()) {
    await processPrompt({
      ...data,
      userId: store.get('auth.user.id') as string
    });
  }
});

// Get active monitoring status
ipcMain.handle('get-active-monitoring', () => {
  return {
    activeProcesses: Array.from(activeProcesses),
    webContentsCount: webContentsMonitoring.size,
    clipboardMonitoring: !!monitoringInterval
  };
});

// Manual prompt processing for testing
ipcMain.handle('test-prompt-processing', async (event, testPrompt) => {
  const testData = {
    prompt: testPrompt || 'Test prompt with sensitive data: john.doe@example.com and SSN 123-45-6789',
    sourceApp: 'Manual Test',
    userId: store.get('auth.user.id') as string
  };
  
  await processPrompt(testData);
  return { success: true, message: 'Test prompt processed' };
});

// Prompt interception for blocking
ipcMain.handle('intercept-prompt', async (event, data) => {
  if (isMonitoringEnabled()) {
    return await interceptPrompt({
      ...data,
      userId: store.get('auth.user.id') as string
    });
  }
  return { action: 'allow' };
});

// Test prompt interception
ipcMain.handle('test-prompt-interception', async (event, testPrompt) => {
  const testData = {
    prompt: testPrompt || 'Please help me with my SSN 123-45-6789 and credit card 4532-1234-5678-9012',
    sourceApp: 'Manual Test',
    userId: store.get('auth.user.id') as string
  };
  
  const result = await interceptPrompt(testData);
  return { success: true, result, message: 'Test prompt intercepted' };
});

// Notification IPC handlers
ipcMain.on('close-notification', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) {
    senderWindow.close();
  }
});

ipcMain.on('clipboard-action', (event, data) => {
  console.log('Complyze Debug: Received clipboard-action:', data);
  try {
    switch (data.action) {
      case 'clear':
        clipboard.writeText('');
        console.log('Complyze Debug: Clipboard cleared by user choice');
        break;
      case 'replace':
        if (data.content) {
          clipboard.writeText(data.content);
          console.log('Complyze Debug: Clipboard replaced with safe version');
          console.log('Complyze Debug: New clipboard content:', data.content.substring(0, 100) + '...');
        }
        break;
      case 'keep':
        // Do nothing - just keep the original content as is
        console.log('Complyze Debug: User chose to keep original clipboard content (no action taken)');
        break;
      default:
        console.log('Complyze Debug: Unknown clipboard action:', data.action);
    }
  } catch (error) {
    console.error('Complyze Debug: Error handling clipboard action:', error);
  }
});

ipcMain.on('open-dashboard-from-notification', async (event) => {
  try {
    await shell.openExternal(`${AUTH_CONFIG.DASHBOARD_URL}?token=${store.get('auth.token')}`);
  } catch (error) {
    console.error('Failed to open dashboard from notification:', error);
  }
});

// App event handlers
app.whenReady().then(() => {
  // Initialize logging
  log.initialize();
  log.info('Complyze Desktop Agent starting...');

  // Create tray first (always visible)
  createTray();

  // Create main window
  createMainWindow();

  // Start monitoring system
  startMonitoring();

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep app running in background on macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  // Stop monitoring system
  stopMonitoring();
  
  // Close all notification windows
  notificationWindows.forEach(window => {
    if (!window.isDestroyed()) {
      window.close();
    }
  });
  notificationWindows = [];
  
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle app updates (placeholder)
app.on('ready', () => {
  // Check for updates if needed
  // autoUpdater.checkForUpdatesAndNotify();
});

/**
 * Start monitoring system
 */
function startMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  log.info('Starting Complyze monitoring system...');
  
  // Monitor every 2 seconds
  monitoringInterval = setInterval(async () => {
    if (!isMonitoringEnabled()) return;
    
    try {
      await monitorActiveProcesses();
      await monitorClipboard();
    } catch (error) {
      log.error('Monitoring error:', error);
    }
  }, 2000);

  // Setup web content monitoring
  setupWebContentMonitoring();
  
  log.info('Complyze monitoring system started');
}

/**
 * Stop monitoring system
 */
function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  webContentsMonitoring.clear();
  log.info('Complyze monitoring system stopped');
}

/**
 * Monitor active processes for target applications
 */
async function monitorActiveProcesses(): Promise<void> {
  try {
    const platform = os.platform();
    let command = '';
    
    if (platform === 'darwin') {
      // Use ps -ax to get full command lines, which is better for app detection
      command = 'ps -ax';
    } else if (platform === 'win32') {
      command = 'tasklist /fo csv /nh';
    } else {
      command = 'ps -eo comm,pid';
    }
    
    const { stdout } = await execAsync(command);
    const runningProcesses = stdout.split('\n').map(line => line.trim());
    
    // Debug: Log some processes to see what we're getting
    console.log('Complyze Debug: Sample running processes:', runningProcesses.slice(0, 5));
    
    // Check for monitored apps
    const enabledApps = monitoredApps.filter(app => 
      app.enabled && (app.platform === 'all' || app.platform === platform)
    );
    
    console.log('Complyze Debug: Checking for apps:', enabledApps.map(app => app.name));
    
    // Also check for browsers (for web monitoring guidance)
    const browserProcesses = [
      'Google Chrome', 'Chrome', 'Safari', 'Firefox', 'Microsoft Edge', 'Edge'
    ];
    
    let browsersDetected = [];
    
    for (const app of enabledApps) {
      const isRunning = runningProcesses.some(process => {
        const processLower = process.toLowerCase();
        const appNameLower = app.processName.toLowerCase();
        const execNameLower = app.executableName.toLowerCase();
        
        // For macOS, check if the process line contains the app name
        const matches = processLower.includes(appNameLower) || 
                       processLower.includes(execNameLower) ||
                       processLower.includes(`${appNameLower}.app`) ||
                       processLower.includes(`${execNameLower}.app`);
        
        if (matches) {
          console.log(`Complyze Debug: Found match for ${app.name}: ${process.substring(0, 100)}...`);
        }
        
        return matches;
      });
      
      if (isRunning && !activeProcesses.has(app.name)) {
        activeProcesses.add(app.name);
        log.info(`Detected monitored app: ${app.name}`);
        console.log(`Complyze Debug: Added ${app.name} to active processes`);
        
        // Notify main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app-detected', {
            appName: app.name,
            status: 'active'
          });
        }
      } else if (!isRunning && activeProcesses.has(app.name)) {
        activeProcesses.delete(app.name);
        log.info(`Monitored app closed: ${app.name}`);
        console.log(`Complyze Debug: Removed ${app.name} from active processes`);
        
        // Notify main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app-detected', {
            appName: app.name,
            status: 'inactive'
          });
        }
      }
    }
    
    // Check for browsers
    for (const browser of browserProcesses) {
      const isRunning = runningProcesses.some(process => 
        process.toLowerCase().includes(browser.toLowerCase())
      );
      
      if (isRunning) {
        browsersDetected.push(browser);
      }
    }
    
    // Debug: Log current active processes
    console.log('Complyze Debug: Current active processes:', Array.from(activeProcesses));
    
    // Update browser detection status
    if (browsersDetected.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('browsers-detected', {
        browsers: browsersDetected,
        message: 'Install Complyze Chrome Extension for web monitoring'
      });
    }
    
  } catch (error) {
    log.error('Process monitoring error:', error);
    console.error('Complyze Debug: Process monitoring error:', error);
  }
}

/**
 * Monitor clipboard for potential prompt content and provide real-time blocking
 */
async function monitorClipboard(): Promise<void> {
  try {
    const currentContent = clipboard.readText();
    
    // Debug: Log clipboard changes
    if (currentContent !== lastClipboardContent) {
      console.log('Complyze Debug: Clipboard changed, length:', currentContent.length);
      console.log('Complyze Debug: Clipboard preview:', currentContent.substring(0, 100));
    }
    
    // Only process if content changed and is substantial
    if (currentContent !== lastClipboardContent && 
        currentContent.length > 10 && 
        currentContent.length < 10000) {
      
      lastClipboardContent = currentContent;
      originalClipboardContent = currentContent; // Store original for potential restoration
      
      // Enhanced prompt detection with more indicators
      const promptIndicators = [
        // Question words
        'explain', 'how to', 'what is', 'why does', 'can you', 'please',
        'could you', 'would you', 'help me', 'i need', 'tell me',
        
        // AI task words
        'generate', 'create', 'write', 'analyze', 'summarize', 'translate',
        'review', 'check', 'improve', 'optimize', 'debug', 'fix',
        
        // Common AI prompt starters
        'act as', 'pretend to be', 'you are', 'imagine you',
        'role play', 'simulate', 'behave like'
      ];
      
      const lowerContent = currentContent.toLowerCase();
      const hasPromptIndicators = promptIndicators.some(indicator => 
        lowerContent.includes(indicator)
      );
      
      // Also check for sensitive data patterns
      const sensitivePatterns = [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /\b\d{3}-\d{2}-\d{4}\b/, // SSN
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
        /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      ];
      
      const hasSensitiveData = sensitivePatterns.some(pattern => 
        pattern.test(currentContent)
      );
      
      console.log('Complyze Debug: Clipboard analysis:', {
        hasPromptIndicators,
        hasSensitiveData,
        length: currentContent.length
      });
      
      if (hasPromptIndicators || hasSensitiveData) {
        log.info('Potential prompt detected in clipboard', {
          hasPromptIndicators,
          hasSensitiveData,
          length: currentContent.length
        });
        
        console.log('Complyze Debug: Processing clipboard prompt...');
        
        // For clipboard content, we can provide real-time blocking
        const shouldBlock = hasSensitiveData; // Block if sensitive data detected
        
        if (shouldBlock) {
          // Generate enhanced prompt first
          const redactionResult = await comprehensiveRedact(currentContent);
          const enhancementResult = await enhancePrompt(redactionResult.redactedText);
          
          // Show blocking notification for clipboard content
          const userChoice = await createNotificationWindow({
            prompt: currentContent,
            riskScore: 85, // High risk for sensitive data
            redactionDetails: [{ type: 'Sensitive Data', original: 'Detected in clipboard', redacted: '[REDACTED]' }],
            sourceApp: 'Clipboard',
            enhancedPrompt: enhancementResult.enhancedPrompt,
            blockingMode: true
          });
          
          console.log('Complyze Debug: User chose:', userChoice);
          
          // Note: The clipboard action is now handled by the notification buttons
          // via the clipboard-action IPC handler, so we don't need to modify it here
          
        } else {
          // Just process for logging and notifications
          await processPrompt({
            prompt: currentContent,
            sourceApp: 'Clipboard',
            userId: store.get('auth.user.id') as string
          });
        }
        
        // Notify main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-prompt-detected', {
            hasPromptIndicators,
            hasSensitiveData,
            promptPreview: currentContent.substring(0, 100) + '...',
            wasBlocked: shouldBlock
          });
        }
      }
    }
  } catch (error) {
    log.error('Clipboard monitoring error:', error);
    console.error('Complyze Debug: Clipboard monitoring error:', error);
  }
}

/**
 * Setup web content monitoring for browser windows
 */
function setupWebContentMonitoring(): void {
  // Note: Electron can't inject into external browser windows for security reasons
  // Instead, we'll monitor for browser processes and provide instructions to users
  log.info('Web content monitoring: External browser monitoring requires Chrome extension');
  
  // We can still monitor if users open web content within our Electron app
  app.on('web-contents-created', (event, contents) => {
    // Skip if it's our main window
    if (contents === mainWindow?.webContents) return;
    
    contents.on('did-finish-load', () => {
      const url = contents.getURL();
      const monitoredSite = monitoredWebURLs.find(site => {
        const pattern = site.pattern.replace(/\*/g, '.*');
        const regex = new RegExp(pattern);
        return regex.test(url) && site.enabled;
      });
      
      if (monitoredSite) {
        log.info(`Monitoring Electron web content: ${monitoredSite.name} (${url})`);
        injectWebMonitoring(contents, monitoredSite);
        webContentsMonitoring.set(contents.id, true);
      }
    });
    
    contents.on('destroyed', () => {
      webContentsMonitoring.delete(contents.id);
    });
  });
}

/**
 * Inject monitoring script into web content
 */
function injectWebMonitoring(contents: Electron.WebContents, site: any): void {
  const monitoringScript = `
    (function() {
      console.log('Complyze Desktop Agent: Monitoring ${site.name}');
      
      // Platform-specific selectors (similar to Chrome extension)
      const platformSelectors = {
        'chat.openai.com': {
          promptInput: '#prompt-textarea, div[contenteditable="true"], textarea[placeholder*="Message"], [data-id] div[contenteditable="true"], div[data-testid="composer-text-input"], textarea[data-testid="prompt-textarea"], div[role="textbox"]',
          submitButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"], button[type="submit"], button:has(svg), button[aria-label*="Send"], button[title*="Send"]'
        },
        'claude.ai': {
          promptInput: 'div[contenteditable="true"], textarea, div[role="textbox"]',
          submitButton: 'button[aria-label*="Send"], button:has(svg), button[type="submit"]'
        },
        'gemini.google.com': {
          promptInput: 'div[contenteditable="true"], textarea, div[role="textbox"]',
          submitButton: 'button[aria-label*="Send"], button:has(svg), button[type="submit"]'
        }
      };
      
      const hostname = window.location.hostname;
      const selectors = platformSelectors[hostname] || {
        promptInput: 'textarea, div[contenteditable="true"], input[type="text"]',
        submitButton: 'button[type="submit"], button:has(svg), input[type="submit"]'
      };
      
      let lastPrompt = '';
      let isProcessing = false;
      
      // Monitor for prompt submissions
      function setupPromptMonitoring() {
        // Monitor Enter key presses
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
            const promptElement = document.querySelector(selectors.promptInput);
            if (promptElement) {
              const promptText = getPromptText(promptElement).trim();
              if (promptText && promptText !== lastPrompt) {
                lastPrompt = promptText;
                processPrompt(promptText);
              }
            }
          }
        });
        
        // Monitor button clicks
        document.addEventListener('click', (e) => {
          if (isProcessing) return;
          
          const submitButton = e.target.closest(selectors.submitButton);
          if (submitButton) {
            const promptElement = document.querySelector(selectors.promptInput);
            if (promptElement) {
              const promptText = getPromptText(promptElement).trim();
              if (promptText && promptText !== lastPrompt) {
                lastPrompt = promptText;
                processPrompt(promptText);
              }
            }
          }
        });
      }
      
      function getPromptText(element) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          return element.value;
        } else if (element.contentEditable === 'true') {
          return element.textContent || element.innerText;
        }
        return '';
      }
      
      async function processPrompt(promptText) {
        if (isProcessing) return;
        isProcessing = true;
        
        console.log('Complyze: Processing prompt:', promptText.substring(0, 100) + '...');
        
        try {
          // Send to Electron main process via IPC
          if (window.electronAPI) {
            await window.electronAPI.processPrompt({
              prompt: promptText,
              sourceApp: '${site.name}',
              url: window.location.href,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Complyze: Error processing prompt:', error);
        } finally {
          isProcessing = false;
        }
      }
      
      // Initialize monitoring
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPromptMonitoring);
      } else {
        setupPromptMonitoring();
      }
      
      // Re-setup monitoring when page content changes
      const observer = new MutationObserver(() => {
        setupPromptMonitoring();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
    })();
  `;
  
  try {
    contents.executeJavaScript(monitoringScript);
  } catch (error) {
    log.error('Failed to inject monitoring script:', error);
  }
}

/**
 * Create a desktop notification window for flagged prompts
 */
function createNotificationWindow(data: {
  prompt: string;
  riskScore: number;
  redactionDetails: any[];
  sourceApp: string;
  enhancedPrompt?: string;
  blockingMode?: boolean;
}): Promise<'allow' | 'block' | 'replace'> {
  return new Promise((resolve) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // Calculate position for notification (center for blocking mode, top-right for non-blocking)
    const notificationWidth = data.blockingMode ? 500 : 400;
    const notificationHeight = data.blockingMode ? 500 : 350;
    const margin = 20;
    
    let x, y;
    if (data.blockingMode) {
      // Center the blocking notification
      x = Math.round((width - notificationWidth) / 2);
      y = Math.round((height - notificationHeight) / 2);
    } else {
      // Top-right for non-blocking notifications
      const yOffset = notificationWindows.length * (notificationHeight + 10);
      x = width - notificationWidth - margin;
      y = margin + yOffset;
    }
    
    const notificationWindow = new BrowserWindow({
      width: notificationWidth,
      height: notificationHeight,
      x,
      y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      show: false,
      modal: data.blockingMode,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: isDevelopment
      },
      backgroundColor: '#0E1E36',
      transparent: false,
      hasShadow: true,
      roundedCorners: true
    });

    // Track this notification window
    notificationWindows.push(notificationWindow);

    // Create the notification HTML content
    const notificationHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0E1E36 0%, #1a2f4a 100%);
            color: #FAF9F6;
            padding: 0;
            margin: 0;
            height: 100vh;
            overflow: hidden;
            border-radius: 12px;
            border: ${data.blockingMode ? '2px solid #FF6F3C' : '1px solid rgba(255, 111, 60, 0.3)'};
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
          }
          
          .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px 12px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            -webkit-app-region: drag;
            cursor: move;
            flex-shrink: 0;
          }
          
          .notification-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
          }
          
          .notification-title {
            font-size: ${data.blockingMode ? '16px' : '14px'};
            font-weight: bold;
            color: #FF6F3C;
            display: flex;
            align-items: center;
            gap: 8px;
            -webkit-app-region: no-drag;
          }
          
          .warning-icon {
            width: ${data.blockingMode ? '20px' : '16px'};
            height: ${data.blockingMode ? '20px' : '16px'};
            background: #FF6F3C;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${data.blockingMode ? '12px' : '10px'};
            color: white;
            font-weight: bold;
          }
          
          .close-btn {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s;
            -webkit-app-region: no-drag;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #FF6F3C;
          }
          
          .blocking-message {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            font-weight: 500;
            color: #dc3545;
            text-align: center;
            ${data.blockingMode ? '' : 'display: none;'}
          }
          
          .risk-level {
            font-size: ${data.blockingMode ? '14px' : '12px'};
            padding: ${data.blockingMode ? '6px 12px' : '4px 8px'};
            border-radius: 12px;
            font-weight: bold;
            margin-bottom: 16px;
            text-align: center;
          }
          
          .risk-high {
            background: rgba(220, 53, 69, 0.2);
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.3);
          }
          
          .risk-medium {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
            border: 1px solid rgba(255, 193, 7, 0.3);
          }
          
          .risk-low {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.3);
          }
          
          .source-app {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 12px;
          }
          
          .prompt-preview {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            line-height: 1.4;
            margin-bottom: 16px;
            max-height: ${data.blockingMode ? '100px' : '60px'};
            overflow-y: auto;
            border-left: 3px solid #FF6F3C;
            flex-shrink: 0;
          }
          
          .redaction-info {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 16px;
            flex-shrink: 0;
          }
          
          .redaction-item {
            background: rgba(220, 53, 69, 0.1);
            padding: 6px 8px;
            border-radius: 4px;
            margin: 4px 0;
            font-size: 10px;
          }
          
          .enhanced-preview {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.3);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            font-size: 11px;
            line-height: 1.4;
            max-height: 80px;
            overflow-y: auto;
            ${data.enhancedPrompt ? '' : 'display: none;'}
          }
          
          .enhanced-label {
            color: #28a745;
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 10px;
          }
          
          .actions {
            display: flex;
            gap: 12px;
            margin-top: auto;
            flex-wrap: wrap;
            flex-shrink: 0;
            -webkit-app-region: no-drag;
          }
          
          .btn {
            flex: 1;
            min-width: ${data.blockingMode ? '120px' : '80px'};
            padding: ${data.blockingMode ? '10px 16px' : '8px 12px'};
            border: none;
            border-radius: 6px;
            font-size: ${data.blockingMode ? '12px' : '11px'};
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            -webkit-app-region: no-drag;
          }
          
          .btn-danger {
            background: #dc3545;
            color: white;
          }
          
          .btn-danger:hover {
            background: #c82333;
            transform: translateY(-1px);
          }
          
          .btn-success {
            background: #28a745;
            color: white;
          }
          
          .btn-success:hover {
            background: #218838;
            transform: translateY(-1px);
          }
          
          .btn-primary {
            background: #FF6F3C;
            color: white;
          }
          
          .btn-primary:hover {
            background: #FF8B5E;
            transform: translateY(-1px);
          }
          
          .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #FAF9F6;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .auto-close {
            font-size: 9px;
            color: rgba(255, 255, 255, 0.4);
            text-align: center;
            margin-top: 12px;
            ${data.blockingMode ? 'display: none;' : ''}
          }
          
          /* Custom scrollbar */
          .notification-content::-webkit-scrollbar {
            width: 6px;
          }
          
          .notification-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
          }
          
          .notification-content::-webkit-scrollbar-thumb {
            background: rgba(255, 111, 60, 0.6);
            border-radius: 3px;
          }
          
          .notification-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 111, 60, 0.8);
          }
        </style>
      </head>
      <body>
        <div class="notification-header">
          <div class="notification-title">
            <div class="warning-icon">!</div>
            ${data.blockingMode ? 'Sensitive Content Detected' : 'Prompt Flagged'}
          </div>
          <button class="close-btn" onclick="closeNotification()" title="Close notification">×</button>
        </div>
        
        <div class="notification-content">
          ${data.blockingMode ? `
            <div class="blocking-message">
              ⚠️ Sensitive data detected in your clipboard. Choose how to proceed:
            </div>
          ` : ''}
          
          <div class="risk-level ${data.riskScore > 70 ? 'risk-high' : data.riskScore > 40 ? 'risk-medium' : 'risk-low'}">
            ${data.riskScore > 70 ? 'HIGH RISK' : data.riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK'} (${data.riskScore}%)
          </div>
          
          <div class="source-app">From: ${data.sourceApp}</div>
          
          <div class="prompt-preview">
            <strong>Original Prompt:</strong><br>
            ${data.prompt.substring(0, data.blockingMode ? 500 : 300)}${data.prompt.length > (data.blockingMode ? 500 : 300) ? '...' : ''}
          </div>
          
          ${data.redactionDetails.length > 0 ? `
            <div class="redaction-info">
              <strong>Sensitive data detected:</strong>
              ${data.redactionDetails.map(detail => `
                <div class="redaction-item">${detail.type}: ${detail.original}</div>
              `).join('')}
            </div>
          ` : ''}
          
          ${data.enhancedPrompt ? `
            <div class="enhanced-preview">
              <div class="enhanced-label">✨ Safe Alternative:</div>
              ${data.enhancedPrompt}
            </div>
          ` : ''}
          
          <div class="actions">
            ${data.blockingMode ? `
              ${data.enhancedPrompt ? `<button class="btn btn-success" onclick="replacePrompt()" title="Copy safe version to clipboard">✨ Copy Safe Version</button>` : ''}
              <button class="btn btn-secondary" onclick="keepOriginal()" title="Close popup and keep original content">📋 Keep Original</button>
            ` : `
              <button class="btn btn-secondary" onclick="dismissNotification()">Dismiss</button>
              <button class="btn btn-primary" onclick="openDashboard()">View Details</button>
            `}
          </div>
          
          <div class="auto-close">Auto-closes in <span id="countdown">${data.blockingMode ? 30 : 10}</span>s</div>
        </div>
        
        <script>
          const { ipcRenderer } = require('electron');
          
          let countdown = ${data.blockingMode ? 30 : 10};
          const countdownElement = document.getElementById('countdown');
          
          const timer = setInterval(() => {
            countdown--;
            if (countdownElement) {
              countdownElement.textContent = countdown;
            }
            
            if (countdown <= 0) {
              ${data.blockingMode ? 'closeNotification()' : 'dismissNotification()'};
            }
          }, 1000);
          
          function closeNotification() {
            console.log('Complyze Notification: Closing notification');
            clearInterval(timer);
            try {
              ipcRenderer.send('notification-response', { action: 'dismiss' });
            } catch (error) {
              console.error('Error sending notification response:', error);
              window.close();
            }
          }
          
          function dismissNotification() {
            console.log('Complyze Notification: Dismissing notification');
            clearInterval(timer);
            try {
              ipcRenderer.send('notification-response', { action: 'dismiss' });
            } catch (error) {
              console.error('Error dismissing notification:', error);
              window.close();
            }
          }
          
          function openDashboard() {
            console.log('Complyze Notification: Opening dashboard');
            clearInterval(timer);
            try {
              ipcRenderer.send('open-dashboard-from-notification');
              ipcRenderer.send('notification-response', { action: 'dismiss' });
            } catch (error) {
              console.error('Error opening dashboard:', error);
              window.close();
            }
          }
          
          function replacePrompt() {
            console.log('Complyze Notification: Copying safe version to clipboard');
            clearInterval(timer);
            try {
              // Replace clipboard with enhanced prompt
              const enhancedPrompt = \`${(data.enhancedPrompt || '').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
              console.log('Enhanced prompt to copy:', enhancedPrompt.substring(0, 100) + '...');
              ipcRenderer.send('clipboard-action', { action: 'replace', content: enhancedPrompt });
              ipcRenderer.send('notification-response', { action: 'replace' });
            } catch (error) {
              console.error('Error copying safe version:', error);
              window.close();
            }
          }
          
          function keepOriginal() {
            console.log('Complyze Notification: Keeping original content and closing popup');
            clearInterval(timer);
            try {
              // Just close the popup without any clipboard action
              ipcRenderer.send('notification-response', { action: 'allow' });
            } catch (error) {
              console.error('Error keeping original content:', error);
              window.close();
            }
          }
          
          // Prevent window from being dragged on interactive elements
          document.addEventListener('mousedown', (e) => {
            const target = e.target;
            if (target.classList.contains('btn') || 
                target.classList.contains('close-btn') ||
                target.closest('.actions') ||
                target.closest('.notification-content')) {
              e.stopPropagation();
            }
          });
          
          // Add click event listeners as backup
          document.addEventListener('DOMContentLoaded', () => {
            console.log('Complyze Notification: DOM loaded, setting up event listeners');
            
            // Add event listeners to buttons
            const buttons = document.querySelectorAll('.btn');
            buttons.forEach(button => {
              button.addEventListener('click', (e) => {
                console.log('Button clicked:', button.textContent);
                e.preventDefault();
                e.stopPropagation();
              });
            });
          });
        </script>
      </body>
      </html>
    `;

    // Load the notification content
    notificationWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(notificationHTML)}`);

    // Show the notification with animation
    notificationWindow.once('ready-to-show', () => {
      notificationWindow.show();
      
      // Animate in
      notificationWindow.setOpacity(0);
      let opacity = 0;
      const fadeIn = setInterval(() => {
        opacity += 0.1;
        notificationWindow.setOpacity(opacity);
        if (opacity >= 1) {
          clearInterval(fadeIn);
        }
      }, 30);
    });

    // Handle notification response
    const handleResponse = (event: any, response: { action: string }) => {
      console.log('Complyze Debug: Received notification response:', response);
      if (event.sender === notificationWindow.webContents) {
        console.log('Complyze Debug: Response from correct notification window');
        ipcMain.removeListener('notification-response', handleResponse);
        
        if (!notificationWindow.isDestroyed()) {
          notificationWindow.close();
        }
        
        resolve(response.action as 'allow' | 'block' | 'replace');
      } else {
        console.log('Complyze Debug: Response from different window, ignoring');
      }
    };
    
    ipcMain.on('notification-response', handleResponse);

    // Handle window close
    notificationWindow.on('closed', () => {
      const index = notificationWindows.indexOf(notificationWindow);
      if (index > -1) {
        notificationWindows.splice(index, 1);
      }
      
      ipcMain.removeListener('notification-response', handleResponse);
      repositionNotifications();
      
      // If closed without response, default to block for blocking mode, dismiss for non-blocking
      resolve(data.blockingMode ? 'block' : 'allow');
    });

    // Auto-close timeout
    if (!data.blockingMode) {
      setTimeout(() => {
        if (!notificationWindow.isDestroyed()) {
          notificationWindow.close();
        }
      }, 10000);
    }
  });
}

/**
 * Reposition notification windows when one is closed
 */
function repositionNotifications(): void {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const notificationWidth = 400;
  const notificationHeight = 300;
  const margin = 20;
  
  notificationWindows.forEach((window, index) => {
    if (!window.isDestroyed()) {
      const yOffset = index * (notificationHeight + 10);
      window.setPosition(width - notificationWidth - margin, margin + yOffset);
    }
  });
}

log.info('Complyze Desktop Agent initialized'); 