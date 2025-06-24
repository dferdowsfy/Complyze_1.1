import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptText } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promptId, userId } = body;

    if (!promptId || !userId) {
      return NextResponse.json({ 
        error: 'Prompt ID and User ID are required' 
      }, { status: 400 });
    }

    console.log('Decrypt request for prompt:', promptId, 'by user:', userId);

    // First, verify the user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan, role')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user has admin privileges (admin role or enterprise plan)
    const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.plan === 'enterprise';
    if (!isAdmin) {
      console.log('Access denied - user role:', user.role, 'plan:', user.plan);
      return NextResponse.json({ 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 });
    }

    // Fetch the prompt from the database
    const { data: prompt, error: promptError } = await supabase
      .from('prompt_events')
      .select(`
        id,
        prompt_text,
        platform,
        risk_level,
        risk_type,
        pii_types,
        captured_at
      `)
      .eq('id', promptId)
      .single();

    if (promptError) {
      console.error('Error fetching prompt:', promptError);
      return NextResponse.json({ 
        error: 'Prompt not found' 
      }, { status: 404 });
    }

    // Decrypt the prompt text
    let decryptedText = 'No prompt text available';
    try {
      if (prompt.prompt_text) {
        decryptedText = decryptText(prompt.prompt_text);
      }
    } catch (decryptError) {
      console.error('Error decrypting prompt:', decryptError);
      decryptedText = 'Error decrypting prompt';
    }

    console.log('Prompt decrypted successfully for admin user');

    return NextResponse.json({
      success: true,
      promptId: prompt.id,
      decryptedText,
      metadata: {
        platform: prompt.platform,
        riskLevel: prompt.risk_level,
        riskType: prompt.risk_type,
        piiTypes: prompt.pii_types || [],
        capturedAt: prompt.captured_at
      }
    });

  } catch (error: any) {
    console.error('Decrypt endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 