import React from 'react';

type Props = {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function AddTagsButton({ onClick }: Props) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-[50px] border-gray-600 h-[28px] text-xs hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200">
      <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs">Add Tags</span>
    </button>
  );
}


