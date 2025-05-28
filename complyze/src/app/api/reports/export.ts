import { NextRequest, NextResponse } from 'next/server';
import { openRouterService } from '@/lib/openRouterService';
import { reportDataService } from '@/lib/reportDataService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const userId = searchParams.get('userId');

    if (!id || !format) {
      return NextResponse.json({ error: 'Missing required parameters: id, format' }, { status: 400 });
    }

    console.log(`Exporting ${id} report in ${format} format...`);

    // Set up date range
    const dateRange = start && end ? { start, end } : undefined;

    // Generate the report data
    const reportData = await reportDataService.aggregateReportData(id, dateRange, userId || undefined);
    const sections = await openRouterService.generateReport({
      template: id,
      data: reportData,
      dateRange,
      project: 'Complyze AI Compliance'
    });

    const reportTitle = getReportTitle(id);
    const currentDate = new Date().toLocaleDateString();

    if (format === 'json') {
      const jsonData = {
        metadata: {
          template: id,
          title: reportTitle,
          generatedAt: new Date().toISOString(),
          dateRange: dateRange || { start: 'N/A', end: 'N/A' },
          dataSource: {
            promptCount: reportData.promptLogs.length,
            riskBreakdown: reportData.riskAnalysis.riskCounts
          }
        },
        sections: sections.map(section => ({
          title: section.title,
          content: section.content,
          data: section.data
        })),
        rawData: {
          promptLogs: reportData.promptLogs,
          costData: reportData.costData,
          riskAnalysis: reportData.riskAnalysis,
          redactionStats: reportData.redactionStats,
          controlMappings: reportData.controlMappings
        }
      };

      return NextResponse.json(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${id}-${currentDate}.json"`,
        },
      });
    }

    if (format === 'markdown') {
      const markdownContent = generateMarkdown(reportTitle, sections, reportData, dateRange);
      const buffer = Buffer.from(markdownContent, 'utf-8');
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${id}-${currentDate}.md"`,
        },
      });
    }

    if (format === 'html') {
      const htmlContent = generateHTML(reportTitle, sections, reportData, dateRange);
      const buffer = Buffer.from(htmlContent, 'utf-8');
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${id}-${currentDate}.html"`,
        },
      });
    }

    if (format === 'pdf' || format === 'docx') {
      // For PDF and DOCX, we'll generate HTML and return it with appropriate headers
      // In a production environment, you'd use libraries like puppeteer (PDF) or docx (Word)
      const htmlContent = generateHTML(reportTitle, sections, reportData, dateRange);
      const buffer = Buffer.from(htmlContent, 'utf-8');
      
      let contentType = 'text/html';
      let fileName = `${id}-${currentDate}.html`;
      
      if (format === 'pdf') {
        contentType = 'application/pdf';
        fileName = `${id}-${currentDate}.pdf`;
      } else if (format === 'docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileName = `${id}-${currentDate}.docx`;
      }

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Export failed', 
      details: error.message 
    }, { status: 500 });
  }
}

function getReportTitle(templateId: string): string {
  const titles: Record<string, string> = {
    'framework-coverage-matrix': 'Framework Coverage Matrix',
    'prompt-risk-audit': 'Weekly Prompt Risk Audit',
    'redaction-effectiveness': 'Redaction Effectiveness Report',
    'fedramp-conmon-exec': 'FedRAMP Continuous Monitoring Executive Summary',
    'cost-usage-ledger': 'Cost & Usage Ledger',
    'ai-rmf-profile': 'NIST AI RMF Compliance Profile',
    'owasp-llm-findings': 'OWASP LLM Top 10 Findings Summary',
    'soc2-evidence-pack': 'SOC 2 Type II Evidence Pack'
  };
  
  return titles[templateId] || 'Compliance Report';
}

function generateMarkdown(title: string, sections: any[], reportData: any, dateRange?: any): string {
  const currentDate = new Date().toLocaleDateString();
  const dateRangeStr = dateRange ? `${dateRange.start} to ${dateRange.end}` : 'Current period';
  
  let markdown = `# ${title}\n\n`;
  markdown += `**Generated:** ${currentDate}\n`;
  markdown += `**Date Range:** ${dateRangeStr}\n`;
  markdown += `**Data Source:** Chrome Extension Prompt Monitoring\n`;
  markdown += `**Prompts Analyzed:** ${reportData.promptLogs.length}\n\n`;
  
  markdown += `---\n\n`;
  
  sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    markdown += `${section.content}\n\n`;
  });
  
  markdown += `---\n\n`;
  markdown += `*This report was generated automatically using real data from the Complyze Chrome extension and OpenRouter LLM analysis.*\n`;
  
  return markdown;
}

function generateHTML(title: string, sections: any[], reportData: any, dateRange?: any): string {
  const currentDate = new Date().toLocaleDateString();
  const dateRangeStr = dateRange ? `${dateRange.start} to ${dateRange.end}` : 'Current period';
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #0E1E36; border-bottom: 3px solid #FF6F3C; padding-bottom: 10px; }
        h2 { color: #0E1E36; margin-top: 30px; }
        h3 { color: #555; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
        .metadata strong { color: #0E1E36; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .section { margin-bottom: 40px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-style: italic; color: #666; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="metadata">
        <strong>Generated:</strong> ${currentDate}<br>
        <strong>Date Range:</strong> ${dateRangeStr}<br>
        <strong>Data Source:</strong> Chrome Extension Prompt Monitoring<br>
        <strong>Prompts Analyzed:</strong> ${reportData.promptLogs.length}
    </div>
`;

  sections.forEach(section => {
    html += `    <div class="section">
        <h2>${section.title}</h2>
        <div>${formatContentForHTML(section.content)}</div>
    </div>
`;
  });

  html += `    <div class="footer">
        <p>This report was generated automatically using real data from the Complyze Chrome extension and OpenRouter LLM analysis.</p>
    </div>
</body>
</html>`;

  return html;
}

function formatContentForHTML(content: string): string {
  return content
    .split('\n')
    .map(line => {
      // Handle markdown tables
      if (line.includes('|')) {
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length > 0) {
          const isHeader = line.includes('---');
          if (isHeader) return ''; // Skip separator rows
          const tag = cells.every(cell => cell.includes('Control') || cell.includes('Framework')) ? 'th' : 'td';
          return `<tr>${cells.map(cell => `<${tag}>${cell}</${tag}>`).join('')}</tr>`;
        }
      }
      
      // Handle headers
      if (line.startsWith('###')) {
        return `<h4>${line.replace('###', '').trim()}</h4>`;
      }
      if (line.startsWith('##')) {
        return `<h3>${line.replace('##', '').trim()}</h3>`;
      }
      
      // Handle bullet points
      if (line.trim().startsWith('-')) {
        return `<li>${line.replace('-', '').trim()}</li>`;
      }
      
      // Regular paragraphs
      return line.trim() ? `<p>${line}</p>` : '<br>';
    })
    .join('\n');
} 