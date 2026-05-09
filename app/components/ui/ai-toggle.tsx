import React from "react";
import { CreatorListMode } from "@/types/database";

interface AIToggleProps {
  value: CreatorListMode;
  onChange: (value: CreatorListMode) => void;
  className?: string;
}

export const AIToggle: React.FC<AIToggleProps> = ({ value, onChange, className = "" }) => {

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Container - Vertical on mobile, horizontal on larger screens */}
      <div className="flex flex-col sm:flex-row bg-gray-800 border border-gray-600 rounded-[10px] p-0 overflow-hidden">
        {/* AI Recommendations Option */}
        <button
          onClick={() => onChange('ai')}
          className={`relative flex items-center justify-center gap-[3px] lg:gap-[4px] xl:gap-[6px] px-[6px] lg:px-[8px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-[28px] lg:h-[32px] xl:h-[36px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] transition-all duration-200 rounded-[8px] ${
            value === 'ai'
              ? 'bg-gradient-to-r from-purple-600/40 to-purple-500/30 text-white shadow-lg shadow-purple-500/20'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="whitespace-nowrap">AI Recommendations</span>
        </button>

        {/* All Creators Option */}
        <button
          onClick={() => onChange('all')}
          className={`flex items-center justify-center px-[6px] lg:px-[8px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-[28px] lg:h-[32px] xl:h-[36px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] transition-all duration-200 rounded-[8px] ${
            value === 'all'
              ? 'bg-gradient-to-r from-purple-600/40 to-purple-500/30 text-white shadow-lg shadow-purple-500/20'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`}
        >
          <span className="whitespace-nowrap">All Influencers</span>
        </button>
      </div>
    </div>
  );
};