"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImportService, ImportProgress, validateCSVFile } from '../../../services/importService';

interface ImportCreatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadCsv?: (file: File) => void;
  onAddFromDiscover?: () => void;
  listId?: string;
  onImportComplete?: (result: { found: number; scraping: number; errors: string[] }) => void;
}

export const ImportCreatorsModal: React.FC<ImportCreatorsModalProps> = ({
  isOpen,
  onClose,
  onUploadCsv,
  onAddFromDiscover,
  listId,
  onImportComplete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  if (!isOpen) return null;

  const openFilePicker = () => inputRef.current?.click();

  const handleFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      setImportError(validation.error || 'Invalid file');
      return;
    }

    // If listId is provided, use the new import service
    if (listId) {
      await handleImportWithService(file);
    } else {
      // Fallback to old behavior
      onUploadCsv?.(file);
    }
  };

  const handleImportWithService = async (file: File) => {
    if (!listId) {
      setImportError('List ID is required for import');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportProgress(null);

    try {
      const importService = new ImportService((progress) => {
        setImportProgress(progress);
      });

      // Start import and immediately close modal; progress will render in parent UI
      const importPromise = importService.importCreatorsFromCSV(file, listId);
      onClose?.();
      const result = await importPromise;

      if (result.success) {
        onImportComplete?.(result);
        // Close the modal immediately, import continues in background
        onClose?.();
      } else {
        setImportError(result.errors.join(', ') || 'Import failed');
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer?.files);
  };

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 pointer-events-auto z-[2147483647]" style={{ zIndex: 2147483647 }} onWheel={(e) => e.stopPropagation()}>
      <div className="bg-[#1a1f2e] rounded-[12px] border border-gray-700 w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="h-6" />
          <div className="flex items-center gap-2">
            <button
              onClick={onAddFromDiscover}
              className="py-2 px-3 bg-[#31384A] border border-gray-600 rounded-lg hover:bg-[#3F4A5F] active:bg-[#4B5563] transition-colors text-xs text-[#F9FAFB]"
            >
              Add from the discover page
            </button>
            <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 hover:bg-opacity-50 rounded-full transition-colors duration-200">
              <span className="text-[#FFFFFF] text-xl font-light">x</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-700" />

        {/* Upload Area */}
        <div className="p-6">
          {/* Error Display */}
          {importError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{importError}</p>
            </div>
          )}

          {/* Progress Display */}
          {isImporting && importProgress && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-400 text-sm font-medium">{importProgress.message}</p>
                <span className="text-blue-400 text-xs">{Math.round(importProgress.progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress.progress}%` }}
                ></div>
              </div>
              {importProgress.details && (
                <div className="mt-2 text-xs text-gray-400">
                  <p>Total: {importProgress.details.totalCreators} | Found: {importProgress.details.foundCreators} | Scraping: {importProgress.details.scrapingCreators}</p>
                  {importProgress.details.errors.length > 0 && (
                    <p className="text-yellow-400 mt-1">Warnings: {importProgress.details.errors.length}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            className={`w-full min-h-[300px] md:min-h-[360px] bg-[#111827] border border-dotted ${isDragging ? 'border-blue-500' : 'border-gray-600'} rounded-lg flex flex-col items-center justify-center text-center px-6 py-6 ${isImporting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            onClick={isImporting ? undefined : openFilePicker}
            onDragOver={isImporting ? undefined : handleDragOver}
            onDragLeave={isImporting ? undefined : handleDragLeave}
            onDrop={isImporting ? undefined : handleDrop}
            style={{ borderStyle: 'dotted', borderWidth: '2.5px' }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <img src="/DragDropIcon.svg" alt="Drag and drop" className="w-8 h-8 mb-2 opacity-90" />
            <p className="text-gray-200 text-sm md:text-base mb-6">
              Drag and drop your CSV file here, or click this box to upload
            </p>

            {/* Diagram + instructions side-by-side on md+ */}
            <div className="w-full max-w-3xl flex flex-col sm:flex-row sm:flex-nowrap sm:items-start sm:justify-start gap-6 text-left">
              {/* Diagram (two columns sketch) */}
              <div className="text-gray-200">
                <div className="relative rounded-t-md overflow-hidden inline-block shadow-sm w-[260px] flex-shrink-0">
                <table className="text-[11px] md:text-xs border-separate border-spacing-0 table-fixed w-[260px] overflow-hidden">
                  <colgroup>
                    <col style={{ width: 160 }} />
                    <col style={{ width: 100 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="text-left bg-[#111827] text-gray-300 border border-gray-600/30 p-2 font-semibold rounded-tl-md">username</th>
                      <th className="text-left bg-[#111827] text-gray-300 border border-gray-600/30 p-2 font-semibold rounded-tr-md">platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-600/30 p-2 text-gray-400">drdollar</td>
                      <td className="border border-gray-600/30 p-2 text-gray-400">instagram</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600/20 p-2 text-gray-500">cryptovic</td>
                      <td className="border border-gray-600/20 p-2 text-gray-500">tiktok</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-600/10 p-2 text-gray-600">thefinancialwolf...</td>
                      <td className="border border-gray-600/10 p-2 text-gray-600">tiktok...</td>
                    </tr>
                  </tbody>
                </table>
                {/* Fade overlay to soften bottom borders */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#111827]" />
                </div>
              </div>

              {/* Instructions */}
              <div className="text-gray-300 text-[11px] md:text-xs leading-relaxed md:pl-6 md:pt-1 md:flex-1 w-full">
                <ul className="list-disc ml-5 space-y-1 text-left">
                  <li>The first row should be headers: <span className="text-current">username</span>, <span className="text-current">platform</span></li>
                  <li>Do not include the '@' symbol in the username (e.g., <span className="text-current">drdollar</span>)</li>
                  <li>Platform should be the social network (e.g., <span className="text-current">instagram</span> or <span className="text-current">tiktok</span>)</li>
                  <li>Save the file as a CSV (.csv)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modal, document.body) : null;
};


