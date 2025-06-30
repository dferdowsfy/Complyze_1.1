"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PromptRiskAssessmentReport from "@/app/components/PromptRiskAssessmentReport";

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
      <p className="text-sm text-white/80 mb-3 h-12">{template.description}</p>
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
         <PreviewAccordion sections={reportSections} isGenerating={isGenerating} dataInfo={dataInfo} />
      </div>
    </div>
  );
} 