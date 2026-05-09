import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { ImportProgress } from '../../../services/importService';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { TagPill } from '../TagPills/TagPill';
import { AddTagsButton } from '../TagPills/AddTagsButton';
import { TagEditorDropdown } from '../TagEditorDropdown/TagEditorDropdown';
import { MetricsRowSm } from '../Metrics/MetricsRowSm';
import { CreatorTable } from '../CreatorTable/CreatorTable';
import { ImportCreatorsModal } from '../modals/ImportCreatorsModal';
import { listsClient } from '@/lib/listsClient';
import { ChevronDown, Plus } from 'lucide-react';

type SortField = 'followers' | 'avg_views' | 'engagement' | 'price';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

type ListDetailModalProps = {
  isOpen: boolean;
  list: any;
  creators: any[];
  selectedCreatorIds: Set<number>;
  onToggleSelectCreator: (id: number) => void;
  onSelectAllCreators: () => void;
  onRemoveSelectedCreators: () => void;
  onClose: () => void;
  // Title editing
  isEditingTitle: boolean;
  editedTitle: string;
  onStartTitleEdit: () => void;
  onChangeEditedTitle: (v: string) => void;
  onSaveTitleEdit: () => void;
  onCancelTitleEdit: () => void;
  onTitleKeyPress: (e: React.KeyboardEvent) => void;
  // Tags
  availableTags: string[];
  showTagDropdown: boolean;
  selectedListTags: Set<string>;
  searchTagQuery: string;
  setShowTagDropdown: (v: boolean) => void;
  setSelectedListTags: (v: Set<string>) => void;
  setEditingListId: (id: number) => void;
  setSearchTagQuery: (v: string) => void;
  onTagToggle: (name: string) => void;
  onCreateTag: () => void;
  onCancelTags: () => void;
  onSaveTags: () => void;
  onRenameTag?: (oldName: string, newName: string) => void;
  onRemoveTag?: (name: string) => void;
  // Row click (opens expanded profile overlay)
  onCreatorRowClick: (creator: any) => void;
  // Import completion callback
  onImportComplete?: (result: any) => void;
};

export function ListDetailModal(props: ListDetailModalProps) {
  const {
    isOpen,
    list,
    creators,
    selectedCreatorIds,
    onToggleSelectCreator,
    onSelectAllCreators,
    onRemoveSelectedCreators,
    onClose,
    isEditingTitle,
    editedTitle,
    onStartTitleEdit,
    onChangeEditedTitle,
    onSaveTitleEdit,
    onCancelTitleEdit,
    onTitleKeyPress,
    availableTags,
    showTagDropdown,
    selectedListTags,
    searchTagQuery,
    setShowTagDropdown,
    setSelectedListTags,
    setEditingListId,
    setSearchTagQuery,
    onTagToggle,
    onCreateTag,
    onCancelTags,
    onSaveTags,
    onCreatorRowClick,
    onRenameTag,
    onImportComplete,
  } = props;
  const { onRemoveTag } = props;

  // Local state for creators to allow real-time price updates
  const [localCreators, setLocalCreators] = useState<any[]>(creators);

  // Track if we've initialized the local creators for this list
  const prevListIdRef = useRef<string | number | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const prevCreatorCountRef = useRef<number>(0);
  const actionDropdownRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const listPickerRef = useRef<HTMLDivElement>(null);

  // Sync local creators ONLY when the list ID changes (switching lists)
  // or when the number of creators changes (add/remove, not price edits)
  // This prevents parent updates from overwriting local edits
  useEffect(() => {
    const currentListId = list?.id;
    const currentCount = creators.length;
    
    // Initialize on first mount or when list changes
    if (!hasInitializedRef.current || prevListIdRef.current !== currentListId) {
      setLocalCreators(creators);
      prevListIdRef.current = currentListId;
      prevCreatorCountRef.current = currentCount;
      hasInitializedRef.current = true;
    }
    // Refresh when creators are added or removed (count changes)
    else if (prevCreatorCountRef.current !== currentCount) {
      setLocalCreators(creators);
      prevCreatorCountRef.current = currentCount;
    }
    // Intentionally NOT syncing on every creators change to preserve local edits
  }, [list?.id, creators.length]);

  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [savingToList, setSavingToList] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isActionDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target as Node) &&
        actionButtonRef.current &&
        !actionButtonRef.current.contains(event.target as Node)
      ) {
        setIsActionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionDropdownOpen]);

  useEffect(() => {
    if (!showListPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listPickerRef.current &&
        !listPickerRef.current.contains(event.target as Node) &&
        actionButtonRef.current &&
        !actionButtonRef.current.contains(event.target as Node)
      ) {
        setShowListPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showListPicker]);

  useEffect(() => {
    if (selectedCreatorIds.size === 0) {
      setIsActionDropdownOpen(false);
      setShowListPicker(false);
    }
  }, [selectedCreatorIds.size]);

  const closeActionNotice = () => setActionNotice(null);

  const toggleActionDropdown = () => {
    if (selectedCreatorIds.size === 0) return;
    setIsActionDropdownOpen((prev) => !prev);
    setShowListPicker(false);
  };

  const handleRemoveInfluencers = () => {
    setIsActionDropdownOpen(false);
    setShowListPicker(false);
    onRemoveSelectedCreators();
  };

  const loadAvailableLists = async () => {
    setLoadingLists(true);
    try {
      const lists = await listsClient.getLists();
      setAvailableLists(lists.map((l) => ({ id: l.id, name: l.name })));
    } catch (error) {
      console.error('Failed to load lists', error);
      setAvailableLists([]);
    } finally {
      setLoadingLists(false);
    }
  };

  const openSaveToListMenu = async () => {
    if (selectedCreatorIds.size === 0) return;
    setIsActionDropdownOpen(false);
    setShowListPicker(true);
    await loadAvailableLists();
  };

  const addSelectedCreatorsToNetwork = async () => {
    if (selectedCreatorIds.size === 0) return;
    setIsActionDropdownOpen(false);
    setSavingToList(true);
    try {
      const creatorIds = Array.from(selectedCreatorIds);
      console.log('Adding creators to talent network from My Lists:', creatorIds);
      
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'addCreators', creatorIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to add to talent network');
      }
      
      const result = await response.json();
      console.log('Successfully added to talent network:', result);
      
      setActionNotice(`${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'} added to talent network`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (error) {
      console.error('Failed to add influencers to talent network', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add influencers to talent network';
      setActionNotice(errorMessage);
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSavingToList(false);
    }
  };

  const addSelectedCreatorsToList = async (listId: string) => {
    if (!listId || selectedCreatorIds.size === 0) {
      setShowListPicker(false);
      return;
    }
    setSavingToList(true);
    try {
      const creatorIds = Array.from(selectedCreatorIds).map((id) => String(id));
      await listsClient.addCreators(listId, creatorIds);
      setActionNotice(`${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'} added to list`);
      setShowListPicker(false);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (error) {
      console.error('Failed to add influencers to list', error);
      setActionNotice('Failed to add influencers to list');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSavingToList(false);
    }
  };

  const handleAddNewListClick = () => {
    setShowListPicker(false);
    setShowNewListModal(true);
  };

  const handleCreateNewList = async () => {
    if (newListName.trim().length === 0 || selectedCreatorIds.size === 0) return;
    setSavingToList(true);
    try {
      const created = await listsClient.createList(newListName.trim());
      const creatorIds = Array.from(selectedCreatorIds).map((id) => String(id));
      await listsClient.addCreators(created.id, creatorIds);
      setActionNotice(`Created "${newListName.trim()}" and added ${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'}.`);
      setShowNewListModal(false);
      setNewListName('');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (error) {
      console.error('Failed to create list', error);
      setActionNotice('Failed to create list');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSavingToList(false);
    }
  };

  const handleNewListKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newListName.trim().length > 0 && !savingToList) {
      handleCreateNewList();
    }
  };

  const handleCloseNewListModal = () => {
    if (savingToList) return;
    setShowNewListModal(false);
    setNewListName('');
  };

  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: 'desc'
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filter and sort creators based on search query and sort state
  const filteredAndSortedCreators = useMemo(() => {
    if (!localCreators) return [];

    // First filter by search query
    let filtered = localCreators;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = localCreators.filter(creator => 
        (creator.display_name || '').toLowerCase().includes(query) ||
        (creator.handle || '').toLowerCase().includes(query) ||
        (creator.username || '').toLowerCase().includes(query)
      );
    }

    // Then sort if needed
    if (!sortState.field) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortState.field) {
        case 'followers':
          aValue = a.followers_count || 0;
          bValue = b.followers_count || 0;
          break;
        case 'avg_views':
          aValue = a.average_views || 0;
          bValue = b.average_views || 0;
          break;
        case 'engagement':
          aValue = a.engagement_rate || 0;
          bValue = b.engagement_rate || 0;
          break;
        case 'price':
          // Treat null/undefined as -1 so they sort to the end when descending
          aValue = a.price ?? -1;
          bValue = b.price ?? -1;
          break;
        default:
          return 0;
      }

      if (sortState.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [localCreators, sortState, searchQuery]);

  // Calculate total payout from all creators (not just filtered)
  const totalPayout = useMemo(() => {
    if (!localCreators || localCreators.length === 0) return 0;
    return localCreators.reduce((sum, creator) => {
      const price = creator.price ?? 0;
      return sum + price;
    }, 0);
  }, [localCreators]);

  // Import progress thin bar in the modal's list area
  const [modalImportProgress, setModalImportProgress] = useState<number | null>(null);
  useEffect(() => {
    const listIdStr = list?.id?.toString?.() ?? '';
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail as { listId: string; progress: ImportProgress } | undefined;
      if (!detail) return;
      if (detail.listId === listIdStr) {
        setModalImportProgress(Math.max(0, Math.min(100, Math.round(detail.progress.progress))));
      }
    };
    const handleComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail as { listId: string } | undefined;
      if (detail?.listId === listIdStr) setModalImportProgress(100);
    };

    window.addEventListener('import-progress', handleProgress as EventListener);
    window.addEventListener('import-complete', handleComplete as EventListener);

    // Hydrate from localStorage if present
    try {
      const raw = localStorage.getItem(`listImportProgress:${listIdStr}`);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p.progress === 'number') setModalImportProgress(Math.round(p.progress));
      }
    } catch {}

    return () => {
      window.removeEventListener('import-progress', handleProgress as EventListener);
      window.removeEventListener('import-complete', handleComplete as EventListener);
    };
  }, [list?.id]);

  // Provide optional export callback via window event to avoid tight coupling
  const exportCurrentList = () => {
    const event = new CustomEvent('export-list', { detail: { list, creators } });
    window.dispatchEvent(event);
  };

  // Import creators tooltip state/refs locally
  const importInfoRef = useRef<HTMLDivElement>(null);
  const importButtonRef = useRef<HTMLDivElement>(null);
  const [showImportInfoPopup, setShowImportInfoPopup] = React.useState(false);
  const [showImportCreatorsModal, setShowImportCreatorsModal] = React.useState(false);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        importInfoRef.current && 
        !importInfoRef.current.contains(event.target as Node) &&
        importButtonRef.current &&
        !importButtonRef.current.contains(event.target as Node)
      ) {
        setShowImportInfoPopup(false);
      }
    };
    if (showImportInfoPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showImportInfoPopup]);

  if (!isOpen || !list) return null;

  const avgFollowers = localCreators.length ? (localCreators.reduce((s, c) => s + c.followers_count, 0) / localCreators.length) : 0;
  const avgViews = localCreators.length ? (localCreators.reduce((s, c) => s + c.average_views, 0) / localCreators.length) : 0;
  const avgEngagement = localCreators.length ? (localCreators.reduce((s, c) => s + c.engagement_rate, 0) / localCreators.length) : 0;

  const formatShort = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-6 py-8"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="bg-[#1a1f2e] rounded-[12px] border border-gray-700 w-full max-w-6xl h-[80vh] min-h-[80vh] max-h-[110vh] overflow-hidden flex flex-col pb-4">
        {/* Top Section */}
        <div className="px-6 py-4 flex-shrink-0 mt-3 lg:mt-2 mb-6">
          {/* Small/Medium: two-column top row – left: title/count/tags, right: actions */}
          <div className="lg:hidden w-full flex flex-row items-start justify-between gap-3">
            {/* Left stack: title + count/date + tags */}
            <div className="flex flex-col justify-center items-start gap-2 flex-1 min-w-[220px]">
              <div className="flex flex-col justify-center items-start gap-1 w-full">
                {/* List Title */}
                <div className="flex items-center gap-1.5 w-full min-h-[28px]">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => onChangeEditedTitle(e.target.value)}
                      onKeyDown={onTitleKeyPress}
                      onBlur={onSaveTitleEdit}
                      className="w-fit [font-family:'Inter',Helvetica] font-semibold text-lg leading-[140%] text-[#F9FAFB] bg-transparent border-b border-[#F9FAFB] outline-none cursor-text"
                      autoFocus
                    />
                  ) : (
                    <h1 
                      className="w-fit [font-family:'Inter',Helvetica] font-semibold text-lg leading-[140%] text-[#F9FAFB] whitespace-nowrap cursor-pointer hover:underline"
                      onClick={onStartTitleEdit}
                    >
                      {list.name}
                    </h1>
                  )}
                  <img className="w-4 h-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" alt="Edit title" src="/EditListIcon.svg" onClick={onStartTitleEdit} />
                </div>

                {/* Number + Date row */}
                <div className="flex flex-row items-center gap-2 w-full min-h-[20px]">
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">{list.creatorCount > 0 ? localCreators.length : 0}</span>
                    <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">Influencers</span>
                  </div>
                  <div className="flex flex-col justify-center items-center h-[20px]"><div className="w-[12px] h-0 border border-solid border-[#DBE2EB] transform rotate-90"></div></div>
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <img className="w-4 h-4" alt="Date" src="/DateIcon.svg" />
                    <div className="flex flex-row items-center gap-1">
                      <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">Created</span>
                      <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">{list.createdDate}</span>
                    </div>
                  </div>
                </div>

                {/* List Tags */}
                <div className="relative flex flex-row items-center gap-2 w-full h-[28px] flex-wrap mt-2">
                  {list.tags && list.tags.length > 0 ? (
                    <>
                      {list.tags.map((tag: { name: string }, index: number) => (
                        <div
                          key={index}
                          onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set(list.tags.map((t: { name: string }) => t.name))); setEditingListId(list.id); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <TagPill name={tag.name} />
                        </div>
                      ))}
                      <button data-edit-tags-trigger onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set(list.tags.map((t: { name: string }) => t.name))); setEditingListId(list.id); }} className="flex flex-row justify-center items-center py-1.5 px-2 gap-1 h-[28px] bg-[#31384A] border border-solid border-gray-600 rounded-[50px] hover:bg-[#3F4A5F] transition-colors" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                        <img className="w-3 h-3" alt="Edit tags" src="/EditListIcon.svg" />
                      </button>
                    </>
                  ) : (
                    <AddTagsButton onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set()); setEditingListId(list.id); }} />
                  )}

                  {/* Tag Selection Dropdown */}
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-2 z-50" data-tag-area onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                      <TagEditorDropdown
                        availableTags={availableTags}
                        selected={selectedListTags}
                        onToggle={onTagToggle}
                        onCreate={() => onCreateTag()}
        onRename={(oldName, newName) => onRenameTag && onRenameTag(oldName, newName)}
                        onRemove={(name) => {
                          // Unlink immediately in DB if handler provided, and update UI selection only if currently selected
                          if (onRemoveTag) onRemoveTag(name);
                          if (selectedListTags.has(name)) {
                            onTagToggle(name);
                          }
                        }}
                        onCancel={onCancelTags}
                        onSave={onSaveTags}
                        search={searchTagQuery}
                        onSearchChange={setSearchTagQuery}
                        maxSelected={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right stack: actions */}
            <div className="flex flex-row justify-end items-center gap-2 flex-shrink-0">
              <div className="flex flex-row justify-center items-center py-2 px-3 gap-1 w-[70px] h-8 bg-[#31384A] border border-solid border-gray-600 rounded-lg hover:bg-[#3F4A5F] active:bg-[#4B5563] transition-colors" onClick={() => exportCurrentList?.()}>
                <img className="w-3 h-3" alt="Export" src="/ExportIcon.svg" />
                <span className="w-[35px] h-4 [font-family:'Inter',Helvetica] font-medium text-xs leading-4 text-[#F9FAFB]">Export</span>
              </div>
              <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 hover:bg-opacity-50 rounded-full transition-colors duration-200">
                <span className="text-[#FFFFFF] text-xl font-light">x</span>
              </button>
            </div>
          </div>

          {/* Small/Medium: metrics below the two-column header (show even for new/empty lists) */}
          <div className="lg:hidden w-full mt-2">
            <MetricsRowSm
              avgFollowers={formatShort(avgFollowers)}
              avgViews={formatShort(avgViews)}
              avgEngagement={`${avgEngagement.toFixed(1)}%`}
            />
          </div>

          {/* Large/XL layout */}
          <div className="hidden lg:flex flex-row lg:flex-nowrap justify-between items-start gap-4 w-full min-h-[80px]">
            {/* Title */}
            <div className="flex flex-col justify-center items-start gap-2 flex-1 order-1 lg:order-1 min-w-[260px] mt-0 lg:mt-3">
              <div className="flex flex-col justify-center items-start gap-1 w-full mt-0">
                {/* List Title */}
                <div className="flex items-center gap-1.5 w-full min-h-[28px]">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => onChangeEditedTitle(e.target.value)}
                      onKeyDown={onTitleKeyPress}
                      onBlur={onSaveTitleEdit}
                      className="w-fit [font-family:'Inter',Helvetica] font-semibold text-lg lg:text-xl leading-[140%] text-[#F9FAFB] bg-transparent border-b border-[#F9FAFB] outline-none cursor-text"
                      autoFocus
                    />
                  ) : (
                    <h1 
                      className="w-fit [font-family:'Inter',Helvetica] font-semibold text-lg lg:text-xl leading-[140%] text-[#F9FAFB] whitespace-nowrap cursor-pointer hover:underline"
                      onClick={onStartTitleEdit}
                    >
                      {list.name}
                    </h1>
                  )}
                  <img className="w-4 h-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" alt="Edit title" src="/EditListIcon.svg" onClick={onStartTitleEdit} />
                </div>

                {/* Number + Date row */}
                <div className="flex flex-row items-center gap-2 w-full min-h-[20px]">
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">{list.creatorCount > 0 ? localCreators.length : 0}</span>
                    <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">Influencers</span>
                  </div>
                  <div className="flex flex-col justify-center items-center h-[20px]"><div className="w-[12px] h-0 border border-solid border-[#DBE2EB] transform rotate-90"></div></div>
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <img className="w-4 h-4" alt="Date" src="/DateIcon.svg" />
                    <div className="flex flex-row items-center gap-1">
                      <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">Created</span>
                      <span className="[font-family:'Inter',Helvetica] font-normal text-sm leading-[140%] text-[#F9FAFB]">{list.createdDate}</span>
                    </div>
                  </div>
                </div>

                {/* List Tags below the row */}
                <div className="relative flex flex-row items-center gap-2 w-full h-[28px] flex-wrap mt-2">
                  {list.tags && list.tags.length > 0 ? (
                    <>
                      {list.tags.map((tag: { name: string }, index: number) => (
                        <div
                          key={index}
                          onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set(list.tags.map((t: { name: string }) => t.name))); setEditingListId(list.id); }}
                        >
                          <TagPill name={tag.name} />
                        </div>
                      ))}
                      <button onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set(list.tags.map((t: { name: string }) => t.name))); setEditingListId(list.id); }} className="flex flex-row justify-center items-center py-1.5 px-2 gap-1 h-[28px] bg-[#31384A] border border-solid border-gray-600 rounded-[50px] hover:bg-[#3F4A5F] transition-colors">
                        <img className="w-3 h-3" alt="Edit tags" src="/EditListIcon.svg" />
                      </button>
                    </>
                  ) : (
                    <AddTagsButton onClick={() => { setShowTagDropdown(true); setSelectedListTags(new Set()); setEditingListId(list.id); }} />
                  )}

                  {/* Tag Selection Dropdown */}
                  {showTagDropdown && (
                    <div className="absolute top-full left-0 mt-2 z-50">
                      <TagEditorDropdown
                        availableTags={availableTags}
                        selected={selectedListTags}
                        onToggle={onTagToggle}
                        onCreate={() => onCreateTag()}
                        onRename={(oldName, newName) => onRenameTag && onRenameTag(oldName, newName)}
                        onRemove={(name) => {
                          if (onRemoveTag) onRemoveTag(name);
                          if (selectedListTags.has(name)) {
                            onTagToggle(name);
                          }
                        }}
                        onCancel={onCancelTags}
                        onSave={onSaveTags}
                        search={searchTagQuery}
                        onSearchChange={setSearchTagQuery}
                        maxSelected={4}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section (large/extra-large screens) */}
            <div className="hidden lg:flex flex-col items-end gap-2 w-full max-w-[556px] h-[85px] order-2 ml-auto">
              {/* Top-right actions (always visible) */}
              <div className="flex flex-row justify-end items-center gap-2 w-full h-8">
                <button
                  onClick={() => localCreators.length > 0 && exportCurrentList?.()}
                  disabled={localCreators.length === 0}
                  className={`flex flex-row justify-center items-center py-2 px-3 gap-1 w-[70px] h-8 rounded-lg border transition-colors ${
                    localCreators.length === 0
                      ? 'bg-gray-900 border-gray-700 cursor-not-allowed'
                      : 'bg-[#31384A] border-gray-600 hover:bg-[#3F4A5F] active:bg-[#4B5563]'
                  }`}
                >
                  <img className={`w-3 h-3 ${localCreators.length === 0 ? 'opacity-50' : ''}`} alt="Export" src="/ExportIcon.svg" />
                  <span className="w-[35px] h-4 [font-family:'Inter',Helvetica] font-medium text-xs leading-4 text-[#F9FAFB]">Export</span>
                </button>
                <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 hover:bg-opacity-50 rounded-full transition-colors duration-200">
                  <span className="text-[#FFFFFF] text-xl font-light">x</span>
                </button>
              </div>

              {/* Metrics row */}
              <div className="flex flex-row items-center gap-2 w-full h-[55px] justify-end" id="metrics-container">
                  <div className="flex flex-row items-center py-3 px-3 gap-3 w-[180px] h-[55px] bg-[#31384A] rounded-[12px]">
                    <div className="flex flex-row justify-center items-center w-[36px] h-[36px]"><img className="w-[36px] h-[36px]" alt="Followers" src="/FollowerIcon.svg" /></div>
                    <div className="flex flex-col justify-center items-start gap-0.5 flex-1 h-[28px]">
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-xs leading-[14px] text-[#9CA3AF] whitespace-nowrap">Avg. Followers</span></div>
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-sm leading-[14px] text-[#F9FAFB]">{formatShort(avgFollowers)}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center py-3 px-3 gap-3 w-[180px] h-[55px] bg-[#31384A] rounded-[12px]">
                    <div className="flex flex-row justify-center items-center w-[36px] h-[36px]"><img className="w-[36px] h-[36px]" alt="Views" src="/AvgViewsIcon.svg" /></div>
                    <div className="flex flex-col justify-center items-start gap-0.5 flex-1 h-[28px]">
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-xs leading-[14px] text-[#9CA3AF] whitespace-nowrap">Avg. Views</span></div>
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-sm leading-[14px] text-[#F9FAFB]">{formatShort(avgViews)}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center py-3 px-3 gap-3 w-[180px] h-[55px] bg-[#31384A] rounded-[12px]">
                    <div className="flex flex-row justify-center items-center w-[36px] h-[36px]"><img className="w-[36px] h-[36px]" alt="Engagement" src="/EngagementIcon.svg" /></div>
                    <div className="flex flex-col justify-center items-start gap-0.5 flex-1 h-[28px]">
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-xs leading-[14px] text-[#9CA3AF] whitespace-nowrap">Avg. Engagement</span></div>
                      <div className="flex flex-row items-center gap-1 w-full h-[14px]"><span className="[font-family:'Inter',Helvetica] font-semibold text-sm leading-[14px] text-[#F9FAFB]">{avgEngagement.toFixed(1)}%</span></div>
                    </div>
                  </div>
              </div>

            <div className="flex flex-row items-center gap-1 w-full h-[18px] relative mt-2" />
            </div>

            {/* Small/Medium: metrics under tags covering full width at bottom of top section */}
            {
              <div className="w-full lg:hidden order-4 mt-2 mb-2">
                <MetricsRowSm
                  avgFollowers={formatShort(avgFollowers)}
                  avgViews={formatShort(avgViews)}
                  avgEngagement={`${avgEngagement.toFixed(1)}%`}
                />
              </div>
            }
          </div>
        </div>

        {/* Creator List Action Buttons */}
        <div className="relative self-stretch w-full flex-[0_0_auto] px-6 py-3 border-t border-gray-700 mt-6 flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="gap-2 inline-flex items-center flex-wrap">
            {/* Add/Import Influencers */}
            <div className="relative">
              <button type="button" onClick={() => setShowImportCreatorsModal(true)} className="inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-[#31384A] rounded-lg border border-solid border-gray-600 h-8 text-[11px] sm:text-xs hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] transition-colors duration-200">
                <img className="w-3 h-3" alt="Import" src="/ImportIcon.svg" />
                <span className="[font-family:'Inter',Helvetica] font-medium text-[#F9FAFB]">Add/Import Influencers</span>
                <div
                  ref={importButtonRef}
                  className="flex flex-row items-center pt-[1px] gap-2 w-[13px] h-[13px] cursor-pointer"
                  onMouseDown={(e) => { e.stopPropagation(); }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowImportInfoPopup((prev) => !prev);
                  }}
                >
                  <img className="w-[13px] h-[13px] !important" style={{ width: '13px !important', height: '13px !important', minWidth: '13px', minHeight: '13px' }} alt="Info" src="/icons/InformationIcon.svg" />
                </div>
              </button>
              {showImportInfoPopup && (
                <div ref={importInfoRef} className="absolute top-full mt-2 w-[280px] sm:w-[320px] lg:w-[360px] bg-[#1F2937] border border-[#374151] rounded-lg shadow-lg z-50 p-4 left-0 dark:bg-gray-800 dark:border-gray-600">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-semibold text-[#F9FAFB] mb-2 dark:text-gray-100">Add/Import Influencers</h3>
                      <p className="text-sm text-[#D1D5DB] mb-3 dark:text-gray-400">This button allows you to add new influencers or import your own list of influencers and track their performance within this list.</p>
                      <p className="text-sm text-[#D1D5DB] mb-3 dark:text-gray-400">You can manually add influencers or upload a CSV file containing influencer data including their social media handles, follower counts, engagement rates, and other relevant metrics.</p>
                      <p className="text-sm text-[#9CA3AF] dark:text-gray-400"><strong>Privacy:</strong> Your imported list will be private and no other user will be able to track or access it.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Action Dropdown */}
            <div className="relative">
              <button
                ref={actionButtonRef}
                onClick={toggleActionDropdown}
                disabled={selectedCreatorIds.size === 0}
                className={`inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg h-8 text-[11px] sm:text-xs transition-colors duration-200 border border-solid ${
                  selectedCreatorIds.size > 0
                    ? 'bg-[#31384A] border-gray-600 text-[#F9FAFB] hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] cursor-pointer'
                    : 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="[font-family:'Inter',Helvetica] font-medium">Action</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isActionDropdownOpen ? 'rotate-180' : ''
                  } ${selectedCreatorIds.size === 0 ? 'text-gray-500' : 'text-[#F9FAFB]'}`}
                />
              </button>

              {isActionDropdownOpen && (
                <div
                  ref={actionDropdownRef}
                  className="absolute top-full left-0 mt-2 w-44 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999]"
                >
                  <button
                    onClick={handleRemoveInfluencers}
                    className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors"
                  >
                    Remove Influencers
                  </button>
                  <div className="h-px bg-[#2c3954]" />
                  <button
                    onClick={openSaveToListMenu}
                    className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors"
                  >
                    Add to list
                  </button>
                  <div className="h-px bg-[#2c3954]" />
                  <button
                    onClick={addSelectedCreatorsToNetwork}
                    className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors"
                  >
                    Add to network
                  </button>
                </div>
              )}

              {showListPicker && (
                <div
                  ref={listPickerRef}
                  className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-[#111827] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[9999]"
                >
                  <div className="px-3 py-2">
                    <h3 className="text-sm font-semibold text-[#F9FAFB] [font-family:'Inter',Helvetica]">Save to list</h3>
                  </div>
                  <div className="h-px bg-[#2c3954] mx-2" />
                  <div className="py-2 max-h-48 overflow-y-auto">
                    {loadingLists ? (
                      <div className="px-3 py-2 text-xs text-[#99a0ad] flex items-center gap-2 [font-family:'Inter',Helvetica]">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading lists...
                      </div>
                    ) : availableLists.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#99a0ad] [font-family:'Inter',Helvetica]">No lists found</div>
                    ) : (
                      availableLists.map((l) => (
                        <button
                          key={l.id}
                          className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs [font-family:'Inter',Helvetica]"
                          onClick={() => addSelectedCreatorsToList(l.id)}
                          disabled={savingToList}
                        >
                          <span>{l.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="h-px bg-[#2c3954] mx-2" />
                  <div className="py-2">
                    <button
                      onClick={handleAddNewListClick}
                      className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs [font-family:'Inter',Helvetica]"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add new list</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="gap-2 inline-flex items-center flex-wrap justify-end ml-auto">
            {/* Total Payout */}
            <div className="inline-flex items-center">
              <span className="[font-family:'Inter',Helvetica] font-normal text-[#F9FAFB] text-sm whitespace-nowrap">
                Total Payout: ${totalPayout.toLocaleString()}
              </span>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <div className="inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-[#31384A] rounded-lg border border-solid border-gray-600 h-8">
                <img className="w-3 h-3" alt="Search" src="/SearchIcon.svg" />
                <input
                  type="text"
                  placeholder="Search influencers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[#F9FAFB] text-[11px] sm:text-xs font-medium [font-family:'Inter',Helvetica] placeholder-[#9CA3AF] border-none outline-none w-32 sm:w-40"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-3 h-3 flex items-center justify-center text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5">
                      <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Select All Influencers */}
            <label htmlFor="select-all-creators-checkbox" className="inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 bg-[#31384A] rounded-lg border border-solid border-gray-600 cursor-pointer hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] transition-colors duration-200 h-8" onClick={onSelectAllCreators}>
              <span className="[font-family:'Inter',Helvetica] font-medium text-[#F9FAFB] text-[11px] sm:text-xs">Select All</span>
              {selectedCreatorIds.size === localCreators.length && localCreators.length > 0 ? (
                <div className="flex items-center justify-center w-3 h-3 bg-[#217EFD] rounded-[2px]">
                  <svg width="8" height="6" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2 h-1.5"><path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              ) : (
                <div className="w-3 h-3 bg-[#4B5563] rounded-[2px] border border-[#6B7280] hover:bg-[#5B6573] transition-colors" />
              )}
            </label>
          </div>
        </div>

        {/* Creator List */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0 border-t-0 custom-scrollbar">
          {modalImportProgress != null && modalImportProgress < 100 ? (
            <div className="w-full h-full flex items-center justify-center py-12">
              <div className="w-full max-w-xl">
                <div className="text-center mb-4">
                  <div className="text-[#F9FAFB] text-base sm:text-lg font-semibold">Uploading your list…</div>
                  <div className="text-[#9CA3AF] text-sm mt-1">We’re importing your influencers. This may take a while, you can come back later.</div>
                </div>
                <div className="w-full bg-[#374151] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${modalImportProgress}%`, background: 'linear-gradient(90deg, #60A5FA, #3B82F6)' }}
                  />
                </div>
                <div className="text-right text-xs text-[#9CA3AF] mt-1">{Math.max(0, Math.min(100, Math.round(modalImportProgress)))}%</div>
              </div>
            </div>
          ) : list.creatorCount > 0 ? (
            <CreatorTable
              creators={filteredAndSortedCreators}
              selectedIds={selectedCreatorIds}
              onToggleSelect={onToggleSelectCreator}
              onRowClick={onCreatorRowClick}
              sortState={sortState}
              onSort={handleSort}
              listId={list?.id?.toString()}
              onPriceUpdate={(creatorId, newPrice) => {
                // Update the creator's price in the local state for immediate UI update
                setLocalCreators(prevCreators => 
                  prevCreators.map(c => 
                    c.id === parseInt(creatorId) ? { ...c, price: newPrice } : c
                  )
                );
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 py-8">
              <div className="text-center">
                <div className="text-lg mb-2">No influencers in this list yet</div>
                <div className="text-sm">Add influencers to see them here</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Influencers Modal */}
      <ImportCreatorsModal
        isOpen={showImportCreatorsModal}
        onClose={() => setShowImportCreatorsModal(false)}
        listId={list?.id?.toString()}
        onImportComplete={(result) => {
          console.log('Import completed:', result);
          
          // Refresh the creator list to show newly imported creators
          if (result.found > 0) {
            // Trigger a refresh of the creator data by calling the parent's refresh function
            // This will update the UI to show the new creators without page reload
            if (props.onImportComplete) {
              props.onImportComplete(result);
            }
          }
          
          // Close the import modal
          setShowImportCreatorsModal(false);
        }}
        onUploadCsv={(file) => {
          // Fallback for when listId is not available
          console.log('CSV selected:', file.name);
          setShowImportCreatorsModal(false);
        }}
        onAddFromDiscover={() => {
          try {
            setShowImportCreatorsModal(false);
            window.location.href = '/dashboard/discover';
          } catch {
            setShowImportCreatorsModal(false);
          }
        }}
      />

      {actionNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#1a1f2e] rounded-[15px] border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-50 mb-4 [font-family:'Inter',Helvetica]">
              Save to List
            </h2>
            <p className="text-gray-300 mb-6 [font-family:'Inter',Helvetica] text-sm">{actionNotice}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeActionNotice}
                className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#1a1f2e] rounded-[15px] border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-50 mb-4 [font-family:'Inter',Helvetica]">
              Create New List
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2 [font-family:'Inter',Helvetica]">
                List Name
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyPress={handleNewListKeyPress}
                placeholder="Enter list name..."
                className="w-full px-3 py-2 bg-[#31384a] border border-gray-600 rounded-lg text-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-500 [font-family:'Inter',Helvetica]"
                autoFocus
              />
              {newListName.trim().length === 0 && (
                <p className="text-xs text-gray-500 mt-1 [font-family:'Inter',Helvetica]">
                  Please enter at least one character
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseNewListModal}
                disabled={savingToList}
                className={`px-4 py-2 rounded-lg border [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  savingToList
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewList}
                disabled={newListName.trim().length === 0 || savingToList}
                className={`px-4 py-2 rounded-lg [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  newListName.trim().length === 0 || savingToList
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {savingToList ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


