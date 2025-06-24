import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    // Get the last 7 days of data
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all prompts from the last 7 days from prompt_events table
    const { data: prompts, error } = await supabase
      .from('prompt_events')
      .select('captured_at, risk_level, status')
      .gte('captured_at', sevenDaysAgo.toISOString())
      .order('captured_at', { ascending: true });

    if (error) {
      console.error('Error fetching trends data:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch trends data', 
        details: error.message 
      }, { status: 500 });
    }

    if (!prompts || prompts.length === 0) {
      // Return mock data if no real data available
      return NextResponse.json({
        total_prompts: [0, 0, 0, 0, 0, 0, 0],
        high_risk_prompts: [0, 0, 0, 0, 0, 0, 0],
        trend_percent: 0,
        status: 'Flat',
        emoji: '➖'
      });
    }

    // Group prompts by day (last 7 days)
    const dailyData: Record<string, { total: number; highRisk: number }> = {};
    
    // Initialize all 7 days with zero counts
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      dailyData[dateKey] = { total: 0, highRisk: 0 };
    }

    // Count prompts by day
    prompts.forEach(prompt => {
      const date = new Date(prompt.captured_at);
      const dateKey = date.toISOString().split('T')[0];
      
      if (dailyData[dateKey]) {
        dailyData[dateKey].total++;
        
        // Count high-risk prompts (high or critical risk level)
        if (prompt.risk_level === 'high' || prompt.risk_level === 'critical') {
          dailyData[dateKey].highRisk++;
        }
      }
    });

    // Convert to arrays for the last 7 days (oldest to newest)
    const sortedDates = Object.keys(dailyData).sort();
    const totalPrompts = sortedDates.map(date => dailyData[date].total);
    const highRiskPrompts = sortedDates.map(date => dailyData[date].highRisk);

    // Calculate trend (percent change from first to last day)
    const firstDayHighRisk = highRiskPrompts[0] || 1; // Avoid division by zero
    const lastDayHighRisk = highRiskPrompts[6] || 0;
    const trendPercent = ((firstDayHighRisk - lastDayHighRisk) / firstDayHighRisk) * 100;

    // Determine status and emoji
    let status = 'Flat';
    let emoji = '➖';
    
    if (trendPercent > 10) {
      status = 'Improving';
      emoji = '📈';
    } else if (trendPercent < -10) {
      status = 'Worsening';
      emoji = '⚠️';
    }

    return NextResponse.json({
      total_prompts: totalPrompts,
      high_risk_prompts: highRiskPrompts,
      trend_percent: Math.round(Math.abs(trendPercent)),
      status,
      emoji,
      total_analyzed: prompts.length
    });

  } catch (error: any) {
    console.error('Trends endpoint error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error.message 
    }, { status: 500 });
  }
} 