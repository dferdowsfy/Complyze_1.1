"use client";

import React, { useState, useRef } from "react";
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
      className={`bg-white shadow-sm p-4 rounded-lg hover:ring-2 ring-orange-500 cursor-pointer mb-3 border transition ${selected ? "ring-2 ring-orange-500" : ""}`}
      onClick={onClick}
    >
      <h3 className="font-semibold mb-1 text-base">{template.name}</h3>
      <p className="text-sm text-slate-500 mb-2">{template.description}</p>
      <div className="flex gap-1 flex-wrap">
        {template.frameworks.map((fw: keyof typeof FRAMEWORK_COLORS) => (
          <FrameworkPill key={fw} fw={fw} />
        ))}
      </div>
    </div>
  );
}

function ExportBar() {
  return (
    <div className="sticky bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-end gap-4 px-8 py-4 z-40 shadow-lg">
      <button className="bg-[#6366F1] text-white px-4 py-2 rounded font-semibold">PDF</button>
      <button className="bg-[#4F46E5] text-white px-4 py-2 rounded font-semibold">Word Doc</button>
      <button className="bg-[#06B6D4] text-white px-4 py-2 rounded font-semibold">JSON Bundle</button>
      <button className="bg-[#F97316] text-white px-4 py-2 rounded font-semibold">Copy Share Link</button>
    </div>
  );
}

interface PreviewAccordionProps {
  sections: { title: string; content: string }[];
}
function PreviewAccordion({ sections }: PreviewAccordionProps) {
  const [open, setOpen] = useState(0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow divide-y divide-slate-100">
      {sections.map((s, i) => (
        <div key={i}>
          <button
            className="w-full text-left px-6 py-4 font-semibold flex justify-between items-center focus:outline-none"
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            <span>{s.title}</span>
            <span className="text-xl">{open === i ? "▼" : "▶"}</span>
          </button>
          {open === i && (
            <div className="px-8 pb-6 text-slate-700 text-base whitespace-pre-line">{s.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}

const DUMMY_SECTIONS = {
  "framework-coverage-matrix": [
    { title: "Executive Summary", content: "This matrix shows coverage of NIST 800-53, FedRAMP, and ISO 27001 controls.\n\nAll critical controls are mapped. See table below for details." },
    { title: "Findings", content: "| Control | Status | Evidence |\n|---|---|---|\n| SC-28 | Met | [Link] |\n| AC-3 | Partially Met | [Link] |\n| SI-4 | Not Applicable | - |" },
    { title: "Recommendations", content: "Address partial and unmet controls before next audit." },
    { title: "Appendix", content: "{\n  controls: [...]\n}" },
  ],
  "prompt-risk-audit": [
    { title: "Executive Summary", content: "Weekly audit of prompt risks.\n\nHigh: 3, Medium: 7, Low: 20." },
    { title: "Findings", content: "Histogram: [▇▇▇▇▇▇▇▇▇▇] (see chart)\nTop flagged prompts:\n1. ..." },
    { title: "Recommendations", content: "Reduce high-risk prompts by clarifying intent and redacting PII." },
    { title: "Appendix", content: "{\n  risks: [...]\n}" },
  ],
  "redaction-effectiveness": [
    { title: "Executive Summary", content: "% of prompts with PII: 12%.\nFalse positive rate: 2%.\nFalse negative rate: 1%." },
    { title: "Findings", content: "Sample redaction diff:\n- Before: ...\n- After: ..." },
    { title: "Recommendations", content: "Tune redaction patterns to reduce false results." },
    { title: "Appendix", content: "{\n  redactionStats: {...}\n}" },
  ],
  "fedramp-conmon-exec": [
    { title: "Executive Summary", content: "FedRAMP ConMon summary for May 2025." },
    { title: "Findings", content: "Control status heatmap: [image]\nOpen POA&M items: 2\nMonthly test coverage: 95%" },
    { title: "Recommendations", content: "Close open POA&M items and maintain test coverage > 90%." },
    { title: "Appendix", content: "{\n  conmon: {...}\n}" },
  ],
  "cost-usage-ledger": [
    { title: "Executive Summary", content: "Token usage and cost breakdown for May 2025." },
    { title: "Findings", content: "Total tokens: 1,200,000\nModel cost: $24.00\nProjection vs budget: -$6.00" },
    { title: "Recommendations", content: "Monitor usage to stay within budget." },
    { title: "Appendix", content: "{\n  usage: {...}\n}" },
  ],
  "ai-rmf-profile": [
    { title: "Executive Summary", content: "NIST AI RMF profile for LLM deployment." },
    { title: "Findings", content: "Evidence paragraphs and risk tables for GOVERN, MAP, MEASURE, MANAGE." },
    { title: "Recommendations", content: "Review evidence and update risk tables quarterly." },
    { title: "Appendix", content: "{\n  rmf: {...}\n}" },
  ],
  "owasp-llm-findings": [
    { title: "Executive Summary", content: "OWASP LLM Top-10 findings for May 2025." },
    { title: "Findings", content: "Pie chart: LLM01-LLM10 occurrences.\nRemediation: ..." },
    { title: "Recommendations", content: "Address top 3 risk categories." },
    { title: "Appendix", content: "{\n  owasp: {...}\n}" },
  ],
  "soc2-evidence-pack": [
    { title: "Executive Summary", content: "SOC 2 Type II evidence pack for May 2025." },
    { title: "Findings", content: "Sampled prompts, control mappings, audit trail links." },
    { title: "Recommendations", content: "Maintain evidence binder and update monthly." },
    { title: "Appendix", content: "{\n  soc2: {...}\n}" },
  ],
};

type TemplateId = keyof typeof DUMMY_SECTIONS;

export default function Reports() {
  const [selected, setSelected] = useState<TemplateId>(TEMPLATES[0].id as TemplateId);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0E1E36' }}>
      {/* Sticky Nav Tabs - Standardized */}
      <nav className="sticky top-0 z-40 flex px-8 py-5 shadow-md justify-between items-center" style={{ background: '#0E1E36' }}>
        {/* Left: Branding */}
        <div className="flex items-center gap-12 min-w-[180px]">
          <span className="text-2xl font-light tracking-widest uppercase text-white select-none" style={{ letterSpacing: 2 }}>COMPLYZE</span>
        </div>
        {/* Center: Nav Links */}
        <div className="flex gap-12 items-center">
          <Link href="/dashboard" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Dashboard
            {pathname && pathname.startsWith('/dashboard') && !pathname.includes('reports') && !pathname.includes('settings') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
          <Link href="/dashboard/reports" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Reports
            {pathname && pathname.includes('reports') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
          <Link href="/dashboard/settings" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Settings
            {pathname && pathname.includes('settings') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
        </div>
        {/* Right: User Info Pill */}
        <div className="flex items-center gap-4 min-w-[160px] justify-end">
          {/* User info pill from localStorage */}
          {(() => {
            let user = null;
            if (typeof window !== 'undefined') {
              try {
                user = JSON.parse(localStorage.getItem('complyze_user') || '{}');
              } catch {}
            }
            if (user && user.email) {
              return (
                <div className="relative group">
                  <span
                    className="rounded-full bg-white/10 px-4 py-1 text-white font-medium truncate max-w-[140px] cursor-pointer transition-all duration-200 group-hover:bg-white/20"
                    title={user.email}
                    style={{ display: 'inline-block' }}
                  >
                    {user.full_name || user.email}
                  </span>
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block bg-[#222] text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
                    {user.email}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto flex flex-row gap-10 py-12 px-4">
        {/* Left Rail: Templates */}
        <aside
          className="w-80 flex-shrink-0 fixed left-0 top-[76px] z-30 h-[calc(100vh-76px)] overflow-y-auto border-r border-slate-200 px-6 py-6"
          style={{ boxShadow: '2px 0 8px rgba(14,30,54,0.04)', background: 'rgba(255,255,255,0.95)' }}
        >
          <h2 className="text-lg font-bold mb-4 text-[#0E1E36]">Report Blueprints</h2>
          {TEMPLATES.map(t => (
            <TemplateCard
              key={t.id}
              template={{ ...t, frameworks: t.frameworks as (keyof typeof FRAMEWORK_COLORS)[] }}
              selected={selected === t.id}
              onClick={() => setSelected(t.id as TemplateId)}
            />
          ))}
        </aside>
        {/* Main Canvas */}
        <section className="flex-1 min-w-0 ml-80">
          {/* Export Button Row */}
          <div className="flex w-full justify-end items-center mb-2 mt-2">
            <div className="relative" ref={exportRef}>
              <button
                className="bg-[#6366F1] text-white px-6 py-2 rounded font-semibold shadow hover:bg-[#4F46E5] transition"
                onClick={() => setExportOpen(v => !v)}
              >
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded shadow-lg z-50">
                  <button className="w-full text-left px-4 py-3 hover:bg-slate-100" onClick={() => { setExportOpen(false); /* handle PDF export */ }}>PDF</button>
                  <button className="w-full text-left px-4 py-3 hover:bg-slate-100" onClick={() => { setExportOpen(false); /* handle Word export */ }}>Word Doc</button>
                  <button className="w-full text-left px-4 py-3 hover:bg-slate-100" onClick={() => { setExportOpen(false); /* handle JSON export */ }}>JSON Bundle</button>
                  <button className="w-full text-left px-4 py-3 hover:bg-slate-100" onClick={() => { setExportOpen(false); /* handle Share Link */ }}>Copy Share Link</button>
                </div>
              )}
            </div>
          </div>
          {/* Parameters Pane */}
          <div className="bg-white rounded-xl shadow p-6 mb-2 border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 sticky top-[76px] z-20">
            <label className="font-medium text-[#1C2A3E]">Date Range</label>
            <input type="text" className="border border-slate-200 rounded-md p-2 text-base w-48" placeholder="2025-05-01/2025-05-31" />
            <label className="font-medium text-[#1C2A3E]">Environment</label>
            <select className="border border-slate-200 rounded-md p-2 text-base">
              <option>prod</option>
              <option>dev</option>
            </select>
            <label className="font-medium text-[#1C2A3E]">Model</label>
            <select className="border border-slate-200 rounded-md p-2 text-base">
              <option>GPT-4o</option>
              <option>Claude 3</option>
              <option>Gemini</option>
            </select>
            <label className="font-medium text-[#1C2A3E]">Team</label>
            <select className="border border-slate-200 rounded-md p-2 text-base">
              <option>All</option>
              <option>Red Team</option>
              <option>Blue Team</option>
            </select>
          </div>
          <div className="flex w-full justify-end mb-4 sticky top-[168px] z-20">
            <button className="bg-[#FF6F3C] text-white font-bold text-lg px-8 py-3 rounded-lg shadow hover:bg-[#ff8a5c] transition">Search</button>
          </div>
          {/* Preview Panel */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
            <PreviewAccordion sections={DUMMY_SECTIONS[selected]} />
          </div>
        </section>
      </main>
    </div>
  );
} 