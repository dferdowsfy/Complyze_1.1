import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export interface DashboardMetrics {
  budget_tracker: {
    total_spend: number;
    budget: number;
    percent_delta: number;
    status: string;
    indicator: string;
  };
  top_prompts: Array<{
    prompt: string;
    model: string;
    cost: number;
  }>;
  most_used_model: string;
  total_spend: number;
  integrity_score: {
    avg_integrity: number;
    stable: number;
    suspicious: number;
    critical: number;
    total: number;
  };
  risk_types: Record<string, number>;
  trends: {
    total_prompts: number[];
    high_risk_prompts: number[];
    trend_percent: number;
    status: string;
    emoji: string;
  };
}

export function useDashboardMetrics(userId: string | null): {
  data: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Get current month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get user's budget
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('budget')
        .eq('id', userId)
        .single();

      const budget = user?.budget || 500.00;

      // Fetch current month's prompt events
      const { data: promptEvents, error: eventsError } = await supabase
        .from('prompt_events')
        .select('*')
        .eq('user_id', userId)
        .gte('captured_at', startOfMonth.toISOString())
        .lte('captured_at', endOfMonth.toISOString())
        .order('captured_at', { ascending: false });

      if (eventsError) {
        throw new Error(`Failed to fetch prompt events: ${eventsError.message}`);
      }

      if (!promptEvents || promptEvents.length === 0) {
        // Return empty state
        setData({
          budget_tracker: {
            total_spend: 0.00,
            budget: budget,
            percent_delta: -100.0,
            status: "Under Budget",
            indicator: "↓"
          },
          top_prompts: [],
          most_used_model: "No data",
          total_spend: 0.00,
          integrity_score: {
            avg_integrity: 85,
            stable: 0,
            suspicious: 0,
            critical: 0,
            total: 0
          },
          risk_types: {},
          trends: {
            total_prompts: [0, 0, 0, 0, 0, 0, 0],
            high_risk_prompts: [0, 0, 0, 0, 0, 0, 0],
            trend_percent: 0,
            status: 'Flat',
            emoji: '➖'
          }
        });
        return;
      }

      // 1. Budget Tracker
      const totalSpend = promptEvents.reduce((sum, event) => sum + parseFloat(event.usd_cost.toString()), 0);
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
      const topPrompts = promptEvents
        .sort((a, b) => parseFloat(b.usd_cost.toString()) - parseFloat(a.usd_cost.toString()))
        .slice(0, 5)
        .map(event => ({
          prompt: event.prompt_text ? (event.prompt_text.length > 35 
            ? event.prompt_text.substring(0, 35) + "..." 
            : event.prompt_text) : `${event.model} interaction`,
          model: event.model,
          cost: parseFloat(event.usd_cost.toString())
        }));

      // 3. Most Used Model
      const modelCounts: Record<string, number> = {};
      promptEvents.forEach(event => {
        modelCounts[event.model] = (modelCounts[event.model] || 0) + 1;
      });

      const mostUsedModel = Object.entries(modelCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "No data";

      // 4. Total Spend
      const totalSpendFormatted = parseFloat(totalSpend.toFixed(2));

      // 5. Integrity Score
      let totalIntegrityScore = 0;
      let stable = 0;
      let suspicious = 0;
      let critical = 0;

      promptEvents.forEach(event => {
        const score = event.integrity_score;
        totalIntegrityScore += score;

        if (score >= 80) {
          stable++;
        } else if (score >= 60) {
          suspicious++;
        } else {
          critical++;
        }
      });

      const avgIntegrity = promptEvents.length > 0 
        ? Math.round(totalIntegrityScore / promptEvents.length) 
        : 85;

      // 6. Risk Type Frequency
      const riskTypes: Record<string, number> = {};
      promptEvents.forEach(event => {
        riskTypes[event.risk_type] = (riskTypes[event.risk_type] || 0) + 1;
      });

      // 7. Trends (last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const { data: trendEvents, error: trendError } = await supabase
        .from('prompt_events')
        .select('captured_at, risk_level')
        .eq('user_id', userId)
        .gte('captured_at', sevenDaysAgo.toISOString())
        .order('captured_at', { ascending: true });

      if (trendError) {
        throw new Error(`Failed to fetch trend data: ${trendError.message}`);
      }

      // Group by day for trends
      const dailyData: Record<string, { total: number; highRisk: number }> = {};
      
      // Initialize all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { total: 0, highRisk: 0 };
      }

      // Count trends
      trendEvents?.forEach(event => {
        const date = new Date(event.captured_at);
        const dateKey = date.toISOString().split('T')[0];
        
        if (dailyData[dateKey]) {
          dailyData[dateKey].total++;
          if (event.risk_level === 'high') {
            dailyData[dateKey].highRisk++;
          }
        }
      });

      const totalPrompts = Object.values(dailyData).map(d => d.total);
      const highRiskPrompts = Object.values(dailyData).map(d => d.highRisk);

      // Calculate trend
      const recentHighRisk = highRiskPrompts.slice(-3).reduce((a, b) => a + b, 0);
      const earlierHighRisk = highRiskPrompts.slice(0, 4).reduce((a, b) => a + b, 0);
      const trendPercent = earlierHighRisk > 0 
        ? ((recentHighRisk - earlierHighRisk) / earlierHighRisk) * 100 
        : 0;

      let trendStatus = 'Flat';
      let trendEmoji = '➖';
      
      if (trendPercent > 5) {
        trendStatus = 'Rising';
        trendEmoji = '📈';
      } else if (trendPercent < -5) {
        trendStatus = 'Declining';
        trendEmoji = '📉';
      }

      const trends = {
        total_prompts: totalPrompts,
        high_risk_prompts: highRiskPrompts,
        trend_percent: Math.round(trendPercent),
        status: trendStatus,
        emoji: trendEmoji
      };

      setData({
        budget_tracker: budgetTracker,
        top_prompts: topPrompts,
        most_used_model: mostUsedModel,
        total_spend: totalSpendFormatted,
        integrity_score: {
          avg_integrity: avgIntegrity,
          stable,
          suspicious,
          critical,
          total: promptEvents.length
        },
        risk_types: riskTypes,
        trends
      });

    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 20 seconds
    const interval = setInterval(fetchMetrics, 20000);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics
  };
} 