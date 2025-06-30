import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/lib/openRouterService';
import { reportDataService } from '@/lib/reportDataService';

export async function POST(req: NextRequest) {
  try {
    const { template, dateRange, project, format, userId, prompts } = await req.json();
    
    console.log(`Generating ${template} report for ${dateRange?.start || 'N/A'} to ${dateRange?.end || 'N/A'}...`);
    
    // Validate template
    const validTemplates = [
      "exec-ai-risk-summary",
      "prompt-risk-audit-log",
      "redaction-effectiveness",
      "framework-coverage-matrix",
      "usage-cost-dashboard",
      "continuous-monitoring",
      "llm-governance-policy",
      "ai-threat-intelligence",
    ];
    
    if (!validTemplates.includes(template)) {
      return NextResponse.json({ 
        error: 'Invalid template', 
        validTemplates 
      }, { status: 400 });
    }

    // Validate date range
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return NextResponse.json({ 
        error: 'Missing date range. Both start and end dates are required.' 
      }, { status: 400 });
    }

    // Validate date format and logic
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format. Use YYYY-MM-DD format.' 
      }, { status: 400 });
    }
    
    if (startDate > endDate) {
      return NextResponse.json({ 
        error: 'Start date must be before end date.' 
      }, { status: 400 });
    }

    // Add time components to ensure full day coverage
    const startDateTime = dateRange.start + 'T00:00:00.000Z';
    const endDateTime = dateRange.end + 'T23:59:59.999Z';

    console.log(`Fetching data for user ${userId} from ${startDateTime} to ${endDateTime}`);

    let reportData;
    if (prompts) {
      console.log(`Using ${prompts.length} provided prompts for report generation.`);
      // If prompts are provided, filter them by the date range on the server
      const startDate = new Date(startDateTime);
      const endDate = new Date(endDateTime);
      const filteredPrompts = prompts.filter((p: any) => {
        const promptDate = new Date(p.captured_at);
        return promptDate >= startDate && promptDate <= endDate;
      });
      // Use a simplified aggregation if prompts are passed directly
      reportData = await reportDataService.aggregateReportDataFromPrompts(filteredPrompts, template);

    } else {
       // Aggregate real data from database with time filtering
      console.log(`Querying database for prompts for user ${userId}.`);
      reportData = await reportDataService.aggregateReportData(
        template, 
        { start: startDateTime, end: endDateTime }, 
        userId
      );
    }

    const promptCount = reportData.promptLogs?.length || 0;
    const totalCost = reportData.costData?.total_spend || 0;
    
    console.log(`Data aggregated: ${promptCount} prompts, $${totalCost.toFixed(2)} total cost, ${Object.keys(reportData.riskAnalysis?.riskTypes || {}).length} risk types`);

    if (promptCount === 0) {
      return NextResponse.json({
        template,
        dateRange,
        project: project || 'Complyze AI Compliance',
        generatedAt: new Date().toISOString(),
        dataSource: {
          promptCount: 0,
          dateRange: { start: dateRange.start, end: dateRange.end },
          riskBreakdown: {},
          totalCost: 0,
          message: 'No data found for the specified date range'
        },
        sections: [
          {
            title: 'No Data Available',
            content: `No prompt events found for the date range ${dateRange.start} to ${dateRange.end}.\n\nThis could mean:\n- The Chrome extension hasn't been used during this period\n- Data hasn't been synced to the database yet\n- The specified date range is outside of available data\n\nTry selecting a different date range or check that the Chrome extension is properly configured.`,
            data: {}
          }
        ]
      }, { status: 200 });
    }

    // Generate report using OpenRouter LLM with time-filtered data
    const sections = await openRouterService.generateReport({
      template,
      data: reportData,
      dateRange: { start: dateRange.start, end: dateRange.end },
      project: project || 'Complyze AI Compliance'
    });

    console.log(`Report generated with ${sections.length} sections`);

    // Calculate days in range for context
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Format response with comprehensive data source info
    const response = {
      template,
      dateRange: { start: dateRange.start, end: dateRange.end },
      project: project || 'Complyze AI Compliance',
      generatedAt: new Date().toISOString(),
      dataSource: {
        promptCount,
        totalCost,
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        daysCovered: daysDiff,
        riskBreakdown: reportData.riskAnalysis?.riskCounts || {},
        topRiskTypes: Object.entries(reportData.riskAnalysis?.riskTypes || {})
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([type, count]) => ({ type, count })),
        sourceBreakdown: reportData.riskAnalysis?.sourceBreakdown || {},
        timeFiltered: true,
        databaseQuery: {
          table: 'prompt_events',
          filters: ['captured_at', 'user_id'],
          startTime: startDateTime,
          endTime: endDateTime
        }
      },
      sections
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Report generation error:', error);
    
    // Return detailed error information
    return NextResponse.json({
      error: 'Report generation failed',
      details: error.message,
      fallback: true,
      template: 'unknown',
      timestamp: new Date().toISOString(),
      sections: [
        {
          title: 'Error',
          content: `Report generation failed: ${error.message}\n\nTroubleshooting steps:\n1. Check your OpenRouter API key configuration\n2. Verify database connectivity\n3. Ensure the date range contains data\n4. Check browser console for additional details`,
          data: { error: error.message, stack: error.stack }
        }
      ]
    }, { status: 500 });
  }
} 