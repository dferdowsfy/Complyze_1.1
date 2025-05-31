// Prompt Enhancer for Complyze Desktop Agent
// Creates optimized prompts using local optimization (matching Chrome extension) with OpenRouter API fallback
// Based on best practices from Anthropic Claude 4 and Google Gemini strategies

import { generateSafePrompt } from './redactionEngine';

export interface PromptEnhancementResult {
  originalPrompt: string;
  enhancedPrompt: string;
  clarityScore: number;
  qualityScore: number;
  improvements: string[];
  detectedIntent: string;
  optimizationReason: string;
  sensitiveDataRemoved: string[];
  complianceFrameworks: string[];
  aiRiskIndicators: string[];
}

// OpenRouter API configuration
const OPENROUTER_CONFIG = {
  apiKey: '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',
  model: 'google/gemini-2.5-pro-preview',
  baseUrl: 'https://openrouter.ai/api/v1/chat/completions'
};

/**
 * Enhanced prompt analyzer for comprehensive content detection
 */
export function shouldTriggerOptimization(content: string): boolean {
  if (content.length < 10) return false; // Lowered threshold
  
  // 🔒 SENSITIVE DATA PATTERNS (ALWAYS TRIGGER)
  const sensitivePatterns = [
    // Personal Identifiers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{9}\b/, // SSN without dashes
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
    /\b\(\d{3}\)\s?\d{3}-\d{4}\b/, // Phone number with parentheses
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP address
    
    // Financial Data
    /\b\d{10,12}\b/, // Bank account numbers
    /\b\d{6,8}-\d{10,12}\b/, // Bank routing + account
    /\biban\s*[a-z]{2}[0-9]{2}[a-z0-9]{4}[0-9]{7}([a-z0-9]?){0,16}\b/i, // IBAN
    /\bswift\s*[a-z]{4}[a-z]{2}[a-z0-9]{2}([a-z0-9]{3})?\b/i, // SWIFT
    
    // Government IDs
    /\b[a-z]{1,2}\d{6,8}\b/i, // Passport numbers
    /\b[a-z]\d{7,8}\b/i, // Driver's license (various formats)
    /\b\d{2}-\d{7}\b/, // Driver's license format
    
    // Healthcare
    /\bmrn[\s:]*\d{6,10}/i, // Medical record numbers
    /\bpatient[\s-_]?id[\s:]*\d+/i, // Patient IDs
    /\bhipaa/i, // HIPAA mentions
    /\bphi\b/i, // Protected Health Information
    
    // Technical Identifiers
    /\b[0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}\b/i, // MAC address
    /\b[a-z0-9]{32}\b/i, // MD5 hash
    /\b[a-z0-9]{40}\b/i, // SHA1 hash
    /\b[a-z0-9]{64}\b/i, // SHA256 hash
    
    // Authentication & API
    /\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/i, // API keys
    /\btoken[\s:=]+[a-z0-9\-_\.]{20,}/i, // Auth tokens
    /\bbearer\s+[a-z0-9\-_\.]{20,}/i, // Bearer tokens
    /\boauth[\s_-]?token[\s:=]+[a-z0-9\-_]{16,}/i, // OAuth tokens
    /\bjwt[\s:=]+[a-z0-9\-_\.]{20,}/i, // JWT tokens
    /\bsession[\s_-]?id[\s:=]+[a-z0-9\-_]{16,}/i, // Session IDs
    /\bcookie[\s:=]+[a-z0-9\-_=%;]{20,}/i, // Session cookies
    
    // Biometric identifiers
    /\bfingerprint/i,
    /\bretinal?\s+scan/i,
    /\bbiometric/i,
    /\bface[\s_-]?id/i
  ];
  
  // 🤖 AI-SPECIFIC RISK INDICATORS
  const aiRiskPatterns = [
    // Model information leakage
    /\bgpt-[0-9\.]+/i,
    /\bclaude-[0-9\.]+/i,
    /\bllama-?[0-9\.]+/i,
    /\bgemini-?[0-9\.]+/i,
    /\bmodel\s*(name|version|weights)/i,
    /\bfine[\s-]?tun(e|ing)/i,
    
    // Prompt injection patterns
    /ignore\s+(previous|all)\s+instructions/i,
    /forget\s+(everything|all)\s+(above|before)/i,
    /\bdeveloper\s+mode/i,
    /\bjailbreak/i,
    /\bdan\s+mode/i, // "Do Anything Now"
    /\bact\s+as.*uncensored/i,
    /\byou\s+are\s+no\s+longer/i,
    /\bpretend\s+you\s+are\s+not/i,
    /\brole[\s-]?play.*evil/i,
    
    // System instruction disclosure
    /\bsystem\s+prompt/i,
    /\bshow\s+me\s+your\s+instructions/i,
    /\bwhat\s+are\s+your\s+rules/i,
    /\bhidden\s+prompt/i,
    /\bbase\s+instructions/i,
    /\binitial\s+prompt/i,
    
    // Unsafe generation attempts
    /\bhow\s+to\s+(hack|break|exploit)/i,
    /\bgenerate\s+(malware|virus)/i,
    /\bcreate\s+(fake|forged)\s+(document|id)/i,
    /\bimpersonate/i,
    /\bfraudulent/i,
    
    // Bias and manipulation
    /\bmake\s+me\s+believe/i,
    /\bconvince\s+me\s+that/i,
    /\bmanipulate/i,
    /\bmisinformation/i,
    /\bpropaganda/i
  ];
  
  // 📋 COMPLIANCE FRAMEWORK KEYWORDS
  const compliancePatterns = [
    // NIST AI RMF
    /\bnist\s+ai/i,
    /\bai\s+rmf/i,
    /\brisk\s+management\s+framework/i,
    /\bai\s+governance/i,
    
    // ISO 42001
    /\biso\s*42001/i,
    /\bai\s+management\s+system/i,
    
    // FedRAMP & Security Controls
    /\bfedramp/i,
    /\bsc-28/i, // System and Communications Protection
    /\bfips\s*199/i,
    /\bfisma/i,
    
    // OWASP LLM Top 10
    /\bowasp\s+llm/i,
    /\bllm\s+top\s*10/i,
    /\bprompt\s+injection/i,
    /\binsecure\s+output/i,
    /\btraining\s+data\s+poisoning/i,
    /\bmodel\s+denial\s+of\s+service/i,
    /\bsupply\s+chain\s+vulnerabilities/i,
    /\bsensitive\s+information\s+disclosure/i,
    /\binsecure\s+plugin\s+design/i,
    /\bexcessive\s+agency/i,
    /\boverreliance/i,
    /\bmodel\s+theft/i,
    
    // GDPR/CCPA
    /\bgdpr/i,
    /\bccpa/i,
    /\bpersonal\s+data/i,
    /\bdata\s+subject/i,
    /\bright\s+to\s+be\s+forgotten/i,
    /\bdata\s+portability/i,
    /\bdata\s+minimization/i,
    
    // PCI DSS
    /\bpci\s+dss/i,
    /\bcardholder\s+data/i,
    /\bpayment\s+card/i,
    /\bsensitive\s+authentication\s+data/i,
    
    // SOC 2
    /\bsoc\s*2/i,
    /\btype\s*ii/i,
    /\btrust\s+service\s+criteria/i,
    /\bavailability\s+criteria/i,
    
    // Confidential Business Logic
    /\btrade\s+secret/i,
    /\bproprietary\s+algorithm/i,
    /\bbusiness\s+logic/i,
    /\bconfidential\s+process/i,
    /\binternal\s+system/i
  ];
  
  const lowerContent = content.toLowerCase();
  
  // Check for sensitive data (highest priority)
  const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(content));
  if (hasSensitiveData) return true;
  
  // Check for AI-specific risks
  const hasAIRisks = aiRiskPatterns.some(pattern => pattern.test(content));
  if (hasAIRisks) return true;
  
  // Check for compliance framework mentions
  const hasComplianceRisks = compliancePatterns.some(pattern => pattern.test(content));
  if (hasComplianceRisks) return true;
  
  // Prompt-like content indicators (existing logic)
  const promptIndicators = [
    'explain', 'how to', 'what is', 'why does', 'can you', 'please',
    'could you', 'would you', 'help me', 'i need', 'tell me',
    'generate', 'create', 'write', 'analyze', 'summarize', 'translate',
    'review', 'check', 'improve', 'optimize', 'debug', 'fix',
    'act as', 'pretend to be', 'you are', 'imagine you',
    'role play', 'simulate', 'behave like',
    'make', 'build', 'design', 'develop', 'code', 'script'
  ];
  
  const hasPromptIndicators = promptIndicators.some(indicator => 
    lowerContent.includes(indicator)
  );
  
  // Check for question patterns
  const hasQuestionPattern = /^(what|how|why|when|where|who|which|can|could|would|should)/i.test(content.trim()) ||
                            content.includes('?');
  
  // Require substantial content for basic prompts (but sensitive data always triggers)
  const isSubstantial = content.split(' ').length >= 3; // Lowered from 4
  
  return (hasPromptIndicators || hasQuestionPattern) && isSubstantial;
}

/**
 * Creates an optimized prompt using local optimization (matching Chrome extension) with OpenRouter API fallback
 */
export async function enhancePrompt(originalPrompt: string): Promise<PromptEnhancementResult> {
  console.log('Complyze: Enhancing prompt with local optimization:', originalPrompt.substring(0, 100) + '...');
  
  try {
    // STEP 1: Use local optimization first (matching Chrome extension approach)
    const localOptimizedPrompt = generateSafePrompt(originalPrompt);
    
    // STEP 2: Detect and analyze sensitive data for reporting
    const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = removeSensitiveData(originalPrompt);
    
    // STEP 3: Analyze prompt intent
    const intent = analyzePromptIntent(cleanedPrompt);
    
    // STEP 4: Create result using local optimization
    const result: PromptEnhancementResult = {
      originalPrompt,
      enhancedPrompt: localOptimizedPrompt,
      clarityScore: 85, // High score for local optimization
      qualityScore: 90, // High score for local optimization
      improvements: [
        'Sensitive data rephrased with contextual alternatives',
        'Maintained original intent while improving security',
        'Applied consistent optimization patterns',
        'Enhanced prompt structure and clarity'
      ],
      detectedIntent: `${intent.type} - ${intent.category}`,
      optimizationReason: 'Local optimization applied to rephrase sensitive content naturally',
      sensitiveDataRemoved,
      complianceFrameworks,
      aiRiskIndicators
    };
    
    console.log('Complyze: Local prompt optimization completed successfully');
    return result;
    
  } catch (error) {
    console.error('Complyze: Error with local optimization, trying API fallback:', error);
    
    try {
      // FALLBACK: Use OpenRouter API if local optimization fails
      const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = removeSensitiveData(originalPrompt);
      const intent = analyzePromptIntent(cleanedPrompt);
      const optimizationPrompt = createOptimizationPrompt(cleanedPrompt, intent);
      const apiResponse = await callOpenRouterAPI(optimizationPrompt);
      
      if (apiResponse.success && apiResponse.content) {
        const result = parseOptimizationResponse(apiResponse.content, originalPrompt, cleanedPrompt, intent, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators);
        console.log('Complyze: API fallback optimization completed successfully');
        return result;
      }
    } catch (apiError) {
      console.error('Complyze: API fallback also failed:', apiError);
    }
    
    // FINAL FALLBACK: Basic optimization
    return createFallbackOptimization(originalPrompt);
  }
}

/**
 * Comprehensive sensitive data removal with expanded detection
 */
function removeSensitiveData(prompt: string): { 
  cleanedPrompt: string; 
  sensitiveDataRemoved: string[]; 
  complianceFrameworks: string[];
  aiRiskIndicators: string[];
} {
  const sensitiveDataRemoved: string[] = [];
  const complianceFrameworks: string[] = [];
  const aiRiskIndicators: string[] = [];
  let cleaned = prompt;
  
  // 🔒 PERSONAL IDENTIFIERS
  const emailMatches = prompt.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  if (emailMatches) {
    emailMatches.forEach(email => sensitiveDataRemoved.push(`Email address: ${email}`));
    cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  }
  
  const ssnMatches = prompt.match(/\b\d{3}-\d{2}-\d{4}\b/g);
  if (ssnMatches) {
    ssnMatches.forEach(ssn => sensitiveDataRemoved.push(`Social Security Number: ${ssn}`));
    cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
  }
  
  const ssnNoHyphenMatches = prompt.match(/\b\d{9}\b/g);
  if (ssnNoHyphenMatches) {
    ssnNoHyphenMatches.forEach(ssn => sensitiveDataRemoved.push(`Social Security Number: ${ssn}`));
    cleaned = cleaned.replace(/\b\d{9}\b/g, '[SSN_REDACTED]');
  }
  
  const ccMatches = prompt.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g);
  if (ccMatches) {
    ccMatches.forEach(cc => sensitiveDataRemoved.push(`Credit card number: ${cc}`));
    cleaned = cleaned.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT_CARD_REDACTED]');
  }
  
  const phoneMatches = prompt.match(/\b\d{3}-\d{3}-\d{4}\b/g);
  if (phoneMatches) {
    phoneMatches.forEach(phone => sensitiveDataRemoved.push(`Phone number: ${phone}`));
    cleaned = cleaned.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE_REDACTED]');
  }
  
  const phoneParenMatches = prompt.match(/\b\(\d{3}\)\s?\d{3}-\d{4}\b/g);
  if (phoneParenMatches) {
    phoneParenMatches.forEach(phone => sensitiveDataRemoved.push(`Phone number: ${phone}`));
    cleaned = cleaned.replace(/\b\(\d{3}\)\s?\d{3}-\d{4}\b/g, '[PHONE_REDACTED]');
  }
  
  const ipMatches = prompt.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g);
  if (ipMatches) {
    ipMatches.forEach(ip => sensitiveDataRemoved.push(`IP address: ${ip}`));
    cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_ADDRESS_REDACTED]');
  }
  
  // 🏦 FINANCIAL DATA
  const bankAccountMatches = prompt.match(/\b\d{10,12}\b/g);
  if (bankAccountMatches) {
    bankAccountMatches.forEach(account => sensitiveDataRemoved.push(`Bank account number: ${account}`));
    cleaned = cleaned.replace(/\b\d{10,12}\b/g, '[BANK_ACCOUNT_REDACTED]');
  }
  
  // 📄 GOVERNMENT IDs
  const passportMatches = prompt.match(/\b[a-z]{1,2}\d{6,8}\b/gi);
  if (passportMatches) {
    passportMatches.forEach(passport => sensitiveDataRemoved.push(`Passport number: ${passport}`));
    cleaned = cleaned.replace(/\b[a-z]{1,2}\d{6,8}\b/gi, '[PASSPORT_REDACTED]');
  }
  
  const driverLicenseMatches = prompt.match(/\b[a-z]\d{7,8}\b/gi);
  if (driverLicenseMatches) {
    driverLicenseMatches.forEach(dl => sensitiveDataRemoved.push(`Driver's license: ${dl}`));
    cleaned = cleaned.replace(/\b[a-z]\d{7,8}\b/gi, '[DRIVERS_LICENSE_REDACTED]');
  }
  
  // 🏥 HEALTHCARE DATA
  const mrnMatches = prompt.match(/\bmrn[\s:]*\d{6,10}/gi);
  if (mrnMatches) {
    mrnMatches.forEach(mrn => sensitiveDataRemoved.push(`Medical record number: ${mrn}`));
    cleaned = cleaned.replace(/\bmrn[\s:]*\d{6,10}/gi, '[MRN_REDACTED]');
  }
  
  const patientIdMatches = prompt.match(/\bpatient[\s-_]?id[\s:]*\d+/gi);
  if (patientIdMatches) {
    patientIdMatches.forEach(pid => sensitiveDataRemoved.push(`Patient ID: ${pid}`));
    cleaned = cleaned.replace(/\bpatient[\s-_]?id[\s:]*\d+/gi, '[PATIENT_ID_REDACTED]');
  }
  
  // 🔧 TECHNICAL IDENTIFIERS
  const macMatches = prompt.match(/\b[0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}\b/gi);
  if (macMatches) {
    macMatches.forEach(mac => sensitiveDataRemoved.push(`MAC address: ${mac}`));
    cleaned = cleaned.replace(/\b[0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}[:-][0-9a-f]{2}\b/gi, '[MAC_ADDRESS_REDACTED]');
  }
  
  // 🔑 AUTHENTICATION & API
  const apiKeyMatches = prompt.match(/\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/gi);
  if (apiKeyMatches) {
    apiKeyMatches.forEach(key => sensitiveDataRemoved.push(`API key: ${key.substring(0, 20)}...`));
    cleaned = cleaned.replace(/\bapi[\s_-]?key[\s:=]+[a-z0-9\-_]{16,}/gi, '[API_KEY_REDACTED]');
  }
  
  const tokenMatches = prompt.match(/\btoken[\s:=]+[a-z0-9\-_\.]{20,}/gi);
  if (tokenMatches) {
    tokenMatches.forEach(token => sensitiveDataRemoved.push(`Auth token: ${token.substring(0, 20)}...`));
    cleaned = cleaned.replace(/\btoken[\s:=]+[a-z0-9\-_\.]{20,}/gi, '[TOKEN_REDACTED]');
  }
  
  const bearerMatches = prompt.match(/\bbearer\s+[a-z0-9\-_\.]{20,}/gi);
  if (bearerMatches) {
    bearerMatches.forEach(bearer => sensitiveDataRemoved.push(`Bearer token: ${bearer.substring(0, 20)}...`));
    cleaned = cleaned.replace(/\bbearer\s+[a-z0-9\-_\.]{20,}/gi, '[BEARER_TOKEN_REDACTED]');
  }
  
  // 🤖 AI RISK INDICATORS
  if (/ignore\s+(previous|all)\s+instructions/i.test(prompt)) {
    aiRiskIndicators.push('Prompt injection attempt detected');
    cleaned = cleaned.replace(/ignore\s+(previous|all)\s+instructions/gi, '[PROMPT_INJECTION_DETECTED]');
  }
  
  if (/forget\s+(everything|all)\s+(above|before)/i.test(prompt)) {
    aiRiskIndicators.push('System instruction override attempt');
    cleaned = cleaned.replace(/forget\s+(everything|all)\s+(above|before)/gi, '[INSTRUCTION_OVERRIDE_DETECTED]');
  }
  
  if (/\bjailbreak/i.test(prompt)) {
    aiRiskIndicators.push('Jailbreak attempt detected');
    cleaned = cleaned.replace(/\bjailbreak/gi, '[JAILBREAK_ATTEMPT]');
  }
  
  if (/\bdan\s+mode/i.test(prompt)) {
    aiRiskIndicators.push('DAN (Do Anything Now) mode attempt');
    cleaned = cleaned.replace(/\bdan\s+mode/gi, '[DAN_MODE_ATTEMPT]');
  }
  
  if (/\bdeveloper\s+mode/i.test(prompt)) {
    aiRiskIndicators.push('Developer mode bypass attempt');
    cleaned = cleaned.replace(/\bdeveloper\s+mode/gi, '[DEVELOPER_MODE_ATTEMPT]');
  }
  
  // 📋 COMPLIANCE FRAMEWORK DETECTION
  if (/\bnist\s+ai/i.test(prompt) || /\bai\s+rmf/i.test(prompt)) {
    complianceFrameworks.push('NIST AI RMF');
  }
  
  if (/\biso\s*42001/i.test(prompt)) {
    complianceFrameworks.push('ISO 42001');
  }
  
  if (/\bfedramp/i.test(prompt) || /\bsc-28/i.test(prompt)) {
    complianceFrameworks.push('FedRAMP SC-28');
  }
  
  if (/\bowasp\s+llm/i.test(prompt) || /\bllm\s+top\s*10/i.test(prompt)) {
    complianceFrameworks.push('OWASP LLM Top 10');
  }
  
  if (/\bgdpr/i.test(prompt) || /\bccpa/i.test(prompt)) {
    complianceFrameworks.push('GDPR/CCPA');
  }
  
  if (/\bpci\s+dss/i.test(prompt)) {
    complianceFrameworks.push('PCI DSS');
  }
  
  if (/\bsoc\s*2/i.test(prompt)) {
    complianceFrameworks.push('SOC 2 Type II');
  }
  
  if (/\btrade\s+secret/i.test(prompt) || /\bproprietary/i.test(prompt)) {
    complianceFrameworks.push('Trade Secret Protection');
  }
  
  return { cleanedPrompt: cleaned, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators };
}

/**
 * Analyze prompt intent for better optimization
 */
function analyzePromptIntent(prompt: string): { type: string; category: string; complexity: string } {
  const lowerPrompt = prompt.toLowerCase();
  
  // Determine category
  let category = 'general';
  let type = 'General request';
  
  if (['create', 'generate', 'write', 'build', 'make', 'design'].some(word => lowerPrompt.includes(word))) {
    category = 'creation';
    type = 'Content creation';
  } else if (['analyze', 'review', 'examine', 'evaluate', 'assess'].some(word => lowerPrompt.includes(word))) {
    category = 'analysis';
    type = 'Analysis task';
  } else if (['explain', 'describe', 'tell me', 'what is', 'how does'].some(word => lowerPrompt.includes(word))) {
    category = 'explanation';
    type = 'Explanation request';
  } else if (['what', 'how', 'why', 'when', 'where', 'who'].some(word => lowerPrompt.startsWith(word))) {
    category = 'question';
    type = 'Information query';
  } else if (['help', 'assist', 'support'].some(word => lowerPrompt.includes(word))) {
    category = 'assistance';
    type = 'Help request';
  }
  
  // Determine complexity
  const complexity = prompt.length > 200 ? 'complex' : prompt.length > 80 ? 'medium' : 'simple';
  
  return { type, category, complexity };
}

/**
 * Create optimization prompt based on Claude 4 and Gemini best practices
 */
function createOptimizationPrompt(cleanedPrompt: string, intent: any): string {
  return `You are an expert prompt engineer specializing in optimizing prompts for AI models. Your task is to improve the given prompt using best practices from Claude 4 and Google Gemini.

OPTIMIZATION PRINCIPLES:
1. Be explicit and specific with instructions
2. Add context to improve performance  
3. Use clear structure and formatting
4. Remove ambiguity and add clarity
5. Apply appropriate prompt engineering techniques
6. Ensure the prompt follows best practices for AI interaction
7. Create natural, professional language flow

ORIGINAL PROMPT TO OPTIMIZE:
"${cleanedPrompt}"

PROMPT CATEGORY: ${intent.category}
PROMPT TYPE: ${intent.type}

CRITICAL INSTRUCTIONS:
- The prompt may contain redaction placeholders like [EMAIL_REDACTED], [SSN_REDACTED], [CREDIT_CARD_REDACTED], etc.
- COMPLETELY REMOVE all redaction placeholders and bracketed markers
- DO NOT include any placeholder text, brackets, or redacted markers in your response
- Rewrite the prompt to be natural and flowing WITHOUT the sensitive information
- If the original prompt referenced specific personal data, generalize it appropriately
- Make the prompt more effective while maintaining the core intent
- Ensure the result is a clean, professional prompt ready for AI interaction

EXAMPLE TRANSFORMATIONS:
- "Help me write an email to [EMAIL_REDACTED]" → "Help me write a professional email to a colleague"
- "My SSN is [SSN_REDACTED]" → Remove this entirely or generalize as "Help me with personal information handling"
- "Process this credit card [CREDIT_CARD_REDACTED]" → "Help me understand payment processing procedures"

Please optimize this prompt by:
1. Removing ALL redaction markers and placeholder text
2. Making instructions more explicit and clear
3. Adding helpful context where needed
4. Structuring the request for better AI understanding
5. Applying relevant prompt engineering techniques
6. Ensuring it follows best practices
7. Creating natural, flowing language

IMPORTANT REQUIREMENTS:
- Keep the core intent and meaning unchanged
- Make the prompt more effective for AI models
- Use clear, specific language
- Add structure where beneficial
- NEVER include placeholder text like [EMAIL_REDACTED], [SSN_REDACTED], etc.
- Create a natural, professional prompt that flows well

Respond with:
1. OPTIMIZED_PROMPT: [The improved prompt with NO placeholder text]
2. CHANGES_MADE: [Bullet list of specific improvements made]

Be concise but thorough in your optimization.`;
}

/**
 * Call OpenRouter API with the optimization prompt
 */
async function callOpenRouterAPI(prompt: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch(OPENROUTER_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://complyze.co',
        'X-Title': 'Complyze Desktop Agent'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'API returned error');
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response choices returned from API');
    }

    return {
      success: true,
      content: data.choices[0].message.content
    };

  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Parse the optimization response from the API
 */
function parseOptimizationResponse(
  apiContent: string, 
  originalPrompt: string, 
  cleanedPrompt: string, 
  intent: any, 
  sensitiveDataRemoved: string[],
  complianceFrameworks: string[],
  aiRiskIndicators: string[]
): PromptEnhancementResult {
  try {
    // Extract optimized prompt
    const optimizedMatch = apiContent.match(/OPTIMIZED_PROMPT:\s*(.+?)(?=\n\d+\.|$)/s);
    const changesMatch = apiContent.match(/CHANGES_MADE:\s*(.+?)$/s);
    
    let enhancedPrompt = optimizedMatch ? optimizedMatch[1].trim() : cleanedPrompt;
    let improvements = changesMatch ? 
      changesMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[\s\-\*\•]+/, '').trim()) :
      ['Applied AI optimization best practices'];
    
    // Remove any quotes around the enhanced prompt
    enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, '');
    
    // Add sensitive data removal to improvements if any were found
    if (sensitiveDataRemoved.length > 0) {
      improvements.unshift('Removed sensitive personal information for security');
    }
    
    // Add AI risk mitigation to improvements
    if (aiRiskIndicators.length > 0) {
      improvements.unshift('Mitigated AI security risks and prompt injection attempts');
    }
    
    // Add compliance framework notes
    if (complianceFrameworks.length > 0) {
      improvements.unshift(`Applied compliance controls for: ${complianceFrameworks.join(', ')}`);
    }
    
    // Calculate scores based on optimization quality
    const clarityScore = Math.min(95, 60 + (enhancedPrompt.length > cleanedPrompt.length ? 20 : 0) + (improvements.length * 5));
    const qualityScore = Math.min(95, 65 + (enhancedPrompt.includes('Please') || enhancedPrompt.includes(':') ? 15 : 0) + (improvements.length * 3));
    
    return {
      originalPrompt,
      enhancedPrompt,
      clarityScore,
      qualityScore,
      improvements,
      detectedIntent: intent.type,
      optimizationReason: `Optimized ${intent.category} prompt using AI best practices`,
      sensitiveDataRemoved,
      complianceFrameworks,
      aiRiskIndicators
    };
    
  } catch (error) {
    console.error('Error parsing optimization response:', error);
    return createFallbackOptimization(originalPrompt);
  }
}

/**
 * Create fallback optimization using local optimization approach
 */
function createFallbackOptimization(originalPrompt: string): PromptEnhancementResult {
  const { cleanedPrompt, sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = removeSensitiveData(originalPrompt);
  const intent = analyzePromptIntent(cleanedPrompt);
  
  // Use local optimization approach (matching Chrome extension)
  let enhancedPrompt = generateSafePrompt(originalPrompt);
  const improvements: string[] = [];
  
  // Report what was optimized
  if (sensitiveDataRemoved.length > 0) {
    improvements.push('Sensitive data rephrased with contextual alternatives');
  }
  
  if (aiRiskIndicators.length > 0) {
    improvements.push('AI security risks detected and mitigated');
  }
  
  if (complianceFrameworks.length > 0) {
    improvements.push(`Applied compliance controls for: ${complianceFrameworks.join(', ')}`);
  }
  
  improvements.push('Applied local optimization patterns');
  improvements.push('Enhanced prompt structure and clarity');
  improvements.push('Maintained original intent while improving security');
  
  return {
    originalPrompt,
    enhancedPrompt,
    clarityScore: 80, // Higher score for local optimization
    qualityScore: 85, // Higher score for local optimization
    improvements,
    detectedIntent: intent.type,
    optimizationReason: 'Local optimization applied to rephrase sensitive content naturally',
    sensitiveDataRemoved,
    complianceFrameworks,
    aiRiskIndicators
  };
}

/**
 * Get enhancement suggestions for a prompt
 */
export function getEnhancementSuggestions(prompt: string): string[] {
  const suggestions: string[] = [];
  
  if (prompt.length < 20) {
    suggestions.push('Consider adding more detail to your request');
  }
  
  if (!prompt.includes('Task:') && !prompt.includes('Request:')) {
    suggestions.push('Add clear task structure for better AI understanding');
  }
  
  if (prompt.toLowerCase().includes('help me')) {
    suggestions.push('Be more specific about what kind of help you need');
  }
  
  if (prompt.length > 500) {
    suggestions.push('Consider breaking this into multiple, focused requests');
  }
  
  suggestions.push('Use our enhanced version for better AI responses');
  
  return suggestions;
}

/**
 * Get comprehensive risk assessment for a prompt
 */
export function getComprehensiveRiskAssessment(prompt: string): {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  riskFactors: string[];
  recommendedAction: string;
} {
  const shouldOptimize = shouldTriggerOptimization(prompt);
  const { sensitiveDataRemoved, complianceFrameworks, aiRiskIndicators } = removeSensitiveData(prompt);
  
  let riskScore = 0;
  const riskFactors: string[] = [];
  
  // Sensitive data increases risk significantly
  if (sensitiveDataRemoved.length > 0) {
    riskScore += 40;
    riskFactors.push(`${sensitiveDataRemoved.length} sensitive data element(s) detected`);
  }
  
  // AI-specific risks
  if (aiRiskIndicators.length > 0) {
    riskScore += 30;
    riskFactors.push(`${aiRiskIndicators.length} AI security risk(s) detected`);
  }
  
  // Compliance framework mentions
  if (complianceFrameworks.length > 0) {
    riskScore += 15;
    riskFactors.push(`Compliance framework references: ${complianceFrameworks.join(', ')}`);
  }
  
  // Basic prompt optimization needs
  if (shouldOptimize && riskScore === 0) {
    riskScore += 10;
    riskFactors.push('Prompt optimization recommended');
  }
  
  let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  let recommendedAction: string;
  
  if (riskScore >= 70) {
    overallRisk = 'CRITICAL';
    recommendedAction = 'BLOCK: Critical sensitive data or AI security risks detected. Use optimized version only.';
  } else if (riskScore >= 50) {
    overallRisk = 'HIGH';
    recommendedAction = 'REVIEW: High risk content detected. Strongly recommend using optimized version.';
  } else if (riskScore >= 25) {
    overallRisk = 'MEDIUM';
    recommendedAction = 'OPTIMIZE: Medium risk content. Consider using enhanced version for better results.';
  } else {
    overallRisk = 'LOW';
    recommendedAction = 'ALLOW: Low risk content. Optimization available for improved results.';
  }
  
  return {
    overallRisk,
    riskScore,
    riskFactors,
    recommendedAction
  };
} 