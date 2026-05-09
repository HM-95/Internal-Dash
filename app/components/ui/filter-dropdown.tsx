import React, { useEffect, useRef } from 'react';
import { Button } from './button';
import { RangeSlider } from './range-slider';

interface FilterConfig {
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  parseValue: (value: string) => number;
  title: string;
  unit: string;
}

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  config: FilterConfig;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  onApply: () => void;
  onReset: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  config,
  value,
  onValueChange,
  onApply,
  onReset,
  triggerRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [minInput, setMinInput] = React.useState(config.formatValue(value[0]));
  const [maxInput, setMaxInput] = React.useState(config.formatValue(value[1]));

  // Update input values when value prop changes
  useEffect(() => {
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
  }, [value, config]);

  // Handle input changes
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinInput(inputValue);
    
    const numericValue = parseInt(inputValue) || 0;
    if (!isNaN(numericValue) && numericValue >= config.min && numericValue <= value[1]) {
      onValueChange([numericValue, value[1]]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMaxInput(inputValue);
    
    const numericValue = parseInt(inputValue) || 0;
    if (!isNaN(numericValue) && numericValue <= config.max && numericValue >= value[0]) {
      onValueChange([value[0], numericValue]);
    }
  };

  // Handle input blur to format values
  const handleMinInputBlur = () => {
    setMinInput(value[0].toString());
  };

  const handleMaxInputBlur = () => {
    setMaxInput(value[1].toString());
  };

  // Position dropdown
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
      const dropdownWidth = 320;
      const dropdownHeight = 400; // Estimated max height
      
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

  // Close on outside click
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
      className="w-[280px] sm:w-[320px] lg:w-[360px] bg-gray-800 border border-gray-600 rounded-[12px] shadow-lg overflow-hidden max-h-[90vh]"
    >
      <div className="p-3 sm:p-4">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#f9fafb] mb-1">
            {config.title}
          </h3>
        </div>

        {/* Min Input */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-[12px] sm:text-[14px] font-medium text-[#9ca3af] mb-2">
            Min {config.unit}
          </label>
          <input
            type="text"
            value={minInput}
            onChange={handleMinInputChange}
            onBlur={handleMinInputBlur}
            className="w-full h-[36px] sm:h-[40px] px-3 py-2 border border-[#374151] rounded-[8px] text-[12px] sm:text-[14px] text-[#f9fafb] bg-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            placeholder={config.min.toString()}
          />
        </div>

        {/* Max Input */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-[12px] sm:text-[14px] font-medium text-[#9ca3af] mb-2">
            Max {config.unit}
          </label>
          <input
            type="text"
            value={maxInput}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            className="w-full h-[36px] sm:h-[40px] px-3 py-2 border border-[#374151] rounded-[8px] text-[12px] sm:text-[14px] text-[#f9fafb] bg-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            placeholder={config.max.toString()}
          />
        </div>

        {/* Range Slider */}
        <div className="mb-4 sm:mb-6">
          <RangeSlider
            min={config.min}
            max={config.max}
            step={config.step}
            value={value}
            onValueChange={onValueChange}
            formatValue={config.formatValue}
          />
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="p-2 sm:p-3 border-t border-[#374151] flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-[12px] font-medium text-[#9ca3af] hover:text-[#f9fafb] hover:bg-[#374151]"
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onApply}
          className="h-7 sm:h-8 px-3 sm:px-4 bg-[linear-gradient(90deg,#557EDD_0%,#6C40E4_100%)] hover:bg-[linear-gradient(90deg,#4A6BC8_0%,#5A36C7_100%)] text-white text-[11px] sm:text-[12px] font-medium rounded-[6px] border-0"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};