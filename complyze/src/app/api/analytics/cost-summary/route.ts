import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Cost calculation is now handled by using the existing usd_cost field from prompt_events table

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const budget = parseFloat(searchParams.get('budget') || '500');

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Build query for current month's prompts from prompt_events table
    let query = supabase
      .from('prompt_events')
      .select(`
        id,
        prompt_text,
        model,
        llm_provider,
        platform,
        usd_cost,
        prompt_tokens,
        completion_tokens,
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

    // 1. Budget Tracker - use existing usd_cost field
    const totalSpend = prompts.reduce((sum, prompt) => sum + (prompt.usd_cost || 0), 0);
    const percentDelta = ((totalSpend - budget) / budget) * 100;
    const isOverBudget = totalSpend > budget;

    const budgetTracker = {
      total_spend: parseFloat(totalSpend.toFixed(2)),
      budget: budget,
      percent_delta: parseFloat(percentDelta.toFixed(1)),
      status: isOverBudget ? "Over Budget" : "Under Budget",
      indicator: isOverBudget ? "↑" : "↓"
    };

    // 2. Top 5 Most Expensive Prompts - use existing usd_cost field
    const topPrompts = prompts
      .filter(prompt => prompt.usd_cost > 0) // Only include prompts with cost data
      .sort((a, b) => (b.usd_cost || 0) - (a.usd_cost || 0))
      .slice(0, 5)
      .map(prompt => ({
        prompt: prompt.prompt_text && prompt.prompt_text.length > 35 
          ? prompt.prompt_text.substring(0, 35) + "..." 
          : prompt.prompt_text || "No prompt text",
        model: prompt.llm_provider || prompt.model || prompt.platform || 'Unknown',
        cost: parseFloat((prompt.usd_cost || 0).toFixed(4)) // Show more precision for small costs
      }));

    // 3. Most Used Model - use llm_provider field from prompt_events
    const modelCounts: Record<string, number> = {};
    prompts.forEach(prompt => {
      const model = prompt.llm_provider || prompt.model || prompt.platform || 'Unknown';
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