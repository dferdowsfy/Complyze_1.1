// Redaction Engine for Complyze Desktop Agent
// Based on existing redactUtils.ts from the web app

export interface RedactionResult {
  redactedText: string;
  redactionDetails: Array<{
    original: string;
    redacted: string;
    type: string;
    startIndex: number;
    endIndex: number;
  }>;
}

// Comprehensive regex patterns for PII/PHI/PCI and enterprise-specific data
const piiPatterns: Record<string, RegExp> = {
  // Core PII/PHI/PCI (Standard Compliance)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  fullName: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g,
  
  // Financial Data
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditcard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  bank_account: /\b\d{8,17}\b/g,
  routing_number: /\b[0-9]{9}\b/g,
  
  // Government IDs
  drivers_license: /\b[A-Z]{1,2}\d{6,8}\b/g,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  
  // Network/Device
  ip_address: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  device_id: /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g,

  // Enterprise-Specific Company Data
  api_key: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g,
  jwtToken: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
  oauthSecret: /\b(?:client_secret|oauth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_-]+/gi,
  sshKey: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  
  // Internal URLs and Services
  internalUrl: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g,
  internalService: /\b(?:ServiceNow|Snowflake|Redshift|Databricks|Splunk|Tableau)\s+(?:instance|database|server)/gi,
  
  // Project and Code Names
  projectName: /\b(?:Project|Operation|Initiative)\s+[A-Z][a-zA-Z]+\b/g,
  codeNames: /\b[A-Z][a-zA-Z]+(?:DB|API|Service|Platform)\b/g,
  
  // Financial and Strategic
  revenueData: /\$[\d,]+(?:\.\d{2})?\s*(?:million|billion|M|B|revenue|profit|loss)/gi,
  
  // IP Ranges and Network
  cidrRange: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g,
  
  // Sensitive Keywords
  credentials: /\b(?:password|secret|token|key|credential|auth|login)\s*[:=]\s*\S+/gi,
  confidential: /\b(?:confidential|private|internal.only|restricted|classified)\b/gi,
  security: /\b(?:vulnerability|exploit|backdoor|zero.day|penetration.test)\b/gi,
  legal: /\b(?:attorney.client|privileged|litigation|settlement|NDA)\b/gi,
};

// Redaction placeholder generator
const redactionPlaceholder = (type: string) => `[REDACTED_${type.toUpperCase()}]`;

/**
 * Redacts PII from text using regex patterns
 */
export function redactPII(text: string): RedactionResult {
  let redactedText = text;
  const redactionDetails: RedactionResult['redactionDetails'] = [];

  Object.entries(piiPatterns).forEach(([key, regex]) => {
    let match;
    const type = key as string;
    
    // Find all matches in original text
    let tempText = text;
    while ((match = regex.exec(tempText)) !== null) {
      redactionDetails.push({
        original: match[0],
        redacted: redactionPlaceholder(type),
        type: type,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    
    // Perform actual redaction
    redactedText = redactedText.replace(regex, redactionPlaceholder(type));
  });
  
  // Sort details by start index
  redactionDetails.sort((a, b) => a.startIndex - b.startIndex);

  return { redactedText, redactionDetails };
}

/**
 * Comprehensive redaction combining multiple techniques
 */
export async function comprehensiveRedact(text: string): Promise<RedactionResult> {
  const regexResult = redactPII(text);
  
  // For now, just return regex results
  // Can be extended with LLM Guard or other AI-based redaction
  return regexResult;
}

/**
 * Calculate risk score based on redaction details
 */
export function calculateRiskScore(redactionDetails: RedactionResult['redactionDetails']): number {
  if (redactionDetails.length === 0) return 0;
  
  const riskWeights: Record<string, number> = {
    ssn: 100,
    creditcard: 95,
    api_key: 90,
    sshKey: 85,
    email: 60,
    phone: 55,
    fullName: 40,
    ip_address: 30,
    projectName: 70,
    confidential: 80,
    security: 85,
    legal: 75
  };
  
  let totalRisk = 0;
  let weightedCount = 0;
  
  redactionDetails.forEach(detail => {
    const weight = riskWeights[detail.type] || 20;
    totalRisk += weight;
    weightedCount++;
  });
  
  const averageRisk = weightedCount > 0 ? totalRisk / weightedCount : 0;
  return Math.min(100, Math.round(averageRisk));
} 