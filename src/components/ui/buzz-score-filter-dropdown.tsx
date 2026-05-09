import React, { useEffect, useRef } from "react";
import { Button } from "./button";

interface BuzzScoreFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScores: Set<string>;
  onScoreToggle: (score: string) => void;
  onReset: () => void;
  onConfirm: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const scoreOptions = [
  { value: '90%+', label: '90%+' },
  { value: '80-90%', label: '80-90%' },
  { value: '70-80%', label: '70-80%' },
  { value: '60-70%', label: '60-70%' },
  { value: 'Less than 60%', label: 'Less than 60%' },
];

export const BuzzScoreFilterDropdown: React.FC<BuzzScoreFilterDropdownProps> = ({
  isOpen,
  onClose,
  selectedScores,
  onScoreToggle,
  onReset,
  onConfirm,
  triggerRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position dropdown relative to trigger
  useEffect(() => {
    if (isOpen && dropdownRef.current && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Calculate optimal position
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left;
      
      // Adjust for viewport boundaries
      const dropdownWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 1024 ? 320 : 360;
      const dropdownHeight = 350; // Estimated max height
      
      // Horizontal positioning
      if (left + dropdownWidth > viewport.width) {
        left = triggerRect.right - dropdownWidth;
      }
      if (left < 8) {
        left = 8;
      }
      
      // Vertical positioning - show above if not enough space below
      if (top + dropdownHeight > viewport.height && triggerRect.top > dropdownHeight) {
        top = triggerRect.top - dropdownHeight - 8;
      }
      
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
      dropdown.style.zIndex = '9999';
      
      // Handle scroll to keep dropdown positioned
      const handleScroll = () => {
        if (triggerRef.current && dropdownRef.current) {
          const newTriggerRect = triggerRef.current.getBoundingClientRect();
          let newTop = newTriggerRect.bottom + 8;
          let newLeft = newTriggerRect.left;
          
          // Reapply boundary checks
          if (newLeft + dropdownWidth > viewport.width) {
            newLeft = newTriggerRect.right - dropdownWidth;
          }
          if (newLeft < 8) {
            newLeft = 8;
          }
          
          if (newTop + dropdownHeight > viewport.height && newTriggerRect.top > dropdownHeight) {
            newTop = newTriggerRect.top - dropdownHeight - 8;
          }
          
          dropdownRef.current.style.top = `${newTop}px`;
          dropdownRef.current.style.left = `${newLeft}px`;
        }
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen, triggerRef]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="bg-white border border-[#dbe2eb] rounded-[12px] shadow-lg overflow-hidden w-[280px] sm:w-[320px] lg:w-[360px] max-h-[90vh] dark:bg-gray-800 dark:border-gray-600"
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h3 className="font-semibold text-[14px] sm:text-[16px] text-neutral-new900 dark:text-gray-100">
            Filter by Buzz Score
          </h3>
        </div>

        {/* Score options */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {scoreOptions.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-between p-2 sm:p-3 rounded-[8px] transition-colors cursor-pointer ${
                selectedScores.has(option.value)
                  ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => onScoreToggle(option.value)}
            >
              <span className={`text-[12px] sm:text-[14px] ${
                selectedScores.has(option.value)
                  ? 'text-blue-700 font-semibold dark:text-blue-400'
                  : 'text-neutral-new900 font-medium dark:text-gray-200'
              }`}>
                {option.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="p-2 sm:p-3 border-t border-[#f3f4f6] flex justify-between items-center dark:border-gray-600">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-[12px] font-medium text-[#6b7280] hover:text-[#374151] hover:bg-[#f9fafb] dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className="h-7 sm:h-8 px-3 sm:px-4 bg-[linear-gradient(90deg,#557EDD_0%,#6C40E4_100%)] hover:bg-[linear-gradient(90deg,#4A6BC8_0%,#5A36C7_100%)] text-white text-[11px] sm:text-[12px] font-medium rounded-[6px] border-0"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};