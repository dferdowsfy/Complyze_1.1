// Prompt Enhancer for Complyze Desktop Agent
// Based on existing optimize prompt logic from the web app

export interface PromptEnhancementResult {
  originalPrompt: string;
  enhancedPrompt: string;
  clarityScore: number;
  qualityScore: number;
  improvements: string[];
}

/**
 * Enhances prompts using Anthropic and OpenAI best practices
 */
export async function enhancePrompt(prompt: string): Promise<PromptEnhancementResult> {
  console.log('Complyze: Enhancing prompt based on best practices:', prompt.substring(0, 100) + '...');
  
  let enhanced = prompt;
  const improvements: string[] = [];
  
  // 1. Clear structure with sections for longer prompts
  if (enhanced.length > 200) {
    enhanced = addPromptStructure(enhanced);
    improvements.push('Added clear structure and sections');
  }

  // 2. Remove redundant phrases
  const redundantPhrases = [
    /\b(?:please|kindly|if you could|would you mind)\b/gi,
    /\b(?:as an AI|as a language model|I understand that you are)\b/gi
  ];
  
  redundantPhrases.forEach(pattern => {
    if (pattern.test(enhanced)) {
      enhanced = enhanced.replace(pattern, '');
      improvements.push('Removed redundant phrases');
    }
  });

  // 3. Improve clarity and specificity
  const clarityReplacements = [
    { from: /\bthing\b/gi, to: 'item', desc: 'Replaced vague "thing" with "item"' },
    { from: /\bstuff\b/gi, to: 'content', desc: 'Replaced vague "stuff" with "content"' },
    { from: /\bdo this\b/gi, to: 'complete this task', desc: 'Made instructions more specific' }
  ];

  clarityReplacements.forEach(replacement => {
    if (replacement.from.test(enhanced)) {
      enhanced = enhanced.replace(replacement.from, replacement.to);
      improvements.push(replacement.desc);
    }
  });

  // 4. Ensure proper formatting
  enhanced = enhanced.trim();
  enhanced = enhanced.replace(/\s+/g, ' '); // Multiple spaces to single space
  enhanced = enhanced.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double

  // 5. Add context markers for complex requests
  if (enhanced.length > 300 && !enhanced.includes('Context:') && !enhanced.includes('Task:')) {
    enhanced = addContextMarkers(enhanced);
    improvements.push('Added context markers for better structure');
  }

  // Calculate scores
  const scores = calculatePromptScores(enhanced);

  return {
    originalPrompt: prompt,
    enhancedPrompt: enhanced,
    clarityScore: scores.clarityScore,
    qualityScore: scores.qualityScore,
    improvements
  };
}

function addPromptStructure(prompt: string): string {
  // Simple structure addition for long prompts
  if (prompt.includes('?')) {
    const parts = prompt.split('?');
    if (parts.length > 1) {
      return `Task: ${parts[0]}?\n\nContext: ${parts.slice(1).join('?')}`;
    }
  }
  
  return `Task: ${prompt.split('.')[0]}.\n\nDetails: ${prompt.split('.').slice(1).join('.')}`;
}

function addContextMarkers(prompt: string): string {
  const sentences = prompt.split('.');
  if (sentences.length > 2) {
    const task = sentences[0] + '.';
    const context = sentences.slice(1).join('.').trim();
    return `Task: ${task}\n\nContext: ${context}`;
  }
  return prompt;
}

/**
 * Calculate prompt quality scores
 */
function calculatePromptScores(prompt: string): { clarityScore: number; qualityScore: number } {
  let clarityScore = 80;
  let qualityScore = 75;

  // Length checks
  if (prompt.length < 10) qualityScore -= 20;
  if (prompt.length > 200) qualityScore -= 10;
  
  // Word count checks
  const wordCount = prompt.split(' ').length;
  if (wordCount < 3) clarityScore -= 30;
  
  // Structure checks
  if (!prompt.includes('?') && prompt.toLowerCase().startsWith('what')) {
    clarityScore += 5;
  }
  
  // Specific instruction checks
  if (prompt.includes('step by step') || prompt.includes('detailed')) {
    qualityScore += 10;
  }
  
  // Redaction penalty
  if (prompt.includes('[REDACTED_')) {
    qualityScore -= 5;
  }
  
  // Clarity indicators
  if (prompt.includes('specifically') || prompt.includes('exactly')) {
    clarityScore += 5;
  }
  
  // Vague language penalty
  const vagueWords = ['thing', 'stuff', 'something', 'anything'];
  vagueWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) {
      clarityScore -= 5;
    }
  });

  return {
    clarityScore: Math.max(0, Math.min(100, clarityScore)),
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
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
  
  if (!prompt.includes('?') && !prompt.includes('.')) {
    suggestions.push('Add punctuation for better clarity');
  }
  
  if (prompt.toLowerCase().includes('help me')) {
    suggestions.push('Be more specific about what kind of help you need');
  }
  
  const vagueWords = ['thing', 'stuff', 'something'];
  vagueWords.forEach(word => {
    if (prompt.toLowerCase().includes(word)) {
      suggestions.push(`Replace "${word}" with more specific terms`);
    }
  });
  
  if (prompt.length > 500) {
    suggestions.push('Consider breaking this into multiple, focused requests');
  }
  
  return suggestions;
} 