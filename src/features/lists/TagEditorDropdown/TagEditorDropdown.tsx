import React, { useMemo, useState, useEffect, useRef } from 'react';

type Props = {
  availableTags: string[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onCreate: (name: string) => void;
  onRename?: (oldName: string, newName: string) => void;
  onRemove?: (name: string) => void;
  onCancel: () => void;
  onSave: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  maxSelected?: number;
};

export function TagEditorDropdown({ availableTags, selected, onToggle, onCreate, onRename, onRemove, onCancel, onSave, search, onSearchChange, maxSelected = 4 }: Props) {
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => {
    // Deduplicate available tags to avoid missing/duplicate entries and ensure consistency
    const unique = Array.from(new Set(availableTags));
    const picked = unique.filter(t => selected.has(t));
    const rest = unique.filter(t => !selected.has(t));
    return [...picked, ...rest];
  }, [availableTags, selected]);

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenMenuFor(null);
        if (editingTag && editingValue.trim() && onRename) {
          onRename(editingTag, editingValue.trim());
        }
        setEditingTag(null);
      }
    };
    document.addEventListener('mousedown', closeOnOutside as EventListener, true);
    document.addEventListener('touchstart', closeOnOutside as EventListener, true);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside as EventListener, true);
      document.removeEventListener('touchstart', closeOnOutside as EventListener, true);
    };
  }, [editingTag, editingValue, onRename]);

  return (
    <div ref={containerRef} data-tag-dropdown data-tag-area className="absolute top-full mt-2 left-0 z-[60] w-[280px] bg-[#111827] border border-gray-700 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-[#F9FAFB]">Edit List Tags</h3>
      </div>
      <div className="px-4 py-3">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Create a new tag..."
              maxLength={20}
              className="flex-1 px-2 py-1.5 bg-[#31384A] border border-gray-600 rounded-lg text-[#F9FAFB] placeholder-gray-400 focus:outline-none focus:border-gray-500 text-xs"
            />
            <button
              onClick={() => search.trim() && onCreate(search.trim())}
              disabled={!search.trim() || search.length > 20 || selected.size >= maxSelected}
              className="px-2 py-1.5 bg-[#217EFD] text-white rounded-lg hover:bg-[#1E6FE8] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-xs"
            >
              Create
            </button>
          </div>
          <p className="text-xs text-[#9CA3AF]">{search.length}/20 characters • {selected.size}/{maxSelected} tags selected</p>
        </div>
        <div className="max-h-48 overflow-y-auto custom-scrollbar">
          <div
            className="space-y-1"
            onMouseDown={() => {
              // Close any open menu when clicking anywhere in the list (except the menu itself which stops propagation)
              if (openMenuFor) setOpenMenuFor(null);
            }}
          >
            {sorted.map((tagName) => (
              <div
                key={tagName}
                className="flex items-center justify-between gap-2 p-1.5 hover:bg-[#31384A] rounded-lg transition-colors"
                onMouseDown={() => {
                  // Clicking another row closes an open menu from a different tag
                  if (openMenuFor && openMenuFor !== tagName) setOpenMenuFor(null);
                }}
              >
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onToggle(tagName)}>
                  <div className="flex items-center justify-center w-3 h-3">
                    {selected.has(tagName) ? (
                      <div className="w-3 h-3 bg-[#217EFD] rounded-[1px] flex items-center justify-center">
                        <svg width="6" height="4" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-1.5 h-1">
                          <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-3 h-3 bg-[#4B5563] rounded-[1px] border border-[#6B7280] hover:bg-[#5B6573] transition-colors" />
                    )}
                  </div>
                  {editingTag === tagName ? (
                    <input
                      value={editingValue}
                      autoFocus
                      maxLength={20}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingValue.trim()) {
                            if (onRename) onRename(tagName, editingValue.trim());
                          }
                          setEditingTag(null);
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                        }
                      }}
                      onBlur={() => {
                        if (editingValue.trim()) {
                          if (onRename) onRename(tagName, editingValue.trim());
                        }
                        setEditingTag(null);
                      }}
                      className="px-1 py-0.5 bg-[#1f2533] border border-gray-600 rounded text-xs text-[#F9FAFB] w-32"
                    />
                  ) : (
                    <span className="text-[#F9FAFB] text-xs">{tagName}</span>
                  )}
                </div>
                {/* Three-dots actions */}
                <div className="relative">
                  <button className="p-1 rounded hover:bg-[#3a4356]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(prev => prev === tagName ? null : tagName); }} aria-label="More actions" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(prev => prev === tagName ? null : tagName); } }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300">
                      <circle cx="5" cy="12" r="2" fill="currentColor"/>
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      <circle cx="19" cy="12" r="2" fill="currentColor"/>
                    </svg>
                  </button>
                   {openMenuFor === tagName && (
                    <div
                      className="absolute right-0 mt-1 w-32 bg-[#111827] border border-gray-700 rounded-md shadow-xl z-50"
                       onMouseDown={(e) => e.stopPropagation()}
                    >
                       <button className="w-full text-left px-3 py-2 text-xs text-gray-100 hover:bg-[#2a3244]"
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(null); setEditingTag(tagName); setEditingValue(tagName); }}
                         onMouseDown={(e) => { e.stopPropagation(); }}
                       >Edit</button>
                       <button className="w-full text-left px-3 py-2 text-xs text-red-300 hover:bg-[#2a3244]"
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(null); if (onRemove) { onRemove(tagName); } }}
                         onMouseDown={(e) => { e.stopPropagation(); }}
                         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(null); if (onRemove) { onRemove(tagName); } } }}
                       >Remove</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-800 border border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 rounded-lg text-xs transition-colors">Cancel</button>
        <button onClick={onSave} className="px-3 py-1.5 bg-[#217EFD] text-white hover:bg-[#1E6FE8] rounded-lg text-xs transition-colors">Save</button>
      </div>
    </div>
  );
}


