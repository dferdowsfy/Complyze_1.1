import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

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

    // Fetch user's redaction settings
    const { data: settings, error: dbError } = await supabase
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

    if (!user_id || !settings) {
      return NextResponse.json({ error: 'User ID and settings are required' }, { status: 400 });
    }

    // Delete existing settings for this user
    const { error: deleteError } = await supabase
      .from('RedactionSettings')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error deleting existing settings:', deleteError);
      return NextResponse.json({ error: 'Failed to update settings', details: deleteError.message }, { status: 500 });
    }

    // Insert new settings
    const settingsArray = Object.entries(settings).map(([item_key, enabled]) => ({
      user_id,
      item_key,
      enabled: Boolean(enabled)
    }));

    const { error: insertError } = await supabase
      .from('RedactionSettings')
      .insert(settingsArray);

    if (insertError) {
      console.error('Error inserting new settings:', insertError);
      return NextResponse.json({ error: 'Failed to save settings', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Redaction settings POST error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
} 