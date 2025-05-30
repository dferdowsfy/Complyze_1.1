import { supabase } from './supabaseClient';

interface DateRange {
  start: string;
  end: string;
}

interface ReportData {
  promptLogs: any[];
  costData: any;
  riskAnalysis: any;
  redactionStats: any;
  controlMappings: any[];
  additionalMetrics: any;
}

class ReportDataService {
  async aggregateReportData(template: string, dateRange?: DateRange, userId?: string): Promise<ReportData> {
    console.log(`Aggregating data for ${template} report...`);
    
    // Set default date range if not provided (last 30 days)
    const endDate = dateRange?.end || new Date().toISOString();
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch prompt logs
      const promptLogs = await this.getPromptLogs(startDate, endDate, userId);
      
      // Fetch cost data
      const costData = await this.getCostData(startDate, endDate, userId);
      
      // Analyze risks
      const riskAnalysis = await this.getRiskAnalysis(promptLogs);
      
      // Calculate redaction stats
      const redactionStats = await this.getRedactionStats(promptLogs);
      
      // Get control mappings
      const controlMappings = await this.getControlMappings(promptLogs);
      
      // Calculate additional metrics based on template
      const additionalMetrics = await this.getAdditionalMetrics(template, promptLogs, startDate, endDate);

      return {
        promptLogs,
        costData,
        riskAnalysis,
        redactionStats,
        controlMappings,
        additionalMetrics
      };

    } catch (error) {
      console.error('Error aggregating report data:', error);
      return this.getEmptyReportData();
    }
  }

  private async getPromptLogs(startDate: string, endDate: string, userId?: string) {
    let query = supabase
      .from('prompt_events')
      .select(`
        id,
        model,
        usd_cost,
        prompt_tokens,
        completion_tokens,
        integrity_score,
        risk_type,
        risk_level,
        captured_at,
        prompt_text,
        response_text,
        source,
        metadata,
        user_id
      `)
      .gte('captured_at', startDate)
      .lte('captured_at', endDate)
      .order('captured_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching prompt events:', error);
      return [];
    }

    return data || [];
  }

  private async getCostData(startDate: string, endDate: string, userId?: string) {
    try {
      // Fetch cost data directly from prompt_events table
      let query = supabase
        .from('prompt_events')
        .select('id, model, usd_cost, prompt_text, captured_at')
        .gte('captured_at', startDate)
        .lte('captured_at', endDate);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching cost data:', error);
        return this.getEmptyCostData();
      }

      const events = data || [];
      
      // Calculate total spend
      const total_spend = events.reduce((sum, event) => sum + (event.usd_cost || 0), 0);
      
      // Get top 5 most expensive prompts
      const top_prompts = events
        .sort((a, b) => (b.usd_cost || 0) - (a.usd_cost || 0))
        .slice(0, 5)
        .map(event => ({
          id: event.id,
          cost: event.usd_cost,
          excerpt: event.prompt_text?.substring(0, 50) + '...' || 'N/A',
          model: event.model,
          date: event.captured_at
        }));

      // Find most used model
      const modelCounts: Record<string, number> = {};
      events.forEach(event => {
        if (event.model) {
          modelCounts[event.model] = (modelCounts[event.model] || 0) + 1;
        }
      });
      
      const most_used_model = Object.entries(modelCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

      // Get user budget (default to 500 if not set)
      const budget = 500; // TODO: Fetch from users table

      return {
        total_spend: Math.round(total_spend * 100) / 100,
        budget_tracker: { 
          total_spend: Math.round(total_spend * 100) / 100, 
          budget, 
          status: total_spend < budget ? 'Under Budget' : 'Over Budget' 
        },
        top_prompts,
        most_used_model
      };
      
    } catch (error) {
      console.error('Error fetching cost data:', error);
      return this.getEmptyCostData();
    }
  }

  private getEmptyCostData() {
    return {
      total_spend: 0,
      budget_tracker: { total_spend: 0, budget: 500, status: 'Under Budget' },
      top_prompts: [],
      most_used_model: 'No data'
    };
  }

  private async getRiskAnalysis(promptLogs: any[]) {
    const riskCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const riskTypes: Record<string, number> = {};
    const sourceBreakdown: Record<string, number> = {};
    const flaggedPrompts: Array<{
      id: string;
      excerpt: string;
      risk_level: string;
      risk_type: string;
      source: string;
      captured_at: string;
      model: string;
      cost: number;
    }> = [];

    promptLogs.forEach(log => {
      // Count risk levels
      if (log.risk_level) {
        const riskLevel = log.risk_level.toLowerCase();
        if (riskCounts.hasOwnProperty(riskLevel)) {
          riskCounts[riskLevel as keyof typeof riskCounts]++;
        }
      }

      // Count risk types
      if (log.risk_type) {
        riskTypes[log.risk_type] = (riskTypes[log.risk_type] || 0) + 1;
      }

      // Source breakdown (chrome_extension, desktop_agent, api)
      if (log.source) {
        sourceBreakdown[log.source] = (sourceBreakdown[log.source] || 0) + 1;
      }

      // Collect high-risk prompts
      if (log.risk_level === 'high' || log.risk_level === 'critical') {
        flaggedPrompts.push({
          id: log.id,
          excerpt: log.prompt_text?.substring(0, 100) + '...' || 'N/A',
          risk_level: log.risk_level,
          risk_type: log.risk_type,
          source: log.source,
          captured_at: log.captured_at,
          model: log.model,
          cost: log.usd_cost || 0
        });
      }
    });

    // Sort flagged prompts by cost (highest first) and take top 20
    flaggedPrompts.sort((a, b) => b.cost - a.cost);

    return {
      riskCounts,
      riskTypes,
      sourceBreakdown,
      flaggedPrompts: flaggedPrompts.slice(0, 20), // Top 20 by cost
      totalPrompts: promptLogs.length
    };
  }

  private async getRedactionStats(promptLogs: any[]) {
    let totalPrompts = promptLogs.length;
    let promptsWithPII = 0;
    let totalPIIEvents = 0;
    const riskTypeBreakdown: Record<string, number> = {};
    const redactionSamples: Array<{
      id: string;
      excerpt: string;
      risk_type: string;
      integrity_score: number;
      model: string;
    }> = [];

    promptLogs.forEach(log => {
      // Count PII-related risk types
      if (log.risk_type === 'PII' || log.risk_type === 'Credential Exposure' || log.risk_type === 'Data Leakage') {
        promptsWithPII++;
        totalPIIEvents++;
        riskTypeBreakdown[log.risk_type] = (riskTypeBreakdown[log.risk_type] || 0) + 1;

        // Collect redaction samples (high-risk PII events)
        if (redactionSamples.length < 10 && (log.risk_level === 'high' || log.risk_level === 'medium')) {
          redactionSamples.push({
            id: log.id,
            excerpt: log.prompt_text?.substring(0, 150) + '...' || 'N/A',
            risk_type: log.risk_type,
            integrity_score: log.integrity_score || 0,
            model: log.model
          });
        }
      }
    });

    const piiPercentage = totalPrompts > 0 ? (promptsWithPII / totalPrompts) * 100 : 0;
    
    // Calculate average integrity score as proxy for effectiveness
    const integrityScores = promptLogs.map(log => log.integrity_score || 0).filter(score => score > 0);
    const averageIntegrityScore = integrityScores.length > 0 
      ? integrityScores.reduce((sum, score) => sum + score, 0) / integrityScores.length 
      : 0;

    // Estimate false rates based on integrity scores and risk levels
    const lowIntegrityCount = promptLogs.filter(log => log.integrity_score && log.integrity_score < 60).length;
    const falsePositiveRate = totalPrompts > 0 ? (lowIntegrityCount / totalPrompts) * 2.5 : 0; // Estimated
    const falseNegativeRate = totalPrompts > 0 ? Math.max(0, 5 - averageIntegrityScore / 20) : 0; // Estimated

    return {
      totalPrompts,
      promptsWithPII,
      piiPercentage: Math.round(piiPercentage * 10) / 10,
      totalPIIEvents,
      riskTypeBreakdown,
      redactionSamples,
      averageIntegrityScore: Math.round(averageIntegrityScore * 10) / 10,
      falsePositiveRate: Math.round(falsePositiveRate * 10) / 10,
      falseNegativeRate: Math.round(falseNegativeRate * 10) / 10,
      effectivenessScore: Math.round(averageIntegrityScore * 10) / 10
    };
  }

  private async getControlMappings(promptLogs: any[]) {
    const controlCounts: Record<string, { count: number; status: string; evidence: string[]; framework: string }> = {};
    
    promptLogs.forEach(log => {
      // Map risk types to compliance controls
      const controls = this.mapRiskTypeToControls(log.risk_type, log.risk_level);
      
      controls.forEach(control => {
        if (!controlCounts[control.id]) {
          controlCounts[control.id] = { 
            count: 0, 
            status: 'Met', 
            evidence: [], 
            framework: control.framework 
          };
        }
        controlCounts[control.id].count++;
        controlCounts[control.id].evidence.push(`prompt_event://${log.id}`);
        
        // Determine status based on risk level
        if (log.risk_level === 'high' || log.risk_level === 'critical') {
          controlCounts[control.id].status = 'Partially Met';
        }
      });
    });

    // Convert to array format
    return Object.entries(controlCounts).map(([controlId, data]) => ({
      controlId,
      framework: data.framework,
      status: data.status,
      count: data.count,
      evidence: data.evidence.slice(0, 3) // Limit evidence links
    }));
  }

  private mapRiskTypeToControls(riskType: string, riskLevel: string): Array<{id: string, framework: string}> {
    const controlMappings: Record<string, Array<{id: string, framework: string}>> = {
      'PII': [
        { id: 'NIST-SC-28', framework: 'NIST 800-53' },
        { id: 'NIST-AC-3', framework: 'NIST 800-53' },
        { id: 'LLM02', framework: 'OWASP LLM Top 10' },
        { id: 'CC6.1', framework: 'SOC 2' }
      ],
      'Credential Exposure': [
        { id: 'NIST-IA-5', framework: 'NIST 800-53' },
        { id: 'NIST-AC-2', framework: 'NIST 800-53' },
        { id: 'LLM06', framework: 'OWASP LLM Top 10' },
        { id: 'CC6.2', framework: 'SOC 2' }
      ],
      'Data Leakage': [
        { id: 'NIST-SC-7', framework: 'NIST 800-53' },
        { id: 'NIST-AU-9', framework: 'NIST 800-53' },
        { id: 'LLM02', framework: 'OWASP LLM Top 10' },
        { id: 'CC6.7', framework: 'SOC 2' }
      ],
      'Jailbreak': [
        { id: 'NIST-SC-18', framework: 'NIST 800-53' },
        { id: 'LLM01', framework: 'OWASP LLM Top 10' },
        { id: 'AI-RMF-1.1', framework: 'NIST AI RMF' }
      ],
      'IP': [
        { id: 'NIST-AC-4', framework: 'NIST 800-53' },
        { id: 'LLM02', framework: 'OWASP LLM Top 10' },
        { id: 'CC6.3', framework: 'SOC 2' }
      ],
      'Compliance': [
        { id: 'NIST-AU-12', framework: 'NIST 800-53' },
        { id: 'CC4.1', framework: 'SOC 2' },
        { id: 'AI-RMF-4.1', framework: 'NIST AI RMF' }
      ],
      'Regulatory': [
        { id: 'NIST-PM-1', framework: 'NIST 800-53' },
        { id: 'CC3.1', framework: 'SOC 2' },
        { id: 'AI-RMF-1.2', framework: 'NIST AI RMF' }
      ]
    };

    return controlMappings[riskType] || [
      { id: 'NIST-RA-5', framework: 'NIST 800-53' },
      { id: 'LLM10', framework: 'OWASP LLM Top 10' }
    ];
  }

  private async getAdditionalMetrics(template: string, promptLogs: any[], startDate: string, endDate: string) {
    const metrics: any = {
      reportPeriod: {
        start: startDate,
        end: endDate,
        days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      }
    };

    switch (template) {
      case 'prompt-risk-audit':
        metrics.weeklyTrends = await this.getWeeklyTrends(promptLogs);
        break;
      
      case 'cost-usage-ledger':
        metrics.dailyUsage = await this.getDailyUsage(promptLogs);
        break;
      
      case 'owasp-llm-findings':
        metrics.owaspMapping = await this.getOwaspMapping(promptLogs);
        break;
      
      case 'fedramp-conmon-exec':
        metrics.poamItems = await this.getPOAMItems(promptLogs);
        break;
    }

    return metrics;
  }

  private async getWeeklyTrends(promptLogs: any[]) {
    // Group by week and calculate trends
    const weeklyData: Record<string, { total: number; high: number; medium: number; low: number }> = {};
    
    promptLogs.forEach(log => {
      const week = this.getWeekKey(new Date(log.captured_at));
      if (!weeklyData[week]) {
        weeklyData[week] = { total: 0, high: 0, medium: 0, low: 0 };
      }
      
      weeklyData[week].total++;
      if (log.risk_level === 'high' || log.risk_level === 'critical') {
        weeklyData[week].high++;
      } else if (log.risk_level === 'medium') {
        weeklyData[week].medium++;
      } else {
        weeklyData[week].low++;
      }
    });

    return weeklyData;
  }

  private async getDailyUsage(promptLogs: any[]) {
    const dailyUsage: Record<string, { prompts: number; cost: number; models: Record<string, number> }> = {};
    
    promptLogs.forEach(log => {
      const day = log.captured_at.split('T')[0];
      if (!dailyUsage[day]) {
        dailyUsage[day] = { prompts: 0, cost: 0, models: {} };
      }
      
      dailyUsage[day].prompts++;
      dailyUsage[day].cost += log.usd_cost || 0;
      
      // Count model usage
      const model = log.model || 'Unknown';
      dailyUsage[day].models[model] = (dailyUsage[day].models[model] || 0) + 1;
    });

    return dailyUsage;
  }

  private async getOwaspMapping(promptLogs: any[]) {
    const owaspCounts: Record<string, number> = {};
    
    promptLogs.forEach(log => {
      // Map risk types to OWASP LLM categories
      const owaspCategory = this.mapRiskTypeToOWASP(log.risk_type);
      if (owaspCategory) {
        owaspCounts[owaspCategory] = (owaspCounts[owaspCategory] || 0) + 1;
      }
    });

    return owaspCounts;
  }

  private async getPOAMItems(promptLogs: any[]) {
    const poamItems: Array<{
      controlId: string;
      issue: string;
      targetDate: string;
      priority: string;
    }> = [];
    const highRiskPrompts = promptLogs.filter(log => log.risk_level === 'high' || log.risk_level === 'critical');
    
    // Group by risk type and create POAM items
    const riskTypeCounts: Record<string, number> = {};
    highRiskPrompts.forEach(log => {
      if (log.risk_type) {
        riskTypeCounts[log.risk_type] = (riskTypeCounts[log.risk_type] || 0) + 1;
      }
    });

    Object.entries(riskTypeCounts).forEach(([riskType, count]) => {
      if (count > 2) { // Only create POAM for risk types with multiple issues
        const controls = this.mapRiskTypeToControls(riskType, 'high');
        controls.forEach(control => {
          poamItems.push({
            controlId: control.id,
            issue: `${count} high-risk ${riskType} prompts detected`,
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
            priority: count > 5 ? 'High' : 'Medium'
          });
        });
      }
    });

    return poamItems;
  }

  // Helper methods
  private mapRedactionTypeToRisk(type: string): string {
    const mapping: Record<string, string> = {
      'EMAIL': 'PII Leakage',
      'SSN': 'PII Leakage',
      'PHONE': 'PII Leakage',
      'NAME': 'PII Leakage',
      'API_KEY': 'Credential Exposure',
      'PASSWORD': 'Credential Exposure',
      'TOKEN': 'Credential Exposure',
      'SENSITIVE_DATA': 'Internal Asset Disclosure',
      'JAILBREAK': 'Jailbreak Attempt'
    };
    
    return mapping[type] || 'Other';
  }

  private getFrameworkFromControlId(controlId: string): string {
    if (controlId.startsWith('NIST-') || controlId.includes('AC-') || controlId.includes('SC-')) return 'NIST 800-53';
    if (controlId.includes('LLM')) return 'OWASP LLM Top 10';
    if (controlId.includes('SOC')) return 'SOC 2';
    if (controlId.includes('ISO')) return 'ISO 27001';
    if (controlId.includes('FedRAMP')) return 'FedRAMP';
    return 'Other';
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private estimatePromptCost(prompt: string, model: string): number {
    const tokenCount = Math.ceil(prompt.length / 4); // Rough estimation
    const pricing: Record<string, number> = {
      'GPT-4o': 0.000003,
      'Claude 3 Opus': 0.000015,
      'Gemini 1.5 Pro': 0.0000035
    };
    
    return tokenCount * (pricing[model] || 0.000003);
  }

  private mapRiskTypeToOWASP(riskType: string): string | null {
    const mapping: Record<string, string> = {
      'Jailbreak': 'LLM01',
      'PII': 'LLM02', 
      'Data Leakage': 'LLM02',
      'IP': 'LLM02',
      'Credential Exposure': 'LLM06',
      'Compliance': 'LLM09',
      'Regulatory': 'LLM09'
    };
    
    return mapping[riskType] || null;
  }

  private getEmptyReportData(): ReportData {
    return {
      promptLogs: [],
      costData: { total_spend: 0, budget_tracker: { total_spend: 0, budget: 500, status: 'Under Budget' }, top_prompts: [], most_used_model: 'No data' },
      riskAnalysis: { riskCounts: { critical: 0, high: 0, medium: 0, low: 0 }, riskTypes: {}, sourceBreakdown: {}, flaggedPrompts: [], totalPrompts: 0 },
      redactionStats: { totalPrompts: 0, promptsWithPII: 0, piiPercentage: 0, totalPIIEvents: 0, riskTypeBreakdown: {}, redactionSamples: [], averageIntegrityScore: 0, falsePositiveRate: 0, falseNegativeRate: 0, effectivenessScore: 0 },
      controlMappings: [],
      additionalMetrics: {}
    };
  }
}

export const reportDataService = new ReportDataService();
export type { ReportData, DateRange }; 