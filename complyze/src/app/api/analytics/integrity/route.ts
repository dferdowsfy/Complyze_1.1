import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get all prompt logs with their risk levels and redaction details
    const { data: prompts, error } = await supabase
      .from('prompt_logs')
      .select('risk_level, redaction_details, metadata')
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
        avg_integrity: 85,
        stable: 0,
        suspicious: 0,
        critical: 0,
        total: 0
      });
    }

    // Calculate integrity scores based on risk levels and redaction counts
    let totalScore = 0;
    let stable = 0;
    let suspicious = 0;
    let critical = 0;

    prompts.forEach(prompt => {
      let score = 100; // Start with perfect score
      
      // Deduct points based on risk level
      switch (prompt.risk_level) {
        case 'critical':
          score -= 40;
          break;
        case 'high':
          score -= 30;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
      }

      // Deduct points based on redaction count
      const redactionCount = prompt.redaction_details?.length || 0;
      score -= Math.min(redactionCount * 5, 30); // Max 30 points deduction for redactions

      // Ensure score doesn't go below 0
      score = Math.max(score, 0);
      
      totalScore += score;

      // Categorize based on final score
      if (score >= 80) {
        stable++;
      } else if (score >= 60) {
        suspicious++;
      } else {
        critical++;
      }
    });

    const avgIntegrity = Math.round(totalScore / prompts.length);

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