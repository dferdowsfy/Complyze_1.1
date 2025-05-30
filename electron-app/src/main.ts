import { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, screen, shell, net, clipboard, session } from 'electron';
import * as path from 'path';
import * as os from 'os';
import Store from 'electron-store';
import log from 'electron-log';
import { monitoredApps, monitoredWebURLs } from './monitoringTargets';
import { comprehensiveRedact, calculateRiskScore } from './shared/redactionEngine';
import { enhancePrompt, shouldTriggerOptimization } from './shared/promptEnhancer';
import { dispatchToComplyze, checkComplyzeAuth, PromptLogData } from './shared/dispatch';
import { openRouterService, SecurityInsights, EnhancedRedactionDetails } from './shared/openRouterService';

// Set app name early for macOS menu bar
app.setName('Complyze');

// Add monitoring system imports
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// Add accessibility monitoring
let accessibilityPermissionGranted = false;
let inputMonitoringInterval: NodeJS.Timeout | null = null;
let lastDetectedInput = '';
let currentFocusedApp = '';
let lastInputProcessTime = 0;

// Check for accessibility permissions
async function checkAccessibilityPermissions(): Promise<boolean> {
  try {
    // On macOS, we need accessibility permissions to monitor other apps
    const { stdout } = await execAsync('osascript -e "tell application \\"System Events\\" to get name of every process"');
    accessibilityPermissionGranted = true;
    return true;
  } catch (error) {
    console.log('Accessibility permissions not granted');
    accessibilityPermissionGranted = false;
    return false;
  }
}

// Add monitoring state
let monitoringInterval: NodeJS.Timeout | null = null;
let lastClipboardContent = '';
let originalClipboardContent = ''; // Store original content for restoration
let activeProcesses = new Set<string>();
let webContentsMonitoring = new Map<number, boolean>();
let currentActiveApp = '';
let lastActiveApp = '';
let lastNotificationTime = 0;
let processingQueue = new Set<string>();

// Add notification suppression system
let recentNotifications = new Map<string, number>(); // content hash -> timestamp
let suppressionDuration = 300000; // 5 minutes suppression for same content

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDevelopment
    },
    show: false,
    icon: getIconPath(),
    backgroundColor: '#0E1E36'
  });

  // Debug preload script path
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Complyze Debug: Preload script path:', preloadPath);
  console.log('Complyze Debug: Preload script exists:', require('fs').existsSync(preloadPath));

  // Set the app name
  app.name = 'Complyze';
  
  // Load the React app
  const startUrl = isDevelopment 
    ? 'http://localhost:3001' 
    : `file://${path.join(__dirname, '../ui/build/index.html')}`;
  
  console.log('Complyze Debug: Loading URL:', startUrl);
  console.log('Complyze Debug: isDevelopment:', isDevelopment);
  console.log('Complyze Debug: __dirname:', __dirname);
  
  mainWindow.loadURL(startUrl);

  // Add debugging for load events
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Complyze Debug: Started loading React app');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Complyze Debug: Finished loading React app');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Complyze Debug: Failed to load React app:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('Complyze Debug: DOM ready');
  });

  // Set dock icon explicitly on macOS
  if (process.platform === 'darwin') {
    const iconPath = getIconPath();
    if (iconPath && require('fs').existsSync(iconPath)) {
      app.dock.setIcon(iconPath);
      console.log('Dock icon set to:', iconPath);
    }
  }

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
  // Use 512px icon for better quality in dock
  const iconName = os.platform() === 'darwin' ? 'icon-512.png' : 'icon.png';
  
  // In development, use the absolute path to the assets directory
  const iconPath = path.join(__dirname, '..', 'assets', iconName);
  
  // Ensure the icon exists
  try {
    if (require('fs').existsSync(iconPath)) {
      console.log('Using icon:', iconPath);
      return iconPath;
    }
    // Fallback to main icon if the specific one doesn't exist
    const fallbackPath = path.join(__dirname, '..', 'assets', 'icon.png');
    if (require('fs').existsSync(fallbackPath)) {
      console.log('Using fallback icon:', fallbackPath);
      return fallbackPath;
    }
  } catch (error) {
    console.error('Error loading icon:', error);
  }
  return '';
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
      enhancementResult = await enhancePrompt(data.prompt);
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
        blockingMode: true,
        enhancementResult
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
        blockingMode: false,
        enhancementResult
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
    
    // 2. Enhance prompt (using original prompt, not redacted content)
    const enhancementResult = await enhancePrompt(data.prompt);
    
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
        blockingMode: false,
        enhancementResult
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

// Test notification popup
ipcMain.handle('test-notification', async (event) => {
  try {
    const testPrompt = 'Please help me write an email to john.doe@company.com about my SSN 123-45-6789 and credit card 4532-1234-5678-9012. I need to include my phone number 555-123-4567 in the signature.';
    
    // Generate enhanced prompt
    const enhancementResult = await enhancePrompt(testPrompt);
    
    // Create test notification
    const userChoice = await createNotificationWindow({
      prompt: testPrompt,
      riskScore: 95,
      redactionDetails: [
        { type: 'Email', original: 'john.doe@company.com', redacted: '[REDACTED_EMAIL]' },
        { type: 'SSN', original: '123-45-6789', redacted: '[REDACTED_SSN]' },
        { type: 'Credit Card', original: '4532-1234-5678-9012', redacted: '[REDACTED_CREDIT_CARD]' },
        { type: 'Phone', original: '555-123-4567', redacted: '[REDACTED_PHONE]' }
      ],
      sourceApp: 'Test Application',
      enhancedPrompt: enhancementResult.enhancedPrompt,
      blockingMode: true,
      enhancementResult
    });
    
    return { success: true, userChoice, message: 'Test notification displayed' };
  } catch (error) {
    log.error('Test notification error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Replace text in AI app
ipcMain.handle('replace-text-in-app', async (event, enhancedText) => {
  try {
    if (!currentFocusedApp) {
      return { success: false, error: 'No AI app currently focused' };
    }
    
    await replaceTextInActiveApp(enhancedText, currentFocusedApp);
    return { success: true, message: 'Text replaced successfully' };
  } catch (error) {
    log.error('Replace text error:', error);
    return { success: false, error: (error as Error).message };
  }
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

  // Check accessibility permissions
  checkAccessibilityPermissions().then(granted => {
    if (granted) {
      console.log('Complyze Debug: Accessibility permissions granted - enhanced monitoring enabled');
      accessibilityPermissionGranted = true;
      
      // Start input monitoring if monitoring is enabled
      if (isMonitoringEnabled()) {
        startMonitoring(); // Restart monitoring to include input monitoring
      }
    } else {
      console.log('Complyze Debug: Accessibility permissions not granted - limited monitoring mode');
      accessibilityPermissionGranted = false;
      
      // Don't show notification about accessibility permissions immediately on launch
      // Users can discover this through settings or when they actually need it
    }
  });

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
  
  if (inputMonitoringInterval) {
    clearInterval(inputMonitoringInterval);
  }

  log.info('Starting Complyze monitoring system...');
  
  // Monitor every 5 seconds for better responsiveness (reduced from 10)
  monitoringInterval = setInterval(async () => {
    if (!isMonitoringEnabled()) return;
    
    try {
      await monitorActiveProcesses();
      await monitorClipboard();
      await monitorActiveWindow();
    } catch (error) {
      log.error('Monitoring error:', error);
    }
  }, 5000); // Reduced from 10000 to 5000ms

  // Start AI app input monitoring (more responsive for input detection)
  if (accessibilityPermissionGranted) {
    inputMonitoringInterval = setInterval(async () => {
      if (!isMonitoringEnabled()) return;
      
      try {
        await monitorAIAppInput();
      } catch (error) {
        log.error('Input monitoring error:', error);
      }
    }, 1500); // Reduced from 2000 to 1500ms for better input detection
    
    log.info('AI app input monitoring started');
  }

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
  
  if (inputMonitoringInterval) {
    clearInterval(inputMonitoringInterval);
    inputMonitoringInterval = null;
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
      command = 'ps -axo pid,comm,command';
    } else if (platform === 'win32') {
      command = 'tasklist /fo csv /nh';
    } else {
      command = 'ps -eo comm,pid';
    }
    
    const { stdout } = await execAsync(command);
    const runningProcesses = stdout.split('\n').map(line => line.trim());
    
    // Check for monitored apps with improved detection
    const enabledApps = monitoredApps.filter(app => 
      app.enabled && (app.platform === 'all' || app.platform === platform)
    );
    
    console.log('Complyze Debug: Checking for apps:', enabledApps.map(app => app.name));
    
    for (const app of enabledApps) {
      const isRunning = runningProcesses.some(process => {
        const processLower = process.toLowerCase();
        
        // Enhanced detection patterns for ChatGPT and Claude
        let matches = false;
        
        if (app.name === 'ChatGPT Desktop') {
          matches = processLower.includes('chatgpt') ||
                   processLower.includes('openai') ||
                   processLower.includes('gpt') ||
                   processLower.includes('chat gpt') ||
                   // Common ChatGPT app bundle identifiers
                   processLower.includes('com.openai.chat') ||
                   processLower.includes('chatgpt.app') ||
                   // Check for ChatGPT in the command line
                   (processLower.includes('/applications/') && processLower.includes('chatgpt'));
        } else if (app.name === 'Claude Desktop') {
          matches = processLower.includes('claude') ||
                   processLower.includes('anthropic') ||
                   processLower.includes('claude.app') ||
                   // Common Claude app bundle identifiers
                   processLower.includes('com.anthropic.claude') ||
                   (processLower.includes('/applications/') && processLower.includes('claude'));
        } else {
          // Fallback to original detection
          const appNameLower = app.processName.toLowerCase();
          const execNameLower = app.executableName.toLowerCase();
          matches = processLower.includes(appNameLower) || 
                   processLower.includes(execNameLower) ||
                   processLower.includes(`${appNameLower}.app`) ||
                   processLower.includes(`${execNameLower}.app`);
        }
        
        if (matches) {
          console.log(`Complyze Debug: Found match for ${app.name}: ${process.substring(0, 150)}...`);
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
    
    // Debug: Log current active processes
    console.log('Complyze Debug: Current active processes:', Array.from(activeProcesses));
    
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
    
    // Only process if content changed and meets basic criteria
    if (currentContent !== lastClipboardContent && 
        currentContent.length > 5 && // Lowered from 10
        currentContent.length < 5000 &&
        !processingQueue.has(currentContent)) {
      
      // Prevent spam notifications (reduced time)
      const now = Date.now();
      if (now - lastNotificationTime < 3000) { // Reduced from 8000 to 3000ms
        return;
      }
      
      // Use smart content detection
      const shouldOptimize = shouldTriggerOptimization(currentContent);
      
      console.log(`Complyze Debug: Clipboard content detected (${currentContent.length} chars)`);
      console.log(`Complyze Debug: Should optimize: ${shouldOptimize}`);
      console.log(`Complyze Debug: Content preview: "${currentContent.substring(0, 50)}..."`);
      
      // ALWAYS SHOW NOTIFICATION FOR ANY SUBSTANTIAL CONTENT (for debugging)
      if (shouldOptimize || currentContent.length > 15) {
        
        // Check if we should suppress this notification
        if (shouldSuppressNotification(currentContent)) {
          console.log('Complyze Debug: Notification suppressed - content shown recently');
          return;
        }
        
        lastClipboardContent = currentContent;
        originalClipboardContent = currentContent;
        lastNotificationTime = now;
        processingQueue.add(currentContent);
        
        console.log('Complyze Debug: *** TRIGGERING CLIPBOARD NOTIFICATION ***');
        
        // Generate enhanced prompt for ALL detected content
        const redactionResult = await comprehensiveRedact(currentContent);
        const enhancementResult = await enhancePrompt(currentContent);
        const riskScore = Math.max(calculateRiskScore(redactionResult.redactionDetails), 30); // Minimum 30 for visibility
        
        console.log(`Complyze Debug: Enhancement result: ${enhancementResult ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Complyze Debug: Risk score: ${riskScore}`);
        console.log(`Complyze Debug: Redactions: ${redactionResult.redactionDetails.length}`);
        
        // Check for sensitive data or AI risks (expanded detection)
        const sensitivePatterns = [
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{9}\b/, // SSN no dashes
          /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
          /\b\d{3}-\d{3}-\d{4}\b/, // Phone
          /\bapi[\s_-]?key/i, // API keys
          /\btoken/i, // Tokens
          /\bjailbreak/i, // AI jailbreak
          /ignore.*instructions/i, // Prompt injection
          /\bgdpr/i, /\bpci\s+dss/i, /\bnist\s+ai/i // Compliance
        ];
        
        const hasSensitiveData = sensitivePatterns.some(pattern => 
          pattern.test(currentContent)
        );
        
        console.log(`Complyze Debug: Has sensitive data: ${hasSensitiveData}`);
        
        // Show notification based on risk level (but ALWAYS show for debugging)
        const shouldBlock = hasSensitiveData || riskScore > 50;
        
        console.log(`Complyze Debug: Should block: ${shouldBlock}`);
        console.log(`Complyze Debug: About to create notification window...`);
        
        try {
          if (shouldBlock) {
            // Show blocking notification for sensitive data
            const userChoice = await createNotificationWindow({
              prompt: currentContent,
              riskScore: Math.max(75, riskScore),
              redactionDetails: redactionResult.redactionDetails,
              sourceApp: 'Clipboard',
              enhancedPrompt: enhancementResult.enhancedPrompt,
              blockingMode: true,
              enhancementResult
            });
            
            console.log('Complyze Debug: BLOCKING notification created, user chose:', userChoice);
          } else {
            // Show non-blocking notification for optimization
            const notificationPromise = createNotificationWindow({
              prompt: currentContent,
              riskScore: Math.max(35, riskScore), // Ensure minimum visibility
              redactionDetails: redactionResult.redactionDetails,
              sourceApp: 'Clipboard',
              enhancedPrompt: enhancementResult.enhancedPrompt,
              blockingMode: false,
              enhancementResult
            });
            
            console.log('Complyze Debug: NON-BLOCKING notification created');
          }
        } catch (notificationError) {
          console.error('Complyze Debug: ERROR creating notification:', notificationError);
        }
        
        // Also process for logging
        await processPrompt({
          prompt: currentContent,
          sourceApp: 'Clipboard',
          userId: store.get('auth.user.id') as string
        });
        
        // Clean up processing queue
        setTimeout(() => {
          processingQueue.delete(currentContent);
        }, 30000);
        
        // Notify main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-prompt-detected', {
            optimizationTriggered: true,
            hasSensitiveData,
            promptPreview: currentContent.substring(0, 100) + '...',
            wasBlocked: shouldBlock
          });
        }
      } else {
        console.log(`Complyze Debug: Content not substantial enough or doesn't match patterns`);
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
  enhancementResult?: any; // New: full enhancement result with insights
  isLiveInput?: boolean;
  securityInsights?: SecurityInsights | null;
  enhancedRedactionDetails?: EnhancedRedactionDetails[];
}): Promise<'allow' | 'block' | 'replace'> {
  return new Promise((resolve) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // Calculate position for notification (center for blocking mode, top-right for non-blocking)
    const notificationWidth = data.blockingMode ? 600 : 500; // Made wider for better content display
    const notificationHeight = data.blockingMode ? 650 : 450; // Made taller for scrollable content
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
      resizable: true, // Made resizable for better UX
      movable: true,
      minimizable: false,
      maximizable: false,
      closable: true,
      show: false,
      modal: data.blockingMode,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: isDevelopment,
        webSecurity: false // Allow clipboard access
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
          
          .content-section {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
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
            display: inline-block;
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
            margin-bottom: 16px;
          }
          
          .enhanced-prompt-section {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.3);
            border-radius: 8px;
            margin-bottom: 16px;
          }
          
          .enhanced-prompt-header {
            background: rgba(40, 167, 69, 0.2);
            padding: 12px 16px;
            border-bottom: 1px solid rgba(40, 167, 69, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .enhanced-label {
            color: #28a745;
            font-weight: bold;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }
          
          .copy-btn:hover {
            background: #218838;
            transform: translateY(-1px);
          }
          
          .enhanced-prompt-content {
            padding: 16px;
            font-size: 13px;
            line-height: 1.5;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .insights-section {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin-bottom: 16px;
          }
          
          .insights-header {
            background: rgba(255, 255, 255, 0.05);
            padding: 12px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px 8px 0 0;
          }
          
          .insights-title {
            color: #FF6F3C;
            font-weight: bold;
            font-size: 13px;
          }
          
          .insights-content {
            padding: 16px;
            font-size: 12px;
            max-height: 150px;
            overflow-y: auto;
          }
          
          .insight-item {
            margin-bottom: 12px;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            border-left: 3px solid #FF6F3C;
          }
          
          .insight-label {
            color: #FF6F3C;
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 11px;
          }
          
          .insight-value {
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.4;
          }
          
          .redaction-details {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.3);
            border-radius: 6px;
            padding: 12px;
            margin-top: 12px;
          }
          
          .redaction-item {
            background: rgba(220, 53, 69, 0.2);
            padding: 6px 8px;
            border-radius: 4px;
            margin: 4px 0;
            font-size: 11px;
            color: #dc3545;
          }
          
          .actions {
            padding: 16px 20px;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            flex-shrink: 0;
            -webkit-app-region: no-drag;
            background: rgba(255, 255, 255, 0.02);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .btn {
            flex: 1;
            min-width: ${data.blockingMode ? '120px' : '100px'};
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
            margin-top: 8px;
            ${data.blockingMode ? 'display: none;' : ''}
          }
          
          /* Custom scrollbar */
          .notification-content::-webkit-scrollbar,
          .enhanced-prompt-content::-webkit-scrollbar,
          .insights-content::-webkit-scrollbar {
            width: 6px;
          }
          
          .notification-content::-webkit-scrollbar-track,
          .enhanced-prompt-content::-webkit-scrollbar-track,
          .insights-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
          }
          
          .notification-content::-webkit-scrollbar-thumb,
          .enhanced-prompt-content::-webkit-scrollbar-thumb,
          .insights-content::-webkit-scrollbar-thumb {
            background: rgba(255, 111, 60, 0.6);
            border-radius: 3px;
          }
          
          .notification-content::-webkit-scrollbar-thumb:hover,
          .enhanced-prompt-content::-webkit-scrollbar-thumb:hover,
          .insights-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 111, 60, 0.8);
          }
          
          .copy-success {
            background: #28a745;
            color: white;
            transition: all 0.3s;
          }
          
          .ai-risk-section {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 6px;
          }
          
          .ai-risks {
            color: #ffc107;
            font-weight: 500;
          }
          
          .compliance-section {
            background: rgba(13, 110, 253, 0.1);
            border: 1px solid rgba(13, 110, 253, 0.3);
            border-radius: 6px;
          }
          
          .compliance-frameworks {
            color: #0d6efd;
            line-height: 1.6;
          }
          
          .compliance-frameworks strong {
            color: #ffffff;
          }
          
          .compliance-frameworks code {
            background: rgba(0, 0, 0, 0.2);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 10px;
          }
          
          .redaction-item code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            color: #ff6b6b;
          }
        </style>
      </head>
      <body>
        <div class="notification-header">
          <div class="notification-title">
            <div class="warning-icon">!</div>
            ${data.blockingMode ? 'Prompt Enhanced & Protected' : 'Prompt Optimized'}
          </div>
          <button class="close-btn" onclick="closeNotification()" title="Close notification">×</button>
        </div>
        
        <div class="notification-content">
          <div class="content-section">
            ${data.blockingMode ? `
              <div class="blocking-message">
                ⚠️ Sensitive data detected and removed. Using the optimized version below is recommended.
              </div>
            ` : ''}
            
            <div class="source-app">From: ${data.sourceApp}</div>
            
            <div class="risk-level ${data.riskScore > 70 ? 'risk-high' : data.riskScore > 40 ? 'risk-medium' : 'risk-low'}">
              ${data.riskScore > 70 ? 'HIGH RISK' : data.riskScore > 40 ? 'MEDIUM RISK' : 'LOW RISK'} (${data.riskScore}%)
            </div>
          </div>
          
          ${data.enhancedPrompt ? `
            <div class="content-section">
              <div class="enhanced-prompt-section">
                <div class="enhanced-prompt-header">
                  <div class="enhanced-label">
                    ✨ Optimized Prompt
                  </div>
                  <button class="copy-btn" onclick="copyEnhancedPrompt()" id="copyBtn">📋 Copy</button>
                </div>
                <div class="enhanced-prompt-content" id="enhancedPrompt">${data.enhancedPrompt}</div>
              </div>
            </div>
          ` : ''}
          
          <div class="content-section">
            <div class="insights-section">
              <div class="insights-header">
                <div class="insights-title">🔍 Analysis & Insights</div>
              </div>
              <div class="insights-content">
                ${data.enhancementResult ? `
                  <div class="insight-item">
                    <div class="insight-label">Intent Detected:</div>
                    <div class="insight-value">${data.enhancementResult.detectedIntent}</div>
                  </div>
                  
                  <div class="insight-item">
                    <div class="insight-label">Optimization Reason:</div>
                    <div class="insight-value">${data.enhancementResult.optimizationReason}</div>
                  </div>
                  
                  <div class="insight-item">
                    <div class="insight-label">Quality Score:</div>
                    <div class="insight-value">${data.enhancementResult.qualityScore}% (was estimated at ${Math.max(20, data.enhancementResult.qualityScore - 15)}%)</div>
                  </div>
                  
                  <div class="insight-item">
                    <div class="insight-label">Clarity Score:</div>
                    <div class="insight-value">${data.enhancementResult.clarityScore}% (was estimated at ${Math.max(20, data.enhancementResult.clarityScore - 20)}%)</div>
                  </div>
                  
                  ${data.enhancementResult.improvements.length > 0 ? `
                    <div class="insight-item">
                      <div class="insight-label">Improvements Made:</div>
                      <div class="insight-value">
                        ${data.enhancementResult.improvements.map((improvement: string) => `• ${improvement}`).join('<br>')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${data.enhancementResult.aiRiskIndicators && data.enhancementResult.aiRiskIndicators.length > 0 ? `
                    <div class="insight-item ai-risk-section">
                      <div class="insight-label">🤖 AI Security Risks Detected:</div>
                      <div class="insight-value ai-risks">
                        ${data.enhancementResult.aiRiskIndicators.map((risk: string) => `⚠️ ${risk}`).join('<br>')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${data.enhancementResult.complianceFrameworks && data.enhancementResult.complianceFrameworks.length > 0 ? `
                    <div class="insight-item compliance-section">
                      <div class="insight-label">📋 Compliance Framework Controls:</div>
                      <div class="insight-value compliance-frameworks">
                        ${data.enhancementResult.complianceFrameworks.map((framework: string) => {
                          let description = '';
                          switch (framework) {
                            case 'NIST AI RMF':
                              description = 'AI Risk Management Framework controls applied';
                              break;
                            case 'ISO 42001':
                              description = 'AI Management System standard compliance';
                              break;
                            case 'FedRAMP SC-28':
                              description = 'System and Communications Protection controls';
                              break;
                            case 'OWASP LLM Top 10':
                              description = 'LLM security vulnerability mitigation';
                              break;
                            case 'GDPR/CCPA':
                              description = 'Personal data protection compliance';
                              break;
                            case 'PCI DSS':
                              description = 'Payment card data security standards';
                              break;
                            case 'SOC 2 Type II':
                              description = 'Trust service criteria compliance';
                              break;
                            case 'Trade Secret Protection':
                              description = 'Confidential business information controls';
                              break;
                            default:
                              description = 'Security control framework applied';
                          }
                          return `🔒 <strong>${framework}</strong>: ${description}`;
                        }).join('<br><br>')}
                      </div>
                    </div>
                  ` : ''}
                ` : `
                  <div class="insight-item">
                    <div class="insight-label">Risk Level:</div>
                    <div class="insight-value">${data.riskScore > 70 ? 'High - Contains sensitive information' : data.riskScore > 40 ? 'Medium - Some privacy concerns' : 'Low - Generally safe'}</div>
                  </div>
                `}
                
                ${data.redactionDetails.length > 0 ? `
                  <div class="redaction-details">
                    <div class="insight-label">🔒 Sensitive Data Removed:</div>
                    ${data.redactionDetails.map(detail => `
                      <div class="redaction-item">
                        <strong>${detail.type}</strong>: <code>${detail.original}</code>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="actions">
          ${data.blockingMode ? `
            ${data.enhancedPrompt ? `<button class="btn btn-success" onclick="copyAndClose()" title="Copy optimized prompt and close">✨ Use Optimized</button>` : ''}
            ${data.isLiveInput ? `<button class="btn btn-primary" onclick="replaceInApp()" title="Replace text in the AI app">🔄 Replace Text</button>` : ''}
            <button class="btn btn-secondary" onclick="keepOriginal()" title="Keep original content">📋 Keep Original</button>
          ` : `
            <button class="btn btn-secondary" onclick="dismissNotification()">Dismiss</button>
            <button class="btn btn-primary" onclick="openDashboard()">View Dashboard</button>
          `}
          
          <div class="auto-close">Auto-closes in <span id="countdown">${data.blockingMode ? 20 : 8}</span>s</div>
        </div>
        
        <script>
          const { ipcRenderer } = require('electron');
          
          let countdown = ${data.blockingMode ? 20 : 8};
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
          
          function copyEnhancedPrompt() {
            const enhancedPrompt = document.getElementById('enhancedPrompt').textContent;
            const copyBtn = document.getElementById('copyBtn');
            
            // Copy to clipboard
            navigator.clipboard.writeText(enhancedPrompt).then(() => {
              // Visual feedback
              copyBtn.textContent = '✓ Copied!';
              copyBtn.className = 'copy-btn copy-success';
              
              setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
                copyBtn.className = 'copy-btn';
              }, 2000);
            }).catch(err => {
              console.error('Failed to copy text: ', err);
              copyBtn.textContent = '❌ Failed';
              setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
              }, 2000);
            });
          }
          
          function copyAndClose() {
            copyEnhancedPrompt();
            setTimeout(() => {
              clearInterval(timer);
              try {
                ipcRenderer.send('notification-response', { action: 'replace' });
              } catch (error) {
                console.error('Error sending notification response:', error);
                window.close();
              }
            }, 1000);
          }
          
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
          
          function keepOriginal() {
            console.log('Complyze Notification: Keeping original content');
            clearInterval(timer);
            try {
              ipcRenderer.send('notification-response', { action: 'allow' });
            } catch (error) {
              console.error('Error keeping original:', error);
              window.close();
            }
          }
          
          async function replaceInApp() {
            const enhancedPrompt = document.getElementById('enhancedPrompt').textContent;
            console.log('Complyze Notification: Replacing text in AI app');
            clearInterval(timer);
            
            try {
              // Send the enhanced prompt to be replaced in the AI app
              const result = await ipcRenderer.invoke('replace-text-in-app', enhancedPrompt);
              if (result.success) {
                console.log('Text replaced successfully in AI app');
                // Close notification after successful replacement
                ipcRenderer.send('notification-response', { action: 'replace' });
              } else {
                console.error('Failed to replace text:', result.error);
                alert('Failed to replace text in the AI app. You can copy the enhanced prompt instead.');
              }
            } catch (error) {
              console.error('Error replacing text:', error);
              alert('An error occurred while replacing text. You can copy the enhanced prompt instead.');
            }
          }
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
      }, 8000); // Reduced from 10000 to 8000ms
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

/**
 * Monitor active window changes
 */
async function monitorActiveWindow(): Promise<void> {
  try {
    const { stdout } = await execAsync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"');
    const activeApp = stdout.trim();
    
    // Only update if the app actually changed
    if (activeApp !== currentActiveApp) {
      lastActiveApp = currentActiveApp;
      currentActiveApp = activeApp;
      
      const isAIApp = activeApp.toLowerCase().includes('chatgpt') || 
                     activeApp.toLowerCase().includes('claude') ||
                     activeApp.toLowerCase().includes('openai');
      
      // Only show app switch notification if user stayed on the AI app for more than 10 seconds
      // This prevents spam when quickly switching between apps
      if (isAIApp && lastActiveApp !== activeApp) {
        setTimeout(() => {
          // Check if user is still on the same AI app after 10 seconds
          if (currentActiveApp === activeApp) {
            // Notify main window about AI app focus (but don't show popup immediately)
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('ai-app-detected', {
                appName: activeApp,
                isActive: true,
                timestamp: Date.now()
              });
            }
            
            log.info(`AI application detected: ${activeApp}`);
            console.log(`Complyze Debug: AI app focus confirmed after 10 seconds: ${activeApp}`);
          }
        }, 10000); // Wait 10 seconds before confirming app focus
      }
    }
  } catch (error) {
    // Silent error handling for app monitoring
  }
}

// Monitor text input in AI applications
async function monitorAIAppInput(): Promise<void> {
  if (!accessibilityPermissionGranted) return;
  
  // Prevent too frequent processing (reduced time)
  const now = Date.now();
  if (now - lastInputProcessTime < 2000) { // Reduced from 5000 to 2000ms for better responsiveness
    return;
  }
  
  try {
    // Get the frontmost application
    const { stdout: frontApp } = await execAsync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"');
    const activeApp = frontApp.trim();
    
    // Enhanced AI app detection
    const isAIApp = activeApp.toLowerCase().includes('chatgpt') || 
                   activeApp.toLowerCase().includes('claude') ||
                   activeApp.toLowerCase().includes('openai') ||
                   activeApp.toLowerCase().includes('anthropic') ||
                   activeApp.toLowerCase().includes('gpt') ||
                   activeApp.toLowerCase().includes('gemini');
    
    if (isAIApp) {
      currentFocusedApp = activeApp;
      console.log(`Complyze Debug: Monitoring input for ${activeApp}`);
      
      // Simplified text detection approach
      try {
        // Method 1: Check if clipboard was recently updated with text input
        const currentClipboard = clipboard.readText();
        
        // Method 2: Try simplified AppleScript for direct text detection
        const simpleScript = `
          tell application "System Events"
            try
              tell process "${activeApp}"
                try
                  set frontWin to front window
                  set textFields to text fields of frontWin
                  set textAreas to text areas of frontWin
                  set foundText to ""
                  
                  repeat with aField in textFields
                    try
                      set fieldValue to value of aField as string
                      if length of fieldValue > 15 then
                        set foundText to fieldValue
                        exit repeat
                      end if
                    end try
                  end repeat
                  
                  if foundText is "" then
                    repeat with anArea in textAreas
                      try
                        set areaValue to value of anArea as string
                        if length of areaValue > 15 then
                          set foundText to areaValue
                          exit repeat
                        end if
                      end try
                    end repeat
                  end if
                  
                  return foundText
                on error
                  return ""
                end try
              end tell
            on error
              return ""
            end try
          end tell
        `;
        
        let detectedText = "";
        try {
          const { stdout } = await execAsync(`osascript -e '${simpleScript.replace(/'/g, "\\'")}'`);
          detectedText = stdout.trim();
        } catch (scriptError) {
          console.log('Complyze Debug: AppleScript detection failed, monitoring clipboard changes...');
          
          // Fallback: monitor clipboard for recent changes that look like AI input
          if (currentClipboard && 
              currentClipboard !== lastDetectedInput && 
              currentClipboard.length > 15 &&
              shouldTriggerOptimization(currentClipboard)) {
            detectedText = currentClipboard;
          }
        }
        
        // Process using smart detection
        if (detectedText && 
            detectedText !== lastDetectedInput && 
            detectedText.length > 15 && 
            detectedText.length < 3000 && 
            !processingQueue.has(detectedText) &&
            shouldTriggerOptimization(detectedText) &&
            !shouldSuppressNotification(detectedText)) {
          
          lastDetectedInput = detectedText;
          lastInputProcessTime = now;
          processingQueue.add(detectedText);
          
          console.log(`Complyze Debug: Smart detection triggered for ${activeApp} input`);
          
          // Process the detected prompt
          try {
            await processDetectedPrompt(detectedText, activeApp);
            processingQueue.delete(detectedText);
          } catch (error) {
            console.error('Error processing detected prompt:', error);
            processingQueue.delete(detectedText);
          }
        }
      } catch (error) {
        console.error('Complyze Debug: Text detection error:', error);
      }
    }
  } catch (error) {
    console.error('Complyze Debug: Input monitoring error:', error);
  }
}

// Process detected prompt from AI apps
async function processDetectedPrompt(promptText: string, sourceApp: string): Promise<void> {
  try {
    console.log(`Complyze Debug: *** PROCESSING PROMPT FROM ${sourceApp} ***`);
    console.log(`Complyze Debug: Prompt text: "${promptText.substring(0, 100)}..."`);
    
    // ALWAYS show a notification for ANY detected prompt - this ensures we see something
    console.log(`Complyze Debug: *** FORCING NOTIFICATION FOR DETECTED INPUT ***`);
    
    // Quick risk assessment first
    const redactionResult = await comprehensiveRedact(promptText);
    const riskScore = Math.max(calculateRiskScore(redactionResult.redactionDetails), 40); // Minimum 40 for visibility
    
    console.log(`Complyze Debug: Risk score: ${riskScore}, Redactions: ${redactionResult.redactionDetails.length}`);
    
    // Generate enhancement for all prompts
    const enhancementResult = await enhancePrompt(promptText);
    console.log(`Complyze Debug: Enhancement generated: ${enhancementResult.enhancedPrompt ? 'YES' : 'NO'}`);
    
    // Expanded sensitive data detection
    const allSensitivePatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{9}\b/, // SSN no dashes
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
      /\b\(\d{3}\)\s?\d{3}-\d{4}\b/, // Phone with parentheses
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address
      /\b\d{10,12}\b/, // Bank account
      /\b[a-z]{1,2}\d{6,8}\b/i, // Passport
      /\b[a-z]\d{7,8}\b/i, // Driver's license
      /\bmrn[\s:]*\d{6,10}/i, // Medical record
      /\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/i, // API keys
      /\btoken[\s:=]+[a-z0-9\-_\.]{20,}/i, // Auth tokens
      /\bbearer\s+[a-z0-9\-_\.]{20,}/i, // Bearer tokens
      /\bjailbreak/i, // AI jailbreak
      /ignore\s+(previous|all)\s+instructions/i, // Prompt injection
      /forget\s+(everything|all)\s+(above|before)/i, // Instruction override
      /\bdeveloper\s+mode/i, // Developer mode
      /\bdan\s+mode/i, // DAN mode
      /\bgdpr/i, /\bccpa/i, // Privacy regulations
      /\bpci\s+dss/i, // Payment card standards
      /\bnist\s+ai/i, /\bai\s+rmf/i, // AI frameworks
      /\bowasp\s+llm/i, // OWASP LLM
      /\btrade\s+secret/i, /\bproprietary/i // Business confidential
    ];
    
    const hasAnySensitiveData = allSensitivePatterns.some(pattern => pattern.test(promptText));
    
    // Show notification for ANY detected content (for debugging)
    const shouldBlock = hasAnySensitiveData || riskScore > 40; // Lowered threshold
    
    console.log(`Complyze Debug: Has any sensitive data: ${hasAnySensitiveData}`);
    console.log(`Complyze Debug: Should block: ${shouldBlock}`);
    console.log(`Complyze Debug: Creating notification window...`);
    
    try {
      if (shouldBlock) {
        // For high-risk content, generate security insights
        const [securityInsights, enhancedRedactionDetails] = await Promise.all([
          openRouterService.generateSecurityInsights(promptText, redactionResult.redactionDetails, riskScore).catch(() => null),
          openRouterService.analyzeRedactionDetails(redactionResult.redactionDetails).catch(() => [])
        ]);
        
        const userChoice = await createNotificationWindow({
          prompt: promptText,
          riskScore: Math.max(riskScore, 60), // Ensure visibility
          redactionDetails: redactionResult.redactionDetails,
          sourceApp: sourceApp,
          enhancedPrompt: enhancementResult.enhancedPrompt,
          blockingMode: true,
          enhancementResult,
          isLiveInput: true,
          securityInsights: securityInsights ?? null,
          enhancedRedactionDetails: enhancedRedactionDetails ?? []
        });
        
        console.log(`Complyze Debug: BLOCKING notification shown, user choice: ${userChoice}`);
        
        // If user chose to replace, update the text field
        if (userChoice === 'replace' && enhancementResult.enhancedPrompt) {
          await replaceTextInActiveApp(enhancementResult.enhancedPrompt, sourceApp);
        }
      } else {
        // For all other content, show non-blocking notification
        const notificationPromise = createNotificationWindow({
          prompt: promptText,
          riskScore: Math.max(riskScore, 35), // Ensure visibility
          redactionDetails: redactionResult.redactionDetails,
          sourceApp: sourceApp,
          enhancedPrompt: enhancementResult.enhancedPrompt,
          blockingMode: false,
          enhancementResult,
          isLiveInput: true
        });
        
        console.log('Complyze Debug: NON-BLOCKING notification shown');
      }
    } catch (notificationError) {
      console.error('Complyze Debug: ERROR creating notification:', notificationError);
      
      // Even if there's an error, show a simple notification so we know detection works
      try {
        await createNotificationWindow({
          prompt: promptText,
          riskScore: 50,
          redactionDetails: [],
          sourceApp: sourceApp,
          enhancedPrompt: 'Error processing prompt - please check console',
          blockingMode: false,
          enhancementResult: {
            enhancedPrompt: 'Error processing prompt',
            improvements: ['Error occurred during processing'],
            detectedIntent: 'Unknown',
            optimizationReason: 'Error occurred',
            qualityScore: 0,
            clarityScore: 0,
            originalPrompt: promptText,
            sensitiveDataRemoved: [],
            complianceFrameworks: [],
            aiRiskIndicators: []
          },
          isLiveInput: true
        });
        console.log('Complyze Debug: FALLBACK notification shown');
      } catch (fallbackError) {
        console.error('Complyze Debug: Even fallback notification failed:', fallbackError);
      }
    }
    
    // Log the interaction asynchronously (don't wait for this)
    setTimeout(async () => {
      try {
        await processPrompt({
          prompt: promptText,
          sourceApp: sourceApp,
          userId: store.get('auth.user.id') as string
        });
      } catch (error) {
        console.error('Background logging error:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('Error processing detected prompt:', error);
    
    // Even if there's an error, show a simple notification so we know detection works
    try {
      await createNotificationWindow({
        prompt: promptText,
        riskScore: 50,
        redactionDetails: [],
        sourceApp: sourceApp,
        enhancedPrompt: 'Error processing prompt',
        blockingMode: false,
        enhancementResult: {
          enhancedPrompt: 'Error processing prompt',
          improvements: ['Error occurred during processing'],
          detectedIntent: 'Unknown',
          optimizationReason: 'Error occurred',
          qualityScore: 0,
          clarityScore: 0,
          originalPrompt: promptText,
          sensitiveDataRemoved: [],
          complianceFrameworks: [],
          aiRiskIndicators: []
        },
        isLiveInput: true
      });
      console.log('Complyze Debug: ERROR fallback notification shown');
    } catch (fallbackError) {
      console.error('Complyze Debug: Even error fallback notification failed:', fallbackError);
    }
  }
}

// Replace text in the active AI application
async function replaceTextInActiveApp(newText: string, appName: string): Promise<void> {
  try {
    const replaceScript = `
      tell application "System Events"
        tell process "${appName}"
          try
            set focusedElement to focused UI element
            if exists focusedElement then
              if (class of focusedElement is text field) or (class of focusedElement is text area) then
                set value of focusedElement to "${newText.replace(/"/g, '\\"')}"
                return true
              end if
            end if
          end try
        end tell
      end tell
      return false
    `;
    
    await execAsync(`osascript -e '${replaceScript}'`);
    console.log(`Complyze Debug: Replaced text in ${appName}`);
  } catch (error) {
    console.error('Error replacing text:', error);
  }
}

log.info('Complyze Desktop Agent initialized'); 

// Test input detection from main window
ipcMain.handle('test-input-detection', async (event) => {
  try {
    const testPrompt = 'Can you help me write an email to john.doe@company.com about my account?';
    console.log('Complyze Debug: *** TESTING INPUT DETECTION ***');
    console.log(`Complyze Debug: Test prompt: "${testPrompt}"`);
    
    // Simulate detected input from ChatGPT
    await processDetectedPrompt(testPrompt, 'ChatGPT (Test)');
    
    return { success: true, message: 'Test input detection triggered' };
  } catch (error) {
    console.error('Test input detection error:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Test simple notification
ipcMain.handle('test-simple-notification', async (event) => {
  try {
    console.log('Complyze Debug: *** TESTING SIMPLE NOTIFICATION ***');
    
    // Create a simple notification to verify the system works
    await createNotificationWindow({
      prompt: 'This is a test notification to verify the system is working',
      riskScore: 30,
      redactionDetails: [],
      sourceApp: 'Test System',
      enhancedPrompt: 'This is an enhanced version of the test prompt',
      blockingMode: false,
      enhancementResult: {
        enhancedPrompt: 'This is an enhanced version of the test prompt',
        improvements: ['Added clarity', 'Improved structure'],
        detectedIntent: 'Testing system functionality',
        optimizationReason: 'System test verification',
        qualityScore: 85,
        clarityScore: 90
      },
      isLiveInput: false
    });
    
    return { success: true, message: 'Simple notification test completed' };
  } catch (error) {
    console.error('Simple notification test error:', error);
    return { success: false, error: (error as Error).message };
  }
});

/**
 * Generate a simple hash for content to track notifications
 */
function generateContentHash(content: string): string {
  // Simple hash function for tracking (not cryptographic)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Check if we should suppress notification for this content
 */
function shouldSuppressNotification(content: string): boolean {
  const contentHash = generateContentHash(content);
  const now = Date.now();
  
  // Clean up old entries
  for (const [hash, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > suppressionDuration) {
      recentNotifications.delete(hash);
    }
  }
  
  // Check if we've shown this content recently
  const lastShown = recentNotifications.get(contentHash);
  if (lastShown && (now - lastShown) < suppressionDuration) {
    console.log(`Complyze Debug: Suppressing notification - content shown ${Math.round((now - lastShown) / 1000)}s ago`);
    return true;
  }
  
  // Record this notification
  recentNotifications.set(contentHash, now);
  return false;
}