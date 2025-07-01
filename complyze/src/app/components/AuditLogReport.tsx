"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Download,
  Eye,
  Lock,
  Calendar,
  Activity,
  Search,
  AlertCircle,
  BookOpen,
  Settings,
} from "lucide-react";

// Professional audit colors
const AUDIT_COLORS = {
  compliant: "#10B981",
  partial: "#F59E0B", 
  nonCompliant: "#EF4444",
  neutral: "#6B7280",
  primary: "#1E40AF",
  secondary: "#7C3AED",
};

const CHART_COLORS = [
  "#1E40AF", "#7C3AED", "#DC2626", "#F59E0B", "#10B981", "#06B6D4"
];

interface AuditLogReportProps {
  data: {
    organization_name: string;
    report_date: string;
    start_date: string;
    end_date: string;
    total_prompts: number;
    unique_users: number;
    top_ai_tools: string[];
    avg_prompts_per_user: number;
    redactions: {
      pii: number;
      financial: number;
      code: number;
      dates: number;
    };
    rewrite_count: number;
    blocked_prompts: number;
    manual_flags: number;
    top_risk_category: string;
    violations_by_role: Array<{
      role: string;
      violations: number;
      common_type: string;
    }>;
    framework_alignment: Array<{
      control_id: string;
      framework: string;
      description: string;
      status: "compliant" | "partial" | "non-compliant";
    }>;
    percentage_redacted: number;
    rewrite_coverage: number;
    blocked_count: number;
    non_overridable_flags: number;
  };
  onExport?: (format: string) => void;
}

const AuditLogReport = ({ data, onExport }: AuditLogReportProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (printWindow && reportRef.current) {
        const styles = `
          <style>
            @media print {
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .audit-section { break-inside: avoid; margin-bottom: 30px; }
              .audit-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
              .audit-table th, .audit-table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
              .audit-table th { background-color: #f8fafc; font-weight: 600; }
              .status-compliant { color: #10B981; font-weight: 600; }
              .status-partial { color: #F59E0B; font-weight: 600; }
              .status-non-compliant { color: #EF4444; font-weight: 600; }
              .risk-high { background-color: #FEE2E2; padding: 16px; border-left: 4px solid #EF4444; }
              .risk-medium { background-color: #FEF3C7; padding: 16px; border-left: 4px solid #F59E0B; }
              .metadata-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
              .metric-item { background: #F8FAFC; padding: 12px; border-radius: 8px; }
              hr { border: none; border-top: 2px solid #E5E7EB; margin: 24px 0; }
              h1, h2, h3 { color: #1E293B; }
              .chart-container { break-inside: avoid; }
            }
          </style>
        `;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Audit Log Report - ${data.organization_name}</title>
              ${styles}
            </head>
            <body>
              ${reportRef.current.innerHTML.replace(/class="no-print"[^>]*>[^<]*<\/[^>]*>/gi, '')}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      }
    } else if (onExport) {
      onExport(format);
    }
    
    setIsExporting(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return '✅';
      case 'partial': return '⚠️';
      case 'non-compliant': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return AUDIT_COLORS.compliant;
      case 'partial': return AUDIT_COLORS.partial;
      case 'non-compliant': return AUDIT_COLORS.nonCompliant;
      default: return AUDIT_COLORS.neutral;
    }
  };

  // Prepare chart data
  const redactionData = Object.entries(data.redactions).map(([type, count]) => ({
    type: type.toUpperCase(),
    count,
    color: CHART_COLORS[Object.keys(data.redactions).indexOf(type)],
  }));

  const riskEventData = [
    { category: 'Redactions', count: Object.values(data.redactions).reduce((a, b) => a + b, 0), color: CHART_COLORS[0] },
    { category: 'Rewrites', count: data.rewrite_count, color: CHART_COLORS[1] },
    { category: 'Blocked', count: data.blocked_count, color: CHART_COLORS[2] },
    { category: 'Manual Flags', count: data.manual_flags, color: CHART_COLORS[3] },
  ];

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-white">
      {/* Export Button */}
      <div className="no-print mb-6 flex justify-end">
        <Button 
          onClick={() => handleExport("pdf")} 
          disabled={isExporting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Generating PDF..." : "Export as PDF"}
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 audit-section">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 AI Prompt Activity Audit Log
        </h1>
        <p className="text-lg text-gray-600">
          Comprehensive audit trail and compliance assessment
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">
            This report provides a complete audit trail of AI prompt activity for compliance and security review
          </p>
        </div>
      </div>

      <hr className="my-8" />

      {/* 1. Audit Metadata */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <Calendar className="h-6 w-6 mr-3" />
            🧑‍💻 1. Audit Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Organization:</span>
                <span className="font-semibold">{data.organization_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Report Generated:</span>
                <span className="font-semibold">{formatDate(data.report_date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Audit Period Start:</span>
                <span className="font-semibold">{formatDate(data.start_date)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium text-gray-600">Audit Period End:</span>
                <span className="font-semibold">{formatDate(data.end_date)}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">📊 Reporting Window Summary</h4>
              <p className="text-sm text-gray-600 mb-2">
                This audit covers all AI prompt activity during the specified period.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Duration:</strong> {Math.ceil((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 2. Prompt Activity Summary */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <Activity className="h-6 w-6 mr-3" />
            🔎 2. Prompt Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-blue-900">Total Prompts</h4>
              <p className="text-3xl font-bold text-blue-600">{data.total_prompts.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-green-900">Unique Users</h4>
              <p className="text-3xl font-bold text-green-600">{data.unique_users}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-purple-900">Avg per User</h4>
              <p className="text-3xl font-bold text-purple-600">{data.avg_prompts_per_user}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-orange-900">AI Platforms</h4>
              <p className="text-3xl font-bold text-orange-600">{data.top_ai_tools.length}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">🤖 AI Platform Usage Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.top_ai_tools.map((tool, index) => ({
                        name: tool,
                        value: Math.floor(data.total_prompts / data.top_ai_tools.length) + (index === 0 ? data.total_prompts % data.top_ai_tools.length : 0),
                        color: CHART_COLORS[index % CHART_COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.top_ai_tools.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {data.top_ai_tools.map((tool, index) => (
                  <div key={tool} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      ></div>
                      <span className="font-medium">{tool}</span>
                    </div>
                    <span className="text-gray-600">
                      {Math.floor(data.total_prompts / data.top_ai_tools.length) + (index === 0 ? data.total_prompts % data.top_ai_tools.length : 0)} prompts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 3. Risk Events Summary */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-red-600 to-pink-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <AlertTriangle className="h-6 w-6 mr-3" />
            ⛔ 3. Risk Events Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Risk Events Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="chart-container">
              <h4 className="font-semibold text-gray-900 mb-3">🚨 Risk Events Overview</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={riskEventData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Redaction Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🔒 Redaction Categories</h4>
              <div className="space-y-3">
                {redactionData.map((item) => (
                  <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{item.count}</span>
                      <span className="text-sm text-gray-500 block">incidents</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="font-semibold text-red-900 mb-2">⚠️ Most Frequent Risk</h5>
                <p className="text-red-800">
                  <strong>{data.top_risk_category}</strong> represents the highest risk category detected during this audit period.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Events Table */}
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-gray-900 mb-3">📊 Risk Events Breakdown</h4>
            <table className="audit-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left">Risk Type</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Count</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">% of Total</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Action Taken</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">PII Redactions</td>
                  <td className="border border-gray-300 px-4 py-3">{data.redactions.pii}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.redactions.pii / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600">✅ Automatically redacted</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">Financial Data</td>
                  <td className="border border-gray-300 px-4 py-3">{data.redactions.financial}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.redactions.financial / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600">✅ Automatically redacted</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">Code/IP</td>
                  <td className="border border-gray-300 px-4 py-3">{data.redactions.code}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.redactions.code / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600">✅ Automatically redacted</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">Dates/Timestamps</td>
                  <td className="border border-gray-300 px-4 py-3">{data.redactions.dates}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.redactions.dates / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-green-600">✅ Automatically redacted</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">Smart Rewrites</td>
                  <td className="border border-gray-300 px-4 py-3">{data.rewrite_count}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.rewrite_count / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-blue-600">🔄 Rewritten safely</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">Blocked Prompts</td>
                  <td className="border border-gray-300 px-4 py-3">{data.blocked_count}</td>
                  <td className="border border-gray-300 px-4 py-3">{((data.blocked_count / data.total_prompts) * 100).toFixed(1)}%</td>
                  <td className="border border-gray-300 px-4 py-3 text-red-600">🛑 Completely blocked</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 4. Compliance Framework Mapping */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <BookOpen className="h-6 w-6 mr-3" />
            ⚖️ 4. Compliance Framework Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="audit-table w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left">Framework</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Control ID</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.framework_alignment.map((control, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3 font-medium">{control.framework}</td>
                    <td className="border border-gray-300 px-4 py-3 font-mono text-sm">{control.control_id}</td>
                    <td className="border border-gray-300 px-4 py-3">{control.description}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${getStatusColor(control.status)}20`,
                          color: getStatusColor(control.status)
                        }}
                      >
                        {getStatusIcon(control.status)} 
                        <span className="ml-1 capitalize">
                          {control.status === 'non-compliant' ? 'Not Met' : 
                           control.status === 'partial' ? 'Partial' : 'Fully Aligned'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold text-green-900">✅ Fully Aligned</h4>
              <p className="text-2xl font-bold text-green-600">
                {data.framework_alignment.filter(c => c.status === 'compliant').length}
              </p>
              <p className="text-sm text-green-700">Controls</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold text-yellow-900">⚠️ Partial</h4>
              <p className="text-2xl font-bold text-yellow-600">
                {data.framework_alignment.filter(c => c.status === 'partial').length}
              </p>
              <p className="text-sm text-yellow-700">Controls</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <h4 className="font-semibold text-red-900">❌ Not Met</h4>
              <p className="text-2xl font-bold text-red-600">
                {data.framework_alignment.filter(c => c.status === 'non-compliant').length}
              </p>
              <p className="text-sm text-red-700">Controls</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 5. High-Risk Prompt Examples */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-orange-600 to-red-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <AlertCircle className="h-6 w-6 mr-3" />
            💥 5. High-Risk Prompt Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Example 1 */}
            <div className="risk-high border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
              <h4 className="font-semibold text-red-900 mb-2">🚨 Example 1: PII Exposure</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700"><strong>Original Prompt:</strong></p>
                <p className="bg-white p-3 rounded border font-mono text-sm">
                  "Help me draft an email to john.doe@company.com about the contract for SSN 123-45-6789 and include payment via card 4532-1234-5678-9012"
                </p>
                <p className="text-sm text-gray-700"><strong>After Processing:</strong></p>
                <p className="bg-green-50 p-3 rounded border font-mono text-sm">
                  "Help me draft an email to [EMAIL_REDACTED] about the contract for [SSN_REDACTED] and include payment via card [CREDIT_CARD_REDACTED]"
                </p>
                <p className="text-xs text-red-600"><strong>Action:</strong> ✅ Automatically redacted PII, email, and financial data</p>
              </div>
            </div>

            {/* Example 2 */}
            <div className="risk-medium border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Example 2: Code/IP Exposure</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700"><strong>Original Prompt:</strong></p>
                <p className="bg-white p-3 rounded border font-mono text-sm">
                  "Review this API key: sk-1234567890abcdef and help optimize our authentication function: async validateUser(token, secret)"
                </p>
                <p className="text-sm text-gray-700"><strong>After Processing:</strong></p>
                <p className="bg-blue-50 p-3 rounded border font-mono text-sm">
                  "Review best practices for API security and help optimize authentication patterns for user validation"
                </p>
                <p className="text-xs text-yellow-600"><strong>Action:</strong> 🔄 Smart rewrite to remove API keys and proprietary code</p>
              </div>
            </div>

            {/* Example 3 - Blocked */}
            <div className="border-l-4 border-red-600 bg-red-100 p-4 rounded-r-lg">
              <h4 className="font-semibold text-red-900 mb-2">🛑 Example 3: Completely Blocked</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-700"><strong>Attempted Prompt:</strong></p>
                <p className="bg-white p-3 rounded border font-mono text-sm">
                  "Can you help me bypass security controls and extract sensitive customer data from our database?"
                </p>
                <p className="text-sm text-gray-700"><strong>Result:</strong></p>
                <p className="bg-red-100 p-3 rounded border font-mono text-sm text-red-800">
                  🛑 BLOCKED - Prompt contains policy violations and potential security threats
                </p>
                <p className="text-xs text-red-600"><strong>Action:</strong> ❌ Completely blocked due to security policy violation</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 6. Compliance Summary */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <CheckCircle className="h-6 w-6 mr-3" />
            ✅ 6. Compliance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Coverage Rate</h4>
              <p className="text-4xl font-bold text-blue-600">{data.percentage_redacted}%</p>
              <p className="text-sm text-blue-700">of prompts processed</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-green-900 mb-2">Rewrite Success</h4>
              <p className="text-4xl font-bold text-green-600">{data.rewrite_coverage}%</p>
              <p className="text-sm text-green-700">successful rewrites</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">Critical Blocks</h4>
              <p className="text-4xl font-bold text-purple-600">{data.non_overridable_flags}</p>
              <p className="text-sm text-purple-700">non-overridable flags</p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">📋 Compliance Status Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Total prompts monitored and processed
                </span>
                <span className="font-bold text-green-600">{data.total_prompts}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  Sensitive data automatically redacted
                </span>
                <span className="font-bold text-blue-600">
                  {Object.values(data.redactions).reduce((a, b) => a + b, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  Prompts requiring manual review
                </span>
                <span className="font-bold text-orange-600">{data.manual_flags}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded">
                <span className="flex items-center">
                  <Lock className="h-5 w-5 text-red-600 mr-2" />
                  High-risk prompts blocked
                </span>
                <span className="font-bold text-red-600">{data.blocked_count}</span>
              </div>
            </div>
          </div>

          {data.non_overridable_flags > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h5 className="font-semibold text-red-900 mb-2">🚨 Critical Security Flags</h5>
              <p className="text-red-800">
                <strong>{data.non_overridable_flags}</strong> prompts were flagged as critical security risks and could not be overridden by users. These require immediate review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <hr className="my-8" />

      {/* 7. Next Steps */}
      <Card className="mb-8 audit-section">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
          <CardTitle className="flex items-center text-xl">
            <Settings className="h-6 w-6 mr-3" />
            📋 7. Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">📤 Export Audit Logs</h4>
                <p className="text-blue-800 text-sm">
                  Export complete audit trail to your GRC platform or SIEM system for compliance documentation and monitoring integration.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-orange-50 rounded-lg">
              <Users className="h-6 w-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">🎓 Team Training Program</h4>
                <p className="text-orange-800 text-sm">
                  Implement targeted training for teams with high violation counts: {data.violations_by_role.filter(r => r.violations > 10).map(r => r.role).join(', ')}.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-green-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">🔔 Enable Real-time Alerts</h4>
                <p className="text-green-800 text-sm">
                  Configure immediate notifications for high-risk prompts and policy violations to enable faster response times.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-purple-50 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">🔍 Review Detection Policies</h4>
                <p className="text-purple-800 text-sm">
                  Analyze detection effectiveness and update policies based on {data.top_risk_category} being the most frequent risk category.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-gray-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">📑 Update Documentation</h4>
                <p className="text-gray-800 text-sm">
                  Link this audit report to your System Security Plan (SSP) and Plan of Action &amp; Milestones (POA&amp;M) for compliance reporting.
                </p>
              </div>
            </div>

            <div className="flex items-start p-4 bg-red-50 rounded-lg">
              <Shield className="h-6 w-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">⚡ Address Critical Issues</h4>
                <p className="text-red-800 text-sm">
                  Immediately investigate {data.non_overridable_flags} critical security flags that could not be overridden during the audit period.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-semibold text-indigo-900 mb-2">📞 Contact Information</h4>
            <p className="text-indigo-800 text-sm">
              For questions about this audit report or compliance requirements, contact your Information Security team or Compliance Officer.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-200 mt-8">
        <p className="text-sm text-gray-600">
          Generated by Complyze AI Compliance Platform • {formatDate(data.report_date)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This report contains sensitive security information and should be handled according to your organization's data classification policies.
        </p>
      </div>
    </div>
  );
};

export default AuditLogReport; 