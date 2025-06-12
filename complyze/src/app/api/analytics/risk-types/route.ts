import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get all prompt events with their risk types and metadata
    const { data: prompts, error } = await supabase
      .from('prompt_events')
      .select('risk_type, category, subcategory, pii_types, framework_tags, risk_level, status, metadata')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt events:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch prompt data', 
        details: error.message 
      }, { status: 500 });
    }

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({
        risk_types: {}
      });
    }

    // Count risk types using the new categorization system
    const riskFrequency: Record<string, number> = {};

    prompts.forEach(prompt => {
      // Use the structured category field from prompt_events
      const category = prompt.category || 'Other';
      riskFrequency[category] = (riskFrequency[category] || 0) + 1;

      // Also count by specific PII types if available
      if (prompt.pii_types && Array.isArray(prompt.pii_types)) {
        prompt.pii_types.forEach((piiType: string) => {
          const formattedType = piiType.replace('_', ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize each word
          riskFrequency[formattedType] = (riskFrequency[formattedType] || 0) + 1;
        });
      }

      // Count by risk type for backward compatibility
      if (prompt.risk_type) {
        const riskType = prompt.risk_type.charAt(0).toUpperCase() + prompt.risk_type.slice(1);
        riskFrequency[riskType] = (riskFrequency[riskType] || 0) + 1;
      }
    });

    // If no specific risks found but we have prompts, add some to "Other"
    if (Object.keys(riskFrequency).length === 0 && prompts.length > 0) {
      riskFrequency['Other'] = prompts.length;
    }

    return NextResponse.json({
      risk_types: riskFrequency,
      total_prompts: prompts.length
    });

  } catch (error: any) {
    console.error('Risk types endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 