/**
 * OpenRouter API Service for Complyze Desktop Agent
 * Provides LLM-powered security framework mapping and enhanced insights
 */

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface MappedControl {
  controlId: string;
  justification: string;
  suggestedFix: string;
  sourceFramework: string;
}

interface SecurityInsights {
  controlMappings: MappedControl[];
  riskAnalysis: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigationSteps: string[];
  };
  complianceFrameworks: {
    nist: string[];
    owasp: string[];
    iso: string[];
  };
}

interface EnhancedRedactionDetails {
  type: string;
  count: number;
  category: 'PII' | 'Financial' | 'Healthcare' | 'Authentication' | 'Technical';
  controlFamily: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    this.config = {
      // Using the same API key as the main Complyze app
      apiKey: process.env.OPENROUTER_API_KEY || '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',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'perplexity/sonar-pro'
    };
  }

  /**
   * Analyze prompt and generate security insights with framework mappings
   */
  async generateSecurityInsights(
    originalPrompt: string,
    redactionDetails: any[],
    riskScore: number
  ): Promise<SecurityInsights | null> {
    try {
      const systemPrompt = `You are a cybersecurity and compliance expert specializing in AI governance. Analyze the provided prompt and redaction details to map relevant security controls from NIST AI RMF, OWASP LLM Top 10, and ISO/IEC 42001.

For each identified risk, provide:
1. Specific control ID from relevant framework
2. Clear justification for why this control applies
3. Actionable remediation steps
4. Framework family/category

Return a JSON object with the following structure:
{
  "controlMappings": [
    {
      "controlId": "NIST-AI-1.1",
      "justification": "Clear explanation",
      "suggestedFix": "Specific action steps",
      "sourceFramework": "NIST AI RMF"
    }
  ],
  "riskAnalysis": {
    "riskLevel": "high",
    "riskFactors": ["Factor 1", "Factor 2"],
    "mitigationSteps": ["Step 1", "Step 2"]
  },
  "complianceFrameworks": {
    "nist": ["AI-1.1", "GV-1.2"],
    "owasp": ["LLM01", "LLM06"],
    "iso": ["ISO-42001-5.2"]
  }
}`;

      const userPrompt = `
Original Prompt: ${originalPrompt}
Risk Score: ${riskScore}%
Redacted Data Types: ${redactionDetails.map(d => `${d.type} (${d.original?.substring(0, 20)}...)`).join(', ')}

Please analyze this prompt for security and compliance risks, then map to relevant controls.`;

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        return null;
      }

      return JSON.parse(content) as SecurityInsights;
    } catch (error) {
      console.error('OpenRouter security insights error:', error);
      return null;
    }
  }

  /**
   * Enhanced redaction analysis with security framework mapping
   */
  async analyzeRedactionDetails(redactionDetails: any[]): Promise<EnhancedRedactionDetails[]> {
    const enhanced: EnhancedRedactionDetails[] = [];

    for (const detail of redactionDetails) {
      let category: 'PII' | 'Financial' | 'Healthcare' | 'Authentication' | 'Technical';
      let controlFamily: string;
      let severity: 'low' | 'medium' | 'high' | 'critical';

      switch (detail.type.toLowerCase()) {
        case 'email':
          category = 'PII';
          controlFamily = 'NIST Privacy Controls (IP-1, IP-2)';
          severity = 'medium';
          break;
        case 'ssn':
        case 'social security':
          category = 'PII';
          controlFamily = 'NIST SC-28 (Protection of Information at Rest)';
          severity = 'critical';
          break;
        case 'credit card':
        case 'credit_card':
          category = 'Financial';
          controlFamily = 'PCI DSS / NIST SC-8 (Transmission Confidentiality)';
          severity = 'critical';
          break;
        case 'phone':
        case 'phone_number':
          category = 'PII';
          controlFamily = 'NIST IP-1 (Consent)';
          severity = 'medium';
          break;
        case 'password':
        case 'api_key':
          category = 'Authentication';
          controlFamily = 'NIST IA-5 (Authenticator Management)';
          severity = 'critical';
          break;
        case 'ip_address':
          category = 'Technical';
          controlFamily = 'NIST SC-7 (Boundary Protection)';
          severity = 'low';
          break;
        default:
          category = 'PII';
          controlFamily = 'NIST General Privacy Controls';
          severity = 'medium';
      }

      enhanced.push({
        type: detail.type,
        count: 1,
        category,
        controlFamily,
        severity
      });
    }

    return enhanced;
  }

  /**
   * Generate contextual suggestions for prompt improvement
   */
  async generatePromptSuggestions(
    originalPrompt: string,
    enhancedPrompt: string,
    redactionDetails: any[]
  ): Promise<string[]> {
    try {
      const systemPrompt = `You are an AI prompt optimization expert. Given an original prompt and its enhanced version, provide specific, actionable suggestions for further improvement. Focus on clarity, security, and compliance.`;

      const userPrompt = `
Original: ${originalPrompt}
Enhanced: ${enhancedPrompt}
Redacted Items: ${redactionDetails.map(d => d.type).join(', ')}

Provide 3-5 specific suggestions for further improvement.`;

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        return [];
      }

      // Parse suggestions from the response
      const suggestions = content.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((suggestion: string) => suggestion.length > 10);

      return suggestions.slice(0, 5);
    } catch (error) {
      console.error('OpenRouter suggestions error:', error);
      return [];
    }
  }
}

export const openRouterService = new OpenRouterService();
export type { SecurityInsights, MappedControl, EnhancedRedactionDetails }; 