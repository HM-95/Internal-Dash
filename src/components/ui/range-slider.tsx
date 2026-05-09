import React, { useCallback, useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onValueChange,
  formatValue = (v) => v.toString(),
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  // Calculate percentage position for a value
  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  // Calculate value from percentage
  const getValueFromPercentage = useCallback((percentage: number) => {
    const rawValue = min + (percentage / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  // Handle mouse/touch events
  const handlePointerMove = useCallback((clientX: number) => {
    if (!trackRef.current || !isDragging) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const newValue = getValueFromPercentage(percentage);

    if (isDragging === 'min') {
      const newMin = Math.min(newValue, value[1]);
      if (newMin !== value[0]) {
        onValueChange([newMin, value[1]]);
      }
    } else if (isDragging === 'max') {
      const newMax = Math.max(newValue, value[0]);
      if (newMax !== value[1]) {
        onValueChange([value[0], newMax]);
      }
    }
  }, [isDragging, value, onValueChange, getValueFromPercentage]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handlePointerMove(e.clientX);
  }, [handlePointerMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Touch event handlers
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handlePointerMove(e.touches[0].clientX);
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const minPercentage = getPercentage(value[0]);
  const maxPercentage = getPercentage(value[1]);

  return (
    <div className="w-full">
      {/* Track container */}
      <div className="relative mb-6">
        <div
          ref={trackRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer dark:bg-gray-600"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = ((e.clientX - rect.left) / rect.width) * 100;
            const newValue = getValueFromPercentage(percentage);
            
            // Determine which handle is closer
            const distanceToMin = Math.abs(newValue - value[0]);
            const distanceToMax = Math.abs(newValue - value[1]);
            
            if (distanceToMin < distanceToMax) {
              onValueChange([newValue, value[1]]);
            } else {
              onValueChange([value[0], newValue]);
            }
          }}
        >
          {/* Active range */}
          <div
            className="absolute h-full bg-blue-500 rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />
          
          {/* Min handle */}
          <div
            className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform shadow-sm dark:bg-gray-800 dark:border-blue-400"
            style={{ left: `${minPercentage}%` }}
            onMouseDown={() => setIsDragging('min')}
            onTouchStart={() => setIsDragging('min')}
          />
          
          {/* Max handle */}
          <div
            className="absolute w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 top-1/2 hover:scale-110 transition-transform shadow-sm dark:bg-gray-800 dark:border-blue-400"
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={() => setIsDragging('max')}
            onTouchStart={() => setIsDragging('max')}
          />
        </div>
      </div>

      {/* Value labels */}
      <div className="flex justify-between text-[12px] text-gray-600 font-['Inter',Helvetica] dark:text-gray-400">
        <span>{formatValue(min)}</span>
        <span>{formatValue(Math.round((min + max) / 2))}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};