import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for flagged prompts from prompt_events table
    let query = supabase
      .from('prompt_events')
      .select(`
        id,
        prompt_text,
        risk_level,
        risk_type,
        metadata,
        captured_at,
        model,
        source,
        integrity_score
      `)
      .in('risk_level', ['high', 'medium'])
      .order('captured_at', { ascending: false })
      .limit(limit);

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filter by project if provided  
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: flaggedPrompts, error: dbError } = await query;

    if (dbError) {
      console.error('Supabase error fetching flagged prompts:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch flagged prompts', 
        details: dbError.message 
      }, { status: 500 });
    }

    // Transform data for frontend
    const transformedPrompts = flaggedPrompts?.map(prompt => {
      // Extract control families from metadata
      const controlFamilies = new Set<string>();
      if (prompt.metadata?.mapped_controls && Array.isArray(prompt.metadata.mapped_controls)) {
        prompt.metadata.mapped_controls.forEach((control: any) => {
          if (control.controlId) {
            // Extract framework from control ID (e.g., "NIST-SC-28" -> "NIST")
            const parts = control.controlId.split('-');
            if (parts.length > 1) {
              controlFamilies.add(parts[0]);
            } else if (control.controlId.includes('LLM')) {
              controlFamilies.add('OWASP');
            } else if (control.controlId.includes('PII')) {
              controlFamilies.add('Privacy');
            } else {
              controlFamilies.add(control.controlId);
            }
          }
        });
      }

      // Extract PII types from metadata
      const piiTypes = new Set<string>();
      if (prompt.metadata?.detected_pii && Array.isArray(prompt.metadata.detected_pii)) {
        prompt.metadata.detected_pii.forEach((pii: any) => {
          if (typeof pii === 'string') {
            piiTypes.add(pii.toUpperCase());
          } else if (pii.type) {
            piiTypes.add(pii.type.toUpperCase());
          }
        });
      }

      // Add risk type as a framework if available
      if (prompt.risk_type) {
        controlFamilies.add(prompt.risk_type.toUpperCase());
      }

      // Create summary from prompt text (first 80 characters)
      const summary = prompt.prompt_text && prompt.prompt_text.length > 80 
        ? prompt.prompt_text.substring(0, 80) + '...'
        : prompt.prompt_text || 'No prompt text available';

      // Format date
      const date = new Date(prompt.captured_at);
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

      return {
        id: prompt.id,
        summary,
        frameworks: Array.from(controlFamilies),
        date: dateString,
        risk: prompt.risk_level === 'high' ? 'High' : 
              prompt.risk_level === 'medium' ? 'Medium' : 'Low',
        status: 'flagged', // All entries from prompt_events are considered flagged
        platform: prompt.metadata?.platform || prompt.source || 'unknown',
        url: prompt.metadata?.url || 'unknown',
        piiTypes: Array.from(piiTypes),
        mappedControls: prompt.metadata?.mapped_controls || [],
        detectionTime: prompt.captured_at
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