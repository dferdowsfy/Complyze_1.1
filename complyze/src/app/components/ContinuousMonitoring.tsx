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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Download,
  Eye,
  Target,
  Zap,
  Users,
  Calendar,
  AlertCircle,
  XCircle,
  Settings,
  BookOpen,
} from "lucide-react";

// Monitoring color scheme
const MONITORING_COLORS = {
  compliant: "#10B981",
  nonCompliant: "#EF4444",
  inProgress: "#F59E0B",
  overdue: "#DC2626",
  onTrack: "#3B82F6",
  delayed: "#F97316",
};

interface Finding {
  finding_id: string;
  title: string;
  severity: "low" | "moderate" | "high" | "critical";
  status: "open" | "in_progress" | "closed" | "deferred";
  framework: string;
  control_id: string;
  description: string;
  remediation_plan: string;
  due_date: string;
  assigned_to: string;
  days_overdue: number;
}

interface ControlStatus {
  control_id: string;
  framework: string;
  control_name: string;
  implementation_status: "implemented" | "partially_implemented" | "planned" | "not_applicable";
  effectiveness: "effective" | "partially_effective" | "ineffective";
  last_assessed: string;
  next_assessment: string;
  findings_count: number;
}

interface MonitoringMetric {
  metric_name: string;
  current_value: number;
  threshold: number;
  status: "green" | "yellow" | "red";
  trend: "up" | "down" | "stable";
  last_updated: string;
}

interface ContinuousMonitoringData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  overall_compliance_score: number;
  total_findings: number;
  open_findings: number;
  overdue_findings: number;
  findings: Finding[];
  control_status: ControlStatus[];
  monitoring_metrics: MonitoringMetric[];
  compliance_trends: Array<{
    date: string;
    fedramp_score: number;
    soc2_score: number;
    nist_score: number;
  }>;
  upcoming_assessments: Array<{
    assessment_type: string;
    due_date: string;
    framework: string;
    responsible_party: string;
  }>;
}

interface ContinuousMonitoringProps {
  data: ContinuousMonitoringData;
}

const ContinuousMonitoring: React.FC<ContinuousMonitoringProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Findings by severity
  const findingsBySeverity = [
    { name: "Critical", value: data.findings.filter(f => f.severity === "critical").length, color: MONITORING_COLORS.overdue },
    { name: "High", value: data.findings.filter(f => f.severity === "high").length, color: MONITORING_COLORS.nonCompliant },
    { name: "Moderate", value: data.findings.filter(f => f.severity === "moderate").length, color: MONITORING_COLORS.inProgress },
    { name: "Low", value: data.findings.filter(f => f.severity === "low").length, color: MONITORING_COLORS.compliant },
  ];

  // Control implementation status
  const controlImplementation = [
    { name: "Implemented", value: data.control_status.filter(c => c.implementation_status === "implemented").length, color: MONITORING_COLORS.compliant },
    { name: "Partially", value: data.control_status.filter(c => c.implementation_status === "partially_implemented").length, color: MONITORING_COLORS.inProgress },
    { name: "Planned", value: data.control_status.filter(c => c.implementation_status === "planned").length, color: MONITORING_COLORS.delayed },
    { name: "N/A", value: data.control_status.filter(c => c.implementation_status === "not_applicable").length, color: MONITORING_COLORS.onTrack },
  ];

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
      case "moderate": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-700 bg-green-50 border-green-200";
      default: return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "open": return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "deferred": return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case "green": return "text-green-600 bg-green-50";
      case "yellow": return "text-yellow-600 bg-yellow-50";
      case "red": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-lg mb-6 print:bg-cyan-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Eye className="w-8 h-8" />
              Continuous Monitoring & POA&M
            </h1>
            <p className="text-cyan-100 text-lg">
              FedRAMP/SOC 2/NIST continuous monitoring and Plan of Action & Milestones
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-cyan-600 hover:bg-cyan-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Shield className="w-5 h-5" />
            🎯 Compliance Status Overview
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
                <p className="font-semibold text-gray-600">Monitoring Period:</p>
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
                  style={{ backgroundColor: data.overall_compliance_score >= 80 ? MONITORING_COLORS.compliant : data.overall_compliance_score >= 60 ? MONITORING_COLORS.inProgress : MONITORING_COLORS.nonCompliant }}
                >
                  {data.overall_compliance_score}%
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white px-3 py-1 rounded-full text-sm font-medium border shadow-sm"
                        style={{ color: data.overall_compliance_score >= 80 ? MONITORING_COLORS.compliant : data.overall_compliance_score >= 60 ? MONITORING_COLORS.inProgress : MONITORING_COLORS.nonCompliant }}>
                    COMPLIANCE SCORE
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
                <p className="text-sm font-medium text-gray-600">Total Findings</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_findings}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Findings</p>
                <p className="text-2xl font-bold text-orange-600">{data.open_findings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                <p className="text-2xl font-bold text-red-600">{data.overdue_findings}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Controls Assessed</p>
                <p className="text-2xl font-bold text-green-600">{data.control_status.length}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings Distribution & Compliance Trends */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              🚨 Findings by Severity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={findingsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {findingsBySeverity.map((entry, index) => (
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
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fedramp_score" stroke="#DC2626" strokeWidth={3} name="FedRAMP" />
                  <Line type="monotone" dataKey="soc2_score" stroke="#059669" strokeWidth={3} name="SOC 2" />
                  <Line type="monotone" dataKey="nist_score" stroke="#2563EB" strokeWidth={3} name="NIST" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Implementation Status */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Settings className="w-5 h-5 text-green-600" />
            ⚙️ Control Implementation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {controlImplementation.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-xl font-bold" style={{ color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={controlImplementation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {controlImplementation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POA&M Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="w-5 h-5 text-purple-600" />
            📋 Plan of Action & Milestones (POA&M)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Finding ID</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Title</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Severity</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Framework</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {data.findings.slice(0, 10).map((finding, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {finding.finding_id}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{finding.title}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                        {finding.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(finding.status)}
                        <span className="text-xs">{finding.status.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{finding.framework}</span>
                      <div className="text-xs text-gray-500">{finding.control_id}</div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className={`text-sm ${finding.days_overdue > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(finding.due_date)}
                        {finding.days_overdue > 0 && (
                          <div className="text-xs text-red-500">
                            {finding.days_overdue}d overdue
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-gray-700">{finding.assigned_to}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Metrics */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Zap className="w-5 h-5 text-teal-600" />
            📊 Key Monitoring Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.monitoring_metrics.map((metric, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getMetricStatusColor(metric.status)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{metric.metric_name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getMetricStatusColor(metric.status)}`}>
                    {metric.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold">{metric.current_value}</div>
                    <div className="text-xs text-gray-600">
                      Threshold: {metric.threshold}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      Updated: {formatDate(metric.last_updated)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calendar className="w-5 h-5 text-yellow-600" />
            📅 Upcoming Assessments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {data.upcoming_assessments.map((assessment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <p className="font-medium text-gray-900">{assessment.assessment_type}</p>
                  <p className="text-sm text-gray-600">{assessment.framework}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatDate(assessment.due_date)}</p>
                  <p className="text-xs text-gray-600">{assessment.responsible_party}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Continuous Monitoring Report generated on {new Date().toLocaleString()} | Complyze Compliance Management Platform</p>
      </div>
    </div>
  );
};

export default ContinuousMonitoring; 