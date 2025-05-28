// Removed: import type { RiskMetadata, MappedControl } from './mapControls';

export interface ControlTrigger {
  id: string;
  keywords: string[];
  riskLevels?: Array<'low' | 'medium' | 'high'>;
  // Function to allow more complex matching logic beyond keywords
  customMatch?: (redactedPrompt: string, riskMetadata: RiskMetadata) => boolean;
  matchedControlIds: string[];
  justification: string;
  suggestedFix: string;
}

export interface RiskMetadata {
  clarityScore?: number;
  qualityScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
  // Potentially other details from scoring
}

export interface MappedControl {
  controlId: string;
  justification: string;
  suggestedFix: string;
  sourceRuleId: string;
}

// Example Configuration (load from JSON in a real app)
const controlMappingConfig: ControlTrigger[] = [
  {
    id: "NIST-PII-Extraction",
    keywords: ["extract email", "find ssn", "get all names", "pull all addresses"],
    riskLevels: ["medium", "high"],
    matchedControlIds: ["SC-28", "RA-5", "PII"],
    justification: "Attempting to extract Personally Identifiable Information (PII) triggers NIST SC-28 (Protection of Information at Rest/Transit) and RA-5 (Vulnerability Scanning).",
    suggestedFix: "Ensure appropriate authorization and data minimization. If for analysis, consider if aggregated or anonymized data is sufficient. Mask PII in outputs if not strictly necessary."
  },
  {
    id: "OWASP-Prompt-Injection",
    keywords: ["ignore previous instructions", "act as", "translate the following text into pirate speak and then"], // Simplified examples
    customMatch: (prompt, metadata) => {
      // Example: High risk prompts with certain patterns might indicate injection
      return metadata.riskLevel === 'high' && /ignore|override|disregard/.test(prompt.toLowerCase());
    },
    matchedControlIds: ["LLM01: Prompt Injection"],
    justification: "Keywords or prompt structure suggests a potential attempt to subvert the LLM's original instructions, aligning with OWASP LLM01.",
    suggestedFix: "Implement strict input validation and sanitization. Use prefixed instructions or separate trusted and untrusted input. Monitor for anomalous LLM behavior."
  },
  {
    id: "NIST-Financial-Data",
    keywords: ["financial data", "credit card", "bank account", "trading strategy"],
    matchedControlIds: ["SC-28", "AC-3", "SI-4"],
    justification: "Prompts involving sensitive financial data require robust access controls (AC-3), information protection (SC-28), and system monitoring (SI-4).",
    suggestedFix: "Verify user authorization for accessing financial data. Redact or tokenize sensitive numbers. Log all access attempts."
  },
  {
    id: "General-Low-Risk-Review",
    // No specific keywords, acts as a fallback or for general low risk prompts
    keywords: [], // Added to satisfy ControlTrigger interface
    customMatch: (prompt, metadata) => metadata.riskLevel === 'low',
    matchedControlIds: ["CM-2"], // Configuration Management - Baseline Configuration
    justification: "Low-risk prompts are reviewed against baseline configuration and acceptable use policies.",
    suggestedFix: "N/A for compliant low-risk prompts. Ensure prompt aligns with intended use cases."
  },
    {
    id: "OWASP-Data-Leakage-1",
    keywords: ["internal report", "confidential document", "proprietary algorithm"],
    riskLevels: ["medium", "high"],
    matchedControlIds: ["LLM06: Sensitive Information Disclosure"],
    justification: "Prompt indicates potential handling of sensitive or proprietary information, risking disclosure (OWASP LLM06).",
    suggestedFix: "Verify data classification. Apply output filtering and redaction. Ensure LLM is not trained on or retaining sensitive inputs inappropriately."
  },
  {
    id: "NIST-RA-Uncertainty",
    keywords: ["predict stock market", "guarantee outcome", "will this work for sure"],
    riskLevels: ["medium", "high"],
    customMatch: (prompt, metadata) => {
        // If a prompt asks for certainty and is not low risk
        return metadata.riskLevel !== 'low' && (prompt.includes("guarantee") || prompt.includes("100%") || prompt.includes("certain"));
    },
    matchedControlIds: ["RA-3", "RA-10"], // Risk Assessment, Threat Assessment
    justification: "Prompts seeking guarantees or high certainty from LLM outputs relate to NIST RA-3 (Risk Assessment) and RA-10 (Threat Likelihood), highlighting the need to manage expectations about LLM capabilities and potential for misinformation.",
    suggestedFix: "Educate users on LLM limitations. Frame LLM responses as suggestions, not guarantees. Implement human oversight for critical decisions based on LLM output."
  }
];

export function mapControls(
  redactedPrompt: string,
  riskMetadata: RiskMetadata
): MappedControl[] {
  const matched: MappedControl[] = [];
  const lowerCasePrompt = redactedPrompt.toLowerCase();

  controlMappingConfig.forEach(rule => {
    let isMatch = false;

    // Check risk level if specified
    if (rule.riskLevels && !rule.riskLevels.includes(riskMetadata.riskLevel)) {
      return; // Skip rule if risk level doesn't match
    }

    // Check keywords
    if (rule.keywords && rule.keywords.some(keyword => lowerCasePrompt.includes(keyword.toLowerCase()))) {
      isMatch = true;
    }

    // Check custom logic if keywords didn't match (or to augment keyword match)
    if (!isMatch && rule.customMatch) {
      if (rule.customMatch(redactedPrompt, riskMetadata)) {
        isMatch = true;
      }
    }
    
    // If keyword matched, but there's also custom logic, it might need to pass both
    // This depends on desired rule behavior, for now, OR logic is used: keyword OR customMatch

    if (isMatch) {
      rule.matchedControlIds.forEach(controlId => {
        // Avoid duplicate control IDs from different rules if desired, though here we add all
        matched.push({
          controlId,
          justification: rule.justification,
          suggestedFix: rule.suggestedFix,
          sourceRuleId: rule.id
        });
      });
    }
  });

  // Deduplicate based on controlId, keeping the first justification/fix found (or merge them)
  const uniqueMatched: MappedControl[] = [];
  const seenControlIds = new Set<string>();
  for (const m of matched) {
    if (!seenControlIds.has(m.controlId)) {
      uniqueMatched.push(m);
      seenControlIds.add(m.controlId);
    }
  }

  return uniqueMatched;
}

// OpenRouter API integration for LLM-based control mapping
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "perplexity/sonar-pro";

/**
 * Calls OpenRouter LLM to map a prompt to NIST, OWASP, ISO/IEC controls.
 * Returns an array of MappedControl objects.
 */
export async function mapControlsLLM(
  redactedPrompt: string,
  riskMetadata: RiskMetadata
): Promise<MappedControl[] | null> {
  const systemPrompt = `You are an AI security and compliance expert. Given a redacted LLM prompt and its risk metadata, map it to relevant control IDs from NIST AI RMF, OWASP LLM Top 10, and ISO/IEC 42001. For each match, return: controlId, justification, suggestedFix, and the source framework. Return as a JSON array of objects.`;
  const userPrompt = `Prompt: ${redactedPrompt}\nRisk Metadata: ${JSON.stringify(riskMetadata, null, 2)}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 512,
        temperature: 0.2
      })
    });
    const data = await response.json();
    // Expecting the LLM to return a JSON array in the first message content
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    // Try to parse the JSON array from the LLM response
    const controls = JSON.parse(content);
    // Optionally validate/normalize the controls array
    if (Array.isArray(controls)) {
      return controls.map((c: any) => ({
        controlId: c.controlId || c.id || '',
        justification: c.justification || '',
        suggestedFix: c.suggestedFix || '',
        sourceRuleId: c.sourceFramework || c.sourceRuleId || ''
      }));
    }
    return null;
  } catch (err) {
    console.error('OpenRouter LLM control mapping failed:', err);
    return null;
  }
}

/**
 * Calls OpenRouter LLM to score a prompt for clarity, quality, risk, and suggestions.
 * Returns { clarityScore, qualityScore, riskLevel, suggestions }
 */
export async function scorePromptLLM(redactedPrompt: string): Promise<{
  clarityScore: number;
  qualityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
} | null> {
  const systemPrompt = `You are an expert prompt evaluator. Given the following LLM prompt, return a JSON object with:
- clarityScore (0-100)
- qualityScore (0-100)
- riskLevel (low, medium, high)
- suggestions (array of strings to improve the prompt)`;
  const userPrompt = `Prompt: ${redactedPrompt}`;
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 256,
        temperature: 0.2
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const result = JSON.parse(content);
    if (
      typeof result.clarityScore === 'number' &&
      typeof result.qualityScore === 'number' &&
      typeof result.riskLevel === 'string' &&
      Array.isArray(result.suggestions)
    ) {
      return result;
    }
    return null;
  } catch (err) {
    console.error('OpenRouter LLM prompt scoring failed:', err);
    return null;
  }
} 