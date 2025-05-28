export interface RedactionResult {
  redactedText: string;
  redactionDetails: Array<{
    original: string;
    redacted: string;
    type:
      // PII & Sensitive Data
      | 'email' | 'ssn' | 'name' | 'creditcard' | 'bank_account' | 'routing_number' | 'tax_id' | 'investment_account'
      // Government IDs
      | 'passport' | 'drivers_license' | 'military_id' | 'gov_employee_id'
      // Healthcare
      | 'medical_record' | 'insurance_number' | 'prescription_number' | 'biometric' | 'genetic_info'
      // Personal
      | 'phone' | 'address' | 'ip_address' | 'device_id'
      // AI/Infra
      | 'api_key' | 'model_weights' | 'inference_endpoint' | 'prompt_template'
      // Business/Legal
      | 'customer_list' | 'pricing_strategy' | 'mna_discussion' | 'employee_evaluation' | 'legal_strategy' | 'regulatory_comm' | 'compliance_violation' | 'audit_finding'
      // Behavioral/Inferential
      | 'user_interaction' | 'preference_profile' | 'conversation_history' | 'decision_explanation'
      // AI/contextual
      | 'proprietary_dataset' | 'copyrighted_content' | 'personal_training_example'
      // LLM Guard/Contextual
      | 'llm_guard'
      // Fallback for future types
      | string;
    startIndex: number;
    endIndex: number;
  }>;
}

// Comprehensive regex patterns for PII/PHI/PCI and enterprise-specific data
const piiPatterns: Record<string, RegExp> = {
  // ✅ Core PII/PHI/PCI (Standard Compliance)
  // Personal Identifiers
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
  
  // Health Information
  healthInfo: /\b(?:diagnosis|treatment|prescription|medical|health|patient|doctor|hospital|clinic)\b/gi,
  insurance_number: /\b[A-Z]{2,4}\d{6,12}\b/g,
  
  // Network/Device
  ip_address: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  device_id: /\b[0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}\b/g,

  // 🏢 Enterprise-Specific Company Data
  // Technical Assets
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
  financialProjections: /\b(?:Q[1-4]|FY\d{2,4})\s+(?:revenue|earnings|profit|forecast)/gi,
  
  // IP Ranges and Network
  cidrRange: /\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\/\d{1,2}\b/g,
  
  // Regulatory and Compliance
  exportControl: /\b(?:ITAR|EAR|export.controlled|dual.use)\b/gi,
  cui: /\b(?:CUI|Controlled Unclassified Information)\b/gi,
  whistleblower: /\b(?:whistleblower|insider.threat|investigation|compliance.violation)\b/gi,

  // Sensitive Keywords (Context-Aware)
  credentials: /\b(?:password|secret|token|key|credential|auth|login)\s*[:=]\s*\S+/gi,
  confidential: /\b(?:confidential|private|internal.only|restricted|classified)\b/gi,
  security: /\b(?:vulnerability|exploit|backdoor|zero.day|penetration.test)\b/gi,
  legal: /\b(?:attorney.client|privileged|litigation|settlement|NDA)\b/gi,

  // Legacy patterns for backward compatibility
  name: /\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/g,
  medical_record: /\bMRN\d{6,10}\b/gi,
  prescription_number: /\bRX\d{7,10}\b/gi,
  biometric: /\b(fingerprint|iris|retina|face|voice)\b/gi,
  genetic_info: /\b(genotype|genome|DNA|RNA|chromosome)\b/gi,
  address: /\b\d{1,5}\s+([A-Za-z0-9.,'\-\s]+)\b/g,
  model_weights: /\b(model|weight|parameter)[-_ ]?\d{4,}\b/gi,
  inference_endpoint: /https?:\/\/[\w.-]+\/(infer|predict|model)\b/gi,
  prompt_template: /\b(prompt|template)[-_ ]?\d{3,}\b/gi,
  customer_list: /\bcustomer(s)? list(s)?\b/gi,
  pricing_strategy: /\bpricing strateg(y|ies)\b/gi,
  mna_discussion: /\bmerger(s)?|acquisition(s)?|M&A\b/gi,
  employee_evaluation: /\bemployee evaluation(s)?\b/gi,
  legal_strategy: /\blegal strateg(y|ies)\b/gi,
  regulatory_comm: /\bregulator(y|ies) communication(s)?\b/gi,
  compliance_violation: /\bcompliance violation(s)?\b/gi,
  audit_finding: /\baudit finding(s)?\b/gi,
  user_interaction: /\b(user|customer|client) (interaction|behavior|pattern)s?\b/gi,
  preference_profile: /\bpreference profile(s)?\b/gi,
  conversation_history: /\bconversation histor(y|ies)\b/gi,
  decision_explanation: /\bdecision explanation(s)?\b/gi,
  proprietary_dataset: /\bproprietary dataset(s)?\b/gi,
  copyrighted_content: /\bcopyright(ed)? content\b/gi,
  personal_training_example: /\bpersonal training example(s)?\b/gi,
  tax_id: /\b\d{2}-\d{7}\b/g,
  investment_account: /\bINVEST\d{6,10}\b/gi,
  military_id: /\b[0-9]{10}\b/g,
  gov_employee_id: /\bEMP\d{5,10}\b/gi
};

// Redaction placeholder generator for all types
const redactionPlaceholder = (type: string) => `[REDACTED_${type.toUpperCase()}]`;

/**
 * Redacts PII from text using regex.
 * @param text The input text.
 * @returns The redacted text and details of redactions.
 */
export function redactPII(text: string): RedactionResult {
  let redactedText = text;
  const redactionDetails: RedactionResult['redactionDetails'] = [];

  Object.entries(piiPatterns).forEach(([key, regex]) => {
    let match;
    const type = key as string;
    // Important: We need to run replace on the *latest* version of redactedText
    // However, indices should be based on the original text for accurate logging.
    // This simplified version replaces in sequence and might have offset issues
    // if redactions overlap or change string length significantly.
    // A more robust solution would map original indices to current indices.

    // Create a placeholder text to find original indices
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
  
  // Sort details by start index to maintain order if needed later
  redactionDetails.sort((a,b) => a.startIndex - b.startIndex);

  return { redactedText, redactionDetails };
}

/**
 * Placeholder for LLM Guard integration.
 * In a real scenario, this would call an LLM Guard service.
 * @param text The input text.
 * @returns The text, possibly redacted by LLM Guard.
 */
export async function llmGuardRedact(text: string): Promise<RedactionResult> {
  // Simulate LLM Guard activity - for now, it doesn't change the text
  // but could identify specific sensitive phrases.
  console.log("LLM Guard simulation: Analyzing text - ", text.substring(0,50) + "...");
  // Example: if LLM guard identified "Project Phoenix" as sensitive
  const llmRedactions: RedactionResult['redactionDetails'] = [];
  if (text.includes("Project Phoenix")) {
    llmRedactions.push({
      original: "Project Phoenix",
      redacted: "[REDACTED_PROJECT_NAME]",
      type: "llm_guard",
      startIndex: text.indexOf("Project Phoenix"),
      endIndex: text.indexOf("Project Phoenix") + "Project Phoenix".length
    });
    text = text.replace("Project Phoenix", "[REDACTED_PROJECT_NAME]");
  }
  return { redactedText: text, redactionDetails: llmRedactions };
}

/**
 * Combines regex and LLM Guard redaction.
 * @param text The input text.
 * @returns The final redacted text and combined redaction details.
 */
export async function comprehensiveRedact(text: string): Promise<RedactionResult> {
  const regexResult = redactPII(text);
  // Apply LLM guard to already regex-redacted text or original? This depends on strategy.
  // Applying to regex-redacted text is safer but LLM might lose context.
  // Applying to original means LLM guard might redact things regex already got.
  // For this example, let's apply LLM guard to the original text then merge.
  
  const llmResult = await llmGuardRedact(text); // LLM on original

  // Combine results:
  // This is a simplified merge. A more robust solution would handle overlapping
  // redactions and adjust indices.
  let finalRedactedText = regexResult.redactedText;
  const combinedDetails = [...regexResult.redactionDetails];

  // Apply LLM redactions to the regex-redacted text if they are not already covered
  llmResult.redactionDetails.forEach(llmDetail => {
    // Check if this portion of text (by original indices) was already redacted by regex
    const isOverlapping = regexResult.redactionDetails.some(regexDetail => 
        Math.max(regexDetail.startIndex, llmDetail.startIndex) < Math.min(regexDetail.endIndex, llmDetail.endIndex)
    );
    if (!isOverlapping) {
        // This is tricky: if regex changed length, llmDetail.original might not be in finalRedactedText
        // For simplicity, we assume llmDetail.original refers to a segment in the *current* finalRedactedText
        // A better way would be to replace based on original indices on the original text,
        // and then consolidate all redaction operations.
        finalRedactedText = finalRedactedText.replace(llmDetail.original, llmDetail.redacted);
        combinedDetails.push(llmDetail);
    }
  });
  
  combinedDetails.sort((a,b) => a.startIndex - b.startIndex);

  return { redactedText: finalRedactedText, redactionDetails: combinedDetails };
} 