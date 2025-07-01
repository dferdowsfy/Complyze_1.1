'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import { useDashboardMetrics } from '@/lib/useDashboardMetrics';
import NewReportsPage from './reports/page';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Area, AreaChart } from 'recharts';

const THEME = {
  background: '#0E1E36', // Original dark blue background
  sidebar: '#252945',
  card: '#252945',
  primary: '#7b68ee',
  accent: '#FF6F3C', // Original orange accent
  text: '#ffffff',
  textMuted: '#a0aec0',
  border: '#323755',
  riskHigh: '#e53935',
  riskMedium: '#fbc02d',
  riskLow: '#388e3c',
};

function DashboardHeader({ title, user, logout }: { title: string, user: any, logout: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const projects = ['Complyze AI', 'Project Phoenix', 'Q3 Initiative'];
  
  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        </button>
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full text-white hover:bg-white/20">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.email}</p>
              <p className="text-xs text-gray-400">Member</p>
            </div>
             <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {dropdownOpen && (
             <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[#252945] ring-1 ring-black ring-opacity-5 z-50">
               <div className="py-1">
                 <div className="px-4 py-2 text-xs text-gray-400">Projects</div>
                 {projects.map(p => (
                    <a href="#" key={p} className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5">{p}</a>
                 ))}
                 <div className="border-t border-white/10 my-1"></div>
                 <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-white/5">
                   Logout
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </header>
  );
}

const DonutChart = ({ percentage, color }: { percentage: number, color: string }) => {
  const sqSize = 100;
  const strokeWidth = 10;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - dashArray * percentage / 100;

  return (
    <svg width={sqSize} height={sqSize} viewBox={viewBox} className="transform -rotate-90">
      <circle className="text-gray-700" cx={sqSize / 2} cy={sqSize / 2} r={radius} strokeWidth={`${strokeWidth}px`} stroke="currentColor" fill="transparent" />
      <circle cx={sqSize / 2} cy={sqSize / 2} r={radius} strokeWidth={`${strokeWidth}px`} stroke={color} fill="transparent" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-2xl font-bold fill-white transform rotate-90" transform-origin="center">
        {`${percentage}%`}
      </text>
    </svg>
  );
};

function StatCard({ title, value, total, percentage, icon, color }: { title: string, value: string | number, total?: string | number, percentage: number, icon: React.ReactNode, color: string }) {
    return (
        <div style={{ backgroundColor: THEME.card, borderColor: THEME.border }} className="p-6 rounded-lg border flex items-start justify-between">
            <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                    {icon}
                    <span>{title}</span>
                </div>
                <div className="text-3xl font-bold text-white">{value}</div>
                {total && <div className="text-sm text-gray-500 mt-1">of {total} total</div>}
            </div>
            <DonutChart percentage={percentage} color={color} />
        </div>
    );
}

function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      try {
        // First check if we have tokens in localStorage
        const token = localStorage.getItem('complyze_token');
        const userStr = localStorage.getItem('complyze_user');
        
        if (token && userStr) {
          // Set up the session with the stored token
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: localStorage.getItem('complyze_refresh_token') || ''
          });
          
          if (!error && data.user) {
            setUser(data.user);
            setLoading(false);
            return;
          }
        }

        // Fallback to normal auth check
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          // Clear any stale tokens
          localStorage.removeItem('complyze_token');
          localStorage.removeItem('complyze_user');
          localStorage.removeItem('complyze_refresh_token');
          router.push('/');
          return;
        }
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        // Clear any stale tokens
        localStorage.removeItem('complyze_token');
        localStorage.removeItem('complyze_user');
        localStorage.removeItem('complyze_refresh_token');
        router.push('/');
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Clear tokens and redirect
        localStorage.removeItem('complyze_token');
        localStorage.removeItem('complyze_user');
        localStorage.removeItem('complyze_refresh_token');
        router.push('/');
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const logout = async () => {
    // Clear tokens first
    localStorage.removeItem('complyze_token');
    localStorage.removeItem('complyze_user');
    localStorage.removeItem('complyze_refresh_token');
    // Then sign out from Supabase
    await supabase.auth.signOut();
    router.push('/');
  };

  return { user, loading, logout };
}

function Sidebar({ activeTab, setActiveTab, user, logout }: { activeTab: string; setActiveTab: (tab: string) => void; user: any; logout: () => void; }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
    { id: 'flagged', label: 'Flagged Prompts', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
    { id: 'analytics', label: 'Analytics', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg> },
    { id: 'reports', label: 'Reports', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> },
    { id: 'settings', label: 'Settings', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> },
  ];

  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    menuItems.push({ id: 'admin', label: 'Admin', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> });
  }

  return (
    <div className="w-64 h-full fixed top-0 left-0 p-4 flex flex-col" style={{ backgroundColor: THEME.sidebar }}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M6.333 21.667h11.334c.834 0 1.584-.5 1.834-1.333L21.917 12c.166-.583-.083-1.167-.583-1.5l-9.334-6.083c-.417-.25-.917-.25-1.333 0L1.333 10.5c-.5.333-.75.917-.583 1.5l2.416 8.334c.25.833 1 1.333 1.834 1.333zM8.5 13.5H15.5V15H8.5V13.5z"></path></svg>
        <h1 className="text-2xl font-light tracking-wider text-white">COMPLYZE</h1>
      </div>
      <nav className="flex-grow">
        <h2 className="px-4 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</h2>
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}>
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto">
        <button onClick={logout} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

// --- NEW DASHBOARD COMPONENTS ---

function BudgetTrackerCard({ currentSpend, budget }: { currentSpend: number; budget: number }) {
  const percentage = (currentSpend / budget) * 100;
  const remaining = budget - currentSpend;
  const status = percentage > 90 ? 'Over Budget' : percentage > 75 ? 'Near Budget' : 'Under Budget';
  const statusColor = percentage > 90 ? THEME.riskHigh : percentage > 75 ? THEME.riskMedium : THEME.riskLow;

  return (
    <div className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: THEME.card }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Budget Tracker</h3>
            <p className="text-sm" style={{ color: THEME.textMuted }}>Set Budget</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">${currentSpend.toFixed(2)} / ${budget.toFixed(2)}</div>
            <div className="text-sm" style={{ color: statusColor }}>↓ {(100 - percentage).toFixed(1)}% Under Budget</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: THEME.textMuted }}>Monthly Budget Usage</span>
              <span className="text-white font-medium">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: statusColor 
                }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <span style={{ color: THEME.textMuted }}>Status:</span>
            <span className="font-medium" style={{ color: statusColor }}>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopExpensivePromptsCard({ prompts }: { prompts: any[] }) {
  const topExpensive = prompts
    .sort((a, b) => b.usd_cost - a.usd_cost)
    .slice(0, 5);

  return (
    <div className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: THEME.card }}>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-4">Top 5 Most Expensive Prompts</h3>
        
        <div className="space-y-3">
          {topExpensive.map((prompt, index) => (
            <div key={prompt.id} className="flex justify-between items-center p-3 rounded-lg bg-black/20">
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">
                  {prompt.prompt_text ? 
                    (prompt.prompt_text.length > 40 ? prompt.prompt_text.substring(0, 40) + '...' : prompt.prompt_text) :
                    'Generate comprehensive technical do...'
                  }
                </div>
                <div className="text-sm" style={{ color: THEME.textMuted }}>{prompt.model}</div>
              </div>
              <div className="text-right ml-4">
                <div className="text-white font-bold">${prompt.usd_cost.toFixed(4)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MostUsedModelCard({ prompts }: { prompts: any[] }) {
  const modelCounts = prompts.reduce((acc, prompt) => {
    const modelName = prompt.model || 'Unknown';
    acc[modelName] = (acc[modelName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedModel = Object.entries(modelCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  const modelName = mostUsedModel ? mostUsedModel[0] : 'GPT-4o';
  const usageCount = mostUsedModel ? (mostUsedModel[1] as number) : 0;

  return (
    <div className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: THEME.card }}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-4">Most Used Model</h3>
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold" 
               style={{ backgroundColor: THEME.primary, color: 'white' }}>
            {modelName.charAt(0).toUpperCase()}
          </div>
          <div className="text-xl font-bold text-white">{modelName}</div>
          <div className="text-sm" style={{ color: THEME.textMuted }}>
            Based on prompt frequency ({usageCount} uses)
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalSpendCard({ totalSpend }: { totalSpend: number }) {
  return (
    <div className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: THEME.card }}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-white mb-4">Total Spend</h3>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">${totalSpend.toFixed(2)}</div>
          <div className="text-sm" style={{ color: THEME.textMuted }}>This Month</div>
          <div className="text-xs mt-1" style={{ color: THEME.textMuted }}>
            Cumulative monthly spend from all LLM interactions
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskTrendsChart({ prompts }: { prompts: any[] }) {
  // Process data for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const chartData = last30Days.map(date => {
    const dayPrompts = prompts.filter(p => 
      p.captured_at && p.captured_at.startsWith(date)
    );
    
    const totalPrompts = dayPrompts.length;
    const highRiskPrompts = dayPrompts.filter(p => p.risk_level === 'high').length;
    const mediumRiskPrompts = dayPrompts.filter(p => p.risk_level === 'medium').length;
    const lowRiskPrompts = dayPrompts.filter(p => p.risk_level === 'low').length;
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: totalPrompts,
      high: highRiskPrompts,
      medium: mediumRiskPrompts,
      low: lowRiskPrompts,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-2xl">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-lg relative overflow-hidden" style={{ backgroundColor: THEME.card }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Risk Trends</h3>
            <p className="text-sm" style={{ color: THEME.textMuted }}>
              30-day risk level distribution with animated gradients
            </p>
          </div>
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: THEME.riskHigh }}></div>
              <span className="text-white">High Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: THEME.riskMedium }}></div>
              <span className="text-white">Medium Risk</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: THEME.riskLow }}></div>
              <span className="text-white">Low Risk</span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={THEME.riskHigh} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={THEME.riskHigh} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={THEME.riskMedium} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={THEME.riskMedium} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={THEME.riskLow} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={THEME.riskLow} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#323755" />
            <XAxis 
              dataKey="date" 
              stroke="#a0aec0" 
              fontSize={12}
              tick={{ fill: '#a0aec0' }}
            />
            <YAxis 
              stroke="#a0aec0" 
              fontSize={12}
              tick={{ fill: '#a0aec0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke={THEME.riskHigh}
              fill="url(#highGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke={THEME.riskMedium}
              fill="url(#mediumGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke={THEME.riskLow}
              fill="url(#lowGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FlaggedPromptItem({ prompt }: { prompt: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500/80 text-red-100';
      case 'medium': return 'bg-yellow-500/80 text-yellow-100';
      case 'low': return 'bg-green-500/80 text-green-100';
      default: return 'bg-gray-500/80 text-gray-100';
    }
  };
  
  const getRiskIndicatorColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const complianceTags = prompt.compliance_tags || ['GDPR', 'CCPA', 'OWASP'];

  return (
    <div className="p-3 rounded-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-red-400 text-sm">{prompt.risk_type || 'Undefined Risk'}</p>
          <p className="text-gray-300 truncate max-w-md">{prompt.prompt_text}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getRiskIndicatorColor(prompt.risk_level)}`}></div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-indigo-600 px-4 py-1.5 rounded-md text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Review
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 p-4 rounded-lg bg-black/20">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-400 text-sm font-semibold mb-2">Original Prompt</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskColor(prompt.risk_level)}`}>
                {prompt.risk_level?.toUpperCase() || 'UNKNOWN'} RISK
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-400/80 text-yellow-900">FLAGGED</span>
            </div>
          </div>

          <div className="bg-red-900/10 border border-red-500/30 p-3 rounded-md text-gray-200 mb-4">
            {prompt.prompt_text}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {complianceTags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 text-xs rounded-full bg-gray-600 text-gray-200">{tag}</span>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              <strong>Platform:</strong> {prompt.platform || 'Unknown'} · <strong>LLM:</strong> {prompt.model || 'Unknown'}
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-4 pt-2 text-xs text-gray-500 flex justify-between">
            <span>{getTimeAgo(prompt.captured_at)}</span>
            <span className="font-mono text-red-400"><strong>PII:</strong> {prompt.risk_type}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FlaggedPrompts({ prompts }: { prompts: any[] }) {
  console.log('FlaggedPrompts: Received prompts:', prompts?.length || 0);
  console.log('FlaggedPrompts: Sample prompt statuses:', prompts?.slice(0, 3).map(p => ({ id: p.id, status: p.status, risk_level: p.risk_level })));

  if (!prompts || prompts.length === 0) {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: '1px' }}>
        <h2 className="text-xl font-bold text-white mb-4">Flagged Prompts</h2>
        <p className="text-gray-400">No prompts have been flagged recently.</p>
      </div>
    );
  }

  // Don't double filter - prompts are already filtered in the parent
  const flagged = prompts;

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: '1px' }}>
      <h2 className="text-xl font-bold text-white mb-4">Flagged Prompts ({flagged.length})</h2>
      <div className="space-y-3">
        {flagged.map((prompt) => (
          <FlaggedPromptItem key={prompt.id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}

function AnalyticsContent({ metrics }: { metrics: any }) {
  console.log('AnalyticsContent: Received metrics:', metrics);
  
  if (!metrics) {
    return <div className="text-center py-10 text-white">Loading analytics data...</div>;
  }

  const trendData = metrics.trends.total_prompts.map((total: any, index: number) => ({
    name: `Day ${index + 1}`,
    total,
    highRisk: metrics.trends.high_risk_prompts[index],
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Risk Analytics Dashboard</h2>
        <p className="text-gray-400">In-depth analysis of prompt activity and associated risks over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-3 p-6 rounded-lg" style={{ backgroundColor: THEME.card }}>
          <h3 className="text-lg font-bold text-white mb-4">Prompt Volume vs. High-Risk Events</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#252945', border: '1px solid #323755' }} />
                <Legend wrapperStyle={{fontSize: "14px"}}/>
                <Bar dataKey="total" name="Total Prompts" fill="#3b82f6" />
                <Bar dataKey="highRisk" name="High Risk" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Type Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-lg" style={{ backgroundColor: THEME.card }}>
            <h3 className="text-lg font-bold text-white mb-4">Risk Type Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(metrics.risk_types).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>{type}</span>
                    <span>{count as React.ReactNode}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(Number(count) / metrics.integrity_score.total) * 100}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}

const initialSettings = {
  pii: {
    label: 'PII',
    enabled: true,
    items: {
      name: { label: 'Name', enabled: true },
      email: { label: 'Email', enabled: true },
      phone: { label: 'Phone Number', enabled: true },
      address: { label: 'Address', enabled: true },
      ssn: { label: 'SSN', enabled: true },
      passport: { label: 'Passport Number', enabled: true },
      ip_address: { label: 'IP Address', enabled: true },
    },
  },
  credentials: {
    label: 'Credentials & Secrets',
    enabled: true,
    items: {
      api_keys: { label: 'API Keys', enabled: true },
      oauth_tokens: { label: 'OAuth Tokens', enabled: true },
      ssh_keys: { label: 'SSH Keys', enabled: true },
      vault_paths: { label: 'Vault Paths', enabled: true },
      access_tokens: { label: 'Access Tokens', enabled: true },
    },
  },
  company: {
    label: 'Company Internal',
    enabled: true,
    items: {
      internal_urls: { label: 'Internal URLs', enabled: true },
      codenames: { label: 'Project Codenames', enabled: true },
      internal_tools: { label: 'Internal Tools', enabled: true },
      system_ips: { label: 'System IP Ranges', enabled: true },
    },
  },
  ai_leakage: {
    label: 'AI Model & Dataset Leakage',
    enabled: true,
    items: {
      model_names: { label: 'Model Names', enabled: true },
      training_data: { label: 'Training Data References', enabled: true },
      finetuned_logic: { label: 'Fine-tuned Logic', enabled: true },
      private_weights: { label: 'Private Weights or Output', enabled: true },
    },
  },
  regulated: {
    label: 'Regulated Info',
    enabled: true,
    items: {
      phi: { label: 'PHI (HIPAA)', enabled: true },
      financial: { label: 'Financial Records', enabled: true },
      itar: { label: 'Export-Controlled Terms (ITAR)', enabled: true },
      whistleblower: { label: 'Whistleblower IDs', enabled: true },
    },
  },
  jailbreak: {
    label: 'Jailbreak Patterns',
    enabled: true,
    items: {
      ignore_instructions: { label: 'Ignore previous instructions', enabled: true },
      developer_mode: { label: 'Simulate a developer mode', enabled: true },
      repeat_after_me: { label: 'Repeat after me...', enabled: true },
    },
  },
  other: {
    label: 'Other',
    enabled: true,
    items: {
      custom_terms: { label: 'Custom-defined terms', enabled: true },
    },
  },
};

function SettingsToggle({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: (enabled: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-black/10 rounded-md">
      <span className="text-gray-300">{label}</span>
      <button onClick={() => onToggle(!enabled)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${enabled ? 'translate-x-6' : ''}`}></div>
      </button>
    </div>
  );
}

function SettingsCategory({ category, onToggle }: { category: any, onToggle: (itemId: string, enabled: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const enabledCount = Object.values(category.items).filter((item: any) => item.enabled).length;
  const totalCount = Object.keys(category.items).length;

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: THEME.card, borderColor: THEME.border, borderWidth: '1px' }}>
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <h3 className="text-xl font-bold text-white">{category.label}</h3>
          <p className="text-sm text-gray-400">{enabledCount} of {totalCount} enabled</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-indigo-400 text-sm font-semibold">Collapse</button>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {isOpen && (
        <div className="mt-6 space-y-2">
          {Object.entries(category.items).map(([id, item]: [string, any]) => (
            <SettingsToggle key={id} label={item.label} enabled={item.enabled} onToggle={(enabled) => onToggle(id, enabled)} />
          ))}
          {category.label === 'Other' && (
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Terms (comma-separated)</label>
              <textarea 
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                placeholder="Enter custom terms to redact, separated by commas..."
              />
              <p className="text-xs text-gray-500 mt-2">These terms will be automatically redacted when detected in prompts</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState(initialSettings);

  const handleSettingToggle = (categoryKey: string, itemKey: string, enabled: boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      (newSettings as any)[categoryKey].items[itemKey].enabled = enabled;
      return newSettings;
    });
  };

  const handleSave = () => {
    // In a real app, you'd post this to your backend
    console.log("Saving settings:", settings);
    alert("Settings saved! (Check console for data)");
  };

  return (
    <div className="relative pb-24">
      <div className="space-y-6">
        {Object.entries(settings).map(([key, category]) => (
          <SettingsCategory key={key} category={category} onToggle={(itemKey, enabled) => handleSettingToggle(key, itemKey, enabled)} />
        ))}
      </div>
      <div className="fixed bottom-0 left-64 right-0 p-4" style={{ backgroundColor: 'rgba(14, 31, 54, 0.8)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-8">
            <button 
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full md:w-auto"
            >
              Save Settings
            </button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderContent({ title }: { title: string }) {
    return (
        <div style={{ backgroundColor: THEME.card, borderColor: THEME.border }} className="p-6 rounded-lg border">
            <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
            <p className="text-gray-400">This page will be redesigned to match the new theme.</p>
        </div>
    );
}

function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, loading: userLoading, logout } = useAuth();
  const { data: metrics, prompts, loading: metricsLoading, error, refetch } = useDashboardMetrics(user?.id || null);

  useEffect(() => {
    if (user?.id) {
      refetch();
    }
    const interval = setInterval(() => {
      if (user?.id) refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refetch]);

  const renderContent = () => {
    if (metricsLoading) {
      return (
        <div className="space-y-8">
          <div className="text-center py-10 text-white">Loading metrics...</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="space-y-8">
          <div className="text-center py-10">
            <div className="text-red-400 mb-4">Database connection issue detected</div>
            <div className="text-gray-300 text-sm">
              {error.includes('does not exist') ? 
                'Database tables are not set up yet. The dashboard will work once the database is configured.' :
                `Error: ${error}`
              }
            </div>
          </div>
        </div>
      );
    }

    const currentPrompts = prompts || [];
    const currentSpend = currentPrompts.reduce((sum: number, p: any) => sum + (p.usd_cost || 0), 0);
    const budget = 1000.00; // Default budget since metrics.budget doesn't exist

    if (activeTab === 'overview') {
      return (
        <div className="space-y-8">
          {/* Top Row - Budget and Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BudgetTrackerCard currentSpend={currentSpend} budget={budget} />
            <MostUsedModelCard prompts={currentPrompts} />
            <TotalSpendCard totalSpend={currentSpend} />
            <div className="lg:col-span-1">
              <div className="p-6 rounded-lg" style={{ backgroundColor: THEME.card }}>
                <h3 className="text-lg font-bold text-white mb-2">Flagged Prompts</h3>
                <div className="text-3xl font-bold text-white">
                  {currentPrompts.filter((p: any) => p.status === 'flagged').length}
                </div>
                <div className="text-sm" style={{ color: THEME.textMuted }}>This Month</div>
              </div>
            </div>
          </div>

          {/* Second Row - Top Expensive Prompts */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <TopExpensivePromptsCard prompts={currentPrompts} />
          </div>

          {/* Bottom Row - Full Width Risk Trends Chart */}
          <div className="grid grid-cols-1 gap-6">
            <RiskTrendsChart prompts={currentPrompts} />
          </div>
        </div>
      );
    }

    if (activeTab === 'flagged') {
      // Show prompts that have any risk level or are flagged
      const flaggedPrompts = currentPrompts.filter((p: any) => 
        p.status === 'flagged' || p.risk_level === 'high' || p.risk_level === 'medium' || p.risk_level === 'low'
      );
      console.log('Dashboard: Filtering flagged prompts from', currentPrompts.length, 'total, found', flaggedPrompts.length);
      return <FlaggedPrompts prompts={flaggedPrompts} />;
    }

    if (activeTab === 'analytics') {
      return <AnalyticsContent metrics={metrics} />;
    }

    if (activeTab === 'reports') {
      return <NewReportsPage prompts={prompts || []} />;
    }

    if (activeTab === 'settings') {
      return <SettingsContent />;
    }

    if (activeTab === 'admin' && user && (user.role === 'admin' || user.role === 'super_admin')) {
      return <PlaceholderContent title="Admin Panel" />;
    }

    return <div className="text-white">Unknown tab: {activeTab}</div>;
  };

  if (userLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} logout={logout} />
      <main 
        className={`flex-1 ml-64 p-8 ${activeTab === 'reports' ? 'h-screen flex flex-col' : 'overflow-y-auto'}`} 
        style={{ background: THEME.background }}
      >
        <DashboardHeader title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} user={user} logout={logout} />
        <div className={`${activeTab === 'reports' ? 'flex-grow overflow-hidden' : ''}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage; 