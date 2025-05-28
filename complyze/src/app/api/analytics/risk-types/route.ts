import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get all prompt logs with their redaction details and metadata
    const { data: prompts, error } = await supabase
      .from('prompt_logs')
      .select('redaction_details, metadata, risk_level, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching prompt logs:', error);
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

    // Map redaction types to risk categories
    const riskTypeMapping: Record<string, string> = {
      'EMAIL': 'PII Leakage',
      'SSN': 'PII Leakage', 
      'PHONE': 'PII Leakage',
      'NAME': 'PII Leakage',
      'ADDRESS': 'PII Leakage',
      'CREDIT_CARD': 'PII Leakage',
      'API_KEY': 'Credential Exposure',
      'PASSWORD': 'Credential Exposure',
      'TOKEN': 'Credential Exposure',
      'SECRET': 'Credential Exposure',
      'CREDENTIALS': 'Credential Exposure',
      'JWT_TOKEN': 'Credential Exposure',
      'OAUTH_SECRET': 'Credential Exposure',
      'SSH_KEY': 'Credential Exposure',
      'SENSITIVE_DATA': 'Internal Asset Disclosure',
      'INTERNAL_URL': 'Internal Asset Disclosure',
      'PROJECT_NAME': 'Internal Asset Disclosure',
      'CODE_NAMES': 'Internal Asset Disclosure',
      'REVENUE_DATA': 'Internal Asset Disclosure',
      'FINANCIAL_PROJECTIONS': 'Internal Asset Disclosure',
      'EXPORT_CONTROL': 'Regulatory Trigger',
      'CUI': 'Regulatory Trigger',
      'WHISTLEBLOWER': 'Regulatory Trigger',
      'CONFIDENTIAL': 'Regulatory Trigger',
      'LEGAL': 'Regulatory Trigger'
    };

    const riskFrequency: Record<string, number> = {};

    prompts.forEach(prompt => {
      const redactionDetails = prompt.redaction_details || [];
      const metadata = prompt.metadata || {};
      
      // Process redaction details to determine risk types
      redactionDetails.forEach((redaction: any) => {
        const riskType = riskTypeMapping[redaction.type] || 'Other';
        riskFrequency[riskType] = (riskFrequency[riskType] || 0) + 1;
      });

      // Check for jailbreak attempts based on metadata or high risk
      if (metadata.detection_method === 'real_time_analysis' && prompt.risk_level === 'critical') {
        riskFrequency['Jailbreak Attempt'] = (riskFrequency['Jailbreak Attempt'] || 0) + 1;
      }

      // Check for model leakage based on metadata
      if (metadata.detected_pii?.includes('model') || metadata.risk_factors?.includes('model_leakage')) {
        riskFrequency['Model Leakage'] = (riskFrequency['Model Leakage'] || 0) + 1;
      }

      // Check for vague prompts (low redaction count but flagged)
      if (prompt.status === 'flagged' && redactionDetails.length === 0) {
        riskFrequency['Vague Prompt'] = (riskFrequency['Vague Prompt'] || 0) + 1;
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