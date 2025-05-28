'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from '@/lib/supabaseClient';

// Inline style helpers
const COLORS = {
  bg: "#0E1E36",
  header: "#0E1E36",
  accent: "#FF6F3C",
  riskHigh: "#E53935",
  riskMedium: "#FBC02D",
  riskLow: "#388E3C",
  card: "#FFFFFF",
  border: "#E0E0E0",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  chartBg: "#F1F1F1",
};

const FONT = {
  fontFamily: 'Inter, sans-serif',
};

// Authentication hook
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('complyze_token');
      const userData = localStorage.getItem('complyze_user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('complyze_token');
          localStorage.removeItem('complyze_user');
          router.push('/');
        }
      } else {
        router.push('/');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('complyze_token');
    localStorage.removeItem('complyze_user');
    router.push('/');
  };

  return { isAuthenticated, user, loading, logout };
}

function RiskBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const color =
    level === 'High' ? COLORS.riskHigh :
    level === 'Medium' ? COLORS.riskMedium :
    COLORS.riskLow;
  return (
    <span style={{
      background: color,
      color: '#fff',
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 13,
      padding: '2px 10px',
      marginLeft: 8,
    }}>{level} risk</span>
  );
}

const LLM_CARDS = [
  {
    model: "GPT-4o",
    inputTokens: 1800000,
    outputTokens: 600000,
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 10.00,
    dailySpend: 9.14,
    budget: 500,
    color: "#FF6F3C"
  },
  {
    model: "Claude 3 Opus",
    inputTokens: 1200000,
    outputTokens: 300000,
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 75.00,
    dailySpend: 19.65,
    budget: 500,
    color: "#6366F1"
  },
  {
    model: "Gemini 1.5 Flash",
    inputTokens: 2400000,
    outputTokens: 800000,
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    dailySpend: 1.84,
    budget: 500,
    color: "#06b6d4"
  }
];

function formatNumber(n: number) { return n.toLocaleString(); }

function LLMUsageCard({ d }: { d: typeof LLM_CARDS[0] }) {
  const inputCost = (d.inputTokens / 1_000_000) * d.inputCostPerMillion;
  const outputCost = (d.outputTokens / 1_000_000) * d.outputCostPerMillion;
  const totalCost = inputCost + outputCost;
  const monthly = d.dailySpend * 31;
  const percentUsed = Math.min(100, ((monthly / d.budget) * 100));
  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-3 min-h-[320px]" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="font-extrabold text-2xl text-[#0E1E36] mb-1">{d.model}</div>
      <div className="text-lg font-semibold text-gray-500 mb-2">
        <span style={{ color: d.color, fontWeight: 800, fontSize: 22 }}>${d.dailySpend.toFixed(2)}</span> <span className="text-base">/day</span> &nbsp;|&nbsp;
        <span style={{ color: d.color, fontWeight: 700, fontSize: 18 }}>${monthly.toFixed(2)}</span> <span className="text-base">/mo</span>
      </div>
      <div className="flex gap-4 text-base font-semibold text-gray-800">
        <span>Input: <span style={{ color: '#6366F1', fontWeight: 700 }}>{formatNumber(d.inputTokens)}</span></span>
        <span>Output: <span style={{ color: '#FF6F3C', fontWeight: 700 }}>{formatNumber(d.outputTokens)}</span></span>
      </div>
      <div className="text-base text-gray-700 font-medium">Total tokens: <span className="font-bold">{formatNumber(d.inputTokens + d.outputTokens)}</span></div>
      <div className="text-base text-gray-700 font-medium">Cost: <span className="font-bold">${totalCost.toFixed(2)}</span> (input: ${inputCost.toFixed(2)}, output: ${outputCost.toFixed(2)})</div>
      <div className="mt-3 mb-1">
        <div className="text-sm text-gray-400 mb-1">Monthly Budget Usage</div>
        <div className="bg-gray-100 rounded h-4 w-full relative">
          <div style={{ width: `${percentUsed}%`, background: d.color }} className="h-4 rounded transition-all duration-300" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#0E1E36]">{percentUsed.toFixed(1)}%</div>
        </div>
      </div>
      <div className="text-sm text-gray-500 font-medium">Budget: <span className="text-[#0E1E36] font-bold">${d.budget.toFixed(2)}</span></div>
      <div className="text-sm text-indigo-600 font-semibold mt-2 underline cursor-pointer">See Details</div>
    </div>
  );
}

function PromptOptimizerPanel({ onOptimize }: { onOptimize: (data: any) => void }) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("GPT-4o");
  const [optCost, setOptCost] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-5 min-w-[320px] max-w-[400px] sticky top-32" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="font-bold text-xl text-[#0E1E36] mb-1">Prompt Optimizer</div>
      <textarea
        className="border border-gray-200 rounded-lg p-3 text-base min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
        placeholder="Paste or write your prompt..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Model</label>
        <select
          className="border border-gray-200 rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={model}
          onChange={e => setModel(e.target.value)}
        >
          <option value="GPT-4o">GPT-4o</option>
          <option value="Claude 3 Opus">Claude 3 Opus</option>
          <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
        </select>
        <label className="flex items-center gap-2 mt-2 text-sm font-medium">
          <input type="checkbox" checked={optCost} onChange={e => setOptCost(e.target.checked)} className="accent-orange-500 w-4 h-4" />
          Optimize for cost
        </label>
      </div>
      <button
        className="w-full bg-[#FF6F3C] text-white font-bold text-lg py-3 rounded-lg shadow hover:bg-[#e65d2d] transition"
        onClick={() => onOptimize({ prompt, model, optimizeForCost: optCost })}
        disabled={!prompt.trim()}
      >
        Optimize
      </button>
    </div>
  );
}

// --- Framework Tag Colors ---
const FRAMEWORK_COLORS: Record<string, string> = {
  NIST: 'bg-blue-500',
  'NIST AI RMF': 'bg-indigo-500',
  FedRAMP: 'bg-orange-500',
  'SOC 2': 'bg-green-600',
  'ISO 27001': 'bg-pink-500',
  SO: 'bg-yellow-500',
  'NIST AI RMP SOC': 'bg-cyan-600',
  NSST: 'bg-purple-500',
};

// --- Flagged Prompt Interface ---
interface FlaggedPrompt {
  id: string;
  summary: string;
  frameworks: string[];
  date: string;
  risk: 'High' | 'Medium' | 'Low';
  status: string;
  platform?: string;
  url?: string;
  piiTypes?: string[];
  mappedControls?: any[];
  detectionTime: string;
}

function FrameworkTag({ fw }: { fw: string }) {
  const color = FRAMEWORK_COLORS[fw] || 'bg-gray-400';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mr-2 mb-1 ${color}`}>{fw}</span>
  );
}

function FlaggedPromptsPanel() {
  const [flaggedPrompts, setFlaggedPrompts] = useState<FlaggedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchFlaggedPrompts();
  }, []);

  const fetchFlaggedPrompts = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      console.log('Complyze Dashboard: Fetching flagged prompts...');
      const response = await fetch('/api/prompts/flagged?limit=20');
      console.log('Complyze Dashboard: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Complyze Dashboard: API error:', errorText);
        throw new Error(`Failed to fetch flagged prompts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Complyze Dashboard: API response:', data);
      console.log('Complyze Dashboard: Number of flagged prompts:', data.prompts?.length || 0);
      
      setFlaggedPrompts(data.prompts || []);
    } catch (err) {
      console.error('Error fetching flagged prompts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Fall back to empty array on error
      setFlaggedPrompts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearTestData = async () => {
    try {
      setClearing(true);
      console.log('Complyze Dashboard: Clearing test data...');
      
      const response = await fetch('/api/test-db', { method: 'DELETE' });
      console.log('Complyze Dashboard: Clear response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Complyze Dashboard: Clear error:', errorText);
        throw new Error(`Failed to clear test data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Complyze Dashboard: Clear result:', result);
      
      // Refresh the list after clearing
      await fetchFlaggedPrompts();
      
      // Show success message (you could use a toast library here)
      console.log('Complyze Dashboard: Test data cleared successfully');
      
    } catch (error) {
      console.error('Failed to clear test data:', error);
      setError('Failed to clear test data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setClearing(false);
    }
  };

  const createTestData = async () => {
    try {
      console.log('Complyze Dashboard: Creating test data...');
      
      const response = await fetch('/api/test-db', { method: 'POST' });
      console.log('Complyze Dashboard: Create test response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Complyze Dashboard: Create test error:', errorText);
        throw new Error(`Failed to create test data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Complyze Dashboard: Create test result:', result);
      
      // Refresh the list after creating test data
      await fetchFlaggedPrompts();
      
      // Show success message
      console.log('Complyze Dashboard: Test data created successfully');
      
    } catch (error) {
      console.error('Failed to create test data:', error);
      setError('Failed to create test data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <div className="font-bold text-xl text-[#0E1E36] mb-2">Flagged Prompts</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading flagged prompts...</div>
        </div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-xl text-[#0E1E36]">Flagged Prompts</div>
          <div className="flex items-center gap-2">
            <button 
              onClick={createTestData}
              className="text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              Create Test Data
            </button>
            <button 
              onClick={fetchFlaggedPrompts}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Error loading flagged prompts: {error}</div>
        </div>
      </div>
    );
  }

  if (flaggedPrompts.length === 0 && !refreshing) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-xl text-[#0E1E36]">Flagged Prompts</div>
          <div className="flex items-center gap-2">
            <button 
              onClick={createTestData}
              className="text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              Create Test Data
            </button>
            <button 
              onClick={fetchFlaggedPrompts}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">No flagged prompts found. Your prompts are looking secure! 🛡️</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-xl text-[#0E1E36]">
          Flagged Prompts {refreshing && <span className="text-sm text-gray-500">(Refreshing...)</span>}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={createTestData}
            className="text-sm text-green-600 hover:text-green-800 transition-colors"
          >
            Create Test Data
          </button>
          <button 
            onClick={clearTestData}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
            disabled={clearing}
          >
            {clearing ? 'Clearing...' : 'Clear Test Data'}
          </button>
          <button 
            onClick={fetchFlaggedPrompts}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      {flaggedPrompts.map((row, i) => (
        <div key={row.id || i} className="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 py-4 last:border-b-0">
          <div className="flex-1">
            <div className="font-semibold text-base text-[#0E1E36] mb-2">{row.summary}</div>
            
            {/* Framework Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {row.frameworks?.map(fw => <FrameworkTag key={fw} fw={fw} />)}
            </div>
            
            {/* Platform and LLM Provider Info */}
            <div className="flex items-center gap-3 mb-2">
              {row.platform && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-500">Platform:</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${
                    row.platform === 'chatgpt' ? 'bg-green-600' :
                    row.platform === 'claude' ? 'bg-orange-600' :
                    row.platform === 'gemini' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }`}>
                    {row.platform === 'chatgpt' ? 'ChatGPT' :
                     row.platform === 'claude' ? 'Claude' :
                     row.platform === 'gemini' ? 'Gemini' :
                     row.platform.toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* LLM Provider Badge */}
              {row.platform && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-500">LLM:</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${
                    row.platform === 'chatgpt' ? 'bg-green-500' :
                    row.platform === 'claude' ? 'bg-orange-500' :
                    row.platform === 'gemini' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {row.platform === 'chatgpt' ? 'OpenAI GPT-4' :
                     row.platform === 'claude' ? 'Anthropic Claude' :
                     row.platform === 'gemini' ? 'Google Gemini' :
                     'Unknown LLM'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Metadata Row */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{row.date}</span>
              {row.piiTypes && row.piiTypes.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-red-600 font-medium">
                    PII: {row.piiTypes.join(', ')}
                  </span>
                </>
              )}
              {row.url && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 font-medium truncate max-w-[200px]" title={row.url}>
                    {row.url}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Risk and Status Badges */}
          <div className="flex flex-col gap-2 mt-3 md:mt-0 md:ml-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-center ${
              row.risk === 'High' ? 'bg-red-100 text-red-700' : 
              row.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-green-100 text-green-700'
            }`}>
              {row.risk} Risk
            </span>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-center ${
              row.status === 'flagged' ? 'bg-yellow-100 text-yellow-800' :
              row.status === 'blocked' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {row.status?.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Prompt Integrity Score Card Component
function PromptIntegrityScoreCard() {
  const [integrityData, setIntegrityData] = useState({
    avg_integrity: 0,
    stable: 0,
    suspicious: 0,
    critical: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrityStats();
  }, []);

  const fetchIntegrityStats = async () => {
    try {
      console.log('Fetching real integrity stats from API...');
      const response = await fetch('/api/analytics/integrity');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch integrity stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Integrity stats received:', data);
      
      setIntegrityData(data);
    } catch (error) {
      console.error('Error fetching integrity stats:', error);
      // Fallback to default values on error
      setIntegrityData({
        avg_integrity: 85,
        stable: 0,
        suspicious: 0,
        critical: 0,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (score: number) => {
    if (score >= 80) return { text: 'Stable', color: '#10b981' };
    if (score >= 60) return { text: 'Suspicious', color: '#f59e0b' };
    return { text: 'Critical', color: '#ef4444' };
  };

  const status = getStatus(integrityData.avg_integrity);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (integrityData.avg_integrity / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <h3 className="font-bold text-xl text-[#0E1E36]">Prompt Integrity Score</h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          {/* Radial Gauge */}
          <div className="relative flex justify-center items-center">
            <svg width="120" height="120" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                stroke={status.color}
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute transform rotate-0 text-center">
              <div className="text-3xl font-bold text-[#0E1E36]">{integrityData.avg_integrity}</div>
              <div className="text-sm text-gray-500">/ 100</div>
            </div>
          </div>

          {/* Status */}
          <div className="text-center">
            <span className="text-lg font-semibold" style={{ color: status.color }}>
              {status.text}
            </span>
            {integrityData.total > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Based on {integrityData.total} prompts
              </div>
            )}
          </div>

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center p-2 rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600">{integrityData.stable}</div>
              <div className="text-xs text-gray-600">Stable</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{integrityData.suspicious}</div>
              <div className="text-xs text-gray-600">Suspicious</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{integrityData.critical}</div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Risk Type Frequency Card Component
function RiskTypeFrequencyCard() {
  const [riskFrequency, setRiskFrequency] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [totalPrompts, setTotalPrompts] = useState(0);

  const riskTypeColors: Record<string, string> = {
    'PII Leakage': '#ef4444',
    'Credential Exposure': '#f97316',
    'Jailbreak Attempt': '#ec4899',
    'Model Leakage': '#a855f7',
    'Internal Asset Disclosure': '#3b82f6',
    'Vague Prompt': '#eab308',
    'Regulatory Trigger': '#22c55e',
    'Other': '#6b7280'
  };

  useEffect(() => {
    fetchRiskTypes();
  }, []);

  const fetchRiskTypes = async () => {
    try {
      console.log('Fetching real risk type data from API...');
      const response = await fetch('/api/analytics/risk-types');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch risk types: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Risk types received:', data);
      
      setRiskFrequency(data.risk_types || {});
      setTotalPrompts(data.total_prompts || 0);
    } catch (error) {
      console.error('Error fetching risk types:', error);
      // Fallback to empty data on error
      setRiskFrequency({});
      setTotalPrompts(0);
    } finally {
      setLoading(false);
    }
  };

  // Sort by frequency
  const sortedRisks = Object.entries(riskFrequency).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl text-[#0E1E36]">Risk Type Frequency</h3>
        {totalPrompts > 0 && (
          <span className="text-sm text-gray-500">
            {totalPrompts} prompts analyzed
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedRisks.map(([riskType, count]) => {
            const color = riskTypeColors[riskType] || riskTypeColors['Other'];
            const size = count > 5 ? 'text-base px-4 py-2' : 'text-sm px-3 py-1.5';
            
            return (
              <div
                key={riskType}
                className={`inline-flex items-center rounded-full font-medium ${size} transition-transform hover:scale-105`}
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                  border: `1px solid ${color}40`
                }}
              >
                <span>{riskType}</span>
                <span className="ml-2 font-bold">({count})</span>
              </div>
            );
          })}
          
          {sortedRisks.length === 0 && (
            <div className="text-gray-500 text-center w-full py-8">
              {totalPrompts === 0 ? 'No prompts analyzed yet' : 'No risk patterns detected'}
              <div className="text-xs mt-2">
                {totalPrompts === 0 ? 'Start using the extension to see risk analysis' : 'Your prompts are looking secure! 🛡️'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComplyzeDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizerOpen, setOptimizerOpen] = useState(false);
  const [optimizerTab, setOptimizerTab] = useState<'optimize' | 'history' | 'analysis'>('optimize');

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#0E1E36] mb-4">Loading...</div>
          <div className="text-gray-600">Checking authentication...</div>
        </div>
      </div>
    );
  }

  // If not authenticated, the useAuth hook will redirect to home
  if (!isAuthenticated) {
    return null;
  }

  // Placeholder data
  const riskBreakdown = [
    { label: 'Vague prompts', value: 31, color: COLORS.accent },
    { label: 'PII leakage', value: 23, color: COLORS.header },
    { label: 'Jailbreak attempts', value: 15, color: COLORS.riskHigh },
    { label: 'Other', value: 31, color: COLORS.riskLow },
  ];
  const deptUsage = [
    { dept: 'Sales', flagged: 7 },
    { dept: 'Engineering', flagged: 2 },
    { dept: 'Marketing', flagged: 3 },
  ];
  const reports = [
    { title: 'System Security Plan', link: '/reports' },
    { title: 'Audit Log', link: '/reports' },
    { title: 'Executive Summary', link: '/reports' },
  ];
  const extensions = [
    { name: 'Prompt Governance API' },
    { name: 'Auto-POAM Generator' },
    { name: 'Slack/Chrome Plugin' },
    { name: 'Prompt Intelligence Feed' },
  ];

  // LLM usage/cost data
  const llmData = [
    {
      model: "GPT-4o",
      inputTokens: 1800000,
      outputTokens: 600000,
      inputCostPerMillion: 3.00,
      outputCostPerMillion: 10.00,
      dailySpend: 9.14,
      budget: 500
    },
    {
      model: "Claude 3 Opus",
      inputTokens: 1200000,
      outputTokens: 300000,
      inputCostPerMillion: 15.00,
      outputCostPerMillion: 75.00,
      dailySpend: 19.65,
      budget: 500
    },
    {
      model: "Gemini 1.5 Flash",
      inputTokens: 2400000,
      outputTokens: 800000,
      inputCostPerMillion: 0.10,
      outputCostPerMillion: 0.40,
      dailySpend: 1.84,
      budget: 500
    }
  ];

  // Helper to format numbers
  const formatNumber = (n: number) => n.toLocaleString();

  // LLM Usage Cards Section
  const LLMUsageCards = () => (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {LLM_CARDS.map((d) => <LLMUsageCard key={d.model} d={d} />)}
    </div>
  );

  // Simulate API call for prompt enhancement
  const handleOptimize = async (data: any) => {
    setLoading(true);
    setEnhancedPrompt("");
    setTimeout(() => {
      setEnhancedPrompt("[Optimized prompt for: ] " + data.prompt);
      setLoading(false);
    }, 1200);
  };

  const handleCopy = () => {
    if (!enhancedPrompt) return;
    navigator.clipboard.writeText(enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Pie chart math
  const total = riskBreakdown.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  const pieSegments = riskBreakdown.map((seg, i) => {
    const start = acc;
    const end = acc + (seg.value / total) * 360;
    acc = end;
    const large = end - start > 180 ? 1 : 0;
    const r = 40, cx = 50, cy = 50;
    const x1 = cx + r * Math.cos((Math.PI * (start - 90)) / 180);
    const y1 = cy + r * Math.sin((Math.PI * (start - 90)) / 180);
    const x2 = cx + r * Math.cos((Math.PI * (end - 90)) / 180);
    const y2 = cy + r * Math.sin((Math.PI * (end - 90)) / 180);
    return (
      <path
        key={seg.label}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
        fill={seg.color}
        style={{ cursor: 'pointer', opacity: 0.92 }}
        onClick={() => alert(seg.label + ' clicked!')}
      />
    );
  });

  // Platform extension color and logo map
  const extensionMeta: Record<string, { color: string; logo: React.ReactNode }> = {
    'Prompt Governance API': {
      color: COLORS.header,
      logo: <span style={{ fontWeight: 700, fontSize: 18 }}>API</span>,
    },
    'Auto-POAM Generator': {
      color: COLORS.riskMedium,
      logo: <span style={{ fontWeight: 700, fontSize: 18 }}>⚙️</span>,
    },
    'Slack/Chrome Plugin': {
      color: '#4A154B', // Slack purple
      logo: <span style={{ fontSize: 20 }}>💬</span>, // fallback emoji
    },
    'Prompt Intelligence Feed': {
      color: COLORS.accent,
      logo: <span style={{ fontWeight: 700, fontSize: 18 }}>🧠</span>,
    },
  };

  // --- Prompt Optimizer Drawer ---
  function OptimizerDrawer() {
    return (
      <div className="fixed top-0 right-0 h-full w-[350px] max-w-full bg-white shadow-2xl z-[100] border-l border-gray-200 flex flex-col transition-transform duration-300" style={{ transform: optimizerOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="font-bold text-lg text-[#0E1E36]">Prompt Optimizer</div>
          <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setOptimizerOpen(false)} aria-label="Close">×</button>
        </div>
        {/* Tab Switcher */}
        <div className="flex gap-2 px-6 pt-4 pb-2 border-b border-gray-100">
          <button className={`px-4 py-2 rounded-t-lg font-semibold text-base transition border-b-2 ${optimizerTab === 'optimize' ? 'border-orange-500 text-[#FF6F3C] bg-orange-50' : 'border-transparent text-gray-700 bg-transparent'}`} onClick={() => setOptimizerTab('optimize')}>Optimize</button>
          <button className={`px-4 py-2 rounded-t-lg font-semibold text-base transition border-b-2 ${optimizerTab === 'history' ? 'border-orange-500 text-[#FF6F3C] bg-orange-50' : 'border-transparent text-gray-700 bg-transparent'}`} onClick={() => setOptimizerTab('history')}>History</button>
          <button className={`px-4 py-2 rounded-t-lg font-semibold text-base transition border-b-2 ${optimizerTab === 'analysis' ? 'border-orange-500 text-[#FF6F3C] bg-orange-50' : 'border-transparent text-gray-700 bg-transparent'}`} onClick={() => setOptimizerTab('analysis')}>Analysis</button>
        </div>
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {optimizerTab === 'optimize' && (
            <>
              <textarea
                className="border border-gray-200 rounded-lg p-3 text-base min-h-[80px] w-full resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
                placeholder="Paste or write your prompt..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-gray-700">Model</label>
                <select
                  className="border border-gray-200 rounded-lg p-2 text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={"GPT-4o"}
                  onChange={e => {}}
                  disabled
                >
                  <option value="GPT-4o">GPT-4o</option>
                  <option value="Claude 3 Opus">Claude 3 Opus</option>
                  <option value="Gemini 1.5 Flash">Gemini 1.5 Flash</option>
                </select>
                <label className="flex items-center gap-2 mt-2 text-sm font-medium">
                  <input type="checkbox" className="accent-orange-500 w-4 h-4" disabled />
                  Optimize for cost
                </label>
              </div>
              <button
                className="w-full bg-[#FF6F3C] text-white font-bold text-lg py-3 rounded-lg shadow hover:bg-[#e65d2d] transition mb-4"
                onClick={() => handleOptimize({ prompt, model: 'GPT-4o', optimizeForCost: false })}
                disabled={!prompt.trim() || loading}
              >
                {loading ? 'Optimizing…' : 'Optimize'}
              </button>
              {/* Optimized Output */}
              {enhancedPrompt && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">✅ Low Risk</span>
                  </div>
                  <div className="relative">
                    <textarea
                      className="w-full bg-gray-100 rounded-lg p-3 text-base font-mono text-gray-800 resize-none border border-gray-200"
                      value={enhancedPrompt}
                      readOnly
                      rows={4}
                    />
                    <button
                      className="absolute top-2 right-2 px-3 py-1 bg-orange-500 text-white rounded font-semibold text-xs hover:bg-orange-600 transition"
                      onClick={handleCopy}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {optimizerTab !== 'optimize' && (
            <div className="text-gray-400 text-center py-12">Coming soon…</div>
          )}
        </div>
      </div>
    );
  }

  // --- Floating Optimizer Button ---
  function FloatingOptimizerButton() {
    return (
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#FF6F3C] text-white font-bold text-lg px-6 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#e65d2d] transition"
        onClick={() => setOptimizerOpen(true)}
        style={{ boxShadow: '0 4px 24px rgba(255,111,60,0.18)' }}
      >
        <span className="text-2xl">✍️</span> Prompt Optimizer
      </button>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ fontSize: 22, background: COLORS.bg }}>
      {/* Sticky Nav Tabs - Standardized */}
      <nav className="sticky top-0 z-40 flex gap-12 px-8 py-5 shadow-md justify-between items-center" style={{ background: COLORS.bg }}>
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
          <Link href="/dashboard/test-prevention" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            🛡️ Test Prevention
            {pathname && pathname.includes('test-prevention') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center gap-4">
          <span className="text-white text-lg">
            Welcome, {user?.full_name || user?.email || 'User'}
          </span>
          <button
            onClick={logout}
            className="bg-[#FF6F3C] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e65d2d] transition"
          >
            Logout
          </button>
        </div>
      </nav>
      {/* Notification Bar */}
      <div className="w-full bg-[#E53935] text-white font-bold text-lg py-3 text-center shadow" style={{ letterSpacing: 0.2 }}>
        3 prompts were blocked today due to high-risk redactions — Your risk score increased 12% this week
      </div>
      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top: 3 LLM Cards */}
        {LLM_CARDS.map((d) => <LLMUsageCard key={d.model} d={d} />)}
      </div>
      {/* Second Row: Compliance, Risk, Optimizer */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Prompt Integrity Score Card */}
        <PromptIntegrityScoreCard />
        
        {/* Risk Type Frequency Card */}
        <RiskTypeFrequencyCard />
        
        {/* Prompt Optimizer Panel (hidden, now in drawer) */}
        <div className="hidden lg:block" />
      </div>
      {/* Flagged Prompts Panel */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        <FlaggedPromptsPanel />
      </div>
      {/* Floating Optimizer Button */}
      <FloatingOptimizerButton />
      {/* Optimizer Drawer */}
      <OptimizerDrawer />
    </div>
  );
} 