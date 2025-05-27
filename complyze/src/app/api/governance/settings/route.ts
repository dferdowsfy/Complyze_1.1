import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase client for now
// const mockGovernanceSettings = {
//   id: 'default_project_settings', // Or a specific projectId
//   project_id: 'GLOBAL_OR_PROJECT_ID',
//   framework_mode: 'NIST', // 'NIST' | 'OWASP' | 'ISO'
//   top_blocked_categories: [
//     { category: 'SSNs', description: 'Social Security Numbers', count: 25 },
//     { category: 'CreditCards', description: 'Credit Card Numbers', count: 18 },
//     { category: 'InternalCode', description: 'Proprietary Source Code', count: 10 },
//   ],
//   redaction_enabled: true,
//   pii_block_enabled: true,
//   updated_at: new Date().toISOString(),
// };

// const supabase = {
//   from: (tableName: string) => ({
//     select: (columns = '*') => ({
//       eq: async (field: string, value: any) => {
//         console.log(`Mock Supabase: Selecting ${columns} from ${tableName} where ${field}=${value}`);
//         if (tableName === 'GovernanceSettings' && value === 'GLOBAL_OR_PROJECT_ID') {
//           await new Promise(resolve => setTimeout(resolve, 50));
//           return { data: [mockGovernanceSettings], error: null };
//         }
//         return { data: [], error: { message: 'Settings not found' } };
//       },
//       // A .single() method might also be appropriate if only one row is expected.
//       single: async () => {
//          console.log(`Mock Supabase: Selecting single row ${columns} from ${tableName}`);
//          if (tableName === 'GovernanceSettings') { // Simplified: assuming global or first record for mock
//             await new Promise(resolve => setTimeout(resolve, 50));
//             return { data: mockGovernanceSettings, error: null };
//          }
//          return { data: null, error: { message: 'Settings not found'}};
//       }
//     })
//   })
// };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'GLOBAL_SETTINGS'; // Use a clear default ID

    const { data: settings, error: dbError } = await supabase
      .from('GovernanceSettings')
      .select('framework_mode, top_blocked_categories, redaction_enabled, pii_block_enabled, updated_at')
      .eq('project_id', projectId)
      .maybeSingle(); // Fetches a single row or null, doesn't error if not found.

    if (dbError) {
      console.error('Supabase error fetching governance settings:', dbError);
      return NextResponse.json({ error: 'Failed to fetch settings', details: dbError.message }, { status: 500 });
    }

    if (!settings) {
      // Return default settings if no specific project settings are found and no error occurred
      return NextResponse.json({
        frameworkMode: 'NIST', 
        topBlockedCategories: [],
        redactionEnabled: true,
        piiBlockEnabled: true,
        lastUpdated: new Date(0).toISOString(),
        message: 'No specific settings for this project, returning defaults.'
      }, { status: 200 }); // 200 with defaults, or 404 if defaults are not desired.
    }
    
    return NextResponse.json({
      frameworkMode: settings.framework_mode,
      topBlockedCategories: settings.top_blocked_categories,
      redactionEnabled: settings.redaction_enabled,
      piiBlockEnabled: settings.pii_block_enabled,
      lastUpdated: settings.updated_at
    }, { status: 200 });

  } catch (error: any) {
    console.error('Governance settings endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred fetching governance settings', details: error.message }, { status: 500 });
  }
} 