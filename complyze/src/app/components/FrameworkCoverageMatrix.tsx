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
  FileText,
  Settings,
  Download,
  Layers,
  Target,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Wrench,
} from "lucide-react";

// Professional compliance colors
const FRAMEWORK_COLORS = {
  compliant: "#10B981",
  partial: "#F59E0B",
  nonCompliant: "#EF4444",
  nist: "#3B82F6",
  iso: "#8B5CF6",
  soc: "#06B6D4",
};

interface FrameworkControl {
  framework: string;
  control_id: string;
  observed_activity: string;
  mitigation_applied: string;
  status: "compliant" | "partial" | "non_compliant";
}

interface FrameworkData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  nist_coverage: number;
  iso_coverage: number;
  soc2_coverage: number;
  total_controls: number;
  controls_matrix: FrameworkControl[];
  gaps_identified: string[];
  enhancement_suggestions: string[];
  integration_recommendations: string[];
}

interface FrameworkCoverageMatrixProps {
  data: FrameworkData;
}

const FrameworkCoverageMatrix: React.FC<FrameworkCoverageMatrixProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Chart data for framework coverage
  const frameworkSummaryData = [
    { name: "NIST AI RMF", coverage: data.nist_coverage, color: FRAMEWORK_COLORS.nist },
    { name: "ISO 42001", coverage: data.iso_coverage, color: FRAMEWORK_COLORS.iso },
    { name: "SOC 2", coverage: data.soc2_coverage, color: FRAMEWORK_COLORS.soc },
  ];

  // Status distribution data
  const statusDistributionData = [
    { 
      name: "Compliant", 
      value: data.controls_matrix.filter(c => c.status === "compliant").length,
      color: FRAMEWORK_COLORS.compliant 
    },
    { 
      name: "Partial", 
      value: data.controls_matrix.filter(c => c.status === "partial").length,
      color: FRAMEWORK_COLORS.partial 
    },
    { 
      name: "Non-Compliant", 
      value: data.controls_matrix.filter(c => c.status === "non_compliant").length,
      color: FRAMEWORK_COLORS.nonCompliant 
    },
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
      default: return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "compliant": return "✅ Compliant";
      case "partial": return "⚠️ Partial";
      default: return "❌ Non-Compliant";
    }
  };

  const getFrameworkColor = (framework: string) => {
    if (framework.includes("NIST")) return "bg-blue-50 border-blue-200";
    if (framework.includes("ISO")) return "bg-purple-50 border-purple-200";
    if (framework.includes("SOC")) return "bg-cyan-50 border-cyan-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg mb-6 print:bg-indigo-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Layers className="w-8 h-8" />
              Framework Coverage Matrix
            </h1>
            <p className="text-indigo-100 text-lg">
              Comprehensive compliance control mapping and coverage analysis
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-indigo-600 hover:bg-indigo-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="w-5 h-5" />
            🗂️ Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4 text-sm">
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
            <div>
              <p className="font-semibold text-gray-600">Total Controls:</p>
              <p className="text-lg font-bold text-gray-900">{data.total_controls}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-blue-600" />
            📊 Framework Coverage Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {frameworkSummaryData.map((framework, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border-l-4" style={{ borderLeftColor: framework.color }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{framework.name}</p>
                      <p className="text-2xl font-bold" style={{ color: framework.color }}>
                        {framework.coverage}%
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg" 
                         style={{ backgroundColor: framework.color }}>
                      {framework.coverage}%
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: framework.color,
                        width: `${framework.coverage}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frameworkSummaryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="coverage" fill="#8884d8">
                    {frameworkSummaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Status Distribution */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-green-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Shield className="w-5 h-5 text-green-600" />
            📈 Control Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {statusDistributionData.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="font-medium text-gray-900">{status.name}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: status.color }}>
                    {status.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {statusDistributionData.map((entry, index) => (
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

      {/* Controls Matrix Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Layers className="w-5 h-5 text-indigo-600" />
            📋 Control Mapping Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Framework</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Control ID</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Observed Activity</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Mitigation Applied</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.controls_matrix.map((control, index) => (
                  <tr key={index} className={`border-b hover:bg-gray-50 ${getFrameworkColor(control.framework)}`}>
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{control.framework}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {control.control_id}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-700 max-w-xs">
                      {control.observed_activity}
                    </td>
                    <td className="py-3 px-2 text-gray-700 max-w-xs">
                      {control.mitigation_applied}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(control.status)}
                        <span className={`text-xs font-medium ${
                          control.status === 'compliant' ? 'text-green-700' :
                          control.status === 'partial' ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {getStatusText(control.status)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gaps and Risks */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            ⚠️ Gaps and Unmapped Risks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {data.gaps_identified.length > 0 ? (
            <div className="space-y-3">
              {data.gaps_identified.map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{gap}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900">No significant gaps identified</p>
              <p className="text-gray-600">All critical controls are properly mapped and covered</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Enhancements */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Wrench className="w-5 h-5 text-purple-600" />
            🛠️ Suggested Control Enhancements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.enhancement_suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                <Settings className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Enhancement #{index + 1}</p>
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Suggestions */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            🔁 Integration Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.integration_recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border-l-4 border-teal-400">
                <BookOpen className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Integration #{index + 1}</p>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Report generated on {new Date().toLocaleString()} | Complyze Framework Coverage Analysis</p>
      </div>
    </div>
  );
};

export default FrameworkCoverageMatrix; 