import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Model pricing per 1M tokens (input/output)
const MODEL_PRICING = {
  'GPT-4o': { input: 3.00, output: 10.00 },
  'GPT-4 Turbo': { input: 10.00, output: 30.00 },
  'GPT-4': { input: 30.00, output: 60.00 },
  'Claude 3 Opus': { input: 15.00, output: 75.00 },
  'Claude 3 Sonnet': { input: 3.00, output: 15.00 },
  'Claude 3 Haiku': { input: 0.25, output: 1.25 },
  'Gemini 1.5 Pro': { input: 3.50, output: 10.50 },
  'Gemini 1.5 Flash': { input: 0.10, output: 0.40 },
  'Google Gemini': { input: 0.10, output: 0.40 }, // Fallback for generic "Google Gemini"
  'OpenAI GPT-4': { input: 30.00, output: 60.00 }, // Fallback for generic "OpenAI GPT-4"
  'Anthropic Claude': { input: 15.00, output: 75.00 }, // Fallback for generic "Anthropic Claude"
};

// Function to estimate tokens from text (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Function to calculate cost for a prompt
function calculatePromptCost(prompt: any): number {
  const model = prompt.metadata?.model_used || prompt.platform || 'GPT-4o';
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['GPT-4o'];
  
  // Estimate tokens from prompt text
  const inputTokens = estimateTokens(prompt.original_prompt || '');
  const outputTokens = estimateTokens(prompt.metadata?.response_text || '') || Math.floor(inputTokens * 0.3); // Assume 30% of input as output if no response
  
  // Calculate cost
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const budget = parseFloat(searchParams.get('budget') || '500');

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Build query for current month's prompts
    let query = supabase
      .from('prompt_logs')
      .select(`
        id,
        original_prompt,
        platform,
        metadata,
        created_at
      `)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())
      .order('created_at', { ascending: false });

    // Filter by user if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: prompts, error: dbError } = await query;

    if (dbError) {
      console.error('Supabase error fetching cost data:', dbError);
      return NextResponse.json({ 
        error: 'Failed to fetch cost data', 
        details: dbError.message 
      }, { status: 500 });
    }

    if (!prompts || prompts.length === 0) {
      return NextResponse.json({
        budget_tracker: {
          total_spend: 0.00,
          budget: budget,
          percent_delta: -100.0,
          status: "Under Budget",
          indicator: "↓"
        },
        top_prompts: [],
        most_used_model: "No data",
        total_spend: 0.00
      });
    }

    // Calculate costs for each prompt
    const promptsWithCost = prompts.map(prompt => ({
      ...prompt,
      cost: calculatePromptCost(prompt)
    }));

    // 1. Budget Tracker
    const totalSpend = promptsWithCost.reduce((sum, prompt) => sum + prompt.cost, 0);
    const percentDelta = ((totalSpend - budget) / budget) * 100;
    const isOverBudget = totalSpend > budget;

    const budgetTracker = {
      total_spend: parseFloat(totalSpend.toFixed(2)),
      budget: budget,
      percent_delta: parseFloat(percentDelta.toFixed(1)),
      status: isOverBudget ? "Over Budget" : "Under Budget",
      indicator: isOverBudget ? "↑" : "↓"
    };

    // 2. Top 5 Most Expensive Prompts
    const topPrompts = promptsWithCost
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map(prompt => ({
        prompt: prompt.original_prompt.length > 35 
          ? prompt.original_prompt.substring(0, 35) + "..." 
          : prompt.original_prompt,
        model: prompt.metadata?.model_used || prompt.platform || 'Unknown',
        cost: parseFloat(prompt.cost.toFixed(2))
      }));

    // 3. Most Used Model
    const modelCounts: Record<string, number> = {};
    promptsWithCost.forEach(prompt => {
      const model = prompt.metadata?.model_used || prompt.platform || 'Unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    const mostUsedModel = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "No data";

    // 4. Total Spend (same as budget tracker)
    const totalSpendFormatted = parseFloat(totalSpend.toFixed(2));

    return NextResponse.json({
      budget_tracker: budgetTracker,
      top_prompts: topPrompts,
      most_used_model: mostUsedModel,
      total_spend: totalSpendFormatted
    });

  } catch (error: any) {
    console.error('Cost summary endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 