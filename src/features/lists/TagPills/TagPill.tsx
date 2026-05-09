import React from 'react';

type Props = {
  name: string;
};

export function TagPill({ name }: Props) {
  return (
    <span className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-[#56240580] rounded-[50px] border border-solid border-[#CA3300]">
      <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs tracking-[0] leading-[14px] whitespace-nowrap">{name}</span>
    </span>
  );
}


