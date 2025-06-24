'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from '@/lib/supabaseClient';
import { useDashboardMetrics } from '@/lib/useDashboardMetrics';
import { BudgetModal } from '@/components/BudgetModal';

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

// Cost Summary Components
function BudgetTrackerCard({ data, userId, onBudgetUpdate }: { data: any; userId: string; onBudgetUpdate: () => void }) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  
  if (!data) return null;

  const isOverBudget = data.status === "Over Budget";
  const indicatorColor = isOverBudget ? "#E53935" : "#388E3C";
  const bgColor = isOverBudget ? "#FFEBEE" : "#E8F5E8";
  
  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-2 sm:gap-3 min-h-[280px] sm:min-h-[300px] lg:min-h-[320px]" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <div className="flex justify-between items-center">
          <div className="font-extrabold text-xl sm:text-2xl text-[#0E1E36] mb-1">Budget Tracker</div>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="text-xs text-[#FF6F3C] hover:text-[#E55A2B] font-medium transition-colors"
          >
            Set Budget
          </button>
        </div>
        <div className="text-base sm:text-lg font-semibold text-gray-500 mb-2">
          <span style={{ color: indicatorColor, fontWeight: 800, fontSize: '18px' }} className="sm:text-xl lg:text-2xl">${data.total_spend?.toFixed(2) || '0.00'}</span> 
          <span className="text-sm sm:text-base"> / ${data.budget?.toFixed(2) || '500.00'}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ color: indicatorColor, fontSize: '20px' }} className="sm:text-2xl">{data.indicator || '↓'}</span>
          <span style={{ color: indicatorColor, fontWeight: 700 }} className="text-sm sm:text-base">
            {Math.abs(data.percent_delta || 0).toFixed(1)}% {data.status || 'Under Budget'}
          </span>
        </div>
        <div className="mt-3 mb-1">
          <div className="text-xs sm:text-sm text-gray-400 mb-1">Monthly Budget Usage</div>
          <div className="bg-gray-100 rounded h-3 sm:h-4 w-full relative" style={{ backgroundColor: bgColor }}>
            <div 
              style={{ 
                width: `${Math.min(100, (data.total_spend || 0) / (data.budget || 500) * 100)}%`, 
                background: indicatorColor 
              }} 
              className="h-3 sm:h-4 rounded transition-all duration-300" 
            />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#0E1E36]">
              {((data.total_spend || 0) / (data.budget || 500) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-gray-500 font-medium">
          Status: <span style={{ color: indicatorColor, fontWeight: 'bold' }}>{data.status || 'Under Budget'}</span>
        </div>
      </div>

      <BudgetModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        currentBudget={data.budget || 500}
        userId={userId}
        onBudgetUpdate={onBudgetUpdate}
      />
    </>
  );
}

function TopPromptsCard({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-2 sm:gap-3 min-h-[280px] sm:min-h-[300px] lg:min-h-[320px]" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="font-extrabold text-xl sm:text-2xl text-[#0E1E36] mb-1">Top 5 Most Expensive Prompts</div>
      <div className="flex flex-col gap-2 sm:gap-3 flex-1">
        {data && data.length > 0 ? (
          data.map((prompt, index) => (
            <div key={index} className="border-l-4 border-[#FF6F3C] pl-2 sm:pl-3 py-2 bg-gray-50 rounded">
              <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                {prompt.prompt}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{prompt.model}</span>
                <span className="text-xs sm:text-sm font-bold text-[#FF6F3C]">${prompt.cost?.toFixed(4)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-base sm:text-lg mb-2">📊</div>
              <div className="text-sm sm:text-base">No prompts analyzed yet</div>
              <div className="text-xs mt-1">Start using the extension to see cost data</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MostUsedModelCard({ model }: { model: string }) {
  const getModelColor = (modelName: string) => {
    if (modelName.includes('gpt') || modelName.includes('GPT') || modelName.includes('OpenAI')) return '#10A37F';
    if (modelName.includes('claude') || modelName.includes('Claude') || modelName.includes('Anthropic')) return '#D97706';
    if (modelName.includes('gemini') || modelName.includes('Gemini') || modelName.includes('Google')) return '#4285F4';
    if (modelName.includes('llama') || modelName.includes('Llama')) return '#8B5CF6';
    return '#6366F1';
  };

  const modelColor = getModelColor(model || '');

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-2 sm:gap-3 min-h-[280px] sm:min-h-[300px] lg:min-h-[320px]" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="font-extrabold text-xl sm:text-2xl text-[#0E1E36] mb-1">Most Used Model</div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div 
          className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4"
          style={{ backgroundColor: `${modelColor}20`, border: `3px solid ${modelColor}` }}
        >
          <span className="text-xl sm:text-2xl font-bold" style={{ color: modelColor }}>
            {model && model !== 'No data' ? model.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        <div className="text-lg sm:text-xl font-bold text-[#0E1E36] text-center">
          {model || 'No data'}
        </div>
        <div className="text-xs sm:text-sm text-gray-500 text-center mt-2">
          {model && model !== 'No data' ? 'Based on prompt frequency' : 'Start using the extension to see data'}
        </div>
      </div>
    </div>
  );
}

function TotalSpendCard({ totalSpend }: { totalSpend: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-2 sm:gap-3 min-h-[280px] sm:min-h-[300px] lg:min-h-[320px]" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="font-extrabold text-xl sm:text-2xl text-[#0E1E36] mb-1">Total Spend</div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#FF6F3C] mb-2">
          ${(totalSpend || 0).toFixed(2)}
        </div>
        <div className="text-base sm:text-lg text-gray-600 mb-3 sm:mb-4">This Month</div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#FF6F3C] to-[#FF8A5C] h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (totalSpend || 0) / 5)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Cumulative monthly spend from all LLM interactions
        </div>
      </div>
    </div>
  );
}

// Cost Summary Panel Component
function CostSummaryPanel({ userId }: { userId: string }) {
  const { data: dashboardData, loading, error, refetch } = useDashboardMetrics(userId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-7 flex items-center justify-center min-h-[320px]">
            <div className="text-gray-500">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error loading dashboard data: {error}</div>
          <button 
            onClick={refetch}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      <BudgetTrackerCard data={dashboardData?.budget_tracker} userId={userId} onBudgetUpdate={refetch} />
      <TopPromptsCard data={dashboardData?.top_prompts || []} />
      <MostUsedModelCard model={dashboardData?.most_used_model || 'No data'} />
      <TotalSpendCard totalSpend={dashboardData?.total_spend || 0} />
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
  category?: string;
  subcategory?: string;
  riskType?: string;
}

function FrameworkTag({ fw }: { fw: string }) {
  const color = FRAMEWORK_COLORS[fw] || 'bg-gray-400';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mr-2 mb-1 ${color}`}>{fw}</span>
  );
}

// Component to display flagged categories with reveal functionality
function FlaggedCategoriesDisplay({ 
  prompt, 
  isRevealed, 
  decryptedText, 
  onReveal, 
  isAdmin 
}: { 
  prompt: FlaggedPrompt; 
  isRevealed: boolean; 
  decryptedText?: string; 
  onReveal: () => void; 
  isAdmin: boolean; 
}) {
  const getFlaggedCategories = () => {
    const categories: string[] = [];
    
    // Add PII types with better formatting
    if (prompt.piiTypes && prompt.piiTypes.length > 0) {
      const piiItems = prompt.piiTypes.map(type => {
        // Format common PII types to be more readable
        switch (type.toLowerCase()) {
          case 'email': return 'Email Address';
          case 'phone': return 'Phone Number';
          case 'ssn': return 'Social Security Number';
          case 'credit_card': return 'Credit Card';
          case 'api_key': return 'API Key';
          case 'password': return 'Password';
          case 'address': return 'Physical Address';
          case 'name': return 'Personal Name';
          case 'medical': return 'Medical Information';
          case 'financial': return 'Financial Data';
          default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
      });
      categories.push(...piiItems);
    }
    
    // Add risk type with better formatting
    if (prompt.riskType) {
      const formattedRisk = prompt.riskType.charAt(0).toUpperCase() + prompt.riskType.slice(1);
      categories.push(`${formattedRisk} Risk`);
    }
    
    // Add category if available
    if (prompt.category && prompt.category.toLowerCase() !== 'general') {
      categories.push(prompt.category);
    }
    
    // Add subcategory if available and different from category
    if (prompt.subcategory && prompt.subcategory !== prompt.category) {
      categories.push(prompt.subcategory);
    }
    
    return categories;
  };

  const categories = getFlaggedCategories();

  if (isRevealed && decryptedText) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Original Prompt:</span>
          {isAdmin && (
            <button
              onClick={() => window.location.reload()} // Simple way to hide again
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          )}
        </div>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
            {decryptedText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Flagged Content:</span>
        {isAdmin && (
          <button
            onClick={onReveal}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reveal
          </button>
        )}
      </div>
      
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {categories.map((category, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
            >
              {category}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          Sensitive content detected - admin required to view
        </div>
      )}
    </div>
  );
}

function FlaggedPromptsPanel() {
  const [flaggedPrompts, setFlaggedPrompts] = useState<FlaggedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [revealedPrompts, setRevealedPrompts] = useState<Set<string>>(new Set());
  const [decryptedTexts, setDecryptedTexts] = useState<Map<string, string>>(new Map());
  const { user } = useAuth();

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

  const revealPrompt = async (promptId: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      console.log('Complyze Dashboard: Revealing prompt:', promptId);
      
      const response = await fetch('/api/prompts/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          alert('Access denied. Admin privileges required to view original prompts.');
          return;
        }
        throw new Error(errorData.error || 'Failed to decrypt prompt');
      }

      const data = await response.json();
      console.log('Complyze Dashboard: Prompt revealed:', data);

      // Update the revealed prompts set and decrypted texts map
      setRevealedPrompts(prev => new Set([...prev, promptId]));
      setDecryptedTexts(prev => new Map([...prev, [promptId, data.decryptedText]]));

    } catch (error) {
      console.error('Failed to reveal prompt:', error);
      alert('Failed to reveal prompt: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
    <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-3 sm:gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2 sm:gap-0">
        <div className="font-bold text-lg sm:text-xl text-[#0E1E36]">
          Flagged Prompts {refreshing && <span className="text-sm text-gray-500">(Refreshing...)</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={createTestData}
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            Create Test Data
          </button>
          <button 
            onClick={fetchFlaggedPrompts}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      {flaggedPrompts.map((row, i) => (
        <div key={row.id || i} className="flex flex-col lg:flex-row lg:items-start justify-between border-b border-gray-100 py-3 sm:py-4 last:border-b-0 gap-3 lg:gap-4">
          <div className="flex-1">
            {/* Replaced summary with flagged categories display */}
            <FlaggedCategoriesDisplay
              prompt={row}
              isRevealed={revealedPrompts.has(row.id)}
              decryptedText={decryptedTexts.get(row.id)}
              onReveal={() => revealPrompt(row.id)}
              isAdmin={user?.role === 'admin' || user?.role === 'super_admin' || user?.plan === 'enterprise'}
            />
            
            {/* Framework Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {row.frameworks?.map(fw => <FrameworkTag key={fw} fw={fw} />)}
            </div>
            
            {/* Platform and LLM Provider Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-400">
              <span>{row.date}</span>
              {row.piiTypes && row.piiTypes.length > 0 && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-red-600 font-medium">
                    PII: {row.piiTypes.join(', ')}
                  </span>
                </>
              )}
              {row.url && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-blue-600 font-medium truncate max-w-[200px] sm:max-w-[300px]" title={row.url}>
                    {row.url}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Risk and Status Badges */}
          <div className="flex flex-row lg:flex-col gap-2 lg:mt-0">
            <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-bold text-center ${
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
function PromptIntegrityScoreCard({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <h3 className="font-bold text-xl text-[#0E1E36]">Prompt Integrity Score</h3>
        <div className="flex justify-center items-center h-48">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const getStatus = (score: number) => {
    if (score >= 80) return { text: 'Stable', color: '#10b981' };
    if (score >= 60) return { text: 'Suspicious', color: '#f59e0b' };
    return { text: 'Critical', color: '#ef4444' };
  };

  const status = getStatus(data.avg_integrity);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (data.avg_integrity / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <h3 className="font-bold text-xl text-[#0E1E36]">Prompt Integrity Score</h3>
      
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
          <div className="text-3xl font-bold text-[#0E1E36]">{data.avg_integrity}</div>
          <div className="text-sm text-gray-500">/ 100</div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <span className="text-lg font-semibold" style={{ color: status.color }}>
          {status.text}
        </span>
        {data.total > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Based on {data.total} prompts
          </div>
        )}
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center p-2 rounded-lg bg-green-50">
          <div className="text-2xl font-bold text-green-600">{data.stable}</div>
          <div className="text-xs text-gray-600">Stable</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-orange-50">
          <div className="text-2xl font-bold text-orange-600">{data.suspicious}</div>
          <div className="text-xs text-gray-600">Suspicious</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-red-50">
          <div className="text-2xl font-bold text-red-600">{data.critical}</div>
          <div className="text-xs text-gray-600">Critical</div>
        </div>
      </div>
    </div>
  );
}

// Risk Type Frequency Card Component
function RiskTypeFrequencyCard({ data }: { data: Record<string, number> }) {
  const riskTypeColors: Record<string, string> = {
    'PII': '#ef4444',
    'IP': '#f97316',
    'Compliance': '#ec4899',
    'Jailbreak': '#a855f7',
    'Credential Exposure': '#3b82f6',
    'Data Leakage': '#eab308',
    'Regulatory': '#22c55e',
    'Other': '#6b7280'
  };

  // Sort by frequency
  const sortedRisks = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const totalPrompts = Object.values(data || {}).reduce((sum, count) => sum + count, 0);

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
    </div>
  );
}

// Prompt Risk Trends Card Component
function PromptRiskTrendsCard({ data }: { data: any }) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <h3 className="font-bold text-xl text-[#0E1E36]">Prompt Risk Trends</h3>
        <div className="flex justify-center items-center h-48">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Create sparkline path
  const maxValue = Math.max(...data.high_risk_prompts, 1);
  const height = 60;
  const width = 200;
  
  const points = data.high_risk_prompts.map((value: number, index: number) => {
    const x = (index / (data.high_risk_prompts.length - 1)) * width;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl text-[#0E1E36]">Prompt Risk Trends</h3>
        <span className="text-sm text-gray-500">Last 7 Days</span>
      </div>
      
      {/* Sparkline Chart */}
      <div className="flex justify-center items-center mb-4">
        <svg width={width} height={height} className="border rounded bg-gray-50">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * (height / 4)}
              x2={width}
              y2={i * (height / 4)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Trend line */}
          <polyline
            points={points}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.high_risk_prompts.map((value: number, index: number) => {
            const x = (index / (data.high_risk_prompts.length - 1)) * width;
            const y = height - (value / maxValue) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#ef4444"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* Trend Summary */}
      <div className="text-center">
        <div className="text-3xl mb-2">{data.emoji}</div>
        <div className="text-lg font-semibold text-[#0E1E36] mb-1">
          {data.status}
        </div>
        <div className="text-sm text-gray-600">
          High-risk prompts: {data.trend_percent > 0 ? '+' : ''}{data.trend_percent}%
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#0E1E36]">
            {data.total_prompts.reduce((a: number, b: number) => a + b, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Prompts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {data.high_risk_prompts.reduce((a: number, b: number) => a + b, 0)}
          </div>
          <div className="text-xs text-gray-600">High Risk</div>
        </div>
      </div>
    </div>
  );
}

// Analytics Panel Component  
function AnalyticsPanel({ userId }: { userId: string }) {
  const { data: dashboardData, loading, error } = useDashboardMetrics(userId);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-7 flex items-center justify-center min-h-[320px]">
            <div className="text-gray-500">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 mb-6 sm:mb-8 lg:mb-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error loading analytics data: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-10">
      {/* Prompt Integrity Score Card */}
      <PromptIntegrityScoreCard data={dashboardData?.integrity_score} />
      
      {/* Risk Type Frequency Card */}
      <RiskTypeFrequencyCard data={dashboardData?.risk_types || {}} />
      
      {/* Prompt Risk Trends Card */}
      <PromptRiskTrendsCard data={dashboardData?.trends} />
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [optimizerOpen, setOptimizerOpen] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0E1E36]">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // This will be handled by the auth redirect
  }

  // Get user ID from the authenticated user
  const userId = user?.id || "test-user-123"; // Fallback for development

  const handleOptimize = ({ prompt, model, optimizeForCost }: { prompt: string; model: string; optimizeForCost: boolean }) => {
    console.log('Optimizing:', { prompt, model, optimizeForCost });
    
    // Simulate optimization
    const optimized = `Analyze the following data with respect to ${optimizeForCost ? 'cost efficiency' : 'accuracy'}: ${prompt.replace(/sensitive|private|confidential/gi, '[REDACTED]')}`;
    setEnhancedPrompt(optimized);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(enhancedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const router = useRouter();
  const pathname = usePathname();

  // Risk breakdown data for pie chart
  const riskBreakdown = [
    { label: 'Low Risk', value: 45, color: '#10b981' },
    { label: 'Medium Risk', value: 35, color: '#f59e0b' },
    { label: 'High Risk', value: 20, color: '#ef4444' },
  ];

  // --- Prompt Optimizer Panel Component ---
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

  // --- Prompt Optimizer Drawer ---
  function OptimizerDrawer() {
    return (
      <div className="fixed top-0 right-0 h-full w-[350px] max-w-full bg-white shadow-2xl z-[100] border-l border-gray-200 flex flex-col transition-transform duration-300" style={{ transform: optimizerOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="font-bold text-lg text-[#0E1E36]">Prompt Optimizer</div>
          <button className="text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setOptimizerOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <PromptOptimizerPanel onOptimize={handleOptimize} />
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
        </div>
      </div>
    );
  }

  // --- Floating Optimizer Button ---
  function FloatingOptimizerButton() {
    return (
      <button
        className="fixed bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 z-40 bg-[#FF6F3C] text-white font-bold text-sm sm:text-base lg:text-lg px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full shadow-lg flex items-center gap-1 sm:gap-2 hover:bg-[#e65d2d] transition"
        onClick={() => setOptimizerOpen(true)}
        style={{ boxShadow: '0 4px 24px rgba(255,111,60,0.18)' }}
      >
        <span className="text-lg sm:text-xl lg:text-2xl">✍️</span> 
        <span className="hidden sm:inline">Prompt Optimizer</span>
        <span className="sm:hidden">Optimize</span>
      </button>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ fontSize: 22, background: COLORS.bg }}>
      {/* Sticky Nav Tabs - Standardized */}
      <nav className="sticky top-0 z-40 flex flex-col sm:flex-row px-4 sm:px-8 py-3 sm:py-5 shadow-md justify-between items-center" style={{ background: COLORS.bg }}>
        {/* Left: Branding */}
        <div className="flex items-center gap-6 sm:gap-12 min-w-[180px] w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xl sm:text-2xl font-light tracking-widest uppercase text-white select-none" style={{ letterSpacing: 2 }}>COMPLYZE</span>
          {/* Mobile menu toggle could go here if needed */}
        </div>
        {/* Center: Nav Links */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-8 lg:gap-12 items-center justify-center w-full sm:w-auto mt-3 sm:mt-0">
          <Link href="/dashboard" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Dashboard
            {pathname && pathname.startsWith('/dashboard') && !pathname.includes('reports') && !pathname.includes('settings') && !pathname.includes('admin') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
          <Link href="/dashboard/reports" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Reports
            {pathname && pathname.includes('reports') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
          <Link href="/dashboard/settings" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
            Settings
            {pathname && pathname.includes('settings') && !pathname.includes('admin') && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
                <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
              </span>
            )}
          </Link>
          {/* Admin link - only visible to admin users */}
          {user && (user.role === 'admin' || user.role === 'super_admin' || user.plan === 'enterprise') && (
            <Link href="/dashboard/admin" className="relative text-white font-semibold text-lg sm:text-xl lg:text-2xl px-2 sm:px-4 py-2 transition focus:outline-none">
              Admin
              {pathname && pathname.includes('admin') && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-16 sm:w-20 lg:w-24 h-[6px] sm:h-[8px] block">
                  <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
                </span>
              )}
            </Link>
          )}
        </div>
        {/* Right: User Info Pill */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-[120px] sm:min-w-[160px] justify-end w-full sm:w-auto mt-3 sm:mt-0">
          {user?.email && (
            <div className="relative group">
              <span
                className="rounded-full bg-white/10 px-3 sm:px-4 py-1 text-white font-medium truncate max-w-[120px] sm:max-w-[140px] cursor-pointer transition-all duration-200 group-hover:bg-white/20 text-sm sm:text-base"
                title={user.email}
                style={{ display: 'inline-block' }}
              >
                {user.full_name || user.email}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block bg-[#222] text-white text-xs rounded px-3 py-2 shadow-lg whitespace-nowrap">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Notification Bar */}
      <div className="w-full bg-[#E53935] text-white font-bold text-sm sm:text-base lg:text-lg py-2 sm:py-3 text-center shadow px-4" style={{ letterSpacing: 0.2 }}>
        <span className="block sm:inline">3 prompts were blocked today due to high-risk redactions</span>
        <span className="hidden sm:inline"> — </span>
        <span className="block sm:inline">Your risk score increased 12% this week</span>
      </div>
      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {/* Top: 3 LLM Cards - REPLACED WITH COST SUMMARY */}
        {/* {LLM_CARDS.map((d) => <LLMUsageCard key={d.model} d={d} />)} */}
      </div>
      
      {/* Cost Summary Panel - NEW */}
      <CostSummaryPanel userId={userId} />
      
      {/* Second Row: Compliance, Risk, Optimizer */}
      <AnalyticsPanel userId={userId} />
      
      {/* Flagged Prompts Panel */}
      <div className="max-w-7xl mx-auto px-4 pb-6 sm:pb-8 lg:pb-10">
        <FlaggedPromptsPanel />
      </div>
      {/* Floating Optimizer Button */}
      <FloatingOptimizerButton />
      {/* Optimizer Drawer */}
      <OptimizerDrawer />
    </div>
  );
} 