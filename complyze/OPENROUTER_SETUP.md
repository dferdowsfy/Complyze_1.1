# OpenRouter Setup for AI-Powered Reports

This guide explains how to set up OpenRouter API integration for generating intelligent compliance reports using real data from the Chrome extension.

## Overview

The new reports system uses:
- **Real data** from your Chrome extension prompt monitoring
- **OpenRouter LLM** (Claude 3.5 Sonnet) for intelligent report generation
- **Compliance templates** for NIST, FedRAMP, SOC 2, OWASP, and more

## Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-your-api-key-here

# Optional: Custom model (defaults to claude-3.5-sonnet)
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### 3. Restart Development Server

```bash
cd complyze
npm run dev
```

## Available Report Templates

The system now supports 8 compliance report templates:

### 1. Framework Coverage Matrix
- **Frameworks:** NIST 800-53, FedRAMP, ISO 27001
- **Content:** Control mappings, evidence links, coverage analysis

### 2. Weekly Prompt Risk Audit  
- **Frameworks:** NIST AI RMF, OWASP LLM Top 10
- **Content:** Risk histogram, flagged prompts, trend analysis

### 3. Redaction Effectiveness Report
- **Frameworks:** NIST AI RMF, SOC 2
- **Content:** PII detection rates, false positive/negative analysis

### 4. FedRAMP Continuous Monitoring
- **Frameworks:** FedRAMP
- **Content:** Control status heatmap, POA&M items, coverage metrics

### 5. Cost & Usage Ledger
- **Frameworks:** NIST 800-53 AT-2, AU-6
- **Content:** Token usage, cost breakdown, budget tracking

### 6. NIST AI RMF Profile
- **Frameworks:** NIST AI RMF
- **Content:** GOVERN, MAP, MEASURE, MANAGE sections with evidence

### 7. OWASP LLM Top 10 Findings
- **Frameworks:** OWASP LLM Top 10
- **Content:** Risk distribution, detailed findings, remediation plans

### 8. SOC 2 Type II Evidence Pack
- **Frameworks:** SOC 2
- **Content:** Sampled prompts, control mappings, audit trails

## How It Works

1. **Data Collection:** System aggregates real data from `prompt_logs` table
2. **Risk Analysis:** Analyzes redaction patterns, risk levels, and control mappings
3. **LLM Generation:** Sends structured data to OpenRouter for intelligent report generation
4. **Template Formatting:** Formats output according to compliance standards

## Export Formats

Each report can be exported in multiple formats:
- **PDF** - Professional compliance documents
- **Word Doc** - Editable compliance reports  
- **JSON Bundle** - Raw data + structured content
- **Share Link** - Shareable report URLs

## Data Sources

Reports are generated from real extension data:
- Prompt logs with redaction details
- Risk assessments and control mappings
- Cost and usage analytics
- Platform and model usage patterns

## Troubleshooting

### Common Issues

**Error: "OpenRouter API error"**
- Check your API key is correct
- Verify you have credits in your OpenRouter account
- Ensure the API key has proper permissions

**Error: "No data available"**
- Use the Chrome extension to generate some prompt data
- Check the date range includes periods with extension usage
- Verify the database connection is working

**Reports showing "Loading..."**
- Check browser console for API errors
- Verify OpenRouter service is responding
- Try refreshing the page

### Support

For issues with:
- **OpenRouter API:** Contact OpenRouter support
- **Report Generation:** Check browser console logs
- **Data Integration:** Verify Chrome extension is logging data

## Cost Considerations

OpenRouter pricing for Claude 3.5 Sonnet:
- Input: ~$3 per 1M tokens
- Output: ~$15 per 1M tokens
- Typical report: ~2,000 tokens = $0.03-0.05 per report

Monitor usage in your OpenRouter dashboard to track costs. 