import React, { useEffect, useRef } from 'react';
import { Button } from './button';

interface LocationFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocations: Set<string>;
  onLocationToggle: (location: string) => void;
  onReset: () => void;
  onConfirm: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

// Define the 5 broad regions
const REGIONS = [
  'United States',
  'Europe', 
  'Asia',
  'Middle East',
  'Global'
];

export const LocationFilterDropdown: React.FC<LocationFilterDropdownProps> = ({
  isOpen,
  onClose,
  selectedLocations,
  onLocationToggle,
  onReset,
  onConfirm,
  triggerRef,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const dropdownWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 1024 ? 320 : 360;
      const dropdownHeight = 300; // Reduced height for fewer options
      
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
          <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#f9fafb]">
            Filter by Region
          </h3>
        </div>

        {/* Regions list */}
        <div className="max-h-[200px] sm:max-h-[240px] lg:max-h-[280px] overflow-y-auto">
          <div className="space-y-2">
            {REGIONS.map((region) => (
              <div
                key={region}
                className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-[6px] cursor-pointer transition-colors ${
                  selectedLocations.has(region)
                    ? 'bg-blue-900/20 hover:bg-blue-900/30'
                    : 'hover:bg-[#374151]'
                }`}
                onClick={() => onLocationToggle(region)}
              >
                <span className={`text-[12px] sm:text-[14px] cursor-pointer flex-1 ${
                  selectedLocations.has(region)
                    ? 'text-blue-400 font-medium'
                    : 'text-[#f9fafb]'
                }`}>
                  {region}
                </span>
              </div>
            ))}
          </div>
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
          onClick={onConfirm}
          className="h-7 sm:h-8 px-3 sm:px-4 bg-[linear-gradient(90deg,#557EDD_0%,#6C40E4_100%)] hover:bg-[linear-gradient(90deg,#4A6BC8_0%,#5A36C7_100%)] text-white text-[11px] sm:text-[12px] font-medium rounded-[6px] border-0"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};