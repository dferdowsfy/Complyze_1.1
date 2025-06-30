import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptText } from '@/lib/encryption'; // Import the decryptText function

export async function GET(req: NextRequest) {
  try {
    const { data: promptEvents, error } = await supabase
      .from('prompt_events')
      .select(`
        id,
        user_id,
        captured_at,
        prompt_text,
        risk_level,
        framework_tags,
        pii_types,
        metadata
      `)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt events for report:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompt data for report', details: error.message },
        { status: 500 }
      );
    }

    if (!promptEvents || promptEvents.length === 0) {
      return NextResponse.json({ reportData: [] });
    }

    const reportData = promptEvents.map(event => {
      const originalPrompt = decryptText(event.prompt_text || '');
      const smartRewrite = event.metadata?.redacted_prompt || null; // Assuming redacted_prompt is the smart rewrite if available

      // Type of data redacted
      const redactedDataTypes = new Set<string>();
      if (event.pii_types && event.pii_types.length > 0) {
        event.pii_types.forEach((type: string) => redactedDataTypes.add(type.toUpperCase()));
      }
      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        if (event.metadata?.redaction_details && Array.isArray(event.metadata.redaction_details)) {
          event.metadata.redaction_details.forEach((detail: any) => {
            if (detail.type) redactedDataTypes.add(detail.type.toUpperCase());
          });
        }
      }

      return {
        id: event.id,
        original_redacted_prompt: originalPrompt,
        risk_level: event.risk_level,
        type_of_data_redacted: Array.from(redactedDataTypes).join(', ') || 'N/A',
        framework_tags: event.framework_tags || [],
        smart_rewrite: smartRewrite,
        timestamp: event.captured_at,
        user_id: event.user_id,
        browser_app_context: event.metadata?.source || event.metadata?.platform || 'N/A',
      };
    });

    return NextResponse.json({ reportData });

  } catch (error: any) {
    console.error('API error generating prompt risk assessment report:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 