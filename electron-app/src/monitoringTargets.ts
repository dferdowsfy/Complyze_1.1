// Monitoring targets configuration for Complyze Desktop Agent

export interface MonitoredApp {
  name: string;
  executableName: string;
  processName: string;
  platform: 'darwin' | 'win32' | 'linux' | 'all';
  enabled: boolean;
}

export interface MonitoredWebURL {
  name: string;
  pattern: string;
  enabled: boolean;
}

// Desktop Apps to monitor
export const monitoredApps: MonitoredApp[] = [
  {
    name: 'ChatGPT Desktop',
    executableName: 'ChatGPT',
    processName: 'ChatGPT',
    platform: 'all',
    enabled: true
  },
  {
    name: 'Claude Desktop',
    executableName: 'Claude',
    processName: 'Claude',
    platform: 'all',
    enabled: true
  },
  {
    name: 'Slack',
    executableName: 'Slack',
    processName: 'Slack',
    platform: 'all',
    enabled: true
  },
  {
    name: 'Notion',
    executableName: 'Notion',
    processName: 'Notion',
    platform: 'all',
    enabled: true
  },
  {
    name: 'Raycast',
    executableName: 'Raycast',
    processName: 'Raycast',
    platform: 'darwin',
    enabled: true
  },
  {
    name: 'VS Code',
    executableName: 'Visual Studio Code',
    processName: 'Code',
    platform: 'all',
    enabled: true
  },
  {
    name: 'LM Studio',
    executableName: 'LM Studio',
    processName: 'LM Studio',
    platform: 'all',
    enabled: true
  },
  {
    name: 'Obsidian',
    executableName: 'Obsidian',
    processName: 'Obsidian',
    platform: 'all',
    enabled: true
  },
  {
    name: 'MacGPT',
    executableName: 'MacGPT',
    processName: 'MacGPT',
    platform: 'darwin',
    enabled: true
  },
  {
    name: 'Typora',
    executableName: 'Typora',
    processName: 'Typora',
    platform: 'all',
    enabled: true
  }
];

// Websites to monitor
export const monitoredWebURLs: MonitoredWebURL[] = [
  {
    name: 'ChatGPT',
    pattern: 'https://chat.openai.com/*',
    enabled: true
  },
  {
    name: 'Claude AI',
    pattern: 'https://claude.ai/*',
    enabled: true
  },
  {
    name: 'Google Gemini',
    pattern: 'https://gemini.google.com/*',
    enabled: true
  },
  {
    name: 'Google AI Studio',
    pattern: 'https://aistudio.google.com/*',
    enabled: true
  },
  {
    name: 'Meta AI',
    pattern: 'https://meta.ai/*',
    enabled: true
  },
  {
    name: 'Poe',
    pattern: 'https://poe.com/*',
    enabled: true
  },
  {
    name: 'Hugging Face Chat',
    pattern: 'https://huggingface.co/chat/*',
    enabled: true
  },
  {
    name: 'Phind',
    pattern: 'https://phind.com/*',
    enabled: true
  },
  {
    name: 'You.com Chat',
    pattern: 'https://you.com/chat/*',
    enabled: true
  },
  {
    name: 'Notion',
    pattern: 'https://notion.so/*',
    enabled: true
  },
  {
    name: 'GitHub Copilot Chat',
    pattern: 'https://github.com/features/copilot/chat',
    enabled: true
  },
  {
    name: 'Forefront Chat',
    pattern: 'https://chat.forefront.ai/*',
    enabled: true
  },
  {
    name: 'Character AI',
    pattern: 'https://beta.character.ai/*',
    enabled: true
  }
];

// Helper functions
export function getEnabledApps(): MonitoredApp[] {
  return monitoredApps.filter(app => app.enabled);
}

export function getEnabledWebURLs(): MonitoredWebURL[] {
  return monitoredWebURLs.filter(url => url.enabled);
}

export function isWebURLMonitored(url: string): MonitoredWebURL | null {
  return monitoredWebURLs.find(monitored => {
    const pattern = monitored.pattern.replace(/\*/g, '.*');
    const regex = new RegExp(pattern);
    return regex.test(url) && monitored.enabled;
  }) || null;
} 