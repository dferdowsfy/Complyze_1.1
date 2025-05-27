import { NextRequest, NextResponse } from 'next/server';

const DUMMY_REPORTS = {
  'framework-coverage-matrix': {
    html: '<h2>Framework Coverage Matrix</h2><p>Dummy HTML for Framework Coverage Matrix.</p>',
    json: { controls: [{ id: 'SC-28', status: 'Met' }, { id: 'AC-3', status: 'Partially Met' }] },
  },
  'prompt-risk-audit': {
    html: '<h2>Prompt Risk Audit</h2><p>Dummy HTML for Prompt Risk Audit.</p>',
    json: { risks: [{ id: 1, level: 'high' }, { id: 2, level: 'medium' }] },
  },
  'redaction-effectiveness': {
    html: '<h2>Redaction Effectiveness</h2><p>Dummy HTML for Redaction Effectiveness.</p>',
    json: { redactionStats: { percentPII: 12, falsePos: 2, falseNeg: 1 } },
  },
  'fedramp-conmon-exec': {
    html: '<h2>FedRAMP ConMon Exec Summary</h2><p>Dummy HTML for FedRAMP ConMon Exec Summary.</p>',
    json: { conmon: { openPOAM: 2, coverage: 95 } },
  },
  'cost-usage-ledger': {
    html: '<h2>Cost & Usage Ledger</h2><p>Dummy HTML for Cost & Usage Ledger.</p>',
    json: { usage: { tokens: 1200000, cost: 24, budgetDelta: -6 } },
  },
  'ai-rmf-profile': {
    html: '<h2>AI RMF Profile</h2><p>Dummy HTML for AI RMF Profile.</p>',
    json: { rmf: { GOVERN: {}, MAP: {}, MEASURE: {}, MANAGE: {} } },
  },
  'owasp-llm-findings': {
    html: '<h2>OWASP LLM Top-10 Findings</h2><p>Dummy HTML for OWASP LLM Top-10 Findings.</p>',
    json: { owasp: { LLM01: 3, LLM02: 1 } },
  },
  'soc2-evidence-pack': {
    html: '<h2>SOC 2 Evidence Pack</h2><p>Dummy HTML for SOC 2 Evidence Pack.</p>',
    json: { soc2: { sampled: 10, mapped: 8 } },
  },
};

export async function POST(req: NextRequest) {
  const { template, dateRange, project, format } = await req.json();
  const data = DUMMY_REPORTS[template] || DUMMY_REPORTS['framework-coverage-matrix'];
  return NextResponse.json({
    html: data.html,
    json: data.json,
    template,
    dateRange,
    project,
    format,
  });
} 