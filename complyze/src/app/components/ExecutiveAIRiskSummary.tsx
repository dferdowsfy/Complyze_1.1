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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  Download,
  Eye,
  BarChart3,
  Globe,
  Lock,
  Calendar,
} from "lucide-react";

// Beautiful color palette for charts
const COLORS = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
  light: "#F1F5F9",
  muted: "#64748B",
};

const CHART_COLORS = [
  "#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", 
  "#06B6D4", "#8C4A1F", "#7C3AED", "#059669", "#DC2626"
];

interface ExecutiveAIRiskSummaryProps {
  data: {
    total_prompts: number;
    unique_users: number;
    avg_prompts_per_user: number;
    top_ai_tools: string[];
    redactions: {
      pii: number;
      financial: number;
      code: number;
      dates: number;
    };
    rewrite_count: number;
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
      status: "compliant" | "partial" | "non-compliant";
    }>;
    percentage_mitigated: number;
    blocked_count: number;
    fully_aligned_frameworks: string[];
    org_name: string;
    start_date: string;
    end_date: string;
    report_date: string;
  };
  onExport?: (format: string) => void;
}

const ExecutiveAIRiskSummary = ({ data, onExport }: ExecutiveAIRiskSummaryProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate derived metrics
  const totalRedactions = Object.values(data.redactions).reduce((sum, count) => sum + count, 0);
  const riskMitigationRate = ((data.blocked_count + data.rewrite_count) / data.total_prompts * 100);
  
  // Prepare chart data
  const redactionData = Object.entries(data.redactions).map(([type, count]) => ({
    type: type.toUpperCase(),
    count,
    percentage: (count / totalRedactions * 100).toFixed(1),
  }));

  const violationsByRoleData = data.violations_by_role.map(item => ({
    role: item.role,
    violations: item.violations,
    type: item.common_type,
  }));

  const frameworkComplianceData = data.framework_alignment.reduce((acc, item) => {
    const existing = acc.find(f => f.framework === item.framework);
    if (existing) {
      existing[item.status]++;
    } else {
      acc.push({
        framework: item.framework,
        compliant: item.status === "compliant" ? 1 : 0,
        partial: item.status === "partial" ? 1 : 0,
        "non-compliant": item.status === "non-compliant" ? 1 : 0,
      });
    }
    return acc;
  }, [] as any[]);

  const aiToolsData = data.top_ai_tools.map((tool, index) => ({
    tool,
    usage: Math.floor(Math.random() * 100) + 20, // Mock usage data
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const handleExport = async (format: string) => {
    setIsExporting(true);
    
    if (format === "pdf") {
      // Generate PDF using the browser's print functionality
      const printWindow = window.open("", "_blank");
      if (printWindow && reportRef.current) {
        const styles = `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            .chart-container { break-inside: avoid; }
            .section { break-inside: avoid; margin-bottom: 30px; }
            h1, h2, h3 { color: #1e293b; }
            .metric-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 8px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; }
          </style>
        `;
        
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${data.org_name} - Executive AI Risk & Compliance Summary</title>
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

  const MetricCard = ({ title, value, icon: Icon, trend, color = "primary" }: any) => (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold text-slate-900`}>
              {value}
            </p>
            {trend && (
              <p className={`text-sm ${trend > 0 ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {trend > 0 ? "+" : ""}{trend}%
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-indigo-100`}>
            <Icon className={`h-6 w-6 text-indigo-600`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Executive AI Risk & Compliance Summary
            </h1>
            <p className="text-lg text-gray-600">{data.org_name}</p>
            <p className="text-sm text-gray-500 flex items-center mt-2">
              <Calendar className="h-4 w-4 mr-2" />
              Report Period: {formatDate(data.start_date)} - {formatDate(data.end_date)}
            </p>
            <p className="text-sm text-gray-500">
              Generated: {formatDate(data.report_date)}
            </p>
          </div>
          <div className="no-print flex gap-2">
            <Button 
              onClick={() => handleExport("pdf")} 
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport("json")}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Raw Data
            </Button>
          </div>
        </div>

        {/* Executive Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total AI Interactions"
            value={data.total_prompts.toLocaleString()}
            icon={BarChart3}
            trend={12}
            color="primary"
          />
          <MetricCard
            title="Active Users"
            value={data.unique_users}
            icon={Users}
            trend={8}
            color="success"
          />
          <MetricCard
            title="Risk Mitigation Rate"
            value={`${riskMitigationRate.toFixed(1)}%`}
            icon={Shield}
            trend={-2}
            color="warning"
          />
          <MetricCard
            title="Security Incidents"
            value={data.manual_flags}
            icon={AlertTriangle}
            trend={-15}
            color="danger"
          />
        </div>
      </div>

      {/* Section 1: Executive Overview */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardTitle className="flex items-center">
            <Globe className="h-6 w-6 mr-3" />
            1. Executive Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Metrics Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Average Prompts per User</span>
                  <span className="text-lg font-bold text-indigo-600">
                    {data.avg_prompts_per_user.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Data Protection Events</span>
                  <span className="text-lg font-bold text-green-600">
                    {totalRedactions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Automated Rewrites</span>
                  <span className="text-lg font-bold text-blue-600">
                    {data.rewrite_count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">AI Platform Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={aiToolsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="usage"
                  >
                    {aiToolsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: LLM Usage Snapshot */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardTitle className="flex items-center">
            <Eye className="h-6 w-6 mr-3" />
            2. LLM Usage Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Top AI Tools</h3>
              <div className="space-y-2">
                {data.top_ai_tools.map((tool, index) => (
                  <div key={tool} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="font-medium">{tool}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {aiToolsData[index]?.usage || 0}% usage
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Usage Patterns</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={aiToolsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tool" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Redaction & Risk Mitigation Summary */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardTitle className="flex items-center">
            <Lock className="h-6 w-6 mr-3" />
            3. Redaction & Risk Mitigation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Redaction Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={redactionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={80} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} (${redactionData.find(d => d.count === value)?.percentage}%)`,
                      'Redactions'
                    ]}
                  />
                  <Bar dataKey="count" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Mitigation Effectiveness</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Overall Mitigation Rate</span>
                    <span className="text-2xl font-bold text-green-600">
                      {data.percentage_mitigated.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${data.percentage_mitigated}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-600 font-medium">Blocked Prompts</p>
                    <p className="text-xl font-bold text-blue-800">{data.blocked_count}</p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-sm text-purple-600 font-medium">Auto Rewrites</p>
                    <p className="text-xl font-bold text-purple-800">{data.rewrite_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Policy Violations by Role/Team */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardTitle className="flex items-center">
            <Users className="h-6 w-6 mr-3" />
            4. Policy Violations by Role / Team
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Violations</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Most Common Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {violationsByRoleData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.violations > 10 ? 'bg-red-100 text-red-800' :
                        item.violations > 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.violations}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.violations > 10 ? 'bg-red-100 text-red-800' :
                        item.violations > 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.violations > 10 ? 'High' : item.violations > 5 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {violationsByRoleData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Violations by Role</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={violationsByRoleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="violations" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Compliance Framework Mapping */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <CardTitle className="flex items-center">
            <CheckCircle className="h-6 w-6 mr-3" />
            5. Compliance Framework Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Framework Compliance Status</h3>
              {frameworkComplianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={frameworkComplianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliant" stackId="a" fill={COLORS.success} name="Compliant" />
                    <Bar dataKey="partial" stackId="a" fill={COLORS.warning} name="Partial" />
                    <Bar dataKey="non-compliant" stackId="a" fill={COLORS.danger} name="Non-Compliant" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No framework compliance data available
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Supported Frameworks</h3>
              <div className="space-y-3">
                {["NIST AI RMF", "ISO/IEC 42001", "SOC 2"].map((framework, index) => {
                  const isFullyAligned = data.fully_aligned_frameworks.includes(framework);
                  return (
                    <div key={framework} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{framework}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isFullyAligned ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isFullyAligned ? 'Fully Aligned' : 'In Progress'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Framework Alignment Summary</h4>
                <p className="text-sm text-blue-700">
                  {data.fully_aligned_frameworks.length} of 3 frameworks are fully aligned.
                  {data.framework_alignment.length} controls have been assessed across all frameworks.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Summary of Findings */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-600 text-white">
          <CardTitle className="flex items-center">
            <FileText className="h-6 w-6 mr-3" />
            6. Summary of Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-600">✅ Strengths</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>High automated redaction rate of {totalRedactions.toLocaleString()} sensitive data items</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{data.percentage_mitigated.toFixed(1)}% risk mitigation effectiveness</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{data.fully_aligned_frameworks.length} compliance frameworks fully aligned</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Active monitoring across {data.unique_users} users</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-600">⚠️ Areas for Improvement</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>{data.manual_flags} incidents requiring manual intervention</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Top risk category: {data.top_risk_category}</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Role-based training needed for high-violation roles</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Framework alignment gaps in {3 - data.fully_aligned_frameworks.length} areas</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Audit-Ready Actions */}
      <Card className="mb-8 section">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 mr-3" />
            7. Audit-Ready Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Immediate Actions (0-30 days)</h3>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-red-500 bg-red-50">
                  <p className="font-medium text-red-800">High Priority</p>
                  <p className="text-sm text-red-700">
                    Address {data.manual_flags} flagged incidents requiring immediate review
                  </p>
                </div>
                <div className="p-3 border-l-4 border-orange-500 bg-orange-50">
                  <p className="font-medium text-orange-800">Medium Priority</p>
                  <p className="text-sm text-orange-700">
                    Implement role-based training for teams with &gt;5 violations
                  </p>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <p className="font-medium text-blue-800">Documentation</p>
                  <p className="text-sm text-blue-700">
                    Update incident response procedures based on recent events
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Long-term Improvements (30+ days)</h3>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <p className="font-medium text-green-800">Policy Enhancement</p>
                  <p className="text-sm text-green-700">
                    Develop AI governance policies for emerging use cases
                  </p>
                </div>
                <div className="p-3 border-l-4 border-purple-500 bg-purple-50">
                  <p className="font-medium text-purple-800">Framework Alignment</p>
                  <p className="text-sm text-purple-700">
                    Complete remaining framework control implementations
                  </p>
                </div>
                <div className="p-3 border-l-4 border-indigo-500 bg-indigo-50">
                  <p className="font-medium text-indigo-800">Automation</p>
                  <p className="text-sm text-indigo-700">
                    Enhance automated redaction rules for improved accuracy
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Evidence Collection Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalRedactions}</div>
                <div className="text-gray-600">Redaction Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.total_prompts}</div>
                <div className="text-gray-600">Audit Logs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{data.framework_alignment.length}</div>
                <div className="text-gray-600">Control Assessments</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 p-4 bg-white rounded-lg shadow">
        <p>
          This report was generated by the Complyze AI Compliance Platform on {formatDate(data.report_date)}.
          <br />
          All data is derived from real-time monitoring of AI interactions within your organization.
        </p>
      </div>
    </div>
  );
};

export default ExecutiveAIRiskSummary; 