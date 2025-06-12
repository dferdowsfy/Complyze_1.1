import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { createSafePreview } from '@/lib/encryption';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for ALL prompts from prompt_events table with enhanced fields
    let query = supabase
      .from('prompt_events')
      .select(`
        id,
        prompt_text,
        model,
        llm_provider,
        platform,
        url,
        risk_level,
        risk_type,
        category,
        subcategory,
        framework_tags,
        pii_types,
        compliance_score,
        integrity_score,
        metadata,
        created_at,
        captured_at,
        status
      `)
      .in('status', ['flagged', 'blocked'])
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: flaggedPrompts, error: dbError } = await query;

    if (dbError) {
      console.error('Supabase error fetching flagged prompts:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch flagged prompts', 
        details: dbError.message 
      }, { status: 500 });
    }

    // Transform data for frontend using enhanced prompt_events schema
    const transformedPrompts = flaggedPrompts?.map(prompt => {
      // Use the framework_tags field directly from prompt_events
      const frameworks = prompt.framework_tags || [];

      // Use the pii_types field directly from prompt_events
      const piiTypes = prompt.pii_types || [];

      // Create summary from prompt_text (decrypt first, then truncate)
      const decryptedText = createSafePreview(prompt.prompt_text || '', 80);
      const summary = decryptedText || 'No prompt text available';

      // Format date using captured_at or created_at
      const date = new Date(prompt.captured_at || prompt.created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      let dateString;
      if (diffHours < 1) {
        dateString = 'just now';
      } else if (diffHours < 24) {
        dateString = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        dateString = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        dateString = date.toLocaleDateString();
      }

      // Extract mapped controls from metadata if available
      const mappedControls = prompt.metadata?.mapped_controls || [];

      return {
        id: prompt.id,
        summary,
        frameworks: frameworks,
        date: dateString,
        risk: prompt.risk_level === 'critical' ? 'Critical' :
              prompt.risk_level === 'high' ? 'High' : 
              prompt.risk_level === 'medium' ? 'Medium' : 'Low',
        status: prompt.status,
        platform: prompt.platform,
        url: prompt.url,
        piiTypes: piiTypes,
        mappedControls: mappedControls,
        detectionTime: prompt.captured_at || prompt.created_at,
        category: prompt.category,
        subcategory: prompt.subcategory,
        riskType: prompt.risk_type,
        llmProvider: prompt.llm_provider,
        model: prompt.model,
        complianceScore: prompt.compliance_score,
        integrityScore: prompt.integrity_score
      };
    }) || [];

    return NextResponse.json({
      success: true,
      prompts: transformedPrompts,
      total: transformedPrompts.length
    });

  } catch (error: any) {
    console.error('Flagged prompts endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 