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

// Expanded regex for PII & sensitive data (see comments for control mappings)
const piiPatterns: Record<string, RegExp> = {
  // --- Financial Data ---
  // Credit card numbers (PCI DSS 3.2.1, NIST 800-53 SC-28)
  creditcard: /\b(?:\d[ -]*?){13,16}\b/g,
  // Bank account numbers (SOX 404, GLBA)
  bank_account: /\b\d{8,12}\b/g, // Simplified, adjust for country
  // Routing numbers (FFIEC, NIST CSF)
  routing_number: /\b\d{9}\b/g, // US ABA routing
  // Tax ID/EIN (IRS Pub 1075, SOC 2)
  tax_id: /\b\d{2}-\d{7}\b/g, // EIN format
  // Investment account (SEC, FINRA)
  investment_account: /\bINVEST\d{6,10}\b/gi, // Example pattern

  // --- Government Identifiers ---
  // SSN (NIST 800-122, FISMA)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  // Passport (ITAR, EAR)
  passport: /\b[\dA-Z]{8,9}\b/g, // Simplified
  // Driver's license (State, REAL ID)
  drivers_license: /\b[A-Z0-9]{1,2}-?\d{3,8}\b/gi, // Varies by state/country
  // Military service number (DoD, NIST 800-171)
  military_id: /\b[0-9]{10}\b/g, // Example: 10 digits
  // Government employee ID (FedRAMP, FISMA)
  gov_employee_id: /\bEMP\d{5,10}\b/gi, // Example pattern

  // --- Healthcare Data (HIPAA PHI) ---
  // Medical record number (HIPAA, NIST 800-66)
  medical_record: /\bMRN\d{6,10}\b/gi, // Example pattern
  // Health insurance number (HITECH, 45 CFR)
  insurance_number: /\bHIN\d{6,10}\b/gi, // Example pattern
  // Prescription number (DEA, 21 CFR)
  prescription_number: /\bRX\d{7,10}\b/gi, // Example pattern
  // Biometric identifiers (HIPAA, GDPR)
  biometric: /\b(fingerprint|iris|retina|face|voice)\b/gi, // Keyword-based
  // Genetic information (GINA, HIPAA)
  genetic_info: /\b(genotype|genome|DNA|RNA|chromosome)\b/gi, // Keyword-based

  // --- Personal Identifiers ---
  // Email (GDPR, CCPA, NIST PF)
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Phone (TCPA, GDPR)
  phone: /\b\+?\d{1,2}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  // Home address (CCPA, PIPEDA)
  address: /\b\d{1,5}\s+([A-Za-z0-9.,'\-\s]+)\b/g, // Simplified
  // IP address (GDPR, ePrivacy)
  ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  // Device ID/MAC (COPPA, state laws)
  device_id: /\b([A-Fa-f0-9]{2}[:-]){5}[A-Fa-f0-9]{2}\b/g,

  // --- AI/Infra ---
  // API keys/tokens (NIST 800-63B, OAuth)
  api_key: /\b(?:sk|pk|api|key|token)[-_][a-zA-Z0-9-]{8,}\b/gi,
  // Model weights/parameters (NIST AI RMF)
  model_weights: /\b(model|weight|parameter)[-_ ]?\d{4,}\b/gi, // Example
  // Inference endpoints (Cloud, SOC 2)
  inference_endpoint: /https?:\/\/[\w.-]+\/(infer|predict|model)\b/gi, // Example
  // Prompt templates (Trade secret)
  prompt_template: /\b(prompt|template)[-_ ]?\d{3,}\b/gi, // Example

  // --- Business/Legal ---
  // Customer lists (Trade Secrets Act)
  customer_list: /\bcustomer(s)? list(s)?\b/gi, // Keyword
  // Pricing strategies (Antitrust, SEC)
  pricing_strategy: /\bpricing strateg(y|ies)\b/gi, // Keyword
  // M&A discussions (Securities, insider trading)
  mna_discussion: /\bmerger(s)?|acquisition(s)?|M&A\b/gi, // Keyword
  // Employee evaluations (Employment law, GDPR)
  employee_evaluation: /\bemployee evaluation(s)?\b/gi, // Keyword
  // Legal strategy (Attorney-client)
  legal_strategy: /\blegal strateg(y|ies)\b/gi, // Keyword
  // Regulatory communications (Agency confidentiality)
  regulatory_comm: /\bregulator(y|ies) communication(s)?\b/gi, // Keyword
  // Compliance violations (Self-reporting, settlements)
  compliance_violation: /\bcompliance violation(s)?\b/gi, // Keyword
  // Audit findings (SOX 404)
  audit_finding: /\baudit finding(s)?\b/gi, // Keyword

  // --- Behavioral/Inferential ---
  // User interaction patterns (GDPR, CCPA)
  user_interaction: /\b(user|customer|client) (interaction|behavior|pattern)s?\b/gi, // Keyword
  // Preference profiles (ePrivacy, advertising)
  preference_profile: /\bpreference profile(s)?\b/gi, // Keyword
  // Conversation history (Data retention, RTBF)
  conversation_history: /\bconversation histor(y|ies)\b/gi, // Keyword
  // Decision explanations (EU AI Act, FCRA)
  decision_explanation: /\bdecision explanation(s)?\b/gi, // Keyword

  // --- AI-Specific Sensitive Data ---
  // Proprietary datasets (Trade Secrets Act, NIST AI RMF)
  proprietary_dataset: /\bproprietary dataset(s)?\b/gi, // Keyword
  // Copyrighted content (DMCA, EU Copyright)
  copyrighted_content: /\bcopyright(ed)? content\b/gi, // Keyword
  // Personal training examples (GDPR, CCPA)
  personal_training_example: /\bpersonal training example(s)?\b/gi, // Keyword

  // --- Names (fallback, not robust) ---
  name: /\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/g,
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