interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ReportGenerationRequest {
  template: string;
  data: any;
  dateRange?: {
    start: string;
    end: string;
  };
  project?: string;
}

interface ReportSection {
  title: string;
  content: string;
  data?: any;
}

class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'anthropic/claude-3.5-sonnet' // High-quality model for report generation
    };
  }

  async generateReport(request: ReportGenerationRequest): Promise<ReportSection[]> {
    const { template, data, dateRange, project } = request;
    
    // Get the appropriate template and system prompt
    const templateConfig = this.getTemplateConfig(template);
    const systemPrompt = this.buildSystemPrompt(templateConfig, dateRange, project);
    const userPrompt = this.buildUserPrompt(template, data);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://complyze.co',
          'X-Title': 'Complyze Compliance Reports'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1, // Low temperature for consistent, factual reports
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const generatedContent = result.choices[0]?.message?.content;

      if (!generatedContent) {
        throw new Error('No content generated from OpenRouter');
      }

      // Parse the generated content into sections
      return this.parseGeneratedContent(generatedContent, template);

    } catch (error) {
      console.error('OpenRouter service error:', error);
      // Return fallback content if OpenRouter fails
      return this.getFallbackSections(template, data);
    }
  }

  private getTemplateConfig(template: string) {
    const configs = {
      'framework-coverage-matrix': {
        title: 'Framework Coverage Matrix',
        frameworks: ['NIST 800-53', 'FedRAMP', 'ISO 27001'],
        sections: ['Executive Summary', 'Control Mapping Table', 'Coverage Analysis', 'Recommendations']
      },
      'prompt-risk-audit': {
        title: 'Weekly Prompt Risk Audit',
        frameworks: ['NIST AI RMF', 'OWASP LLM Top 10'],
        sections: ['Executive Summary', 'Risk Histogram', 'Top Flagged Prompts', 'Trend Analysis', 'Recommendations']
      },
      'redaction-effectiveness': {
        title: 'Redaction Effectiveness Report',
        frameworks: ['NIST AI RMF', 'SOC 2'],
        sections: ['Executive Summary', 'Effectiveness Metrics', 'Redaction Samples', 'False Positive Analysis', 'Recommendations']
      },
      'fedramp-conmon-exec': {
        title: 'FedRAMP Continuous Monitoring Executive Summary',
        frameworks: ['FedRAMP'],
        sections: ['Executive Summary', 'Control Status Heatmap', 'Open POA&M Items', 'Monthly Coverage', 'Risk Assessment']
      },
      'cost-usage-ledger': {
        title: 'Cost & Usage Ledger',
        frameworks: ['NIST 800-53 AT-2', 'AU-6'],
        sections: ['Executive Summary', 'Usage Breakdown', 'Cost Analysis', 'Budget Tracking', 'Projections']
      },
      'ai-rmf-profile': {
        title: 'NIST AI RMF Compliance Profile',
        frameworks: ['NIST AI RMF'],
        sections: ['GOVERN', 'MAP', 'MEASURE', 'MANAGE', 'Evidence Links']
      },
      'owasp-llm-findings': {
        title: 'OWASP LLM Top 10 Findings Summary',
        frameworks: ['OWASP LLM Top 10'],
        sections: ['Executive Summary', 'Risk Distribution', 'Detailed Findings', 'Remediation Plan', 'Detection Sources']
      },
      'soc2-evidence-pack': {
        title: 'SOC 2 Type II Evidence Pack',
        frameworks: ['SOC 2'],
        sections: ['Executive Summary', 'Sampled Prompts', 'Control Mappings', 'Audit Trail', 'Monthly Comparison']
      }
    };

    return configs[template as keyof typeof configs] || configs['framework-coverage-matrix'];
  }

  private buildSystemPrompt(templateConfig: any, dateRange?: any, project?: string): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const projectName = project || 'Complyze AI Compliance';
    
    return `You are a compliance and cybersecurity expert generating ${templateConfig.title} reports for ${projectName}.

CONTEXT:
- Report Date: ${currentDate}
- Date Range: ${dateRange ? `${dateRange.start} to ${dateRange.end}` : 'Current period'}
- Frameworks: ${templateConfig.frameworks.join(', ')}
- Data Source: Chrome extension prompt monitoring and redaction system

REQUIREMENTS:
1. Generate professional compliance report sections
2. Use actual data provided in user prompt
3. Include specific metrics, counts, and evidence links
4. Follow compliance reporting standards
5. Provide actionable recommendations
6. Use markdown formatting for tables and structure
7. Include risk assessments where appropriate

SECTIONS TO GENERATE:
${templateConfig.sections.map((section: string, index: number) => `${index + 1}. ${section}`).join('\n')}

OUTPUT FORMAT:
Return each section with clear headers using this format:
## Section Name
[Content here with tables, metrics, and analysis]

Use tables for data presentation and include specific evidence references like "promptlog://uuid-[id]" for traceability.`;
  }

  private buildUserPrompt(template: string, data: any): string {
    return `Generate a ${template} report using the following real data from our Chrome extension prompt monitoring system:

PROMPT LOGS DATA:
${JSON.stringify(data.promptLogs || [], null, 2)}

COST DATA:
${JSON.stringify(data.costData || {}, null, 2)}

RISK ANALYSIS:
${JSON.stringify(data.riskAnalysis || {}, null, 2)}

REDACTION STATS:
${JSON.stringify(data.redactionStats || {}, null, 2)}

CONTROL MAPPINGS:
${JSON.stringify(data.controlMappings || [], null, 2)}

ADDITIONAL METRICS:
${JSON.stringify(data.additionalMetrics || {}, null, 2)}

Please analyze this data and generate a comprehensive compliance report with specific metrics, evidence links, and actionable recommendations. Include actual numbers from the data and create professional tables where appropriate.`;
  }

  private parseGeneratedContent(content: string, template: string): ReportSection[] {
    const sections: ReportSection[] = [];
    const sectionRegex = /## (.+?)\n([\s\S]*?)(?=## |$)/g;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const title = match[1].trim();
      const sectionContent = match[2].trim();
      
      sections.push({
        title,
        content: sectionContent,
        data: this.extractDataFromSection(sectionContent)
      });
    }

    // If no sections found, create a single section with all content
    if (sections.length === 0) {
      sections.push({
        title: 'Generated Report',
        content: content,
        data: {}
      });
    }

    return sections;
  }

  private extractDataFromSection(content: string): any {
    // Extract structured data from markdown tables and lists
    const data: any = {};
    
    // Extract tables
    const tableRegex = /\|(.+?)\|\n\|[-\s|]+\|\n((?:\|.+?\|\n?)+)/g;
    let tableMatch;
    const tables = [];
    
    while ((tableMatch = tableRegex.exec(content)) !== null) {
      const headers = tableMatch[1].split('|').map(h => h.trim()).filter(h => h);
      const rows = tableMatch[2].split('\n').filter(row => row.includes('|'));
      
      const tableData = rows.map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = cells[index] || '';
        });
        return rowData;
      });
      
      tables.push({ headers, data: tableData });
    }
    
    if (tables.length > 0) {
      data.tables = tables;
    }
    
    return data;
  }

  private getFallbackSections(template: string, data: any): ReportSection[] {
    // Provide basic fallback content if OpenRouter fails
    const fallbackSections = {
      'framework-coverage-matrix': [
        {
          title: 'Executive Summary',
          content: `Framework Coverage Matrix Report\nGenerated: ${new Date().toLocaleDateString()}\n\nThis report analyzes control coverage across compliance frameworks based on prompt monitoring data.`,
          data: {}
        },
        {
          title: 'Control Mapping Table',
          content: '| Control ID | Framework | Status | Evidence Source |\n|------------|-----------|--------|----------------|\n| Loading... | Loading... | Loading... | Loading... |',
          data: {}
        }
      ],
      'prompt-risk-audit': [
        {
          title: 'Executive Summary',
          content: `Weekly Prompt Risk Audit\nPeriod: ${new Date().toLocaleDateString()}\n\nRisk analysis of prompts captured through Chrome extension monitoring.`,
          data: {}
        }
      ]
    };

    return fallbackSections[template as keyof typeof fallbackSections] || fallbackSections['framework-coverage-matrix'];
  }
}

export const openRouterService = new OpenRouterService();
export type { ReportGenerationRequest, ReportSection }; 