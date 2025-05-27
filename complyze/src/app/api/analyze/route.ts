import { NextResponse } from 'next/server'
import { comprehensiveRedact } from '@/lib/redactUtils'

// Use OpenRouter API key and endpoint
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function optimizePrompt(prompt: string): Promise<string> {
  // Simple rule-based optimization for now (OpenRouter API has auth issues)
  console.log('Complyze: Using rule-based optimization for prompt:', prompt.substring(0, 100) + '...');
  
  let optimized = prompt;
  
  // Add role context if missing
  if (!prompt.toLowerCase().includes('you are')) {
    if (prompt.toLowerCase().includes('email')) {
      optimized = `You are a professional communication expert. ${optimized}`;
    } else if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('program')) {
      optimized = `You are an experienced software developer. ${optimized}`;
    } else if (prompt.toLowerCase().includes('write') || prompt.toLowerCase().includes('help')) {
      optimized = `You are a helpful writing assistant. ${optimized}`;
    } else {
      optimized = `You are a knowledgeable assistant. ${optimized}`;
    }
  }
  
  // Add clarity instructions
  if (!prompt.toLowerCase().includes('clear') && !prompt.toLowerCase().includes('detailed')) {
    optimized += ' Please provide a clear, detailed response.';
  }
  
  // Add structure guidance for longer requests
  if (prompt.length > 100 && !prompt.toLowerCase().includes('step')) {
    optimized += ' Structure your response with clear steps or sections.';
  }
  
  console.log('Complyze: Optimized prompt:', optimized.substring(0, 150) + '...');
  return optimized;
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
    if (redactionResult.redactionDetails && redactionResult.redactionDetails.length > 0) {
      if (redactionResult.redactionDetails.length >= 3) {
        risk_level = 'high';
      } else if (redactionResult.redactionDetails.length >= 1) {
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
      pii_detected: redactionResult.redactionDetails?.map(detail => detail.type) || []
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