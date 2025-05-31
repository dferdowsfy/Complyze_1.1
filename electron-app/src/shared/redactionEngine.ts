// Redaction Engine for Complyze Desktop Agent
// Based on existing redactUtils.ts from the web app

export interface RedactionResult {
  redactedText: string;
  optimizedText: string;
  redactionDetails: Array<{
    original: string;
    redacted: string;
    type: string;
    startIndex: number;
    endIndex: number;
  }>;
}

// Comprehensive regex patterns for PII/PHI/PCI and enterprise-specific data with HIPAA compliance
const piiPatterns: Record<string, RegExp> = {
  // Core PII/PHI/PCI (Standard Compliance)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
  fullName: /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})+\b/g,
  
  // Financial Data
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditcard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  bank_account: /\b\d{8,17}\b/g,
  routing_number: /\b[0-9]{9}\b/g,
  
  // HIPAA Employee/Medical Record Numbers
  employeeId: /\b(?:employee\s+id|emp\s+id|employee\s+number|emp\s+#)[\s:]*\d{4,8}\b/gi,
  medicalRecordNumber: /\b(?:mrn|medical\s+record\s+number|patient\s+id)[\s:]*\d{4,10}\b/gi,
  
  // HIPAA Financial Information
  salary: /\$[\d,]+(?:\.\d{2})?\s*(?:annually|per\s+year|yearly|salary)/gi,
  
  // HIPAA Dates (except year) - Critical for HIPAA compliance
  specificDates: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
  numericDates: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
  
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
  
  // HIPAA URLs and Links
  zoomLinks: /https?:\/\/(?:[\w-]+\.)?zoom\.us\/[^\s]+/gi,
  shareLinks: /https?:\/\/[^\s]+\/(?:share|rec|recording)[^\s]*/gi,
  
  // Internal URLs and Services
  internalUrl: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g,
  internalService: /\b(?:ServiceNow|Snowflake|Redshift|Databricks|Splunk|Tableau)\s+(?:instance|database|server)/gi,
  
  // HIPAA Internal Policy References
  policyNumbers: /\b[A-Z]{2,4}-\d{2,4}-[A-Z]\b/g,
  
  // HIPAA Team/Department References
  teamReferences: /\b[A-Z][a-z]+\'s\s+team\b/g,
  departmentNames: /\b(?:AML\s+compliance|compliance\s+department|audit\s+department|legal\s+department)\b/gi,
  
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

// Redaction placeholder generator (for backward compatibility)
const redactionPlaceholder = (type: string) => `[REDACTED_${type.toUpperCase()}]`;

// NEW: Enhanced optimization patterns with HIPAA compliance (matching Chrome extension)
const optimizationPatterns: Record<string, { pattern: RegExp; replacement: string | ((match: string) => string) }> = {
  // HIPAA Personal Identifiers
  email: { 
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
    replacement: (match: string) => {
      // Extract domain for context if it's a common service
      const domain = match.split('@')[1];
      if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('outlook')) {
        return 'a personal email address';
      } else if (domain.includes('company') || domain.includes('corp') || domain.includes('enterprise')) {
        return 'a corporate email address';
      }
      return 'an email address';
    }
  },
  phone: { 
    pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g, 
    replacement: 'a phone number'
  },
  fullName: { 
    pattern: /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})+\b/g, 
    replacement: (match: string) => {
      // Enhanced name detection - more specific patterns
      const words = match.split(' ');
      if (words.length === 2) {
        return 'a person\'s name';
      } else {
        return 'someone\'s full name';
      }
    }
  },
  ssn: { 
    pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g, 
    replacement: 'a social security number'
  },
  
  // HIPAA Employee/Medical Record Numbers
  employeeId: {
    pattern: /\b(?:employee\s+id|emp\s+id|employee\s+number|emp\s+#)[\s:]*\d{4,8}\b/gi,
    replacement: 'an employee identification number'
  },
  medicalRecordNumber: {
    pattern: /\b(?:mrn|medical\s+record\s+number|patient\s+id)[\s:]*\d{4,10}\b/gi,
    replacement: 'a medical record number'
  },
  
  // HIPAA Financial Information
  salary: {
    pattern: /\$[\d,]+(?:\.\d{2})?\s*(?:annually|per\s+year|yearly|salary)/gi,
    replacement: 'salary information'
  },
  
  // HIPAA Dates (except year)
  specificDates: {
    pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
    replacement: 'a specific date'
  },
  numericDates: {
    pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
    replacement: 'a specific date'
  },
  
  // HIPAA URLs and Links
  zoomLinks: {
    pattern: /https?:\/\/(?:[\w-]+\.)?zoom\.us\/[^\s]+/gi,
    replacement: 'a video conference link'
  },
  shareLinks: {
    pattern: /https?:\/\/[^\s]+\/(?:share|rec|recording)[^\s]*/gi,
    replacement: 'a shared document or recording link'
  },
  
  // HIPAA Internal Policy References
  policyNumbers: {
    pattern: /\b[A-Z]{2,4}-\d{2,4}-[A-Z]\b/g,
    replacement: 'an internal policy reference'
  },
  
  // HIPAA Team/Department References
  teamReferences: {
    pattern: /\b[A-Z][a-z]+\'s\s+team\b/g,
    replacement: 'a team reference'
  },
  departmentNames: {
    pattern: /\b(?:AML\s+compliance|compliance\s+department|audit\s+department|legal\s+department)\b/gi,
    replacement: 'a department'
  },
  
  // Standard Technical Identifiers
  passport: { 
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, 
    replacement: 'a passport number'
  },
  ip_address: { 
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g, 
    replacement: (match: string) => {
      // Preserve context for internal vs external IPs
      if (match.startsWith('192.168.') || match.startsWith('10.') || match.startsWith('172.')) {
        return 'an internal IP address';
      }
      return 'an IP address';
    }
  },
  api_key: { 
    pattern: /\b(?:sk-[a-zA-Z0-9]{32,}|pk_[a-zA-Z0-9]{24,}|[a-zA-Z0-9]{32,})\b/g, 
    replacement: 'an API key'
  },
  oauthSecret: { 
    pattern: /\b(?:client_secret|oauth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_-]+/gi, 
    replacement: 'authentication credentials'
  },
  sshKey: { 
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, 
    replacement: 'SSH private key credentials'
  },
  internalUrl: { 
    pattern: /https?:\/\/(?:dev-|staging-|internal-|admin-)[a-zA-Z0-9.-]+/g, 
    replacement: (match: string) => {
      if (match.includes('dev-')) return 'a development environment URL';
      if (match.includes('staging-')) return 'a staging environment URL';
      if (match.includes('internal-')) return 'an internal system URL';
      if (match.includes('admin-')) return 'an admin panel URL';
      return 'an internal URL';
    }
  },
  projectName: { 
    pattern: /\b(?:Project|Operation|Initiative)\s+[A-Z][a-zA-Z]+\b/g, 
    replacement: 'a project codename'
  },
  codeNames: { 
    pattern: /\b[A-Z][a-zA-Z]+(?:DB|API|Service|Platform)\b/g, 
    replacement: (match: string) => {
      if (match.includes('DB')) return 'a database system';
      if (match.includes('API')) return 'an API service';
      if (match.includes('Service')) return 'a service component';
      if (match.includes('Platform')) return 'a platform system';
      return 'an internal system';
    }
  },
  cidrRange: { 
    pattern: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g, 
    replacement: 'a private network range'
  }
};

/**
 * NEW: Generate safe prompt by rephrasing sensitive content (matching Chrome extension)
 */
export function generateSafePrompt(originalPrompt: string): string {
  let safePrompt = originalPrompt;

  // Apply optimization patterns (rephrase instead of redact)
  for (const [type, config] of Object.entries(optimizationPatterns)) {
    if (typeof config.replacement === 'function') {
      safePrompt = safePrompt.replace(config.pattern, config.replacement);
    } else {
      safePrompt = safePrompt.replace(config.pattern, config.replacement);
    }
  }

  // Additional optimization: improve prompt structure and clarity
  safePrompt = optimizePromptStructure(safePrompt);

  return safePrompt;
}

/**
 * NEW: Helper function to optimize prompt structure (matching Chrome extension)
 */
function optimizePromptStructure(prompt: string): string {
  let optimized = prompt;
  
  // Remove redundant phrases
  const redundantPhrases = [
    /\b(?:please|kindly|if you could|would you mind)\b/gi,
    /\b(?:as an AI|as a language model|I understand that you are)\b/gi
  ];
  
  redundantPhrases.forEach(pattern => {
    optimized = optimized.replace(pattern, '');
  });

  // Improve clarity and specificity
  optimized = optimized
    .replace(/\bthing\b/gi, 'item')
    .replace(/\bstuff\b/gi, 'content')
    .replace(/\bdo this\b/gi, 'complete this task');

  // Clean up extra whitespace
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  return optimized;
}

/**
 * Redacts PII from text using regex patterns (for backward compatibility)
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

  // NEW: Generate optimized version
  const optimizedText = generateSafePrompt(text);

  return { redactedText, optimizedText, redactionDetails };
}

/**
 * Comprehensive redaction combining multiple techniques
 */
export async function comprehensiveRedact(text: string): Promise<RedactionResult> {
  const regexResult = redactPII(text);
  
  // For now, just return regex results with optimization
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