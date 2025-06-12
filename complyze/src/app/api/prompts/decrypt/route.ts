import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptText } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promptId, userId } = body;

    if (!promptId || !userId) {
      return NextResponse.json({
        error: 'Missing required fields: promptId and userId'
      }, { status: 400 });
    }

    // Fetch the specific prompt and verify user ownership
    const { data: prompt, error: dbError } = await supabase
      .from('prompt_events')
      .select('id, prompt_text, user_id')
      .eq('id', promptId)
      .eq('user_id', userId) // Ensure user can only decrypt their own prompts
      .single();

    if (dbError || !prompt) {
      console.error('Error fetching prompt for decryption:', dbError);
      return NextResponse.json({
        error: 'Prompt not found or access denied'
      }, { status: 404 });
    }

    // Decrypt the prompt text
    const decryptedText = decryptText(prompt.prompt_text || '');

    // Log the decryption request for audit purposes
    console.log(`Prompt decryption requested: User ${userId}, Prompt ${promptId}`);

    return NextResponse.json({
      success: true,
      promptId: prompt.id,
      decryptedText: decryptedText,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Decryption endpoint error:', error);
    return NextResponse.json({
      error: 'Failed to decrypt prompt',
      details: error.message
    }, { status: 500 });
  }
} 