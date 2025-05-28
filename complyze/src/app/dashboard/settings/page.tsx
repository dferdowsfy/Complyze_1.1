'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from "next/navigation";

// Define the redaction categories and items structure (matching the API)
const REDACTION_CATEGORIES = {
  PII: [
    'Name',
    'Email',
    'Phone Number',
    'Address',
    'SSN',
    'Passport Number',
    'IP Address'
  ],
  'Credentials & Secrets': [
    'API Keys',
    'OAuth Tokens',
    'SSH Keys',
    'Vault Paths',
    'Access Tokens'
  ],
  'Company Internal': [
    'Internal URLs',
    'Project Codenames',
    'Internal Tools',
    'System IP Ranges'
  ],
  'AI Model & Dataset Leakage': [
    'Model Names',
    'Training Data References',
    'Fine-tuned Logic',
    'Private Weights or Output'
  ],
  'Regulated Info': [
    'PHI (HIPAA)',
    'Financial Records',
    'Export-Controlled Terms (ITAR)',
    'Whistleblower IDs'
  ],
  'Jailbreak Patterns': [
    'Ignore previous instructions',
    'Simulate a developer mode',
    'Repeat after me...'
  ],
  Other: [
    'Custom-defined terms'
  ]
};

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false }: { 
  enabled: boolean; 
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6F3C] focus:ring-offset-2 ${
      enabled ? 'bg-[#FF6F3C]' : 'bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Category Section Component
const CategorySection = ({ 
  categoryName, 
  items, 
  settings, 
  onToggle, 
  expanded, 
  onToggleExpanded,
  customTerms,
  onCustomTermsChange
}: {
  categoryName: string;
  items: string[];
  settings: Record<string, boolean>;
  onToggle: (key: string, enabled: boolean) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  customTerms?: string;
  onCustomTermsChange?: (terms: string) => void;
}) => {
  const categoryEnabled = items.some(item => settings[`${categoryName}.${item}`]);
  const allEnabled = items.every(item => settings[`${categoryName}.${item}`]);
  
  const handleCategoryToggle = () => {
    const newState = !allEnabled;
    items.forEach(item => {
      onToggle(`${categoryName}.${item}`, newState);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ToggleSwitch 
              enabled={allEnabled} 
              onChange={handleCategoryToggle}
            />
            <h3 className="text-lg font-semibold text-[#1C2A3E]">{categoryName}</h3>
          </div>
          <span className="text-sm text-gray-500">
            {items.filter(item => settings[`${categoryName}.${item}`]).length} of {items.length} enabled
          </span>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {items.map(item => (
              <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-[#1C2A3E]">{item}</span>
                <ToggleSwitch 
                  enabled={settings[`${categoryName}.${item}`] || false}
                  onChange={(enabled) => onToggle(`${categoryName}.${item}`, enabled)}
                />
              </div>
            ))}
          </div>
          
          {/* Custom terms input for "Other" category */}
          {categoryName === 'Other' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#1C2A3E] mb-2">
                Custom Terms (comma-separated)
              </label>
              <textarea
                value={customTerms || ''}
                onChange={(e) => onCustomTermsChange?.(e.target.value)}
                placeholder="Enter custom terms to redact, separated by commas..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6F3C] focus:border-transparent resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                These terms will be automatically redacted when detected in prompts
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Settings() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [customTerms, setCustomTerms] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user_123';

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/governance/redaction-settings?user_id=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load settings');
      }
      
      setSettings(data.settings);
      
      // Expand all categories by default on first load
      const initialExpanded: Record<string, boolean> = {};
      Object.keys(REDACTION_CATEGORIES).forEach(category => {
        initialExpanded[category] = true;
      });
      setExpandedCategories(initialExpanded);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: enabled
    }));
  };

  const handleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/governance/redaction-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          settings: settings
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }
      
      setLastSaved(new Date());
      
      // Send update to Chrome extension
      if (typeof window !== 'undefined') {
        try {
          // Use postMessage to communicate with the extension's content script
          window.postMessage({
            type: 'COMPLYZE_UPDATE_REDACTION_SETTINGS',
            source: 'complyze-website',
            payload: {
              user_id: userId,
              settings: settings,
              customTerms: customTerms
            }
          }, window.location.origin);
          
          console.log('Settings update sent to Chrome extension');
        } catch (error) {
          console.warn('Could not send message to Chrome extension:', error);
        }
      }
      
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const expandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    Object.keys(REDACTION_CATEGORIES).forEach(category => {
      allExpanded[category] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    const allCollapsed: Record<string, boolean> = {};
    Object.keys(REDACTION_CATEGORIES).forEach(category => {
      allCollapsed[category] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  const enableAllRedaction = () => {
    const allEnabled: Record<string, boolean> = {};
    Object.entries(REDACTION_CATEGORIES).forEach(([category, items]) => {
      items.forEach(item => {
        allEnabled[`${category}.${item}`] = true;
      });
    });
    setSettings(allEnabled);
  };

  const disableAllRedaction = () => {
    const allDisabled: Record<string, boolean> = {};
    Object.entries(REDACTION_CATEGORIES).forEach(([category, items]) => {
      items.forEach(item => {
        allDisabled[`${category}.${item}`] = false;
      });
    });
    setSettings(allDisabled);
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: '#0E1E36' }}>
        {/* Navigation */}
        <nav className="sticky top-0 z-40 flex gap-12 px-8 py-5 shadow-md justify-center items-center" style={{ background: '#0E1E36' }}>
          <Link href="/dashboard" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Dashboard
          </Link>
          <Link href="/dashboard/reports" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Reports
          </Link>
          <Link href="/dashboard/settings" className="relative text-white font-semibold text-2xl px-4 py-2 transition focus:outline-none">
            Settings
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-24 h-[8px] block">
              <svg width="100%" height="8" viewBox="0 0 80 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4C16 8 64 8 76 4" stroke="#FF6F3C" strokeWidth="4" strokeLinecap="round"/></svg>
            </span>
          </Link>
        </nav>
        
        <main className="max-w-6xl mx-auto py-12 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6F3C] mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading redaction settings...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0E1E36' }}>
      {/* Sticky Nav Tabs */}
      <nav className="sticky top-0 z-40 flex gap-12 px-8 py-5 shadow-md justify-center items-center" style={{ background: '#0E1E36' }}>
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
      </nav>

      <main className="max-w-6xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Customize Your Redaction Policy</h1>
          <p className="text-lg text-white mb-6">
            Configure which types of sensitive information should be automatically redacted from your prompts.
            Disabled items will be wrapped in asterisks (*) for visibility while maintaining privacy.
          </p>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 font-medium">Error: {error}</span>
              </div>
            </div>
          )}

          {/* Last Saved Indicator */}
          {lastSaved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700 font-medium">
                  Settings saved successfully at {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#1C2A3E] mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={expandAllCategories}
              className="px-4 py-2 bg-gray-100 text-[#1C2A3E] rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Expand All
            </button>
            <button
              onClick={collapseAllCategories}
              className="px-4 py-2 bg-gray-100 text-[#1C2A3E] rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Collapse All
            </button>
            <button
              onClick={enableAllRedaction}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium"
            >
              Enable All Redaction
            </button>
            <button
              onClick={disableAllRedaction}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
            >
              Disable All Redaction
            </button>
          </div>
        </div>

        {/* Redaction Categories */}
        <div className="space-y-6 mb-8">
          {Object.entries(REDACTION_CATEGORIES).map(([categoryName, items]) => (
            <CategorySection
              key={categoryName}
              categoryName={categoryName}
              items={items}
              settings={settings}
              onToggle={handleToggle}
              expanded={expandedCategories[categoryName] || false}
              onToggleExpanded={() => handleCategoryExpand(categoryName)}
              customTerms={categoryName === 'Other' ? customTerms : undefined}
              onCustomTermsChange={categoryName === 'Other' ? setCustomTerms : undefined}
            />
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-8 py-4 bg-[#FF6F3C] text-white rounded-xl font-bold text-lg hover:bg-[#ff8a5c] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving Changes...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

        {/* Info Panel */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How Redaction Works</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Enabled items</strong> are completely redacted (replaced with [REDACTED]) in your prompts</p>
            <p>• <strong>Disabled items</strong> are wrapped in asterisks (*Name*) for visibility while maintaining some privacy</p>
            <p>• Changes are automatically synced to your Chrome extension</p>
            <p>• All redaction happens before your prompts are sent to AI models</p>
          </div>
        </div>
      </main>
    </div>
  );
} 