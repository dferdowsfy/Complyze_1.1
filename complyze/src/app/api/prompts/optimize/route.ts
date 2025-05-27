import { NextRequest, NextResponse } from 'next/server';

// Prompt optimization patterns and best practices
const OPTIMIZATION_PATTERNS = {
  // Role-based prompting
  addRole: (prompt: string) => {
    const roles = {
      analysis: 'You are an expert analyst.',
      writing: 'You are a professional writer.',
      coding: 'You are an experienced software developer.',
      research: 'You are a thorough researcher.',
      creative: 'You are a creative professional.',
      business: 'You are a business consultant.',
      legal: 'You are a legal expert.',
      default: 'You are a helpful assistant.'
    };
    
    const lowerPrompt = prompt.toLowerCase();
    let selectedRole = roles.default;
    
    if (lowerPrompt.includes('analy') || lowerPrompt.includes('evaluat')) {
      selectedRole = roles.analysis;
    } else if (lowerPrompt.includes('writ') || lowerPrompt.includes('draft')) {
      selectedRole = roles.writing;
    } else if (lowerPrompt.includes('cod') || lowerPrompt.includes('program')) {
      selectedRole = roles.coding;
    } else if (lowerPrompt.includes('research') || lowerPrompt.includes('find')) {
      selectedRole = roles.research;
    } else if (lowerPrompt.includes('creat') || lowerPrompt.includes('design')) {
      selectedRole = roles.creative;
    } else if (lowerPrompt.includes('business') || lowerPrompt.includes('strategy')) {
      selectedRole = roles.business;
    } else if (lowerPrompt.includes('legal') || lowerPrompt.includes('contract')) {
      selectedRole = roles.legal;
    }
    
    return `${selectedRole} ${prompt}`;
  },
  
  // Add structure and clarity
  addStructure: (prompt: string) => {
    if (prompt.includes('step') || prompt.includes('process')) {
      return `${prompt}\n\nPlease provide your response in a clear, step-by-step format.`;
    }
    if (prompt.includes('list') || prompt.includes('options')) {
      return `${prompt}\n\nPlease format your response as a numbered or bulleted list.`;
    }
    if (prompt.includes('explain') || prompt.includes('describe')) {
      return `${prompt}\n\nPlease provide a clear explanation with examples where appropriate.`;
    }
    return prompt;
  },
  
  // Add context and constraints
  addContext: (prompt: string) => {
    let enhanced = prompt;
    
    // Add output format guidance
    if (!prompt.includes('format') && !prompt.includes('structure')) {
      enhanced += '\n\nPlease ensure your response is well-structured and easy to understand.';
    }
    
    // Add accuracy emphasis for factual queries
    if (prompt.includes('fact') || prompt.includes('information') || prompt.includes('data')) {
      enhanced += '\n\nPlease provide accurate, up-to-date information and cite sources when possible.';
    }
    
    return enhanced;
  },
  
  // Improve specificity
  improveSpecificity: (prompt: string) => {
    let improved = prompt;
    
    // Replace vague terms with more specific language
    const replacements = {
      'good': 'effective and well-designed',
      'bad': 'problematic or ineffective',
      'nice': 'professional and polished',
      'stuff': 'relevant information',
      'things': 'specific elements',
      'something': 'a specific solution',
      'anything': 'relevant options'
    };
    
    for (const [vague, specific] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${vague}\\b`, 'gi');
      improved = improved.replace(regex, specific);
    }
    
    return improved;
  }
};

function calculatePromptQuality(prompt: string) {
  let score = 5; // Base score
  
  // Length check (optimal range: 50-500 characters)
  if (prompt.length >= 50 && prompt.length <= 500) score += 1;
  if (prompt.length > 500) score -= 1;
  
  // Specificity check
  const specificWords = ['specific', 'detailed', 'comprehensive', 'thorough'];
  if (specificWords.some(word => prompt.toLowerCase().includes(word))) score += 1;
  
  // Structure check
  if (prompt.includes('please') || prompt.includes('step')) score += 1;
  
  // Context check
  if (prompt.includes('format') || prompt.includes('example')) score += 1;
  
  // Vague language penalty
  const vagueWords = ['good', 'bad', 'nice', 'stuff', 'things'];
  const vagueCount = vagueWords.filter(word => prompt.toLowerCase().includes(word)).length;
  score -= vagueCount * 0.5;
  
  return Math.max(1, Math.min(10, Math.round(score)));
}

function calculateClarity(prompt: string) {
  let score = 5; // Base score
  
  // Sentence structure
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = prompt.length / sentences.length;
  
  if (avgSentenceLength >= 10 && avgSentenceLength <= 100) score += 1;
  if (avgSentenceLength > 150) score -= 2;
  
  // Question clarity
  if (prompt.includes('?')) score += 1;
  
  // Clear instructions
  const instructionWords = ['please', 'can you', 'help me', 'explain', 'describe'];
  if (instructionWords.some(word => prompt.toLowerCase().includes(word))) score += 1;
  
  // Ambiguity penalty
  const ambiguousWords = ['maybe', 'perhaps', 'might', 'could be'];
  const ambiguousCount = ambiguousWords.filter(word => prompt.toLowerCase().includes(word)).length;
  score -= ambiguousCount * 0.5;
  
  return Math.max(1, Math.min(10, Math.round(score)));
}

function optimizePrompt(originalPrompt: string) {
  let optimized = originalPrompt.trim();
  
  // Apply optimization patterns in sequence
  optimized = OPTIMIZATION_PATTERNS.improveSpecificity(optimized);
  optimized = OPTIMIZATION_PATTERNS.addRole(optimized);
  optimized = OPTIMIZATION_PATTERNS.addStructure(optimized);
  optimized = OPTIMIZATION_PATTERNS.addContext(optimized);
  
  // Ensure proper capitalization and punctuation
  if (!optimized.endsWith('.') && !optimized.endsWith('?') && !optimized.endsWith('!')) {
    optimized += '.';
  }
  
  // Capitalize first letter
  optimized = optimized.charAt(0).toUpperCase() + optimized.slice(1);
  
  return optimized;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt text is required' },
        { status: 400 }
      );
    }
    
    // Calculate original metrics
    const originalQuality = calculatePromptQuality(prompt);
    const originalClarity = calculateClarity(prompt);
    
    // Optimize the prompt
    const enhancedPrompt = optimizePrompt(prompt);
    
    // Calculate improved metrics
    const improvedQuality = calculatePromptQuality(enhancedPrompt);
    const improvedClarity = calculateClarity(enhancedPrompt);
    
    // Generate optimization suggestions
    const suggestions = [];
    if (originalQuality < 7) suggestions.push('Consider adding more specific details');
    if (originalClarity < 7) suggestions.push('Try breaking down complex requests into steps');
    if (prompt.length < 20) suggestions.push('Provide more context for better results');
    if (!prompt.includes('please') && !prompt.includes('can you')) {
      suggestions.push('Use polite language for better AI cooperation');
    }
    
    const response = {
      original_prompt: prompt,
      enhanced_prompt: enhancedPrompt,
      improvements: {
        quality_score: {
          before: originalQuality,
          after: improvedQuality,
          improvement: improvedQuality - originalQuality
        },
        clarity_score: {
          before: originalClarity,
          after: improvedClarity,
          improvement: improvedClarity - originalClarity
        }
      },
      optimization_applied: enhancedPrompt !== prompt,
      suggestions: suggestions,
      best_practices_used: [
        'Role-based prompting',
        'Structured output guidance',
        'Specificity enhancement',
        'Context addition'
      ],
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to process optimization request' },
      { status: 500 }
    );
  }
} 