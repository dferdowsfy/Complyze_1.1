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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Download,
  BookOpen,
  Scale,
  Gavel,
  Eye,
  Target,
  Flag,
  Award,
  Clock,
  Building,
} from "lucide-react";

// Policy adherence color scheme
const POLICY_COLORS = {
  compliant: "#10B981",
  violation: "#EF4444",
  warning: "#F59E0B",
  review: "#8B5CF6",
  approved: "#3B82F6",
  department: ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"],
};

interface PolicyViolation {
  violation_id: string;
  user_id: string;
  department: string;
  policy_section: string;
  violation_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  action_taken: string;
  resolution_status: "open" | "resolved" | "escalated";
  date_reported: string;
  resolution_date?: string;
}

interface DepartmentCompliance {
  department: string;
  total_users: number;
  compliant_users: number;
  compliance_rate: number;
  violations_count: number;
  training_completion: number;
  risk_score: number;
}

interface PolicyMetric {
  policy_name: string;
  adherence_rate: number;
  violations_count: number;
  last_review: string;
  next_review: string;
  effectiveness_score: number;
}

interface TrainingRecord {
  user_id: string;
  department: string;
  training_module: string;
  completion_date: string;
  score: number;
  certification_status: "active" | "expired" | "pending";
}

interface LLMGovernanceData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  overall_compliance_rate: number;
  total_violations: number;
  resolved_violations: number;
  active_violations: number;
  policy_violations: PolicyViolation[];
  department_compliance: DepartmentCompliance[];
  policy_metrics: PolicyMetric[];
  training_records: TrainingRecord[];
  compliance_trends: Array<{
    date: string;
    compliance_rate: number;
    violations_count: number;
    training_completion: number;
  }>;
  top_violations: Array<{
    violation_type: string;
    count: number;
    trend: "up" | "down" | "stable";
  }>;
}

interface LLMGovernancePolicyAdherenceProps {
  data: LLMGovernanceData;
}

const LLMGovernancePolicyAdherence: React.FC<LLMGovernancePolicyAdherenceProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Violations by severity
  const violationsBySeverity = [
    { name: "Critical", value: data.policy_violations.filter(v => v.severity === "critical").length, color: POLICY_COLORS.violation },
    { name: "High", value: data.policy_violations.filter(v => v.severity === "high").length, color: "#F97316" },
    { name: "Medium", value: data.policy_violations.filter(v => v.severity === "medium").length, color: POLICY_COLORS.warning },
    { name: "Low", value: data.policy_violations.filter(v => v.severity === "low").length, color: POLICY_COLORS.compliant },
  ];

  // Department radar chart data
  const departmentRadarData = data.department_compliance.map(dept => ({
    department: dept.department,
    compliance: dept.compliance_rate,
    training: dept.training_completion,
    riskScore: 100 - dept.risk_score, // Invert for better visualization
  }));

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-700 bg-red-50 border-red-200";
      case "high": return "text-orange-700 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "escalated": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "open": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getCertificationColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-600 bg-green-50";
      case "expired": return "text-red-600 bg-red-50";
      case "pending": return "text-yellow-600 bg-yellow-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg mb-6 print:bg-purple-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Scale className="w-8 h-8" />
              LLM Governance Policy Adherence
            </h1>
            <p className="text-purple-100 text-lg">
              Employee compliance with internal LLM usage policies and governance
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-purple-600 hover:bg-purple-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Gavel className="w-5 h-5" />
            📊 Policy Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-600">Organization:</p>
                <p className="text-xl font-bold text-gray-900">{data.organization_name}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Assessment Period:</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(data.start_date)} to {formatDate(data.end_date)}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Report Generated:</p>
                <p className="text-lg font-bold text-gray-900">{formatDate(data.report_date)}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto">
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: data.overall_compliance_rate >= 90 ? POLICY_COLORS.compliant : data.overall_compliance_rate >= 75 ? POLICY_COLORS.warning : POLICY_COLORS.violation }}
                >
                  {data.overall_compliance_rate}%
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white px-3 py-1 rounded-full text-sm font-medium border shadow-sm"
                        style={{ color: data.overall_compliance_rate >= 90 ? POLICY_COLORS.compliant : data.overall_compliance_rate >= 75 ? POLICY_COLORS.warning : POLICY_COLORS.violation }}>
                    OVERALL COMPLIANCE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Violations</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_violations}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{data.resolved_violations}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold text-orange-600">{data.active_violations}</p>
              </div>
              <Flag className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-purple-600">{data.department_compliance.length}</p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violations by Severity & Compliance Trends */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              🚨 Violations by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {violationsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              📈 Compliance Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.compliance_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="compliance_rate" stroke={POLICY_COLORS.compliant} strokeWidth={3} name="Compliance %" />
                  <Line yAxisId="right" type="monotone" dataKey="violations_count" stroke={POLICY_COLORS.violation} strokeWidth={2} name="Violations" />
                  <Line yAxisId="left" type="monotone" dataKey="training_completion" stroke={POLICY_COLORS.approved} strokeWidth={2} name="Training %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Compliance Radar Chart */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-indigo-600" />
            🎯 Department Compliance Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={departmentRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="department" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Compliance" dataKey="compliance" stroke={POLICY_COLORS.compliant} fill={POLICY_COLORS.compliant} fillOpacity={0.6} />
                  <Radar name="Training" dataKey="training" stroke={POLICY_COLORS.approved} fill={POLICY_COLORS.approved} fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {data.department_compliance.map((dept, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{dept.department}</h3>
                    <span className={`text-sm px-2 py-1 rounded-full font-medium ${dept.compliance_rate >= 90 ? 'text-green-600 bg-green-50' : dept.compliance_rate >= 75 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'}`}>
                      {dept.compliance_rate}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Users: {dept.total_users}</div>
                    <div>Violations: {dept.violations_count}</div>
                    <div>Training: {dept.training_completion}%</div>
                    <div>Risk Score: {dept.risk_score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Violations */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Flag className="w-5 h-5 text-yellow-600" />
            🔴 Top Policy Violations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.top_violations.map((violation, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{violation.violation_type}</p>
                    <p className="text-sm text-gray-600">{violation.count} occurrences</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(violation.trend)}
                  <span className="text-lg font-bold" style={{ color: violation.trend === 'up' ? POLICY_COLORS.violation : POLICY_COLORS.compliant }}>
                    {violation.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Violations Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="w-5 h-5 text-gray-600" />
            📋 Recent Policy Violations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Violation Type</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Severity</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.policy_violations.slice(0, 10).map((violation, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {violation.violation_id}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{violation.user_id}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{violation.department}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <span className="font-medium text-gray-900">{violation.violation_type}</span>
                        <div className="text-xs text-gray-500">{violation.policy_section}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(violation.severity)}`}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(violation.resolution_status)}
                        <span className="text-xs">{violation.resolution_status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {formatDate(violation.date_reported)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Policy Metrics */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BookOpen className="w-5 h-5 text-green-600" />
            📚 Policy Effectiveness Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Policy</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Adherence Rate</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Violations</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Effectiveness</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Last Review</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Next Review</th>
                </tr>
              </thead>
              <tbody>
                {data.policy_metrics.map((policy, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{policy.policy_name}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`font-medium ${policy.adherence_rate >= 90 ? 'text-green-600' : policy.adherence_rate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {policy.adherence_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {policy.violations_count}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${policy.effectiveness_score}%`,
                              backgroundColor: policy.effectiveness_score >= 80 ? POLICY_COLORS.compliant : policy.effectiveness_score >= 60 ? POLICY_COLORS.warning : POLICY_COLORS.violation
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{policy.effectiveness_score}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {formatDate(policy.last_review)}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {formatDate(policy.next_review)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>LLM Governance Policy Report generated on {new Date().toLocaleString()} | Complyze Policy Management Platform</p>
      </div>
    </div>
  );
};

export default LLMGovernancePolicyAdherence; 