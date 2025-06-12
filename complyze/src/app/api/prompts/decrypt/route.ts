import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptPromptText, isEncrypted } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const { promptId, userId } = await req.json();

    if (!promptId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: promptId and userId' 
      }, { status: 400 });
    }

    // Fetch the specific prompt with user verification
    const { data: prompt, error: dbError } = await supabase
      .from('prompt_events')
      .select('id, prompt_text, user_id')
      .eq('id', promptId)
      .eq('user_id', userId) // Ensure user can only decrypt their own prompts
      .single();

    if (dbError) {
      console.error('Database error fetching prompt for decryption:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch prompt', 
        details: dbError.message 
      }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Prompt not found or access denied' 
      }, { status: 404 });
    }

    // Decrypt the prompt text if it's encrypted
    let decryptedText = prompt.prompt_text || '';
    
    if (prompt.prompt_text && isEncrypted(prompt.prompt_text)) {
      try {
        decryptedText = decryptPromptText(prompt.prompt_text);
        
        if (decryptedText === '[DECRYPTION_FAILED]') {
          return NextResponse.json({ 
            error: 'Failed to decrypt prompt content',
            details: 'Decryption key may be invalid or content corrupted'
          }, { status: 500 });
        }
      } catch (error) {
        console.error('Decryption error:', error);
        return NextResponse.json({ 
          error: 'Decryption failed',
          details: 'Unable to decrypt prompt content'
        }, { status: 500 });
      }
    }

    // Log the decryption access for audit purposes
    console.log(`Prompt decryption accessed: promptId=${promptId}, userId=${userId}, timestamp=${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      promptId: prompt.id,
      decryptedText: decryptedText,
      isEncrypted: isEncrypted(prompt.prompt_text || ''),
      accessTime: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Prompt decryption endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 