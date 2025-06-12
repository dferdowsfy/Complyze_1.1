import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptPromptText, getPromptPreview, isEncrypted } from '@/lib/encryption';

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
        risk_level,
        risk_type,
        metadata,
        captured_at,
        model,
        source,
        integrity_score,
        platform,
        url,
        status,
        llm_provider,
        category,
        subcategory,
        framework_tags,
        pii_types,
        compliance_score
      `)
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
      // Use framework_tags column if available, otherwise extract from metadata
      const controlFamilies = new Set<string>();
      
      // Priority 1: Use the new framework_tags column
      if (prompt.framework_tags && Array.isArray(prompt.framework_tags)) {
        prompt.framework_tags.forEach(tag => controlFamilies.add(tag));
      } 
      // Fallback: Extract from metadata (for backward compatibility)
      else if (prompt.metadata?.mapped_controls && Array.isArray(prompt.metadata.mapped_controls)) {
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

      // Use pii_types column if available, otherwise extract from metadata
      const piiTypes = new Set<string>();
      
      // Priority 1: Use the new pii_types column
      if (prompt.pii_types && Array.isArray(prompt.pii_types)) {
        prompt.pii_types.forEach(type => piiTypes.add(type.toUpperCase()));
      }
      // Fallback: Extract from metadata (for backward compatibility)
      else if (prompt.metadata?.detected_pii && Array.isArray(prompt.metadata.detected_pii)) {
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

      // Create summary from prompt text with decryption
      let summary = 'No prompt text available';
      if (prompt.prompt_text) {
        try {
          // Check if the prompt text is encrypted
          if (isEncrypted(prompt.prompt_text)) {
            // Use safe preview function for encrypted content
            summary = getPromptPreview(prompt.prompt_text, 80);
          } else {
            // Handle plain text (for backward compatibility)
            summary = prompt.prompt_text.length > 80 
              ? prompt.prompt_text.substring(0, 80) + '...'
              : prompt.prompt_text;
          }
        } catch (error) {
          console.error('Error processing prompt text:', error);
          summary = 'Encrypted prompt (preview unavailable)';
        }
      }

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
        status: prompt.status || 'flagged', // Use status column if available
        platform: prompt.platform || prompt.metadata?.platform || prompt.source || 'unknown',
        url: prompt.url || prompt.metadata?.url || 'unknown',
        piiTypes: Array.from(piiTypes),
        mappedControls: prompt.metadata?.mapped_controls || [],
        detectionTime: prompt.captured_at,
        // Include new categorization fields
        llmProvider: prompt.llm_provider,
        category: prompt.category,
        subcategory: prompt.subcategory,
        complianceScore: prompt.compliance_score
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