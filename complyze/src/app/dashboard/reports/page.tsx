"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Framework color codes
const FRAMEWORK_COLORS = {
  NIST: "#6366F1",
  AI_RMF: "#4F46E5",
  FedRAMP: "#EF4444",
  OWASP: "#F97316",
  SOC2: "#10B981",
  ISO: "#06B6D4",
};

const TEMPLATES: Array<{
  id: string;
  name: string;
  description: string;
  frameworks: (keyof typeof FRAMEWORK_COLORS)[];
}> = [
  {
    id: "framework-coverage-matrix",
    name: "Framework-Coverage Matrix",
    description: "Table: Control ID → Met/Partially Met/Not Applicable, evidence links.",
    frameworks: ["NIST", "FedRAMP", "ISO"],
  },
  {
    id: "prompt-risk-audit",
    name: "Prompt Risk Audit (Weekly)",
    description: "Histogram of high/medium/low flags; top 20 flagged prompts; delta vs previous week.",
    frameworks: ["AI_RMF", "OWASP"],
  },
  {
    id: "redaction-effectiveness",
    name: "Redaction Effectiveness Report",
    description: "% of prompts with PII; false-positive/negative rates; sample redaction diff.",
    frameworks: ["AI_RMF", "SOC2"],
  },
  {
    id: "fedramp-conmon-exec",
    name: "FedRAMP Continuous-Monitoring Exec Summary",
    description: "Control status heat-map; open POA&M items; monthly control test coverage.",
    frameworks: ["FedRAMP"],
  },
  {
    id: "cost-usage-ledger",
    name: "Cost & Usage Ledger",
    description: "Daily/monthly token usage, model cost breakdown, projection vs budget.",
    frameworks: ["NIST"],
  },
  {
    id: "ai-rmf-profile",
    name: "Generative-AI RMF Profile Report",
    description: "Narrative sections with evidence paragraphs + risk tables keyed to RMF functions.",
    frameworks: ["AI_RMF"],
  },
  {
    id: "owasp-llm-findings",
    name: "OWASP LLM Top-10 Findings",
    description: "Pie chart: occurrences by risk ID (LLM01-LLM10); remediation recommendations.",
    frameworks: ["OWASP"],
  },
  {
    id: "soc2-evidence-pack",
    name: "SOC 2 Type II Evidence Pack",
    description: "List of prompts sampled, control mappings, audit trail links, monthly diff.",
    frameworks: ["SOC2"],
  },
];

const FRAMEWORK_LABELS = {
  NIST: "NIST 800-53",
  AI_RMF: "NIST AI RMF",
  FedRAMP: "FedRAMP",
  OWASP: "OWASP LLM Top 10",
  SOC2: "SOC 2",
  ISO: "ISO 27001",
};

function FrameworkPill({ fw }: { fw: keyof typeof FRAMEWORK_COLORS }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1"
      style={{ background: FRAMEWORK_COLORS[fw] + "20", color: FRAMEWORK_COLORS[fw] }}
    >
      {FRAMEWORK_LABELS[fw]}
    </span>
  );
}

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    frameworks: (keyof typeof FRAMEWORK_COLORS)[];
  };
  selected: boolean;
  onClick: () => void;
}
function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  return (
    <div
      className={`bg-white shadow-sm p-3 sm:p-4 rounded-lg hover:ring-2 ring-orange-500 cursor-pointer mb-2 sm:mb-3 border transition ${selected ? "ring-2 ring-orange-500" : ""}`}
      onClick={onClick}
    >
      <h3 className="font-semibold mb-1 text-sm sm:text-base">{template.name}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mb-2">{template.description}</p>
      <div className="flex gap-1 flex-wrap">
        {template.frameworks.map((fw: keyof typeof FRAMEWORK_COLORS) => (
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
  
  return { user };
}

type TemplateId = string;

export default function Reports() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [projectName, setProjectName] = useState('Complyze AI Compliance');

  const generateReport = async (templateId: string) => {
    setIsGenerating(true);
    setReportSections([]);
    setDataInfo(null);
    
    try {
      console.log(`Generating ${templateId} report for date range: ${dateRange.start} to ${dateRange.end}`);
      
      // Set expected data info during generation
      setDataInfo({
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        expectedPrompts: 'Loading...'
      });
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: templateId,
          dateRange: {
            start: dateRange.start,
            end: dateRange.end
          },
          project: projectName,
          format: 'sections',
          userId: user?.id || "fa166056-023d-4822-b250-b5b5a47f9df8" // Use seeded user ID as fallback
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Report generated:', result);
      
      if (result.sections && Array.isArray(result.sections)) {
        setReportSections(result.sections);
        
        // Set actual data info from response
        setDataInfo({
          dateRange: `${dateRange.start} to ${dateRange.end}`,
          promptCount: result.dataSource?.promptCount || 0,
          totalCost: result.dataSource?.totalCost,
          riskBreakdown: result.dataSource?.riskBreakdown,
          usingDatabase: !result.dataSource?.usingDashboardData
        });
      } else {
        throw new Error('Invalid report format received');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      setReportSections([
        {
          title: 'Error',
          content: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your OpenRouter API configuration and database connection.`,
          data: {}
        }
      ]);
      
      setDataInfo({
        dateRange: `${dateRange.start} to ${dateRange.end}`,
        promptCount: 0,
        error: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    generateReport(templateId);
  };

  const handleExport = async (format: string) => {
    if (!selectedTemplate) return;
    
    try {
      if (format === 'share') {
        // Copy share link to clipboard
        const shareUrl = `${window.location.origin}/reports/shared/${selectedTemplate}?date=${dateRange.start}_${dateRange.end}`;
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
        return;
      }
      
      // For other formats, call the export API with date range
      const response = await fetch(`/api/reports/export?id=${selectedTemplate}&format=${format}&start=${dateRange.start}&end=${dateRange.end}&userId=${user?.id || "fa166056-023d-4822-b250-b5b5a47f9df8"}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedTemplate}-${dateRange.start}-${dateRange.end}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Auto-regenerate report when date range changes
  useEffect(() => {
    if (selectedTemplate) {
      const timeoutId = setTimeout(() => {
        generateReport(selectedTemplate);
      }, 1000); // Debounce 1 second
      
      return () => clearTimeout(timeoutId);
    }
  }, [dateRange.start, dateRange.end, projectName]);

  return (
    <div className="h-screen bg-[#0E1E36] font-sans flex flex-col overflow-hidden">
      {/* Sticky Nav Tabs - Standardized */}
      <nav className="flex-shrink-0 flex flex-col sm:flex-row px-4 sm:px-8 py-3 sm:py-5 shadow-md justify-between items-center" style={{ background: '#0E1E36' }}>
        {/* Left: Branding */}
        <div className="flex items-center gap-6 sm:gap-12 min-w-[180px] w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xl sm:text-2xl font-light tracking-widest uppercase text-white select-none" style={{ letterSpacing: 2 }}>COMPLYZE</span>
        </div>
        {/* Center: Nav Links */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-8 lg:gap-12 items-center justify-center w-full sm:w-auto mt-3 sm:mt-0">
          <Link href="/dashboard" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Dashboard
          </Link>
          <Link href="/dashboard/reports" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Reports
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          </Link>
          <Link href="/dashboard/settings" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Settings
          </Link>
        </div>
        {/* Right: User Info Pill */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-[120px] sm:min-w-[160px] justify-end w-full sm:w-auto mt-3 sm:mt-0">
          {user?.email && (
            <div className="relative group">
              <span
                className="rounded-full bg-white/10 px-3 sm:px-4 py-1 text-white font-medium truncate max-w-[120px] sm:max-w-[140px] cursor-pointer transition-all duration-200 group-hover:bg-white/20 text-sm sm:text-base"
                title={user.email}
                style={{ display: 'inline-block' }}
              >
                {user.full_name || user.email}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar - Templates */}
        <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col max-h-[40vh] lg:max-h-full">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">Compliance Report Templates</h2>
            
            {/* Date Range Selector */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-lg border">
              <h3 className="font-semibold mb-3 text-slate-700 text-sm sm:text-base">Report Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm"
                    placeholder="Project name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm"
                    />
                  </div>
                </div>
                
                {/* Date Range Preview */}
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                  <strong>Report Period:</strong> {Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))} days
                  <br />
                  <strong>Data Source:</strong> prompt_events table • Time-filtered
                </div>
              </div>
            </div>

            {/* Template Cards */}
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selectedTemplate === template.id}
                onClick={() => handleTemplateSelect(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Content - Preview */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                {selectedTemplate ? 
                  TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'Report Preview' : 
                  'AI-Powered Compliance Reports'
                }
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                {selectedTemplate ? 
                  `Time-based report for ${dateRange.start} to ${dateRange.end} using OpenRouter LLM` :
                  'Select a template to generate a time-based compliance report with real extension data'
                }
              </p>
            </div>
            
            <PreviewAccordion 
              sections={reportSections} 
              isGenerating={isGenerating}
              dataInfo={dataInfo}
            />
          </div>
          
          {/* Export Bar - Inside the right content area */}
          {selectedTemplate && (
            <div className="flex-shrink-0">
              <ExportBar onExport={handleExport} isGenerating={isGenerating} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 