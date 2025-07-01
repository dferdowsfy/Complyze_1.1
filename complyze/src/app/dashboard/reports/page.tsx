"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PromptRiskAssessmentReport from "@/app/components/PromptRiskAssessmentReport";
import ExecutiveAIRiskSummary from "@/app/components/ExecutiveAIRiskSummary";
import AuditLogReport from "@/app/components/AuditLogReport";
import RedactionEffectivenessReport from "@/app/components/RedactionEffectivenessReport";
import FrameworkCoverageMatrix from "@/app/components/FrameworkCoverageMatrix";
import RiskAssessmentDashboard from "@/app/components/RiskAssessmentDashboard";
import UsageCostDashboard from "@/app/components/UsageCostDashboard";
import ContinuousMonitoring from "@/app/components/ContinuousMonitoring";
import LLMGovernancePolicyAdherence from "@/app/components/LLMGovernancePolicyAdherence";

// New Report Templates
const TEMPLATES = [
  {
    id: "exec-ai-risk-summary",
    name: "🔐 1. Executive AI Risk & Compliance Summary",
    description: "High-level overview of organizational LLM usage, redaction events, flagged risks, and compliance status.",
    frameworks: ["NIST AI RMF", "ISO", "SOC 2"],
    gradient: "linear-gradient(109.6deg, rgba(157, 75, 199, 1) 11.2%, rgba(119, 81, 204, 1) 83.1%)"
  },
  {
    id: "prompt-risk-audit-log",
    name: "🛡️ 2. Prompt Risk Audit Log",
    description: "Shows flagged prompts, types of violations, and actions taken.",
    frameworks: ["PII", "PHI", "Credentials", "HIPAA"],
    gradient: "linear-gradient(109.6deg, rgba(62, 161, 219, 1) 11.2%, rgba(93, 52, 236, 1) 100.2%)"
  },
  {
    id: "redaction-effectiveness",
    name: "📊 3. Redaction Effectiveness Report",
    description: "Evaluate the performance of structured redaction and smart rewrite features.",
    frameworks: ["Accuracy", "PII", "Performance"],
    gradient: "linear-gradient(109.6deg, rgba(48, 207, 208, 1) 11.2%, rgba(51, 8, 103, 1) 92.5%)"
  },
  {
    id: "framework-coverage-matrix",
    name: "🔍 4. Framework Coverage Matrix",
    description: "Map prompt behavior and mitigation actions to specific security controls.",
    frameworks: ["NIST AI RMF", "FedRAMP", "SOC 2", "HIPAA"],
    gradient: "linear-gradient(109.6deg, rgba(245, 95, 42, 1) 11.2%, rgba(255, 14, 14, 1) 92.5%)"
  },
  {
    id: "usage-cost-dashboard",
    name: "📈 5. Usage & Cost Dashboard",
    description: "Track model/token usage, cost controls, and user adoption.",
    frameworks: ["OpenAI", "Claude", "Gemini", "Cost Control"],
    gradient: "linear-gradient(109.6deg, rgba(255, 107, 107, 1) 11.2%, rgba(255, 93, 208, 1) 98.6%)"
  },
  {
    id: "continuous-monitoring",
    name: "🔄 6. Continuous Monitoring & POA&M",
    description: "Support FedRAMP/SOC 2/NIST continuous monitoring and open issues.",
    frameworks: ["FedRAMP", "SOC 2", "NIST"],
    gradient: "linear-gradient(109.6deg, rgba(23, 179, 187, 1) 11.2%, rgba(25, 25, 25, 1) 91.1%)"
  },
  {
    id: "llm-governance-policy",
    name: "🧠 7. LLM Governance Policy Adherence",
    description: "Ensure employees comply with internal LLM usage policies.",
    frameworks: ["Internal Policy", "Compliance", "Security"],
    gradient: "linear-gradient(109.6deg, rgba(119, 44, 232, 1) 11.2%, rgba(119, 44, 232, 1) 11.2%, rgba(103, 4, 112, 1) 78.9%)"
  },
  {
    id: "ai-threat-intelligence",
    name: "🤖 8. AI Threat Intelligence Report",
    description: "Inform CISO about emerging LLM-specific threats and platform response.",
    frameworks: ["OWASP LLM Top 10", "Threat Intel", "NIST AI RMF"],
    gradient: "linear-gradient(109.6deg, rgba(12, 12, 12, 1) 11.2%, rgba(12, 12, 12, 1) 11.2%, rgba(102, 34, 34, 1) 78.9%)"
  }
];

function FrameworkPill({ fw }: { fw: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1 border border-white/50 text-white/90"
    >
      {fw}
    </span>
  );
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    frameworks: string[];
    gradient: string;
  };
  selected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  return (
    <div
      className={`text-white shadow-lg p-4 rounded-xl hover:ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 cursor-pointer mb-4 border-2 border-transparent transition-all duration-300 transform hover:-translate-y-1 ${selected ? "ring-2 ring-cyan-400 border-cyan-400" : ""}`}
      style={{ background: template.gradient }}
      onClick={() => {
        console.log(`--- TEMPLATE CARD CLICKED: ${template.id} ---`);
        onClick();
      }}
    >
      <h3 className="font-bold text-lg mb-2">{template.name}</h3>
      <p className="text-sm text-white/80 mb-3 h-20">{template.description}</p>
      <div className="flex flex-wrap">
        {template.frameworks.map((fw: string) => (
          <FrameworkPill key={fw} fw={fw} />
        ))}
      </div>
    </div>
  );
}

interface ExportBarProps {
  onExport: (format: string) => void;
  isGenerating: boolean;
}
function ExportBar({ onExport, isGenerating }: ExportBarProps) {
  return (
    <div className="bg-white border-t border-slate-200 flex flex-wrap sm:flex-nowrap justify-center sm:justify-end gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 z-40 shadow-lg">
      <button 
        className="bg-[#6366F1] text-white px-3 sm:px-4 py-2 rounded font-semibold disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
        onClick={() => onExport('pdf')}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'PDF'}
      </button>
      <button 
        className="bg-[#4F46E5] text-white px-3 sm:px-4 py-2 rounded font-semibold disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
        onClick={() => onExport('docx')}
        disabled={isGenerating}
      >
        <span className="hidden sm:inline">Word Doc</span>
        <span className="sm:hidden">Word</span>
      </button>
      <button 
        className="bg-[#06B6D4] text-white px-3 sm:px-4 py-2 rounded font-semibold disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
        onClick={() => onExport('json')}
        disabled={isGenerating}
      >
        <span className="hidden sm:inline">JSON Bundle</span>
        <span className="sm:hidden">JSON</span>
      </button>
      <button 
        className="bg-[#F97316] text-white px-3 sm:px-4 py-2 rounded font-semibold disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
        onClick={() => onExport('share')}
        disabled={isGenerating}
      >
        <span className="hidden sm:inline">Copy Share Link</span>
        <span className="sm:hidden">Share</span>
      </button>
    </div>
  );
}

interface ReportSection {
  title: string;
  content: string;
  data?: any;
}

interface PreviewAccordionProps {
  sections: ReportSection[];
  isGenerating: boolean;
  dataInfo?: any;
}
function PreviewAccordion({ sections, isGenerating, dataInfo }: PreviewAccordionProps) {
  const [open, setOpen] = useState(0);
  
  if (isGenerating) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <div className="text-lg font-semibold text-slate-700 mb-2">Generating Report with AI</div>
        <div className="text-sm text-slate-500 mb-2">
          Analyzing extension data and generating compliance report using OpenRouter LLM...
        </div>
        {dataInfo && (
          <div className="text-xs text-slate-400">
            Date Range: {dataInfo.dateRange} • Expected Prompts: {dataInfo.expectedPrompts || 'Loading...'}
          </div>
        )}
      </div>
    );
  }
  
  if (!sections || sections.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow p-8 text-center">
        <div className="text-lg font-semibold text-slate-700 mb-2">Select a Template</div>
        <div className="text-sm text-slate-500">
          Choose a report template from the left to generate a compliance report with real data from your Chrome extension.
        </div>
      </div>
    );
  }
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow divide-y divide-slate-100">
      {/* Data Source Info */}
      {dataInfo && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="text-sm text-green-800">
            ✅ <strong>Report Generated:</strong> {dataInfo.promptCount} prompts from {dataInfo.dateRange} 
            {dataInfo.totalCost && ` • $${dataInfo.totalCost.toFixed(2)} total cost`}
          </div>
        </div>
      )}
      
      {sections.map((s, i) => (
        <div key={i}>
          <button
            className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center focus:outline-none hover:bg-slate-50"
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span>{s.title}</span>
            <span className="text-xl">{open === i ? "▼" : "▶"}</span>
          </button>
          {open === i && (
            <div className="px-8 pb-6 text-slate-700 text-base">
              <div className="prose prose-sm max-w-none">
                {s.content.split('\n').map((line, idx) => {
                  // Handle markdown tables
                  if (line.includes('|')) {
                    return <div key={idx} className="font-mono text-xs bg-slate-50 p-2 rounded mb-2">{line}</div>;
                  }
                  // Handle headers
                  if (line.startsWith('###')) {
                    return <h4 key={idx} className="font-semibold text-lg mt-4 mb-2">{line.replace('###', '').trim()}</h4>;
                  }
                  if (line.startsWith('##')) {
                    return <h3 key={idx} className="font-bold text-xl mt-4 mb-2">{line.replace('##', '').trim()}</h3>;
                  }
                  // Handle bullet points
                  if (line.trim().startsWith('-')) {
                    return <li key={idx} className="ml-4">{line.replace('-', '').trim()}</li>;
                  }
                  // Regular paragraphs
                  return line.trim() ? <p key={idx} className="mb-2">{line}</p> : <br key={idx} />;
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Authentication hook (simplified for reports page)
function useAuth() {
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('complyze_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('complyze_token');
    localStorage.removeItem('complyze_user');
    window.location.href = '/';
  };
  
  return { user, logout };
}

type TemplateId = string;

export default function Reports({ prompts }: { prompts: any[] }) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [reportHtml, setReportHtml] = useState<string>("");
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [projectName, setProjectName] = useState("Complyze AI Compliance Report");
  
  const generateReport = async (templateId: string) => {
    setIsGenerating(true);
    setReportSections([]);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          template: templateId, 
          dateRange: dateRange,
          project: projectName,
          userId: user?.id,
          prompts: prompts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      setReportSections(result.sections);
      setDataInfo(result.dataSource);
    } catch (error) {
      console.error("Report generation error:", error);
      // You could set an error state here to show in the UI
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate) {
      const handler = setTimeout(() => {
        generateReport(selectedTemplate);
      }, 1000); // Debounce to avoid rapid-firing on input change

      return () => {
        clearTimeout(handler);
      };
    }
  }, [projectName, dateRange, selectedTemplate]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    generateReport(templateId);
  };

  // Transform raw data for ExecutiveAIRiskSummary component
  const transformDataForExecutiveSummary = () => {
    if (!dataInfo) return null;

    // Calculate metrics from actual prompt data
    const totalPrompts = dataInfo.promptCount || 0;
    const uniqueUsers = prompts ? [...new Set(prompts.map(p => p.user_id))].length : 1;
    const avgPromptsPerUser = Math.round(totalPrompts / uniqueUsers);
    
    // Mock data structure matching the interface - in a real app, this would come from your actual data processing
    return {
      total_prompts: totalPrompts,
      unique_users: uniqueUsers,
      avg_prompts_per_user: avgPromptsPerUser,
      top_ai_tools: ['ChatGPT', 'Claude', 'Gemini', 'Other'],
      redactions: {
        pii: Math.floor(totalPrompts * 0.15),
        financial: Math.floor(totalPrompts * 0.08),
        code: Math.floor(totalPrompts * 0.12),
        dates: Math.floor(totalPrompts * 0.05)
      },
      rewrite_count: Math.floor(totalPrompts * 0.25),
      manual_flags: Math.floor(totalPrompts * 0.03),
      top_risk_category: 'PII Exposure',
      violations_by_role: [
        { role: 'Engineering', violations: 12, common_type: 'PII Exposure' },
        { role: 'Marketing', violations: 8, common_type: 'Data Classification' },
        { role: 'Sales', violations: 15, common_type: 'PII Exposure' },
        { role: 'HR', violations: 3, common_type: 'Confidential Info' },
        { role: 'Finance', violations: 6, common_type: 'Financial Data' }
      ],
      framework_alignment: [
        { control_id: 'NIST-AI-RMF-1.1', framework: 'NIST AI RMF', status: 'compliant' as const },
        { control_id: 'NIST-AI-RMF-2.1', framework: 'NIST AI RMF', status: 'partial' as const },
        { control_id: 'ISO-42001-5.1', framework: 'ISO/IEC 42001', status: 'compliant' as const },
        { control_id: 'ISO-42001-6.1', framework: 'ISO/IEC 42001', status: 'non-compliant' as const },
        { control_id: 'SOC2-CC1.1', framework: 'SOC 2', status: 'compliant' as const },
        { control_id: 'SOC2-CC2.1', framework: 'SOC 2', status: 'compliant' as const }
      ],
      percentage_mitigated: 87,
      blocked_count: Math.floor(totalPrompts * 0.05),
      fully_aligned_frameworks: ['SOC 2'],
      org_name: 'Complyze Organization',
      start_date: dateRange.start,
      end_date: dateRange.end,
      report_date: new Date().toISOString().split('T')[0]
    };
  };

  // Transform raw data for AuditLogReport component
  const transformDataForAuditLog = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    const uniqueUsers = prompts ? [...new Set(prompts.map(p => p.user_id))].length : 1;
    const avgPromptsPerUser = Math.round(totalPrompts / uniqueUsers);
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      total_prompts: totalPrompts,
      unique_users: uniqueUsers,
      top_ai_tools: ['ChatGPT', 'Claude', 'Gemini', 'GitHub Copilot'],
      avg_prompts_per_user: avgPromptsPerUser,
      redactions: {
        pii: Math.floor(totalPrompts * 0.15),
        financial: Math.floor(totalPrompts * 0.08),
        code: Math.floor(totalPrompts * 0.12),
        dates: Math.floor(totalPrompts * 0.05),
      },
      rewrite_count: Math.floor(totalPrompts * 0.25),
      blocked_prompts: Math.floor(totalPrompts * 0.03),
      manual_flags: Math.floor(totalPrompts * 0.02),
      top_risk_category: 'PII Exposure',
      violations_by_role: [
        { role: 'Engineering', violations: 15, common_type: 'Code exposure' },
        { role: 'Sales', violations: 8, common_type: 'Customer PII' },
        { role: 'Marketing', violations: 5, common_type: 'Contact information' },
        { role: 'Finance', violations: 12, common_type: 'Financial data' },
      ],
      framework_alignment: [
        { control_id: 'AI.RM.1.1', framework: 'NIST AI RMF', description: 'AI risk management governance', status: 'compliant' as const },
        { control_id: 'AI.RM.2.1', framework: 'NIST AI RMF', description: 'AI system documentation', status: 'partial' as const },
        { control_id: 'AI.RM.3.1', framework: 'NIST AI RMF', description: 'AI system monitoring', status: 'compliant' as const },
        { control_id: 'ISO.42001.5.1', framework: 'ISO/IEC 42001', description: 'AI management system requirements', status: 'compliant' as const },
        { control_id: 'ISO.42001.6.1', framework: 'ISO/IEC 42001', description: 'AI system lifecycle management', status: 'partial' as const },
        { control_id: 'SOC2.CC6.1', framework: 'SOC 2', description: 'Logical access controls', status: 'compliant' as const },
        { control_id: 'SOC2.CC6.2', framework: 'SOC 2', description: 'Data transmission controls', status: 'non-compliant' as const },
        { control_id: 'SOC2.CC6.3', framework: 'SOC 2', description: 'Data disposal controls', status: 'partial' as const },
      ],
      percentage_redacted: 40,
      rewrite_coverage: 85,
      blocked_count: Math.floor(totalPrompts * 0.03),
      non_overridable_flags: Math.floor(totalPrompts * 0.01),
    };
  };

  // Transform raw data for RedactionEffectivenessReport component
  const transformDataForRedactionEffectiveness = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    const redactedCount = Math.floor(totalPrompts * 0.25); // Mock: 25% of prompts redacted
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      total_prompts: totalPrompts,
      redacted_count: redactedCount,
      percent_redacted: totalPrompts > 0 ? Math.round((redactedCount / totalPrompts) * 100) : 0,
      rewrite_count: Math.floor(totalPrompts * 0.12),
      top_trigger: "PII Detection",
      pii_precision: 94,
      pii_recall: 89,
      code_precision: 88,
      code_recall: 92,
      financial_precision: 91,
      financial_recall: 85,
      missed_prompts_count: Math.floor(totalPrompts * 0.02),
      framework_mapping: [
        { framework: "NIST AI RMF", control_id: "MAP-2", status: "compliant" as const },
        { framework: "ISO 42001", control_id: "6.3.1", status: "partial" as const },
        { framework: "SOC 2", control_id: "CC7.2", status: "compliant" as const },
      ],
    };
  };

  // Transform raw data for FrameworkCoverageMatrix component
  const transformDataForFrameworkMatrix = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      nist_coverage: 85,
      iso_coverage: 72,
      soc2_coverage: 91,
      total_controls: 15,
      controls_matrix: [
        {
          framework: "NIST AI RMF",
          control_id: "MAP-2",
          observed_activity: "Prompt flagged for PII",
          mitigation_applied: "✅ Redacted",
          status: "compliant" as const,
        },
        {
          framework: "ISO 42001",
          control_id: "6.3.1",
          observed_activity: "Financial data in prompt",
          mitigation_applied: "⚠️ Partial redaction",
          status: "partial" as const,
        },
        {
          framework: "SOC 2",
          control_id: "CC7.2",
          observed_activity: "Code repository access",
          mitigation_applied: "✅ Access controlled",
          status: "compliant" as const,
        },
        {
          framework: "NIST AI RMF",
          control_id: "GOVERN-1",
          observed_activity: "User training prompt",
          mitigation_applied: "✅ Policy enforced",
          status: "compliant" as const,
        },
        {
          framework: "ISO 42001",
          control_id: "5.1.1",
          observed_activity: "Prompt risk assessment",
          mitigation_applied: "❌ Not implemented",
          status: "non_compliant" as const,
        },
      ],
      gaps_identified: [
        "Manual review process for healthcare data not fully automated",
        "Integration with SIEM system requires configuration updates",
      ],
      enhancement_suggestions: [
        "Implement automated PHI detection for healthcare prompts",
        "Add real-time alerts for high-risk prompt patterns",
        "Enhance training data with domain-specific examples",
      ],
      integration_recommendations: [
        "Connect Complyze to existing GRC platform for unified reporting",
        "Implement SSO integration for seamless user management",
        "Set up automated evidence collection for audit workflows",
      ],
        };
  };

  // Transform raw data for RiskAssessmentDashboard component
  const transformDataForRiskAssessment = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      overall_risk_score: 72,
      risk_level: "high" as const,
      total_incidents: Math.floor(totalPrompts * 0.08),
      incidents_resolved: Math.floor(totalPrompts * 0.06),
      average_resolution_time: 4.2,
      risk_metrics: [
        {
          category: "PII Exposure",
          current_score: 78,
          previous_score: 82,
          trend: "down" as const,
          incidents: Math.floor(totalPrompts * 0.03),
          mitigation_rate: 85,
        },
        {
          category: "Code Injection",
          current_score: 65,
          previous_score: 60,
          trend: "up" as const,
          incidents: Math.floor(totalPrompts * 0.02),
          mitigation_rate: 92,
        },
        {
          category: "Data Leakage",
          current_score: 71,
          previous_score: 71,
          trend: "stable" as const,
          incidents: Math.floor(totalPrompts * 0.015),
          mitigation_rate: 88,
        },
        {
          category: "Prompt Injection",
          current_score: 58,
          previous_score: 63,
          trend: "down" as const,
          incidents: Math.floor(totalPrompts * 0.01),
          mitigation_rate: 94,
        },
      ],
      risk_trends: [
        { date: "Week 1", critical: 15, high: 28, medium: 45, low: 65, total_prompts: Math.floor(totalPrompts * 0.2) },
        { date: "Week 2", critical: 12, high: 32, medium: 48, low: 68, total_prompts: Math.floor(totalPrompts * 0.25) },
        { date: "Week 3", critical: 18, high: 29, medium: 52, low: 72, total_prompts: Math.floor(totalPrompts * 0.3) },
        { date: "Week 4", critical: 14, high: 35, medium: 49, low: 78, total_prompts: Math.floor(totalPrompts * 0.25) },
      ],
      team_risks: [
        { team: "Engineering", risk_score: 82, violations: 24, top_risk_type: "Code Exposure", mitigation_compliance: 78 },
        { team: "Sales", risk_score: 67, violations: 18, top_risk_type: "Customer PII", mitigation_compliance: 85 },
        { team: "Marketing", risk_score: 55, violations: 12, top_risk_type: "Contact Data", mitigation_compliance: 91 },
        { team: "Finance", risk_score: 74, violations: 15, top_risk_type: "Financial Data", mitigation_compliance: 82 },
        { team: "HR", risk_score: 43, violations: 8, top_risk_type: "Employee Data", mitigation_compliance: 95 },
      ],
      top_vulnerabilities: [
        "Unencrypted API keys exposed in prompts to coding assistants",
        "Customer email addresses being shared in support query examples", 
        "Financial data patterns detected in business analysis prompts",
        "Internal code snippets containing proprietary algorithms",
      ],
      recommendations: [
        "Implement real-time API key detection and automatic redaction",
        "Train teams on data classification and proper prompt hygiene",
        "Deploy enhanced pattern matching for financial data detection",
        "Establish code review process for AI-assisted development",
      ],
      compliance_gaps: [
        "GDPR Article 32 - Technical safeguards for personal data processing",
        "SOX Section 404 - Internal controls over financial reporting accuracy",
      ],
    };
  };

  // Transform raw data for UsageCostDashboard component
  const transformDataForUsageCost = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      total_cost: 2547.85,
      budget_limit: 5000.00,
      cost_savings: 892.34,
      total_tokens: 15750000,
      total_prompts: totalPrompts,
      unique_users: Math.floor(totalPrompts / 25) || 12,
      model_usage: [
        {
          model: "GPT-4",
          provider: "OpenAI",
          total_tokens: 8500000,
          cost: 1275.50,
          prompts: Math.floor(totalPrompts * 0.4),
          avg_cost_per_prompt: 0.045,
          trend: "up" as const,
        },
        {
          model: "Claude-3-Sonnet",
          provider: "Claude",
          total_tokens: 4200000,
          cost: 840.25,
          prompts: Math.floor(totalPrompts * 0.35),
          avg_cost_per_prompt: 0.038,
          trend: "stable" as const,
        },
        {
          model: "Gemini-Pro",
          provider: "Gemini",
          total_tokens: 3050000,
          cost: 432.10,
          prompts: Math.floor(totalPrompts * 0.25),
          avg_cost_per_prompt: 0.029,
          trend: "down" as const,
        },
      ],
      cost_trends: [
        { date: "Week 1", total_cost: 580.25, openai_cost: 320.15, claude_cost: 160.50, gemini_cost: 99.60, token_count: 3500000 },
        { date: "Week 2", total_cost: 640.80, openai_cost: 355.40, claude_cost: 185.20, gemini_cost: 100.20, token_count: 3800000 },
        { date: "Week 3", total_cost: 720.90, openai_cost: 395.85, claude_cost: 220.15, gemini_cost: 104.90, token_count: 4100000 },
        { date: "Week 4", total_cost: 605.90, openai_cost: 204.10, claude_cost: 274.40, gemini_cost: 127.40, token_count: 4350000 },
      ],
      user_adoption: [],
      cost_controls: [
        {
          control_type: "Monthly Budget Limit",
          threshold: 5000,
          current_value: 2547.85,
          status: "safe" as const,
          savings_achieved: 892.34,
        },
        {
          control_type: "Per-User Daily Limit",
          threshold: 50,
          current_value: 28.5,
          status: "safe" as const,
          savings_achieved: 245.60,
        },
        {
          control_type: "Token Rate Limiting",
          threshold: 1000000,
          current_value: 850000,
          status: "warning" as const,
          savings_achieved: 156.80,
        },
      ],
      top_spenders: [
        { user: "Engineering Team Lead", cost: 485.20, department: "Engineering" },
        { user: "Senior Data Scientist", cost: 362.75, department: "Analytics" },
        { user: "Product Manager", cost: 298.50, department: "Product" },
        { user: "Marketing Analyst", cost: 215.40, department: "Marketing" },
        { user: "DevOps Engineer", cost: 187.65, department: "Engineering" },
      ],
      efficiency_metrics: {
        cost_per_token: 0.000162,
        tokens_per_prompt: totalPrompts > 0 ? Math.floor(15750000 / totalPrompts) : 450,
        cost_per_user: 212.32,
      },
    };
  };

  // Transform raw data for ContinuousMonitoring component
  const transformDataForContinuousMonitoring = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      overall_compliance_score: 87,
      total_findings: 24,
      open_findings: 8,
      overdue_findings: 3,
      findings: [
        {
          finding_id: "FIND-2024-001",
          title: "Inadequate PII redaction in customer service prompts",
          severity: "high" as const,
          status: "open" as const,
          framework: "GDPR",
          control_id: "Art. 32",
          description: "Customer email addresses not consistently redacted",
          remediation_plan: "Implement enhanced pattern matching for email detection",
          due_date: "2024-02-15",
          assigned_to: "Security Team",
          days_overdue: 5,
        },
                 {
           finding_id: "FIND-2024-002",
           title: "Missing audit logs for administrative actions",
           severity: "moderate" as const,
           status: "in_progress" as const,
          framework: "SOC 2",
          control_id: "CC7.2",
          description: "Administrative access to prompt data not fully logged",
          remediation_plan: "Configure comprehensive audit logging",
          due_date: "2024-03-01",
          assigned_to: "IT Operations",
          days_overdue: 0,
        },
        {
          finding_id: "FIND-2024-003",
          title: "Incomplete security awareness training",
          severity: "low" as const,
          status: "closed" as const,
          framework: "NIST",
          control_id: "AT-2",
          description: "Not all users completed LLM security training",
          remediation_plan: "Mandatory training completion tracking",
          due_date: "2024-01-30",
          assigned_to: "HR Department",
          days_overdue: 0,
        },
      ],
      control_status: [
        {
          control_id: "GDPR-32",
          framework: "GDPR",
          control_name: "Security of processing",
          implementation_status: "implemented" as const,
          effectiveness: "effective" as const,
          last_assessed: "2024-01-15",
          next_assessment: "2024-04-15",
          findings_count: 1,
        },
        {
          control_id: "SOC2-CC7.2",
          framework: "SOC 2",
          control_name: "System monitoring",
          implementation_status: "partially_implemented" as const,
          effectiveness: "partially_effective" as const,
          last_assessed: "2024-01-20",
          next_assessment: "2024-03-20",
          findings_count: 2,
        },
      ],
      monitoring_metrics: [
        {
          metric_name: "Redaction Accuracy",
          current_value: 94.5,
          threshold: 95.0,
          status: "yellow" as const,
          trend: "up" as const,
          last_updated: "2024-02-20",
        },
        {
          metric_name: "Prompt Flagging Rate",
          current_value: 12.8,
          threshold: 15.0,
          status: "green" as const,
          trend: "stable" as const,
          last_updated: "2024-02-20",
        },
      ],
      compliance_trends: [
        { date: "Week 1", fedramp_score: 85, soc2_score: 88, nist_score: 82 },
        { date: "Week 2", fedramp_score: 86, soc2_score: 87, nist_score: 84 },
        { date: "Week 3", fedramp_score: 87, soc2_score: 89, nist_score: 85 },
        { date: "Week 4", fedramp_score: 87, soc2_score: 87, nist_score: 87 },
      ],
      upcoming_assessments: [
        {
          assessment_type: "SOC 2 Type II Audit",
          due_date: "2024-06-30",
          framework: "SOC 2",
          responsible_party: "External Auditor",
        },
        {
          assessment_type: "GDPR Compliance Review",
          due_date: "2024-05-15",
          framework: "GDPR",
          responsible_party: "Privacy Team",
        },
      ],
    };
  };

  // Transform raw data for LLMGovernancePolicyAdherence component
  const transformDataForPolicyAdherence = () => {
    if (!dataInfo || !prompts) return null;

    const totalPrompts = dataInfo.promptCount || 0;
    
    return {
      organization_name: projectName,
      report_date: new Date().toISOString(),
      start_date: dateRange.start,
      end_date: dateRange.end,
      overall_compliance_rate: 91,
      total_violations: 18,
      resolved_violations: 12,
      active_violations: 6,
      policy_violations: [
        {
          violation_id: "POL-2024-001",
          user_id: "john.doe@company.com",
          department: "Sales",
          policy_section: "Data Handling Policy 3.2",
          violation_type: "Unauthorized customer data sharing",
          severity: "high" as const,
          description: "Shared customer contact information in ChatGPT prompt",
          action_taken: "User training and warning issued",
          resolution_status: "resolved" as const,
          date_reported: "2024-02-10",
          resolution_date: "2024-02-12",
        },
        {
          violation_id: "POL-2024-002",
          user_id: "jane.smith@company.com",
          department: "Engineering",
          policy_section: "Code Security Policy 2.1",
          violation_type: "Source code exposure",
          severity: "critical" as const,
          description: "Proprietary algorithm shared in coding assistant",
          action_taken: "Immediate system lockout and investigation",
          resolution_status: "open" as const,
          date_reported: "2024-02-18",
        },
      ],
      department_compliance: [
        {
          department: "Engineering",
          total_users: 25,
          compliant_users: 22,
          compliance_rate: 88,
          violations_count: 4,
          training_completion: 96,
          risk_score: 12,
        },
        {
          department: "Sales",
          total_users: 18,
          compliant_users: 16,
          compliance_rate: 89,
          violations_count: 3,
          training_completion: 94,
          risk_score: 11,
        },
        {
          department: "Marketing",
          total_users: 12,
          compliant_users: 12,
          compliance_rate: 100,
          violations_count: 0,
          training_completion: 100,
          risk_score: 2,
        },
      ],
      policy_metrics: [
        {
          policy_name: "Data Handling Policy",
          adherence_rate: 92,
          violations_count: 8,
          last_review: "2024-01-15",
          next_review: "2024-07-15",
          effectiveness_score: 88,
        },
        {
          policy_name: "Code Security Policy",
          adherence_rate: 87,
          violations_count: 6,
          last_review: "2024-01-10",
          next_review: "2024-07-10",
          effectiveness_score: 85,
        },
      ],
      training_records: [],
      compliance_trends: [
        { date: "Week 1", compliance_rate: 88, violations_count: 6, training_completion: 92 },
        { date: "Week 2", compliance_rate: 90, violations_count: 4, training_completion: 94 },
        { date: "Week 3", compliance_rate: 89, violations_count: 5, training_completion: 96 },
        { date: "Week 4", compliance_rate: 91, violations_count: 3, training_completion: 98 },
      ],
      top_violations: [
        { violation_type: "Unauthorized data sharing", count: 8, trend: "down" as const },
        { violation_type: "Code exposure", count: 6, trend: "stable" as const },
        { violation_type: "Policy acknowledgment missing", count: 4, trend: "down" as const },
      ],
    };
  };
   
  if (!user) {
    return <div>Loading user...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Templates */}
      <div className="lg:col-span-1 h-full overflow-y-auto bg-[#252945] p-6 rounded-lg custom-scrollbar">
        <h2 className="text-xl font-bold text-white mb-4 sticky top-0 bg-[#252945] py-2 z-10">Compliance Report Templates</h2>
        
        {/* Report Configuration */}
        <div className="mb-6 p-4 rounded-lg bg-black/20 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Report Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date Range (Start)</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date Range (End)</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={selectedTemplate === t.id}
              onClick={() => handleTemplateSelect(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-2 h-full overflow-y-auto custom-scrollbar">
        {selectedTemplate === 'exec-ai-risk-summary' && dataInfo && !isGenerating && transformDataForExecutiveSummary() ? (
          <ExecutiveAIRiskSummary data={transformDataForExecutiveSummary()!} />
        ) : selectedTemplate === 'prompt-risk-audit-log' && dataInfo && !isGenerating && transformDataForAuditLog() ? (
          <AuditLogReport data={transformDataForAuditLog()!} />
        ) : selectedTemplate === 'redaction-effectiveness' && dataInfo && !isGenerating && transformDataForRedactionEffectiveness() ? (
          <RedactionEffectivenessReport data={transformDataForRedactionEffectiveness()!} />
        ) : selectedTemplate === 'framework-coverage-matrix' && dataInfo && !isGenerating && transformDataForFrameworkMatrix() ? (
          <FrameworkCoverageMatrix data={transformDataForFrameworkMatrix()!} />
        ) : selectedTemplate === 'usage-cost-dashboard' && dataInfo && !isGenerating && transformDataForUsageCost() ? (
          <UsageCostDashboard data={transformDataForUsageCost()!} />
        ) : selectedTemplate === 'continuous-monitoring' && dataInfo && !isGenerating && transformDataForContinuousMonitoring() ? (
          <ContinuousMonitoring data={transformDataForContinuousMonitoring()!} />
        ) : selectedTemplate === 'llm-governance-policy' && dataInfo && !isGenerating && transformDataForPolicyAdherence() ? (
          <LLMGovernancePolicyAdherence data={transformDataForPolicyAdherence()!} />
        ) : selectedTemplate === 'ai-threat-intelligence' && dataInfo && !isGenerating && transformDataForRiskAssessment() ? (
          <RiskAssessmentDashboard data={transformDataForRiskAssessment()!} />
        ) : (
          <PreviewAccordion sections={reportSections} isGenerating={isGenerating} dataInfo={dataInfo} />
        )}
      </div>
    </div>
  );
} 