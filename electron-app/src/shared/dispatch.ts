// Dispatch module for sending data to Complyze Dashboard
// Handles API communication and logging

export interface PromptLogData {
  userId: string;
  rawPrompt: string;
  enhancedPrompt: string;
  redactedFields: Array<{
    original: string;
    redacted: string;
    type: string;
    reason: string;
  }>;
  riskScore: number;
  timestamp: string;
  sourceApp: string;
  clarityScore?: number;
  qualityScore?: number;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

class ComplyzeApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    // Default to production API for Complyze
    this.baseUrl = process.env.COMPLYZE_API_URL || 'https://complyze.co/api';
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const options: RequestInit = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      };

      console.log(`Complyze API: ${method} ${url}`);
      
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error('Complyze API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log prompt data to the dashboard
   */
  async logPrompt(promptData: PromptLogData): Promise<ApiResponse> {
    return this.makeRequest('/prompts/log', 'POST', promptData);
  }

  /**
   * Check user authentication status
   */
  async checkAuth(): Promise<ApiResponse> {
    return this.makeRequest('/auth/check', 'GET');
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<ApiResponse> {
    return this.makeRequest('/settings', 'GET');
  }

  /**
   * Update user settings
   */
  async updateUserSettings(settings: any): Promise<ApiResponse> {
    return this.makeRequest('/settings', 'PUT', settings);
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<ApiResponse> {
    return this.makeRequest('/test', 'GET');
  }
}

// Singleton instance
const apiClient = new ComplyzeApiClient();

/**
 * Send prompt data to the Complyze dashboard
 */
export async function dispatchToComplyze(promptData: PromptLogData): Promise<boolean> {
  try {
    console.log('Dispatching prompt data to Complyze dashboard:', {
      sourceApp: promptData.sourceApp,
      riskScore: promptData.riskScore,
      redactionsCount: promptData.redactedFields.length,
    });

    const response = await apiClient.logPrompt(promptData);
    
    if (response.success) {
      console.log('Successfully logged prompt to Complyze dashboard');
      return true;
    } else {
      console.error('Failed to log prompt to dashboard:', response.error);
      return false;
    }
  } catch (error) {
    console.error('Error dispatching to Complyze:', error);
    return false;
  }
}

/**
 * Check if user is authenticated with Complyze
 */
export async function checkComplyzeAuth(): Promise<{ authenticated: boolean; userEmail?: string }> {
  try {
    const response = await apiClient.checkAuth();
    
    if (response.success && response.data) {
      return {
        authenticated: true,
        userEmail: response.data.email,
      };
    } else {
      return {
        authenticated: false,
      };
    }
  } catch (error) {
    console.error('Error checking Complyze auth:', error);
    return {
      authenticated: false,
    };
  }
}

/**
 * Initialize API client with settings
 */
export function initializeApiClient(settings: { apiUrl?: string; apiKey?: string }) {
  if (settings.apiUrl) {
    apiClient.setBaseUrl(settings.apiUrl);
  }
  if (settings.apiKey) {
    apiClient.setApiKey(settings.apiKey);
  }
}

/**
 * Test connection to Complyze API
 */
export async function testComplyzeConnection(): Promise<boolean> {
  try {
    const response = await apiClient.testConnection();
    return response.success;
  } catch (error) {
    console.error('Error testing Complyze connection:', error);
    return false;
  }
}

// Export the API client for advanced usage
export { apiClient as complyzeApiClient }; 