import { NextRequest, NextResponse } from 'next/server';
import { comprehensiveRedact, RedactionResult } from '@/lib/redactUtils';
import { supabase } from '@/lib/supabaseClient';

interface IngestRequestBody {
  prompt: string;
  userId: string;
  projectId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as IngestRequestBody;
    const { prompt, userId, projectId } = body;

    if (!prompt || !userId || !projectId) {
      return NextResponse.json({ error: 'Missing required fields: prompt, userId, projectId' }, { status: 400 });
    }

    // 1. Run redaction
    const redactionOutput: RedactionResult = await comprehensiveRedact(prompt);

    // 2. Log to Supabase (PromptLog table)
    const logEntry = {
      original_prompt: prompt,
      redacted_prompt: redactionOutput.redactedText,
      user_id: userId,
      project_id: projectId,
      redaction_details: redactionOutput.redactionDetails, // Store details of what was redacted
      status: 'pending', // Initial status
      created_at: new Date().toISOString(),
      // Other fields like request_ip, user_agent could be added here
    };

    const { data: loggedPrompt, error: dbError } = await supabase
      .from('PromptLog')
      .insert(logEntry)
      .select() // Optionally get the inserted row back, useful for returning the ID
      ;

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: 'Failed to log prompt', details: (dbError as any).message }, { status: 500 });
    }

    // 3. Return redacted prompt and pending status
    return NextResponse.json({
      message: 'Prompt ingested successfully',
      redactedPrompt: redactionOutput.redactedText,
      logId: loggedPrompt ? loggedPrompt[0].id : null, // Assuming insert().select() returns the ID
      status: 'pending'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Ingest endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
} 