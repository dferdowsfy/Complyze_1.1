import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client and data for now
// const mockFullPromptLog = {
//   id: 'test-prompt-123',
//   created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
//   user_id: 'user-abc-789',
//   project_id: 'project-xyz-123',
//   original_prompt: 'Please extract all customer email addresses and their order numbers from the attached sales report for Q4. My email is test@example.com and SSN is 000-00-0000.',
//   redacted_prompt: 'Please extract all customer [REDACTED_EMAIL] and their order numbers from the attached sales report for Q4. My [REDACTED_EMAIL] is [REDACTED_EMAIL] and [REDACTED_SSN] is [REDACTED_SSN].',
//   redaction_details: [
//     { original: 'test@example.com', redacted: '[REDACTED_EMAIL]', type: 'email', startIndex: 90, endIndex: 106 },
//     { original: '000-00-0000', redacted: '[REDACTED_SSN]', type: 'ssn', startIndex: 120, endIndex: 131 },
//   ],
//   status: 'blocked',
//   metadata: {
//     clarity_score: 70,
//     quality_score: 65,
//     risk_level: 'high',
//     mapped_controls: [
//       { controlId: 'SC-28', justification: 'PII Extraction Attempt', suggestedFix: 'Review necessity of PII.', sourceRuleId: 'NIST-PII-Extraction' },
//       { controlId: 'RA-5', justification: 'High risk PII data involved.', suggestedFix: 'Assess data sensitivity.', sourceRuleId: 'NIST-PII-Extraction' },
//       { controlId: 'PII', justification: 'Contains PII (email, SSN)', suggestedFix: 'Mask or remove PII.', sourceRuleId: 'NIST-PII-Extraction' }
//     ],
//     suggestions: ['Consider if specific customer identifiers are needed or if analysis can be done on anonymized data.'],
//     finalized_at: new Date(Date.now() - 1000 * 60 * 58).toISOString(), // 58 minutes ago (2 mins after creation for processing)
//     llm_guard_details: { // Example of LLM guard specific output
//         scan_id: "lg-scan-abc123",
//         threats_detected: ["PII_EXFILTRATION_ATTEMPT"],
//         confidence: 0.95
//     }
//   },
//   updated_at: new Date(Date.now() - 1000 * 60 * 58).toISOString()
// };

// const supabase = {
//   from: (tableName: string) => ({
//     select: (columns = '*') => ({
//       eq: async (field: string, value: any) => {
//         console.log(`Mock Supabase: Selecting ${columns} from ${tableName} where ${field}=${value}`);
//         if (tableName === 'PromptLog' && value === 'test-prompt-123') {
//           await new Promise(resolve => setTimeout(resolve, 50));
//           return { data: [mockFullPromptLog], error: null }; // Return as an array
//         }
//         return { data: [], error: { message: 'Prompt log not found' } };
//       },
//       single: async () => { // If you expect a single unique row by ID
//         console.log(`Mock Supabase: Selecting single row ${columns} from ${tableName}`);
//         // This mock assumes the ID is passed implicitly or not used for single()
//         // A real implementation would use .eq('id', promptId).single()
//         if (tableName === 'PromptLog') { // Simplified for mock
//             await new Promise(resolve => setTimeout(resolve, 50));
//             return { data: mockFullPromptLog, error: null };
//         }
//         return {data: null, error: {message: 'Prompt log not found'}};
//       }
//     })
//   })
// };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json({ error: 'Missing promptId parameter' }, { status: 400 });
    }

    const { data: promptLog, error: dbError } = await supabase
        .from('prompt_logs')
        .select('*') // Select all columns for the full export
        .eq('id', promptId)
        .single(); // Expects a single record or null
    

    if (dbError) {
      console.error('Supabase error fetching prompt log for export:', dbError);
      // Check if it's a "not found" error specifically if needed
      if (dbError.code === 'PGRST116') { // PostgREST error for zero rows with .single()
         return NextResponse.json({ error: 'Prompt log not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch prompt log', details: dbError.message }, { status: 500 });
    }

    if (!promptLog) { // Should be redundant if dbError.code PGRST116 is handled, but good practice
      return NextResponse.json({ error: 'Prompt log not found' }, { status: 404 });
    }
    

    // Format to match NIST SSP-style evidence logs (this is a conceptual mapping)
    // The exact format would depend on specific NIST SSP requirements.
    // This example provides a structured JSON output that includes key details.
    const evidenceRecord = {
      eventId: promptLog.id,
      eventTimestamp: promptLog.created_at,
      eventType: 'LLMPromptInteraction',
      systemComponent: 'ComplyzeAIPlatform',
      userId: promptLog.user_id,
      projectId: promptLog.project_id,
      data: {
        originalPrompt: promptLog.original_prompt,
        redactedPrompt: promptLog.redacted_prompt,
        redactionDetails: promptLog.redaction_details,
        status: promptLog.status,
        scores: {
          clarity: promptLog.metadata?.clarity_score,
          quality: promptLog.metadata?.quality_score,
        },
        riskAssessment: {
          level: promptLog.metadata?.risk_level,
          // Evidence for risk could be more detailed if LLMGuard provides it
        },
        controlsTriggered: promptLog.metadata?.mapped_controls?.map((mc: { controlId: string; justification: string; suggestedFix: string; sourceRuleId: string }) => ({
          controlId: mc.controlId,
          justification: mc.justification,
          suggestedFix: mc.suggestedFix,
          sourceRule: mc.sourceRuleId
        })),
        suggestionsForUser: promptLog.metadata?.suggestions,
        additionalProcessingDetails: promptLog.metadata?.llm_guard_details, // or other nested objects
      },
      logTimestamp: new Date().toISOString(), // Timestamp of when this evidence record was generated
      version: "1.0.0" // Version of this evidence format
    };

    return NextResponse.json(evidenceRecord, { 
        status: 200,
        headers: {
            'Content-Disposition': `attachment; filename="evidence_prompt_${promptId}.json"`,
            'Content-Type': 'application/json'
        }
    });

  } catch (error: any) {
    console.error('Export evidence endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during evidence export', details: error.message }, { status: 500 });
  }
} 