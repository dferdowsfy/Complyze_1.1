import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { MappedControl } from '@/lib/mapControls'; // Assuming MappedControl is defined here or elsewhere

interface FinalizeRequestBody {
  promptId: string;
  scores: {
    clarity: number;
    quality: number;
  };
  risk: 'low' | 'medium' | 'high';
  mappedControls: MappedControl[];
  status: 'approved' | 'flagged' | 'blocked';
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

    if (!promptId || !scores || !risk || !mappedControls || !status) {
      return NextResponse.json({ error: 'Missing required fields for finalization' }, { status: 400 });
    }

    // Construct the metadata object for JSONB storage
    // This ensures all governance tagging and relevant info is in one structured field
    const metadataPayload = {
      clarity_score: scores.clarity,
      quality_score: scores.quality,
      risk_level: risk,
      mapped_controls: mappedControls,
      suggestions: suggestions || [], // Default to empty array if not provided
      finalized_at: new Date().toISOString(),
      ...(additionalMetadata || {}), // Spread any other custom metadata
    };

    const updateData = {
      status: status,
      metadata: metadataPayload, // Store all detailed info in a JSONB field
      // Potentially update top-level fields like risk_level or scores if needed for easier querying
      // risk_level: risk, 
      // clarity_score: scores.clarity,
      // quality_score: scores.quality,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedLog, error: dbError } = await supabase
      .from('PromptLog')
      .update(updateData)
      .eq('id', promptId)
      .select(); // To get the updated record back

    if (dbError) {
      console.error('Supabase error during finalization:', dbError);
      return NextResponse.json({ error: 'Failed to finalize prompt log', details: (dbError as any).message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Prompt finalized successfully',
      updatedLogId: promptId,
      finalStatus: status,
      updatedRecord: updatedLog ? updatedLog[0] : null // If select() was used after update
    }, { status: 200 });

  } catch (error: any) {
    console.error('Finalize endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during finalization', details: error.message }, { status: 500 });
  }
} 