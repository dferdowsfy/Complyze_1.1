import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { encryptText } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');

    // Test 1: Check if users table exists
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    console.log('Users table test:', { data: usersTest, error: usersError?.message });

    // Test 2: Check if projects table exists
    const { data: projectsTest, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);

    console.log('Projects table test:', { data: projectsTest, error: projectsError?.message });

    // Test 3: Check if prompt_events table exists
    const { data: promptEventsTest, error: promptEventsError } = await supabase
      .from('prompt_events')
      .select('count')
      .limit(1);

    console.log('Prompt events table test:', { data: promptEventsTest, error: promptEventsError?.message });

    return NextResponse.json({
      success: true,
      tests: {
        users: { success: !usersError, error: usersError?.message },
        projects: { success: !projectsError, error: projectsError?.message },
        prompt_events: { success: !promptEventsError, error: promptEventsError?.message }
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating sample flagged prompts...');

    // First, get or create a user
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    let userId;
    if (usersError || !users || users.length === 0) {
      console.log('No users found, creating test user...');
      // Create a test user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: 'test@complyze.co',
          full_name: 'Test User',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createUserError) {
        return NextResponse.json({ 
          error: 'Failed to create test user', 
          details: createUserError.message 
        }, { status: 500 });
      }
      userId = newUser.id;
    } else {
      userId = users[0].id;
    }

    // Get or create a project for this user
    let { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1);

    let projectId;
    if (projectsError || !projects || projects.length === 0) {
      console.log('No projects found, creating test project...');
      // Create a test project
      const { data: newProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          name: 'Test Project',
          user_id: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createProjectError) {
        return NextResponse.json({ 
          error: 'Failed to create test project', 
          details: createProjectError.message 
        }, { status: 500 });
      }
      projectId = newProject.id;
    } else {
      projectId = projects[0].id;
    }

    console.log(`Using userId: ${userId}, projectId: ${projectId}`);

    // Create sample flagged prompts for prompt_events table
    const samplePrompts = [
      {
        user_id: userId,
        model: 'gpt-4',
        usd_cost: 0.002,
        prompt_tokens: 45,
        completion_tokens: 20,
        integrity_score: 25,
        risk_type: 'personal_id',
        risk_level: 'high',
        status: 'flagged',
        platform: 'ChatGPT',
        url: 'https://chat.openai.com',
        captured_at: new Date().toISOString(),
        prompt_text: encryptText("Can you help me analyze this customer data? John Smith, email: john.smith@email.com, SSN: 123-45-6789"),
        metadata: {
          source: 'chrome_extension',
          detection_method: 'real_time_analysis',
          detected_pii: ['NAME', 'EMAIL', 'SSN'],
          mapped_controls: [
            { controlId: 'NIST-SC-28', description: 'Protection of Information at Rest' },
            { controlId: 'Privacy-PII', description: 'PII Protection' }
          ],
          flagged_at: new Date().toISOString(),
          extension_version: 'v2.0',
          auto_flagged: true,
          redacted_prompt: "Can you help me analyze this customer data? [NAME], email: [EMAIL], SSN: [SSN]",
          redaction_details: [
            { type: 'NAME', original: 'John Smith', redacted: '[NAME]' },
            { type: 'EMAIL', original: 'john.smith@email.com', redacted: '[EMAIL]' },
            { type: 'SSN', original: '123-45-6789', redacted: '[SSN]' }
          ]
        }
      },
      {
        user_id: userId,
        model: 'claude-3-5-sonnet-20241022',
        usd_cost: 0.003,
        prompt_tokens: 32,
        completion_tokens: 15,
        integrity_score: 15,
        risk_type: 'security',
        risk_level: 'high',
        status: 'flagged',
        platform: 'Claude',
        url: 'https://claude.ai',
        captured_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        prompt_text: encryptText("Write a SQL query to get all user passwords from the database"),
        metadata: {
          source: 'chrome_extension',
          detection_method: 'real_time_analysis',
          detected_pii: ['SENSITIVE_DATA'],
          mapped_controls: [
            { controlId: 'OWASP-LLM-06', description: 'Sensitive Information Disclosure' },
            { controlId: 'NIST-AC-3', description: 'Access Enforcement' }
          ],
          flagged_at: new Date(Date.now() - 3600000).toISOString(),
          extension_version: 'v2.0',
          auto_flagged: true,
          redacted_prompt: "Write a SQL query to get all user [SENSITIVE_DATA] from the database",
          redaction_details: [
            { type: 'SENSITIVE_DATA', original: 'passwords', redacted: '[SENSITIVE_DATA]' }
          ]
        }
      },
      {
        user_id: userId,
        model: 'gemini-1.5-pro',
        usd_cost: 0.001,
        prompt_tokens: 28,
        completion_tokens: 12,
        integrity_score: 45,
        risk_type: 'security',
        risk_level: 'medium',
        status: 'flagged',
        platform: 'Gemini',
        url: 'https://gemini.google.com',
        captured_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        prompt_text: encryptText("My API key is sk-1234567890abcdef. Can you help me debug this code?"),
        metadata: {
          source: 'chrome_extension',
          detection_method: 'real_time_analysis',
          detected_pii: ['API_KEY'],
          mapped_controls: [
            { controlId: 'NIST-IA-5', description: 'Authenticator Management' },
            { controlId: 'Privacy-API', description: 'API Key Protection' }
          ],
          flagged_at: new Date(Date.now() - 7200000).toISOString(),
          extension_version: 'v2.0',
          auto_flagged: true,
          redacted_prompt: "My API key is [API_KEY]. Can you help me debug this code?",
          redaction_details: [
            { type: 'API_KEY', original: 'sk-1234567890abcdef', redacted: '[API_KEY]' }
          ]
        }
      }
    ];

    const { data: insertedPrompts, error: insertError } = await supabase
      .from('prompt_events')
      .insert(samplePrompts)
      .select();

    if (insertError) {
      console.error('Error inserting sample prompts:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create sample prompts', 
        details: insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample flagged prompts created successfully',
      created: insertedPrompts?.length || 0,
      userId: userId,
      projectId: projectId,
      prompts: insertedPrompts
    });

  } catch (error) {
    console.error('Error creating sample prompts:', error);
    return NextResponse.json(
      { error: 'Failed to create sample prompts', details: error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('Clearing test flagged prompts...');

    // Delete all flagged prompts that were created by the test endpoint
    const { data: deletedPrompts, error: deleteError } = await supabase
      .from('prompt_events')
      .delete()
      .eq('status', 'flagged')
      .in('platform', ['chatgpt', 'claude', 'gemini'])
      .contains('metadata', { source: 'chrome_extension_realtime' })
      .select();

    if (deleteError) {
      console.error('Error deleting test prompts:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete test prompts', 
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test flagged prompts cleared successfully',
      deleted: deletedPrompts?.length || 0
    });

  } catch (error) {
    console.error('Error clearing test prompts:', error);
    return NextResponse.json(
      { error: 'Failed to clear test prompts', details: error },
      { status: 500 }
    );
  }
} 