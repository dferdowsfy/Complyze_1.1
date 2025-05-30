import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  userId: string;
  onBudgetUpdate: (newBudget: number) => void;
}

export function BudgetModal({ isOpen, onClose, currentBudget, userId, onBudgetUpdate }: BudgetModalProps) {
  const [budget, setBudget] = useState(currentBudget);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBudget(currentBudget);
  }, [currentBudget]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateBudgetFromPosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    updateBudgetFromPosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateBudgetFromPosition = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    // Budget range: $50 to $5000
    const minBudget = 50;
    const maxBudget = 5000;
    const newBudget = Math.round(minBudget + (percentage * (maxBudget - minBudget)));
    
    setBudget(newBudget);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleSave = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ budget: budget })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      onBudgetUpdate(budget);
      onClose();
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSliderPosition = () => {
    const minBudget = 50;
    const maxBudget = 5000;
    return ((budget - minBudget) / (maxBudget - minBudget)) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0E1E36]">Set Monthly Budget</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-[#FF6F3C] mb-2">
              ${budget.toLocaleString()}
            </div>
            <div className="text-gray-600">per month</div>
          </div>

          {/* Custom Slider */}
          <div className="relative mb-6">
            <div
              ref={sliderRef}
              className="relative h-6 bg-gray-200 rounded-full cursor-pointer"
              onMouseDown={handleMouseDown}
            >
              {/* Track */}
              <div
                className="absolute h-6 bg-gradient-to-r from-[#FF6F3C] to-[#FF8A5C] rounded-full transition-all duration-200"
                style={{ width: `${getSliderPosition()}%` }}
              />
              
              {/* Handle */}
              <div
                className="absolute top-1/2 w-8 h-8 bg-white border-4 border-[#FF6F3C] rounded-full shadow-lg cursor-grab active:cursor-grabbing transform -translate-y-1/2 transition-all duration-200 hover:scale-110"
                style={{ left: `calc(${getSliderPosition()}% - 16px)` }}
              />
            </div>

            {/* Scale markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>$50</span>
              <span>$1,000</span>
              <span>$2,500</span>
              <span>$5,000</span>
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center mb-6">
            Drag the slider to set your monthly AI spending limit
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[100, 250, 500, 1000].map((presetBudget) => (
            <button
              key={presetBudget}
              onClick={() => setBudget(presetBudget)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                budget === presetBudget
                  ? 'bg-[#FF6F3C] text-white border-[#FF6F3C]'
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              ${presetBudget}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#FF6F3C] text-white rounded-lg hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
} 