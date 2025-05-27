import { NextRequest, NextResponse } from 'next/server';
import { mapControls, mapControlsLLM, RiskMetadata, MappedControl, scorePromptLLM } from '@/lib/mapControls';
import { supabase } from '@/lib/supabaseClient';

interface ScoreRequestBody {
  redactedPrompt: string;
  promptLogId: string; // To update the log entry
}

interface PromptimizerScores {
  clarityScore: number;
  qualityScore: number;
}

interface LLMGuardOutput {
  riskLevel: 'low' | 'medium' | 'high';
  // Potentially more details like specific threats detected
}

/**
 * Simulates Promptimizer logic.
 * In a real scenario, this would involve more complex NLP analysis.
 */
function getPromptimizerScores(redactedPrompt: string): PromptimizerScores {
  let clarityScore = 80;
  let qualityScore = 75;

  if (redactedPrompt.length < 10) qualityScore -= 20;
  if (redactedPrompt.length > 200) qualityScore -= 10;
  if (redactedPrompt.split(' ').length < 3) clarityScore -= 30;
  if (!redactedPrompt.includes('?') && redactedPrompt.toLowerCase().startsWith('what')) clarityScore += 5; // Simple heuristic
  if (redactedPrompt.includes('[REDACTED_')) qualityScore -= 5; // Penalize if redactions happened

  return {
    clarityScore: Math.max(0, Math.min(100, clarityScore)),
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
  };
}

/**
 * Simulates LLM Guard output.
 */
function getLLMGuardRisk(redactedPrompt: string, scores: PromptimizerScores): LLMGuardOutput {
  if (redactedPrompt.toLowerCase().includes('extract all') || redactedPrompt.toLowerCase().includes('ignore protection')) {
    return { riskLevel: 'high' };
  }
  if (scores.qualityScore < 40 || scores.clarityScore < 40) {
    return { riskLevel: 'medium' };
  }
  if (redactedPrompt.includes('[REDACTED_EMAIL]') || redactedPrompt.includes('[REDACTED_SSN]')) {
    return { riskLevel: 'medium' };
  }
  return { riskLevel: 'low' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ScoreRequestBody;
    const { redactedPrompt, promptLogId } = body;

    if (!redactedPrompt || !promptLogId) {
      return NextResponse.json({ error: 'Missing required fields: redactedPrompt, promptLogId' }, { status: 400 });
    }

    // 1. Try LLM-based scoring first
    let clarityScore: number, qualityScore: number, riskLevel: 'low' | 'medium' | 'high', suggestions: string[] = [];
    let usedLLMScoring = false;
    const llmScores = await scorePromptLLM(redactedPrompt);
    if (llmScores) {
      clarityScore = llmScores.clarityScore;
      qualityScore = llmScores.qualityScore;
      riskLevel = llmScores.riskLevel;
      suggestions = llmScores.suggestions;
      usedLLMScoring = true;
    } else {
      // Fallback to heuristic
      const scores = getPromptimizerScores(redactedPrompt);
      clarityScore = scores.clarityScore;
      qualityScore = scores.qualityScore;
      riskLevel = getLLMGuardRisk(redactedPrompt, scores).riskLevel;
      suggestions = [];
    }

    // 2. Prepare risk metadata for control mapping
    const riskMetadata: RiskMetadata = { clarityScore, qualityScore, riskLevel };

    // 3. Map controls using LLM first, fallback to local
    let controls: MappedControl[] = [];
    let usedLLM = false;
    try {
      const llmControls = await mapControlsLLM(redactedPrompt, riskMetadata);
      if (llmControls && llmControls.length > 0) {
        controls = llmControls;
        usedLLM = true;
      }
    } catch (err) {
      // Ignore LLM errors, fallback to local
    }
    if (!controls.length) {
      controls = mapControls(redactedPrompt, riskMetadata);
    }

    // 4. Update PromptLog in Supabase with scores, risk, controls, and suggestions
    const updateData = {
      clarity_score: clarityScore,
      quality_score: qualityScore,
      risk_level: riskLevel,
      mapped_controls: controls, // Store the array of matched controls
      status: 'processed', // Update status from 'pending'
      scored_at: new Date().toISOString(),
      metadata: { usedLLM, usedLLMScoring, suggestions }
    };

    const { data: updatedLog, error: dbError } = await supabase
      .from('PromptLog')
      .update(updateData)
      .eq('id', promptLogId)
      .select(); // Optionally get the updated row back

    if (dbError) {
      console.error('Supabase error during score update:', dbError);
      return NextResponse.json({ error: 'Failed to update prompt log with scores', details: (dbError as any).message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Prompt scored successfully',
      clarityScore,
      qualityScore,
      riskLevel,
      mappedControls: controls,
      suggestions,
      updatedLogId: promptLogId,
      usedLLM,
      usedLLMScoring
    }, { status: 200 });

  } catch (error: any) {
    console.error('Score endpoint error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during scoring', details: error.message }, { status: 500 });
  }
} 