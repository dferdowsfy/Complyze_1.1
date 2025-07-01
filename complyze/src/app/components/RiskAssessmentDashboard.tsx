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
  AreaChart,
  Area,
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
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
  Target,
  Zap,
  Eye,
  Download,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Gauge,
} from "lucide-react";

// Risk assessment color scheme
const RISK_COLORS = {
  critical: "#DC2626",
  high: "#EA580C", 
  medium: "#D97706",
  low: "#65A30D",
  info: "#2563EB",
  success: "#16A34A",
};

interface RiskMetric {
  category: string;
  current_score: number;
  previous_score: number;
  trend: "up" | "down" | "stable";
  incidents: number;
  mitigation_rate: number;
}

interface RiskTrend {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total_prompts: number;
}

interface TeamRisk {
  team: string;
  risk_score: number;
  violations: number;
  top_risk_type: string;
  mitigation_compliance: number;
}

interface RiskAssessmentData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  overall_risk_score: number;
  risk_level: "critical" | "high" | "medium" | "low";
  total_incidents: number;
  incidents_resolved: number;
  average_resolution_time: number;
  risk_metrics: RiskMetric[];
  risk_trends: RiskTrend[];
  team_risks: TeamRisk[];
  top_vulnerabilities: string[];
  recommendations: string[];
  compliance_gaps: string[];
}

interface RiskAssessmentDashboardProps {
  data: RiskAssessmentData;
}

const RiskAssessmentDashboard: React.FC<RiskAssessmentDashboardProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Risk distribution data
  const riskDistribution = [
    { name: "Critical", value: data.risk_trends[0]?.critical || 0, color: RISK_COLORS.critical },
    { name: "High", value: data.risk_trends[0]?.high || 0, color: RISK_COLORS.high },
    { name: "Medium", value: data.risk_trends[0]?.medium || 0, color: RISK_COLORS.medium },
    { name: "Low", value: data.risk_trends[0]?.low || 0, color: RISK_COLORS.low },
  ];

  // Radar chart data for risk categories
  const radarData = data.risk_metrics.map(metric => ({
    category: metric.category,
    score: metric.current_score,
    mitigation: metric.mitigation_rate,
  }));

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "critical": return RISK_COLORS.critical;
      case "high": return RISK_COLORS.high;
      case "medium": return RISK_COLORS.medium;
      case "low": return RISK_COLORS.low;
      default: return RISK_COLORS.info;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return RISK_COLORS.critical;
    if (score >= 60) return RISK_COLORS.high;
    if (score >= 40) return RISK_COLORS.medium;
    return RISK_COLORS.low;
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg mb-6 print:bg-red-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Risk Assessment Dashboard
            </h1>
            <p className="text-red-100 text-lg">
              Comprehensive AI prompt risk analysis and threat assessment
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-red-600 hover:bg-red-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5" />
            🎯 Executive Risk Summary
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
                  {new Date(data.start_date).toLocaleDateString()} to {new Date(data.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Report Generated:</p>
                <p className="text-lg font-bold text-gray-900">{new Date(data.report_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: getRiskLevelColor(data.risk_level) }}
                  >
                    {data.overall_risk_score}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-medium border shadow-sm"
                          style={{ color: getRiskLevelColor(data.risk_level) }}>
                      {data.risk_level.toUpperCase()} RISK
                    </span>
                  </div>
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
                <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{data.total_incidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{data.incidents_resolved}</p>
                <p className="text-xs text-gray-500">
                  {Math.round((data.incidents_resolved / data.total_incidents) * 100)}% resolution rate
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-blue-600">{data.average_resolution_time}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teams at Risk</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.team_risks.filter(t => t.risk_score > 60).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution & Trends */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <PieChartIcon className="w-5 h-5 text-orange-600" />
              📊 Current Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {riskDistribution.map((entry, index) => (
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
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              📈 Risk Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.risk_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke={RISK_COLORS.critical} fill={RISK_COLORS.critical} />
                  <Area type="monotone" dataKey="high" stackId="1" stroke={RISK_COLORS.high} fill={RISK_COLORS.high} />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke={RISK_COLORS.medium} fill={RISK_COLORS.medium} />
                  <Area type="monotone" dataKey="low" stackId="1" stroke={RISK_COLORS.low} fill={RISK_COLORS.low} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Gauge className="w-5 h-5 text-purple-600" />
            📋 Risk Category Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Risk Category</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Current Score</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Previous Score</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Trend</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Incidents</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Mitigation Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.risk_metrics.map((metric, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{metric.category}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getRiskScoreColor(metric.current_score) }}>
                        {metric.current_score}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {metric.previous_score}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center">
                        {getTrendIcon(metric.trend)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-900">
                      {metric.incidents}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${metric.mitigation_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{metric.mitigation_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Team Risk Assessment */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Users className="w-5 h-5 text-indigo-600" />
            👥 Team Risk Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {data.team_risks.map((team, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{team.team}</h3>
                      <p className="text-sm text-gray-600">Primary Risk: {team.top_risk_type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: getRiskScoreColor(team.risk_score) }}>
                        {team.risk_score}
                      </div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Violations: <span className="font-medium">{team.violations}</span></span>
                    <span className="text-gray-600">Compliance: <span className="font-medium text-green-600">{team.mitigation_compliance}%</span></span>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.team_risks} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="team" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="risk_score" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Radar Chart */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-teal-600" />
            🎯 Risk Category Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Risk Score"
                  dataKey="score"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Mitigation Rate"
                  dataKey="mitigation"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities & Recommendations */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ⚠️ Top Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.top_vulnerabilities.map((vulnerability, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Vulnerability #{index + 1}</p>
                    <p className="text-gray-700 text-sm">{vulnerability}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CheckCircle className="w-5 h-5 text-green-600" />
              ✅ Risk Mitigation Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <Zap className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Action #{index + 1}</p>
                    <p className="text-gray-700 text-sm">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Gaps */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Eye className="w-5 h-5 text-yellow-600" />
            🔍 Compliance Gaps Identified
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {data.compliance_gaps.length > 0 ? (
            <div className="space-y-3">
              {data.compliance_gaps.map((gap, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Gap #{index + 1}</p>
                    <p className="text-gray-700">{gap}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900">No compliance gaps identified</p>
              <p className="text-gray-600">All required compliance controls are properly implemented</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Risk Assessment Report generated on {new Date().toLocaleString()} | Complyze Risk Management Platform</p>
      </div>
    </div>
  );
};

export default RiskAssessmentDashboard; 