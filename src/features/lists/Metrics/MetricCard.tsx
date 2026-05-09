import React from 'react';

type MetricCardProps = {
  iconSrc: string;
  iconAlt: string;
  title: string;
  value: string;
  className?: string;
};

export function MetricCard({ iconSrc, iconAlt, title, value, className }: MetricCardProps) {
  return (
    <div className={`flex flex-row items-center py-2 px-2 gap-2 bg-[#31384A] rounded-[12px] w-full min-w-0 ${className ?? ''}`}>
      <div className="flex justify-center items-center w-7 h-7">
        <img
          className="w-7 h-7 !important"
          style={{ width: '28px !important', height: '28px !important', minWidth: '28px', minHeight: '28px' }}
          alt={iconAlt}
          src={iconSrc}
        />
      </div>
      <div className="flex flex-col justify-center items-start gap-0.5 flex-1">
        <span className="[font-family:'Inter',Helvetica] font-semibold text-[10px] text-[#9CA3AF] whitespace-nowrap">{title}</span>
        <span className="[font-family:'Inter',Helvetica] font-semibold text-[12px] text-[#F9FAFB]">{value}</span>
      </div>
    </div>
  );
}


