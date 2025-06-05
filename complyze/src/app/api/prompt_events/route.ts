import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Token estimation for cost calculation
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Cost calculation based on model and tokens
function calculateCost(model: string, tokens: number): number {
  // Cost per 1k tokens (in dollars)
  const costPerThousand: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'gemini-pro': { input: 0.00025, output: 0.0005 },
    'gemini-2.5-pro': { input: 0.00025, output: 0.0005 },
  };

  // Find matching model pricing
  let pricing = costPerThousand['gpt-3.5-turbo']; // default
  for (const [key, value] of Object.entries(costPerThousand)) {
    if (model.toLowerCase().includes(key.toLowerCase()) || 
        key.toLowerCase().includes(model.toLowerCase())) {
      pricing = value;
      break;
    }
  }

  // Calculate cost (assuming input tokens for prompts)
  return (tokens / 1000) * pricing.input;
}

export async function POST(request: Request) {
  try {
    // Get the prompt event data from request body
    const body = await request.json();
    console.log('API: Received prompt event:', {
      hasUserId: !!body.user_id,
      hasOriginalPrompt: !!body.original_prompt,
      hasOptimizedPrompt: !!body.optimized_prompt,
      platform: body.platform,
      riskLevel: body.risk_level
    });

    // Validate required fields
    if (!body.user_id || !body.original_prompt) {
      console.error('API: Missing required fields:', { 
        user_id: body.user_id, 
        hasOriginalPrompt: !!body.original_prompt 
      });
      return NextResponse.json(
        { error: 'Missing required fields: user_id and original_prompt are required' },
        { status: 400 }
      );
    }

    // Calculate token counts and costs
    const originalTokens = estimateTokens(body.original_prompt);
    const optimizedTokens = body.optimized_prompt ? estimateTokens(body.optimized_prompt) : originalTokens;
    const tokensSaved = Math.max(0, originalTokens - optimizedTokens);
    
    // Use the model from the body or default
    const model = body.llm_used || body.model || 'gpt-3.5-turbo';
    const originalCost = calculateCost(model, originalTokens);
    const optimizedCost = calculateCost(model, optimizedTokens);
    const costSaved = originalCost - optimizedCost;

    // Prepare the data for insertion
    const promptEvent = {
      user_id: body.user_id,
      original_prompt: body.original_prompt,
      optimized_prompt: body.optimized_prompt || body.original_prompt,
      timestamp: body.timestamp || new Date().toISOString(),
      risk_level: body.risk_level || 'low',
      sensitivity_score: body.sensitivity_score || 0,
      framework_flags: body.framework_flags || [],
      llm_used: model,
      platform: body.platform || 'unknown',
      flagged: body.flagged || false,
      pii_detected: body.pii_detected || [],
      compliance_frameworks: body.compliance_frameworks || [],
      ai_risk_indicators: body.ai_risk_indicators || [],
      improvements: body.improvements || [],
      // Cost metrics
      original_tokens: originalTokens,
      optimized_tokens: optimizedTokens,
      tokens_saved: tokensSaved,
      original_cost: originalCost,
      optimized_cost: optimizedCost,
      cost_saved: costSaved,
      // Additional metadata
      url: body.url,
      session_id: body.session_id,
      extension_version: body.extension_version || '2.0.0',
    };

    console.log('API: Inserting prompt event with calculated costs:', {
      user_id: promptEvent.user_id,
      platform: promptEvent.platform,
      risk_level: promptEvent.risk_level,
      original_tokens: promptEvent.original_tokens,
      optimized_tokens: promptEvent.optimized_tokens,
      cost_saved: promptEvent.cost_saved
    });

    // Insert into Supabase
    const { data, error } = await supabase
      .from('prompt_events')
      .insert([promptEvent])
      .select()
      .single();

    if (error) {
      console.error('API: Supabase insert error:', error);
      console.error('API: Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Check if it's a foreign key constraint error
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('user_id')) {
        return NextResponse.json(
          { 
            error: 'User not found. Please ensure the user exists in the system.',
            details: 'The user_id provided does not exist in the users table.',
            user_id: body.user_id
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to save prompt event', details: error.message },
        { status: 500 }
      );
    }

    console.log('API: Successfully saved prompt event:', data);

    // Return success response
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Prompt event saved successfully',
      metrics: {
        tokens_saved: tokensSaved,
        cost_saved: costSaved,
        risk_level: promptEvent.risk_level
      }
    });

  } catch (error) {
    console.error('API: Unexpected error in prompt_events endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch prompt events for a user
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('prompt_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    // Add date filters if provided
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API: Error fetching prompt events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt events', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('API: Unexpected error in GET prompt_events:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}