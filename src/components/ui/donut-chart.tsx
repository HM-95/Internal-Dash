import React, { useId, useMemo } from 'react';

interface DonutChartProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

// SVG donut with unique gradient id per instance to avoid collisions.
// Uses the same colors as the buzz bar: #FC4C4B → #CD45BA → #6E57FF
export const DonutChart: React.FC<DonutChartProps> = ({ 
  score, 
  size = 38,
  strokeWidth = 4 
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  const gradId = useId();
  const gradientId = useMemo(() => `buzz-donut-grad-${gradId.replace(/[:]/g, '-')}` , [gradId]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox" gradientTransform="rotate(90)">
            <stop offset="0%" stopColor="#FC4C4B" />
            <stop offset="50%" stopColor="#CD45BA" />
            <stop offset="100%" stopColor="#6E57FF" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#3D4454"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="dark:stroke-gray-700"
        />

        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] sm:text-[11px] lg:text-[10px] xl:text-[11px] font-bold text-gray-100">
          {clamped}%
        </span>
      </div>
    </div>
  );
};