import { NextResponse } from 'next/server'
import { comprehensiveRedact } from '@/lib/redactUtils'

// Use OpenRouter API key and endpoint
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function optimizePrompt(prompt: string): Promise<string> {
  console.log('Complyze: Optimizing prompt based on Anthropic and OpenAI best practices:', prompt.substring(0, 100) + '...');
  
  let optimized = prompt;
  
  // 1. Clear structure with sections for longer prompts
  if (optimized.length > 200) {
    optimized = addPromptStructure(optimized);
  }

  // 2. Remove redundant phrases
  const redundantPhrases = [
    /\b(?:please|kindly|if you could|would you mind)\b/gi,
    /\b(?:as an AI|as a language model|I understand that you are)\b/gi
  ];
  
  redundantPhrases.forEach(pattern => {
    optimized = optimized.replace(pattern, '');
  });

  // 3. Improve clarity and specificity
  optimized = optimized
    .replace(/\bthing\b/gi, 'item')
    .replace(/\bstuff\b/gi, 'content')
    .replace(/\bdo this\b/gi, 'complete this task');

  // 4. Add clear instructions format if missing
  if (!optimized.includes('Task:') && !optimized.includes('Instructions:') && !optimized.includes('You are')) {
    // Add role context based on content
    if (optimized.toLowerCase().includes('email') || optimized.toLowerCase().includes('message')) {
      optimized = `You are a professional communication expert.\n\nTask: ${optimized}`;
    } else if (optimized.toLowerCase().includes('code') || optimized.toLowerCase().includes('program') || optimized.toLowerCase().includes('debug')) {
      optimized = `You are an experienced software developer.\n\nTask: ${optimized}`;
    } else if (optimized.toLowerCase().includes('write') || optimized.toLowerCase().includes('content') || optimized.toLowerCase().includes('article')) {
      optimized = `You are a skilled writing assistant.\n\nTask: ${optimized}`;
    } else if (optimized.toLowerCase().includes('analyze') || optimized.toLowerCase().includes('data') || optimized.toLowerCase().includes('research')) {
      optimized = `You are a thorough analyst.\n\nTask: ${optimized}`;
    } else {
      optimized = `Task: ${optimized}`;
    }
  }

  // 5. Add clarity instructions for better responses
  if (!optimized.toLowerCase().includes('clear') && !optimized.toLowerCase().includes('detailed') && !optimized.toLowerCase().includes('specific')) {
    optimized += '\n\nPlease provide a clear, detailed response with specific examples where relevant.';
  }

  // 6. Add structure guidance for complex requests
  if (optimized.length > 150 && !optimized.toLowerCase().includes('step') && !optimized.toLowerCase().includes('section')) {
    optimized += ' Structure your response with clear sections or steps.';
  }

  // 7. Clean up extra whitespace
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  
  console.log('Complyze: Optimized prompt:', optimized.substring(0, 200) + '...');
  return optimized;
}

// Helper function to add structured format to longer prompts
function addPromptStructure(prompt: string): string {
  // Simple heuristic to add structure
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length > 3) {
    const context = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
    const task = sentences.slice(Math.ceil(sentences.length / 2)).join('. ') + '.';
    
    return `Context: ${context}\n\nTask: ${task}`;
  }
  
  return prompt;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Complyze: Analyzing prompt:', prompt.substring(0, 100) + '...');

    // 1. Redact known PII/sensitive data
    const redactionResult = await comprehensiveRedact(prompt);
    const redacted_prompt = redactionResult.redactedText;
    
    console.log('Complyze: Redaction result:', {
      original_length: prompt.length,
      redacted_length: redacted_prompt.length,
      pii_found: redactionResult.redactionDetails?.length || 0
    });

    // 2. Optimize the redacted prompt
    const optimized_prompt = await optimizePrompt(redacted_prompt);

    // 3. Calculate risk level based on PII detection and content
    let risk_level = 'low';
    let hasCriticalRisk = false;
    let hasHighRisk = false;
    
    if (redactionResult.redactionDetails && redactionResult.redactionDetails.length > 0) {
      // Check for critical risk patterns
      const criticalPatterns = ['ssn', 'creditcard', 'api_key', 'jwtToken', 'oauthSecret', 'sshKey', 'exportControl', 'cui', 'whistleblower', 'credentials'];
      const highRiskPatterns = ['bank_account', 'routing_number', 'drivers_license', 'passport', 'healthInfo', 'internalUrl', 'revenueData', 'financialProjections', 'confidential', 'security', 'legal'];
      
      for (const detail of redactionResult.redactionDetails) {
        if (criticalPatterns.includes(detail.type)) {
          hasCriticalRisk = true;
          hasHighRisk = true;
          break;
        } else if (highRiskPatterns.includes(detail.type)) {
          hasHighRisk = true;
        }
      }
      
      if (hasCriticalRisk) {
        risk_level = 'critical';
      } else if (hasHighRisk) {
        risk_level = 'high';
      } else if (redactionResult.redactionDetails.length >= 2) {
        risk_level = 'medium';
      } else {
        risk_level = 'medium';
      }
    }

    // 4. Calculate clarity score based on prompt characteristics
    let clarity_score = 50; // Base score
    
    // Add points for specificity
    if (prompt.length > 50) clarity_score += 10;
    if (prompt.includes('?')) clarity_score += 10;
    if (prompt.toLowerCase().includes('please') || prompt.toLowerCase().includes('help')) clarity_score += 5;
    
    // Add points for structure
    if (prompt.includes('\n') || prompt.includes('.')) clarity_score += 10;
    
    // Cap at 100
    clarity_score = Math.min(clarity_score, 100);

    // 5. Generate control tags based on content
    const control_tags: string[] = [];
    if (redactionResult.redactionDetails && redactionResult.redactionDetails.length > 0) {
      control_tags.push('GDPR.Art.6', 'NIST.SC-28');
      if (redactionResult.redactionDetails.some((detail) => detail.type.toLowerCase().includes('email'))) {
        control_tags.push('CAN-SPAM.3');
      }
    }

    const result = {
      redacted_prompt,
      optimized_prompt,
      clarity_score,
      risk_level,
      control_tags,
      pii_detected: redactionResult.redactionDetails?.map(detail => detail.type) || [],
      detectedPII: redactionResult.redactionDetails?.map(detail => detail.type) || [], // For extension compatibility
      hasHighRisk: hasHighRisk,
      hasCriticalRisk: hasCriticalRisk
    };

    console.log('Complyze: Analysis complete:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Complyze: Analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to analyze and optimize prompt' },
      { status: 500 }
    );
  }
} 