import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for flagged prompts
    let query = supabase
      .from('prompt_logs')
      .select(`
        id,
        original_prompt,
        platform,
        url,
        risk_level,
        mapped_controls,
        redaction_details,
        metadata,
        created_at,
        status
      `)
      .in('status', ['flagged', 'blocked'])
      .order('created_at', { ascending: false })
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
      // Extract control families from mapped_controls
      const controlFamilies = new Set<string>();
      if (prompt.mapped_controls && Array.isArray(prompt.mapped_controls)) {
        prompt.mapped_controls.forEach((control: any) => {
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

      // Extract PII types from redaction details
      const piiTypes = new Set<string>();
      if (prompt.redaction_details && Array.isArray(prompt.redaction_details)) {
        prompt.redaction_details.forEach((redaction: any) => {
          if (redaction.type) {
            piiTypes.add(redaction.type.toUpperCase());
          }
        });
      }

      // Create summary from original prompt (first 80 characters)
      const summary = prompt.original_prompt.length > 80 
        ? prompt.original_prompt.substring(0, 80) + '...'
        : prompt.original_prompt;

      // Format date
      const date = new Date(prompt.created_at);
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
        status: prompt.status,
        platform: prompt.platform,
        url: prompt.url,
        piiTypes: Array.from(piiTypes),
        mappedControls: prompt.mapped_controls || [],
        detectionTime: prompt.created_at
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