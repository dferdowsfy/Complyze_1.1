import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { MappedControl } from '@/lib/mapControls'; // Assuming MappedControl is defined here or elsewhere

interface FinalizeRequestBody {
  promptId: string;
  scores?: {
    clarity: number;
    quality: number;
  };
  risk?: 'low' | 'medium' | 'high';
  mappedControls?: MappedControl[];
  status?: 'approved' | 'flagged' | 'blocked';
  suggestions?: string[]; // Optional suggestions
  // Any other metadata to be stored as JSONB
  additionalMetadata?: Record<string, any>; 
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as FinalizeRequestBody;
    const {
      promptId,
      scores,
      risk,
      mappedControls,
      status,
      suggestions,
      additionalMetadata
    } = body;

    if (!promptId) {
      return NextResponse.json({ error: 'Missing required field: promptId' }, { status: 400 });
    }

    // Construct the metadata object for JSONB storage
    // This ensures all governance tagging and relevant info is in one structured field
    const metadataPayload = {
      clarity_score: scores?.clarity || 0,
      quality_score: scores?.quality || 0,
      risk_level: risk || 'medium',
      mapped_controls: mappedControls || [],
      suggestions: suggestions || [], // Default to empty array if not provided
      finalized_at: new Date().toISOString(),
      ...(additionalMetadata || {}), // Spread any other custom metadata
    };

    const updateData = {
      status: status || 'flagged', // Default to flagged if not specified
      risk_level: risk || 'high', // Set risk_level column for easier querying
      mapped_controls: mappedControls || [], // Store mapped controls in dedicated column
      metadata: metadataPayload, // Store all detailed info in a JSONB field
      updated_at: new Date().toISOString(),
    };

    // Fix: Use correct table name 'prompt_logs' instead of 'PromptLog'
    const { data: updatedLog, error: dbError } = await supabase
      .from('prompt_logs')
      .update(updateData)
      .eq('id', promptId)
      .select(); // To get the updated record back

    if (dbError) {
      console.error('Supabase error during finalization:', dbError);
      return NextResponse.json({ error: 'Failed to finalize prompt log', details: (dbError as any).message }, { status: 500 });
    }

    console.log('Complyze: Prompt finalized successfully:', {
      promptId,
      status: status || 'flagged',
      risk: risk || 'high',
      updatedRecord: updatedLog?.[0]
    });

    return NextResponse.json({
      message: 'Prompt finalized successfully',
      updatedLogId: promptId,
      finalStatus: status || 'flagged',
      updatedRecord: updatedLog ? updatedLog[0] : null // If select() was used after update
    }, { status: 200 });

  } catch (error: any) {
    console.error('Finalize endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during finalization', details: error.message }, { status: 500 });
  }
} 