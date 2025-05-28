import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client for now
// const mockPromptLogData = [
//   { id: '1', original_prompt: 'Summarize this contract for project Alpha', category: 'Summary', status: 'approved', metadata: { mapped_controls: [{ controlId: 'CM-2' }] } },
//   { id: '2', original_prompt: 'Extract key dates and deadlines from this MSA', category: 'Data Extraction', status: 'approved', metadata: { mapped_controls: [{ controlId: 'CM-2' }] } },
//   { id: '3', original_prompt: 'Identify parties involved in the merger', category: 'Analysis', status: 'flagged', metadata: { mapped_controls: [{ controlId: 'RA-5' }, { controlId: 'PII'}] } },
//   { id: '4', original_prompt: 'Check for compliance issues in the report', category: 'Compliance', status: 'approved', metadata: { mapped_controls: [{ controlId: 'SC-28' }] } },
//   { id: '5', original_prompt: 'Find potential risks in the investment memo', category: 'Risk Analysis', status: 'blocked', metadata: { mapped_controls: [{ controlId: 'RA-5' }, {controlId: 'LLM01: Prompt Injection'}] } },
//   { id: '6', original_prompt: 'Summarize this contract for project Beta', category: 'Summary', status: 'approved', metadata: { mapped_controls: [{ controlId: 'CM-2' }] } },
//   { id: '7', original_prompt: 'Extract all email addresses from this document', category: 'Data Extraction', status: 'blocked', metadata: { mapped_controls: [{ controlId: 'SC-28' }, { controlId: 'RA-5' }, { controlId: 'PII' }] } },
//   { id: '8', original_prompt: 'Summarize this contract for project Gamma', category: 'Summary', status: 'approved', metadata: { mapped_controls: [{ controlId: 'CM-2' }] } },
//   { id: '9', original_prompt: 'what are the financial risks here?', category: 'Risk Analysis', status: 'flagged', metadata: { mapped_controls: [{ controlId: 'RA-5' }, { controlId: 'SC-28' }] } },
//   { id: '10', original_prompt: 'Extract key dates and deadlines for ACME Corp', category: 'Data Extraction', status: 'approved', metadata: { mapped_controls: [{ controlId: 'CM-2' }] } }, 
// ];

// const supabase = {
//   from: (tableName: string) => ({
//     select: async (columns = '*') => { 
//       console.log(`Mock Supabase: Selecting ${columns} from ${tableName}`);
//       if (tableName === 'PromptLog') {
//         // Simulate fetching all prompt logs
//         await new Promise(resolve => setTimeout(resolve, 50));
//         return { data: mockPromptLogData, error: null };
//       }
//       return { data: [], error: { message: 'Table not found'} };
//     }
//   })
// };

export async function GET(req: NextRequest) {
  try {
    // In a real app, you might have filters for projectId, date ranges, etc.
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    let query = supabase
      .from('prompt_logs')
      .select('original_prompt, category, status, metadata');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: promptLogs, error: dbError } = await query;

    if (dbError || !promptLogs) {
      console.error('Supabase error fetching analytics:', dbError);
      return NextResponse.json({ error: 'Failed to fetch analytics data', details: dbError?.message }, { status: 500 });
    }

    // 1. Top 5 most-used prompts by category
    const promptCounts: Record<string, { prompt: string, count: number, category: string }> = {};
    promptLogs.forEach(log => {
      const key = `${log.category || 'Uncategorized'}::${log.original_prompt}`;
      if (!promptCounts[key]) {
        promptCounts[key] = { prompt: log.original_prompt, count: 0, category: log.category || 'Uncategorized' };
      }
      promptCounts[key].count++;
    });
    const sortedPrompts = Object.values(promptCounts).sort((a, b) => b.count - a.count);
    const topPrompts = sortedPrompts.slice(0, 5);

    // 2. Count of prompts mapped to each control tag
    const controlTagCounts: Record<string, number> = {};
    promptLogs.forEach(log => {
      if (log.metadata && log.metadata.mapped_controls) {
        log.metadata.mapped_controls.forEach((control: { controlId: string }) => {
          controlTagCounts[control.controlId] = (controlTagCounts[control.controlId] || 0) + 1;
        });
      }
    });

    // 3. Prompt volume grouped by status
    const statusCounts: Record<string, number> = {
      approved: 0,
      flagged: 0,
      blocked: 0,
      other: 0, // For any other statuses that might exist
    };
    promptLogs.forEach(log => {
      if (log.status && statusCounts.hasOwnProperty(log.status)) {
        statusCounts[log.status]++;
      } else {
        statusCounts.other++;
      }
    });

    return NextResponse.json({
      topPrompts,
      controlTagCounts,
      statusCounts,
      totalProcessedPrompts: promptLogs.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Analytics summary endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred fetching analytics', details: error.message }, { status: 500 });
  }
} 