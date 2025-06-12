import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveRedact, RedactionResult } from '@/lib/redactUtils';
import { supabase } from '@/lib/supabaseClient';

interface IngestRequestBody {
  prompt: string;
  platform?: string;
  url?: string;
  timestamp?: string;
  userId?: string;
  projectId?: string;
  source?: string;
  status?: 'pending' | 'flagged' | 'blocked' | 'approved';
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  analysis_metadata?: Record<string, any>;
}

async function getUserFromRequest(request: NextRequest): Promise<{ userId: string; projectId: string } | null> {
  try {
    // Try to get user from authorization header
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        // Get user's default project
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        
        if (project && !projectError) {
          return { userId: user.id, projectId: project.id };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IngestRequestBody;
    const { prompt, platform, url, timestamp, source, status, risk_level, analysis_metadata } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing required field: prompt' }, { status: 400 });
    }

    // Get user information
    let userId = body.userId;
    let projectId = body.projectId;

    // If not provided in body, try to get from auth header
    if (!userId || !projectId) {
      const userInfo = await getUserFromRequest(req);
      if (!userInfo) {
        return NextResponse.json({ 
          error: 'Authentication required. Please provide userId and projectId or valid authorization header.' 
        }, { status: 401 });
      }
      userId = userInfo.userId;
      projectId = userInfo.projectId;
    }

    // Verify user and project exist
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userExists) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { data: projectExists, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !projectExists) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify user owns the project
    if (projectExists.user_id !== userId) {
      return NextResponse.json({ error: 'User does not have access to this project' }, { status: 403 });
    }

    // 1. Run redaction
    const redactionOutput: RedactionResult = await comprehensiveRedact(prompt);

    // 2. Determine final status and risk level
    const finalStatus = status || 'pending';
    const finalRiskLevel = risk_level || (redactionOutput.redactionDetails.length > 0 ? 'medium' : 'low');

    // 3. Log to Supabase (prompt_events table)
    const logEntry = {
      prompt_text: prompt,
      user_id: userId,
      model: analysis_metadata?.model || 'unknown',
      usd_cost: analysis_metadata?.usd_cost || 0.001, // Default minimal cost
      prompt_tokens: analysis_metadata?.prompt_tokens || Math.ceil(prompt.length / 4),
      completion_tokens: analysis_metadata?.completion_tokens || 0,
      integrity_score: analysis_metadata?.integrity_score || 75,
      risk_type: analysis_metadata?.risk_type || 'pii',
      risk_level: finalRiskLevel,
      status: finalStatus,
      platform: platform || null,
      url: url || null,
      captured_at: timestamp || new Date().toISOString(),
      metadata: {
        source: source || 'api',
        ingested_at: timestamp || new Date().toISOString(),
        redaction_count: redactionOutput.redactionDetails.length,
        redacted_prompt: redactionOutput.redactedText,
        redaction_details: redactionOutput.redactionDetails,
        mapped_controls: analysis_metadata?.mapped_controls || [],
        ...(analysis_metadata || {})
      }
    };

    const { data: loggedPrompt, error: dbError } = await supabase
      .from('prompt_events')
      .insert(logEntry)
      .select()
      .single();

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to log prompt', 
        details: dbError.message 
      }, { status: 500 });
    }

    // 4. Return response with final status
    return NextResponse.json({
      message: 'Prompt ingested successfully',
      logId: loggedPrompt.id,
      redactedPrompt: redactionOutput.redactedText,
      piiDetected: redactionOutput.redactionDetails.map(detail => detail.type),
      redactionCount: redactionOutput.redactionDetails.length,
      status: finalStatus,
      risk_level: finalRiskLevel
    }, { status: 201 });

  } catch (error: any) {
    console.error('Ingest endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 