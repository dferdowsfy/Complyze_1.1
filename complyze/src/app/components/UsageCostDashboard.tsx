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
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Zap,
  Download,
  Calculator,
  Clock,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  CreditCard,
  UserCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Cost dashboard color scheme
const COST_COLORS = {
  openai: "#10B981",
  claude: "#8B5CF6",
  gemini: "#F59E0B",
  other: "#6B7280",
  savings: "#059669",
  overage: "#DC2626",
  target: "#3B82F6",
};

interface ModelUsage {
  model: string;
  provider: string;
  total_tokens: number;
  cost: number;
  prompts: number;
  avg_cost_per_prompt: number;
  trend: "up" | "down" | "stable";
}

interface CostTrend {
  date: string;
  total_cost: number;
  openai_cost: number;
  claude_cost: number;
  gemini_cost: number;
  token_count: number;
}

interface UserAdoption {
  user_id: string;
  department: string;
  total_prompts: number;
  total_cost: number;
  favorite_model: string;
  adoption_score: number;
  risk_level: "low" | "medium" | "high";
}

interface CostControl {
  control_type: string;
  threshold: number;
  current_value: number;
  status: "safe" | "warning" | "exceeded";
  savings_achieved: number;
}

interface UsageCostData {
  organization_name: string;
  report_date: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  budget_limit: number;
  cost_savings: number;
  total_tokens: number;
  total_prompts: number;
  unique_users: number;
  model_usage: ModelUsage[];
  cost_trends: CostTrend[];
  user_adoption: UserAdoption[];
  cost_controls: CostControl[];
  top_spenders: Array<{ user: string; cost: number; department: string }>;
  efficiency_metrics: {
    cost_per_token: number;
    tokens_per_prompt: number;
    cost_per_user: number;
  };
}

interface UsageCostDashboardProps {
  data: UsageCostData;
}

const UsageCostDashboard: React.FC<UsageCostDashboardProps> = ({ data }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Model distribution for pie chart
  const modelDistribution = data.model_usage.map(model => ({
    name: model.model,
    value: model.cost,
    color: COST_COLORS[model.provider.toLowerCase() as keyof typeof COST_COLORS] || COST_COLORS.other,
    tokens: model.total_tokens,
  }));

  // Budget utilization
  const budgetUtilization = (data.total_cost / data.budget_limit) * 100;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe": return "text-green-600 bg-green-50";
      case "warning": return "text-yellow-600 bg-yellow-50";
      case "exceeded": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div ref={reportRef} className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg mb-6 print:bg-green-600">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Usage & Cost Dashboard
            </h1>
            <p className="text-green-100 text-lg">
              Track model usage, cost controls, and AI adoption metrics
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="bg-white text-green-600 hover:bg-green-50 print:hidden"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Preparing..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Calculator className="w-5 h-5" />
            💰 Cost Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-600">Organization:</p>
              <p className="text-lg font-bold text-gray-900">{data.organization_name}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Report Period:</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(data.start_date).toLocaleDateString()} to {new Date(data.end_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Budget Utilization:</p>
              <p className="text-lg font-bold" style={{ color: budgetUtilization > 90 ? COST_COLORS.overage : COST_COLORS.target }}>
                {budgetUtilization.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-600">Cost Savings:</p>
              <p className="text-lg font-bold text-green-600">${data.cost_savings.toLocaleString()}</p>
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
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${data.total_cost.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  of ${data.budget_limit.toLocaleString()} budget
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-blue-600">{(data.total_tokens / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-gray-500">
                  ${data.efficiency_metrics.cost_per_token.toFixed(4)} per token
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{data.unique_users}</p>
                <p className="text-xs text-gray-500">
                  ${data.efficiency_metrics.cost_per_user.toFixed(0)} per user
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Prompts</p>
                <p className="text-2xl font-bold text-orange-600">{data.total_prompts.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {data.efficiency_metrics.tokens_per_prompt.toFixed(0)} tokens/prompt avg
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Target className="w-5 h-5 text-blue-600" />
            📊 Budget Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">
                ${data.total_cost.toLocaleString()} / ${data.budget_limit.toLocaleString()}
              </span>
              <span className={`text-lg font-bold ${budgetUtilization > 90 ? 'text-red-600' : budgetUtilization > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                {budgetUtilization.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  budgetUtilization > 90 ? 'bg-red-500' : budgetUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Remaining: ${(data.budget_limit - data.total_cost).toLocaleString()}</span>
              <span>Savings: ${data.cost_savings.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Usage & Cost Trends */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              🤖 Model Cost Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {modelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <TrendingUp className="w-5 h-5 text-green-600" />
              📈 Cost Trends Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.cost_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Cost']} />
                  <Area type="monotone" dataKey="openai_cost" stackId="1" stroke={COST_COLORS.openai} fill={COST_COLORS.openai} />
                  <Area type="monotone" dataKey="claude_cost" stackId="1" stroke={COST_COLORS.claude} fill={COST_COLORS.claude} />
                  <Area type="monotone" dataKey="gemini_cost" stackId="1" stroke={COST_COLORS.gemini} fill={COST_COLORS.gemini} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Table */}
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            📋 Model Performance & Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Model</th>
                  <th className="text-left py-3 px-2 font-semibold text-gray-700">Provider</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Total Cost</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Tokens</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Prompts</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Cost/Prompt</th>
                  <th className="text-center py-3 px-2 font-semibold text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.model_usage.map((model, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-gray-900">{model.model}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: COST_COLORS[model.provider.toLowerCase() as keyof typeof COST_COLORS] || COST_COLORS.other }}>
                        {model.provider}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-medium text-gray-900">
                      ${model.cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {(model.total_tokens / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      {model.prompts.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600">
                      ${model.avg_cost_per_prompt.toFixed(3)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center">
                        {getTrendIcon(model.trend)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Adoption & Cost Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <UserCheck className="w-5 h-5 text-teal-600" />
              👥 Top Spenders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.top_spenders.map((spender, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-gray-900">{spender.user}</p>
                    <p className="text-sm text-gray-600">{spender.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${spender.cost.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              🛡️ Cost Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {data.cost_controls.map((control, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(control.status)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{control.control_type}</p>
                      <p className="text-sm">
                        {control.current_value} / {control.threshold} limit
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {control.status === 'safe' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">
                          {control.status.toUpperCase()}
                        </span>
                      </div>
                      {control.savings_achieved > 0 && (
                        <p className="text-xs">
                          Saved: ${control.savings_achieved}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 mt-8 print:mt-4">
        <p>Usage & Cost Report generated on {new Date().toLocaleString()} | Complyze Cost Management Platform</p>
      </div>
    </div>
  );
};

export default UsageCostDashboard; 