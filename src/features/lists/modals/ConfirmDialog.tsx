import React from 'react';

type Props = {
  title: string;
  message: React.ReactNode;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ title, message, confirmText, cancelText = 'Cancel', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onWheel={(e) => e.stopPropagation()}>
      <div className="bg-[#1a1f2e] rounded-[12px] border border-gray-700 w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-[#F9FAFB]">{title}</h2>
        </div>
        <div className="px-6 py-4 text-[#D1D5DB] text-sm">
          {message}
        </div>
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 rounded-lg" onClick={onCancel}>{cancelText}</button>
          <button className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}


