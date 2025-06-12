import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get all prompt events with their integrity scores and risk levels
    const { data: prompts, error } = await supabase
      .from('prompt_events')
      .select('integrity_score, risk_level, compliance_score, metadata')
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
        avg_integrity: 85,
        stable: 0,
        suspicious: 0,
        critical: 0,
        total: 0
      });
    }

    // Use the built-in integrity_score and compliance_score fields
    let totalIntegrityScore = 0;
    let stable = 0;
    let suspicious = 0;
    let critical = 0;

    prompts.forEach(prompt => {
      // Use the existing integrity_score or compliance_score, fallback to calculation
      let score = prompt.integrity_score || prompt.compliance_score || 50;

      // If no score exists, calculate based on risk level
      if (!score) {
        score = 100;
        switch (prompt.risk_level) {
          case 'critical':
            score = 20;
            break;
          case 'high':
            score = 40;
            break;
          case 'medium':
            score = 70;
            break;
          case 'low':
            score = 90;
            break;
        }
      }

      totalIntegrityScore += score;

      // Categorize based on integrity score
      if (score >= 80) {
        stable++;
      } else if (score >= 60) {
        suspicious++;
      } else {
        critical++;
      }
    });

    const avgIntegrity = Math.round(totalIntegrityScore / prompts.length);

    return NextResponse.json({
      avg_integrity: avgIntegrity,
      stable,
      suspicious,
      critical,
      total: prompts.length
    });

  } catch (error: any) {
    console.error('Integrity stats endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 