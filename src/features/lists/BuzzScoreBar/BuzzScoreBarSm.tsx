import React from 'react';

type Props = {
  percent: number; // 0-100
};

export function BuzzScoreBarSm({ percent }: Props) {
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  const labelLeft = Math.max(0, rounded - 8);
  return (
    <div className="w-full h-[16px] relative mt-2 min-w-0">
      <div className="h-[12px] w-full bg-[#31384A] rounded-[8px] overflow-hidden" />
      <div
        className="absolute top-0 left-0 h-[12px] bg-gradient-to-r from-[#FC4C4B] via-[#CD45BA] to-[#6E57FF] rounded-[8px]"
        style={{ width: `${rounded}%` }}
      />
      <div className="absolute -top-0.5 z-10 flex items-center" style={{ left: `${labelLeft}%` }}>
        <span className="[font-family:'Inter',Helvetica] font-extrabold text-[10px] text-[#F9FAFB]">{rounded}%</span>
      </div>
    </div>
  );
}


