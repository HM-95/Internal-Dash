import React from 'react';

interface AISearchDonutChartProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export const AISearchDonutChart: React.FC<AISearchDonutChartProps> = ({ 
  score, 
  size = 32,
  strokeWidth = 3 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Calculate center position
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="dark:stroke-gray-500"
        />
        
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id={`gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FC4C4B" />
            <stop offset="50%" stopColor="#CD45BA" />
            <stop offset="100%" stopColor="#6E57FF" />
          </linearGradient>
        </defs>
        
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#gradient-${score})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {/* Score text - 2px smaller than original DonutChart */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[6px] sm:text-[7px] lg:text-[8px] xl:text-[9px] font-bold fill-current text-white">
          {score}%
        </span>
      </div>
    </div>
  );
};
