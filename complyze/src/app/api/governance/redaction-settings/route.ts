import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://likskioavtpnskrfxbqa.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpa3NraW9hdnRwbnNrcmZ4YnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjY5MiwiZXhwIjoyMDYyODk4NjkyfQ.O_qkgrEHKI5QOG9UidDtieEb-kEzu-3su9Ge2XdXPSw";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define the redaction categories and items structure
export const REDACTION_CATEGORIES = {
  PII: [
    'Name',
    'Email',
    'Phone Number',
    'Address',
    'SSN',
    'Passport Number',
    'IP Address'
  ],
  'Credentials & Secrets': [
    'API Keys',
    'OAuth Tokens',
    'SSH Keys',
    'Vault Paths',
    'Access Tokens'
  ],
  'Company Internal': [
    'Internal URLs',
    'Project Codenames',
    'Internal Tools',
    'System IP Ranges'
  ],
  'AI Model & Dataset Leakage': [
    'Model Names',
    'Training Data References',
    'Fine-tuned Logic',
    'Private Weights or Output'
  ],
  'Regulated Info': [
    'PHI (HIPAA)',
    'Financial Records',
    'Export-Controlled Terms (ITAR)',
    'Whistleblower IDs'
  ],
  'Jailbreak Patterns': [
    'Ignore previous instructions',
    'Simulate a developer mode',
    'Repeat after me...'
  ],
  Other: [
    'Custom-defined terms'
  ]
};

// GET - Fetch user's redaction settings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user's redaction settings using admin client
    const { data: settings, error: dbError } = await supabaseAdmin
      .from('RedactionSettings')
      .select('item_key, enabled')
      .eq('user_id', userId);

    if (dbError) {
      console.error('Supabase error fetching redaction settings:', dbError);
      return NextResponse.json({ error: 'Failed to fetch settings', details: dbError.message }, { status: 500 });
    }

    // Convert array to object for easier frontend handling
    const settingsMap: Record<string, boolean> = {};
    
    // Initialize all items as enabled by default
    Object.entries(REDACTION_CATEGORIES).forEach(([category, items]) => {
      items.forEach(item => {
        const key = `${category}.${item}`;
        settingsMap[key] = true; // Default to enabled
      });
    });

    // Override with user's actual settings
    settings?.forEach(setting => {
      settingsMap[setting.item_key] = setting.enabled;
    });

    return NextResponse.json({
      categories: REDACTION_CATEGORIES,
      settings: settingsMap
    }, { status: 200 });

  } catch (error: any) {
    console.error('Redaction settings GET error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}

// POST - Update user's redaction settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, settings } = body;

    console.log('Redaction settings POST request:', { user_id, settingsCount: Object.keys(settings || {}).length });

    if (!user_id || !settings) {
      return NextResponse.json({ error: 'User ID and settings are required' }, { status: 400 });
    }

    // Convert settings object to array
    const settingsArray = Object.entries(settings).map(([item_key, enabled]) => ({
      user_id,
      item_key,
      enabled: Boolean(enabled)
    }));

    console.log('Settings array to insert:', settingsArray.length, 'items');

    // If no settings to save, just return success
    if (settingsArray.length === 0) {
      console.log('No settings to save, returning success');
      return NextResponse.json({ 
        message: 'No settings to save',
        settings: {} 
      }, { status: 200 });
    }

    // Delete existing settings for this user using admin client
    console.log('Deleting existing settings for user:', user_id);
    const { error: deleteError } = await supabaseAdmin
      .from('RedactionSettings')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error deleting existing settings:', deleteError);
      return NextResponse.json({ error: 'Failed to update settings', details: deleteError.message }, { status: 500 });
    }

    // Insert new settings using admin client
    console.log('Inserting new settings...');
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('RedactionSettings')
      .insert(settingsArray)
      .select();

    if (insertError) {
      console.error('Error inserting new settings:', insertError);
      console.error('Settings array that failed:', settingsArray);
      return NextResponse.json({ error: 'Failed to save settings', details: insertError.message }, { status: 500 });
    }

    console.log('Settings saved successfully:', insertData?.length, 'records');

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings,
      recordsInserted: insertData?.length || 0
    }, { status: 200 });

  } catch (error: any) {
    console.error('Redaction settings POST error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
} 