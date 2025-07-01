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
  LineChart,
  Line,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  Target,
  TrendingUp,
  Download,
  Settings,
  Zap,
  Search,
  Brain,
  FileCheck,
} from "lucide-react";

// Color palette for redaction effectiveness
const COLORS = {
  success: "#10B981",
  warning: "#F59E0B", 
  danger: "#EF4444",
  primary: "#3B82F6",
  secondary: "#6366F1",
  accent: "#8B5CF6",
};

interface RedactionData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  total_prompts: number;
  redacted_count: number;
  percent_redacted: number;
  rewrite_count: number;
  top_trigger: string;
  pii_precision: number;
  pii_recall: number;
  code_precision: number;
  code_recall: number;
  financial_precision: number;
  financial_recall: number;
  missed_prompts_count: number;
  framework_mapping: Array<{
    framework: string;
    control_id: string;
    status: "compliant" | "partial" | "non_compliant";
  }>;
}

interface RedactionEffectivenessReportProps {
  data: RedactionData;
}

const RedactionEffectivenessReport: React.FC<RedactionEffectivenessReportProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Mock chart data based on report data
  const redactionCoverageData = [
    { name: "Redacted", value: data.redacted_count, color: COLORS.success },
    { name: "Clean", value: data.total_prompts - data.redacted_count, color: COLORS.primary },
  ];

  const detectionAccuracyData = [
    { category: "PII", precision: data.pii_precision, recall: data.pii_recall },
    { category: "Code", precision: data.code_precision, recall: data.code_recall },
    { category: "Financial", precision: data.financial_precision, recall: data.financial_recall },
  ];

  const rewriteTrendData = [
    { day: "Day 1", rewrites: Math.floor(data.rewrite_count * 0.1) },
    { day: "Day 2", rewrites: Math.floor(data.rewrite_count * 0.15) },
    { day: "Day 3", rewrites: Math.floor(data.rewrite_count * 0.2) },
    { day: "Day 4", rewrites: Math.floor(data.rewrite_count * 0.25) },
    { day: "Day 5", rewrites: Math.floor(data.rewrite_count * 0.3) },
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "partial": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div ref={reportRef} className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg mb-6 print:bg-blue-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Redaction Effectiveness Report
            </h1>
            <p className="text-blue-100 text-lg">
              Evaluating AI prompt redaction and smart rewrite performance
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-blue-600 hover:bg-blue-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Search className="w-5 h-5" />
            🔍 Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-600">Organization:</p>
              <p className="text-lg font-bold text-gray-900">{data.organization_name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Report Date:</p>
              <p className="text-lg font-bold text-gray-900">{new Date(data.report_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Period:</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(data.start_date).toLocaleDateString()} to {new Date(data.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redaction Coverage */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <CheckCircle className="w-5 h-5 text-green-600" />
            ✅ Redaction Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Prompts</p>
                    <p className="text-2xl font-bold text-gray-900">{data.total_prompts.toLocaleString()}</p>
                  </div>
                  <FileCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Redacted Prompts</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {data.redacted_count.toLocaleString()} ({data.percent_redacted}%)
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={redactionCoverageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {redactionCoverageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Rewrite Triggers */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Brain className="w-5 h-5 text-purple-600" />
            🧠 Smart Rewrite Triggers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rewrite Count</p>
                    <p className="text-2xl font-bold text-purple-900">{data.rewrite_count.toLocaleString()}</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Trigger</p>
                  <p className="text-lg font-bold text-indigo-900">{data.top_trigger}</p>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rewriteTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rewrites" stroke={COLORS.secondary} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Accuracy */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-orange-600" />
            📊 Detection Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-semibold text-gray-700">Category</th>
                    <th className="text-center py-2 font-semibold text-gray-700">Precision</th>
                    <th className="text-center py-2 font-semibold text-gray-700">Recall</th>
                  </tr>
                </thead>
                <tbody>
                  {detectionAccuracyData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{row.category}</td>
                      <td className="text-center py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          row.precision >= 90 ? 'bg-green-100 text-green-800' : 
                          row.precision >= 75 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.precision}%
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          row.recall >= 90 ? 'bg-green-100 text-green-800' : 
                          row.recall >= 75 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.recall}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detectionAccuracyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="precision" fill={COLORS.primary} name="Precision" />
                  <Bar dataKey="recall" fill={COLORS.accent} name="Recall" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missed Redactions */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            🛑 Missed Redactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Unflagged High-Risk Prompts</p>
                <p className="text-2xl font-bold text-red-900">{data.missed_prompts_count}</p>
              </div>
              <Eye className="w-8 h-8 text-red-600" />
            </div>
            {data.missed_prompts_count > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Action Required:</strong> Review missed detection patterns and update training data.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Framework Mapping */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Settings className="w-5 h-5 text-cyan-600" />
            🧩 Framework Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.framework_mapping.map((framework, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(framework.status)}
                  <div>
                    <p className="font-medium text-gray-900">{framework.framework} {framework.control_id}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  framework.status === 'compliant' ? 'bg-green-100 text-green-800' :
                  framework.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {framework.status === 'compliant' ? 'Fully Aligned' :
                   framework.status === 'partial' ? 'Partial' : 'Not Met'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            📋 Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border-l-4 border-blue-500">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Tune Detection Thresholds</p>
                <p className="text-sm text-gray-600">Adjust financial data detection sensitivity to reduce false negatives</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border-l-4 border-green-500">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Expand Training Data</p>
                <p className="text-sm text-gray-600">Add PHI examples to improve healthcare-related prompt detection</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border-l-4 border-purple-500">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Monitor Engineering Team</p>
                <p className="text-sm text-gray-600">Increase monitoring for false negatives in engineering team prompts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Report generated on {new Date().toLocaleString()} | Complyze Redaction Effectiveness Analysis</p>
      </div>
    </div>
  );
};

export default RedactionEffectivenessReport; 