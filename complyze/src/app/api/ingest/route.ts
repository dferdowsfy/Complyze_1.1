import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

interface PromptEventBody {
  user_id: string;
  model: string;
  usd_cost: number;
  prompt_tokens: number;
  completion_tokens: number;
  integrity_score: number; // 0-100
  risk_type: string; // PII, IP, Compliance, etc.
  risk_level: 'low' | 'medium' | 'high';
  captured_at?: string; // ISO timestamp
  prompt_text?: string; // Optional for cost analysis
  response_text?: string; // Optional for analysis
  source?: 'chrome_extension' | 'desktop_agent' | 'api';
  metadata?: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PromptEventBody;
    const {
      user_id,
      model,
      usd_cost,
      prompt_tokens,
      completion_tokens,
      integrity_score,
      risk_type,
      risk_level,
      captured_at,
      prompt_text,
      response_text,
      source,
      metadata
    } = body;

    // Validate required fields
    if (!user_id || !model || usd_cost === undefined || !prompt_tokens || !completion_tokens || 
        integrity_score === undefined || !risk_type || !risk_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: user_id, model, usd_cost, prompt_tokens, completion_tokens, integrity_score, risk_type, risk_level' 
      }, { status: 400 });
    }

    // Validate ranges
    if (integrity_score < 0 || integrity_score > 100) {
      return NextResponse.json({ 
        error: 'integrity_score must be between 0 and 100' 
      }, { status: 400 });
    }

    if (!['low', 'medium', 'high'].includes(risk_level)) {
      return NextResponse.json({ 
        error: 'risk_level must be one of: low, medium, high' 
      }, { status: 400 });
    }

    // Create prompt event entry
    const promptEvent = {
      user_id,
      model,
      usd_cost: parseFloat(usd_cost.toFixed(4)), // Ensure precision
      prompt_tokens: parseInt(prompt_tokens.toString()),
      completion_tokens: parseInt(completion_tokens.toString()),
      integrity_score: parseInt(integrity_score.toString()),
      risk_type,
      risk_level,
      captured_at: captured_at || new Date().toISOString(),
      prompt_text: prompt_text || null,
      response_text: response_text || null,
      source: source || 'api',
      metadata: metadata || {}
    };

    // Insert into prompt_events table
    const { data: insertedEvent, error: dbError } = await supabase
      .from('prompt_events')
      .insert(promptEvent)
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error inserting prompt event:', dbError);
      return NextResponse.json({ 
        error: 'Failed to store prompt event', 
        details: dbError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Prompt event ingested successfully',
      event_id: insertedEvent.id,
      total_cost: usd_cost,
      total_tokens: prompt_tokens + completion_tokens,
      risk_assessment: {
        risk_type,
        risk_level,
        integrity_score
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Ingest endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 