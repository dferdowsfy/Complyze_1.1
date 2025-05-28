import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/lib/openRouterService';
import { reportDataService } from '@/lib/reportDataService';

export async function POST(req: NextRequest) {
  try {
    const { template, dateRange, project, format, userId } = await req.json();
    
    console.log(`Generating ${template} report with OpenRouter LLM...`);
    
    // Validate template
    const validTemplates = [
      'framework-coverage-matrix',
      'prompt-risk-audit', 
      'redaction-effectiveness',
      'fedramp-conmon-exec',
      'cost-usage-ledger',
      'ai-rmf-profile',
      'owasp-llm-findings',
      'soc2-evidence-pack'
    ];
    
    if (!validTemplates.includes(template)) {
      return NextResponse.json({ 
        error: 'Invalid template', 
        validTemplates 
      }, { status: 400 });
    }

    // Aggregate real data from extension and database
    const reportData = await reportDataService.aggregateReportData(
      template, 
      dateRange, 
      userId
    );

    console.log(`Data aggregated: ${reportData.promptLogs.length} prompts, ${Object.keys(reportData.riskAnalysis.riskTypes).length} risk types`);

    // Generate report using OpenRouter LLM
    const sections = await openRouterService.generateReport({
      template,
      data: reportData,
      dateRange,
      project: project || 'Complyze AI Compliance'
    });

    console.log(`Report generated with ${sections.length} sections`);

    // Format response based on requested format
    let response: any = {
      template,
      dateRange,
      project: project || 'Complyze AI Compliance',
      generatedAt: new Date().toISOString(),
      dataSource: {
        promptCount: reportData.promptLogs.length,
        dateRange: reportData.additionalMetrics.reportPeriod,
        riskBreakdown: reportData.riskAnalysis.riskCounts
      },
      sections
    };

    if (format === 'html') {
      response.html = sections.map(section => 
        `<div class="report-section">
          <h2>${section.title}</h2>
          <div class="content">${section.content.replace(/\n/g, '<br>')}</div>
        </div>`
      ).join('\n');
    }

    if (format === 'markdown') {
      response.markdown = sections.map(section => 
        `## ${section.title}\n\n${section.content}\n\n`
      ).join('');
    }

    if (format === 'json') {
      response.json = {
        metadata: {
          template,
          generatedAt: new Date().toISOString(),
          dataSource: response.dataSource
        },
        sections: sections.map(section => ({
          title: section.title,
          content: section.content,
          data: section.data
        })),
        rawData: reportData
      };
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Report generation error:', error);
    
    // Return fallback response with error details
    return NextResponse.json({
      error: 'Report generation failed',
      details: error.message,
      fallback: true,
      template: 'unknown',
      sections: [
        {
          title: 'Error',
          content: `Report generation failed: ${error.message}\n\nPlease check your OpenRouter API configuration and try again.`,
          data: {}
        }
      ]
    }, { status: 500 });
  }
} 