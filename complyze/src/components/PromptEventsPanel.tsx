'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';

interface PromptEvent {
  id: string;
  user_id: string;
  original_prompt: string;
  optimized_prompt: string;
  timestamp: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  platform: string;
  llm_used: string;
  flagged: boolean;
  framework_flags: string[];
  pii_detected: string[];
  original_tokens: number;
  optimized_tokens: number;
  tokens_saved: number;
  original_cost: number;
  optimized_cost: number;
  cost_saved: number;
}

interface PromptEventsPanelProps {
  userId: string;
}

export function PromptEventsPanel({ userId }: PromptEventsPanelProps) {
  const [events, setEvents] = useState<PromptEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Platform colors
  const getPlatformBadge = (platform: string) => {
    const platformStyles: Record<string, string> = {
      'chatgpt': 'bg-green-600',
      'chat.openai.com': 'bg-green-600',
      'claude': 'bg-orange-600',
      'claude.ai': 'bg-orange-600',
      'gemini': 'bg-blue-600',
      'gemini.google.com': 'bg-blue-600',
      'context-menu': 'bg-purple-600',
    };
    
    const style = platformStyles[platform.toLowerCase()] || 'bg-gray-600';
    const displayName = platform.replace('.com', '').replace('.ai', '').toUpperCase();
    
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${style}`}>
        {displayName}
      </span>
    );
  };

  // LLM Model colors
  const getModelBadge = (model: string) => {
    const modelColor = model.includes('gpt') ? 'bg-green-500' :
                      model.includes('claude') ? 'bg-orange-500' :
                      model.includes('gemini') ? 'bg-blue-500' :
                      'bg-gray-500';
    
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${modelColor}`}>
        {model}
      </span>
    );
  };

  // Fetch initial events
  useEffect(() => {
    fetchEvents();
    
    // Set up real-time subscription
    setupRealtimeSubscription();
    
    return () => {
      // Clean up subscription on unmount
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
    };
  }, [userId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/prompt_events?user_id=${userId}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch prompt events');
      }
      
      const data = await response.json();
      setEvents(data.data || []);
    } catch (err) {
      console.error('Error fetching prompt events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prompt events');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to INSERT events on prompt_events table for this user
    const channel = supabaseClient
      .channel(`prompt_events:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prompt_events',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New prompt event received:', payload);
          // Add new event to the beginning of the list
          setEvents(prev => [payload.new as PromptEvent, ...prev].slice(0, 50)); // Keep max 50 events
          
          // Show a notification if it's a high-risk prompt
          if ((payload.new as PromptEvent).risk_level === 'high' || (payload.new as PromptEvent).risk_level === 'critical') {
            showNotification('High-risk prompt detected!', 'warning');
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    subscriptionRef.current = channel;
  };

  const showNotification = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    // Simple notification - could be enhanced with a proper notification library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'warning' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4">
        <div className="font-bold text-xl text-[#0E1E36] mb-2">Live Prompt Activity</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading prompt events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-7 flex flex-col gap-4">
        <div className="font-bold text-xl text-[#0E1E36] mb-2">Live Prompt Activity</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-7 flex flex-col gap-3 sm:gap-4" style={{ boxShadow: '0 2px 8px rgba(14,30,54,0.10)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="font-bold text-lg sm:text-xl text-[#0E1E36]">Live Prompt Activity</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
          </div>
          <button
            onClick={() => setShowOptimizer(!showOptimizer)}
            className="px-4 py-2 bg-[#FF6F3C] text-white rounded-lg hover:bg-[#E55A2B] transition-colors text-sm font-medium"
          >
            {showOptimizer ? 'Hide' : 'Show'} Optimizer
          </button>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🛡️</div>
            <div className="text-lg font-medium mb-2">No prompts captured yet</div>
            <div className="text-sm text-center max-w-md">
              Start using AI platforms with the Complyze extension active to see your prompts here in real-time
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${getRiskColor(event.risk_level)}`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getPlatformBadge(event.platform)}
                    {getModelBadge(event.llm_used)}
                    {event.flagged && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-semibold text-white bg-red-600">
                        FLAGGED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Original Prompt */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Original Prompt:</div>
                  <div className="text-sm bg-white bg-opacity-50 rounded p-2 font-mono break-words">
                    {event.original_prompt.length > 200 
                      ? event.original_prompt.substring(0, 200) + '...' 
                      : event.original_prompt}
                  </div>
                </div>

                {/* Optimized Prompt (if different) */}
                {event.optimized_prompt !== event.original_prompt && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Optimized Prompt:</div>
                    <div className="text-sm bg-green-50 rounded p-2 font-mono break-words">
                      {event.optimized_prompt.length > 200 
                        ? event.optimized_prompt.substring(0, 200) + '...' 
                        : event.optimized_prompt}
                    </div>
                  </div>
                )}

                {/* Metrics Row */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {/* Risk Level */}
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Risk:</span>
                    <span className={`font-bold uppercase ${
                      event.risk_level === 'high' || event.risk_level === 'critical' ? 'text-red-600' :
                      event.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {event.risk_level}
                    </span>
                  </div>

                  {/* Tokens Saved */}
                  {event.tokens_saved > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Tokens Saved:</span>
                      <span className="font-bold text-green-600">{event.tokens_saved}</span>
                    </div>
                  )}

                  {/* Cost Saved */}
                  {event.cost_saved > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Cost Saved:</span>
                      <span className="font-bold text-green-600">${event.cost_saved.toFixed(4)}</span>
                    </div>
                  )}

                  {/* PII Detected */}
                  {event.pii_detected.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">PII:</span>
                      <span className="text-red-600">{event.pii_detected.join(', ')}</span>
                    </div>
                  )}

                  {/* Frameworks */}
                  {event.framework_flags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Frameworks:</span>
                      <span>{event.framework_flags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Optimizer Overlay */}
      {showOptimizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0E1E36]">Prompt Optimizer</h2>
              <button
                onClick={() => setShowOptimizer(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* PromptOptimizer component content */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}