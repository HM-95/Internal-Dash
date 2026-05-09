import React, { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Icon } from "@/components/ui/icon-component";
import { DonutChart } from "@/components/ui/donut-chart";
import { ExpandedProfileOverlay } from "@/components/ui/expanded-profile-overlay";
import { formatNumber, formatEngagement, getSocialMediaIcon, getMatchScoreColor } from "@/utils/formatters";
import { ViewMode, SortField, SortDirection, SortState, Creator, CreatorListMode } from "@/types/database";

interface CreatorListSectionProps {
  creatorData: {
    creators: Creator[];
    loading: boolean;
    paginationLoading?: boolean; // NEW: Optional pagination loading state for compatibility
    error: string | null;
    currentMode: CreatorListMode;
    currentPage: number;
    totalPages: number;
    totalCreators: number;
    handlePageChange: (page: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    sortState: SortState;
    handleSort: (field: SortField) => Promise<void>;
    // Allow additional properties from useCreatorData hook
    [key: string]: any;
  };
  userId?: string;
}
import CreatorGridView from "./CreatorGridView";
import CreatorListView from "./CreatorListView";
import PaginationControls from "./PaginationControls";

export const CreatorListSection: React.FC<CreatorListSectionProps> = ({ creatorData, userId }) => {
  const { 
    creators, 
    loading, 
    paginationLoading = false, // NEW: Dedicated pagination loading state with default
    error, 
    currentMode, 
    currentPage, 
    totalPages, 
    totalCreators,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    sortState,
    handleSort
  } = creatorData;

  // State for tracking selected cards
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const saveDropdownRef = useRef<HTMLDivElement>(null);

  // User ID is no longer needed - API endpoints use session authentication
  // Keeping the state for backwards compatibility but it's not used

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowListPicker(false);
        setLoadingLists(false);
      }
      if (
        saveButtonRef.current && 
        !saveButtonRef.current.contains(event.target as Node) &&
        saveDropdownRef.current &&
        !saveDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSaveDropdownOpen(false);
      }
    };

    if (showListPicker || isSaveDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListPicker, isSaveDropdownOpen]);

  // Handle individual card selection
  const handleCardSelection = (creatorId: string) => {
    const newSelectedCards = new Set(selectedCards);
    if (newSelectedCards.has(creatorId)) {
      newSelectedCards.delete(creatorId);
    } else {
      newSelectedCards.add(creatorId);
    }
    setSelectedCards(newSelectedCards);
    
    // Update select all state based on individual selections
    setSelectAll(newSelectedCards.size === creators.length);
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedCards(new Set());
      setSelectAll(false);
    } else {
      // Select all
      const allCreatorIds = new Set(creators.map(creator => creator.id));
      setSelectedCards(allCreatorIds);
      setSelectAll(true);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Handle creator click to open overlay
  const handleCreatorClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsOverlayOpen(true);
  };

  // Handle overlay close
  const handleOverlayClose = () => {
    setIsOverlayOpen(false);
    setSelectedCreator(null);
  };

  // Load lists for dropdown when opened
  const openListPicker = async () => {
    if (selectedCards.size === 0) return;
    setIsSaveDropdownOpen(false);
    
    console.log('Opening list picker, selected cards:', selectedCards.size);
    
    // Show dropdown immediately with loading state
    setShowListPicker(true);
    setLoadingLists(true);
    setAvailableLists([]); // Clear previous lists
    
    // Then load lists in the background
    try {
      // Lazy import to avoid server bundle bloat
      const { listsClient } = await import('@/lib/listsClient');
      console.log('listsClient imported for list loading');
      
      const lists = await listsClient.getLists();
      console.log('Lists loaded:', lists);
      
      setAvailableLists(lists.map(l => ({ id: l.id, name: l.name })));
    } catch (e) {
      console.error('Failed to load lists', e);
      // Keep dropdown open but show error state
      setAvailableLists([]);
    } finally {
      setLoadingLists(false);
    }
  };

  // Add selected creators to talent network
  const addSelectedToNetwork = async () => {
    if (selectedCards.size === 0) return;
    setIsSaveDropdownOpen(false);
    setSaving(true);
    try {
      const creatorIds = Array.from(selectedCards);
      console.log('Adding creators to talent network:', creatorIds);
      
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
      
      setSaveNotice(`${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'} added to talent network`);
      setSelectedCards(new Set());
      setSelectAll(false);
    } catch (e) {
      console.error('Failed to add to talent network', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to add influencers to talent network';
      setSaveNotice(errorMessage);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const addSelectedToList = async (listId: string) => {
    if (!listId || selectedCards.size === 0) {
      setShowListPicker(false);
      return;
    }
    setSaving(true);
    try {
      const creatorIds = Array.from(selectedCards);
      console.log('Adding creators to list:', { listId, creatorIds, selectedCardsSize: selectedCards.size });
      
      const { listsClient } = await import('@/lib/listsClient');
      console.log('listsClient imported successfully');
      
      await listsClient.addCreators(listId, creatorIds);
      console.log('Creators added to list successfully');
      
      setSaveNotice(`${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'} added to list`);
      
      // Clear selection after successful save
      setSelectedCards(new Set());
      setSelectAll(false);
    } catch (e) {
      console.error('Failed to add creators to list', e);
      setSaveNotice('Failed to add influencers to list');
    } finally {
      setSaving(false);
      setShowListPicker(false);
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  // Handle new list creation
  const handleCreateNewList = async () => {
    if (newListName.trim().length === 0) return;
    
    setSaving(true);
    try {
      // Lazy import to avoid server bundle bloat
      const { listsClient } = await import('@/lib/listsClient');
      const created = await listsClient.createList(newListName.trim());
      
      // Immediately add selected creators to the new list
      const creatorIds = Array.from(selectedCards);
      await listsClient.addCreators(created.id, creatorIds);
      
      setSaveNotice(`Successfully created "${newListName}" and saved ${creatorIds.length} creators!`);
      
      // Signal My Lists page to refresh when user navigates there
      localStorage.setItem('pendingListPageReload', 'true');
      
      // Clear selection after successful save
      setSelectedCards(new Set());
      setSelectAll(false);
      
      // Close modal and dropdown
      setNewListName('');
      setShowNewListModal(false);
      setShowListPicker(false);
      
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (e) {
      console.error('Failed to create list and add creators', e);
      setSaveNotice('Failed to create list');
      setTimeout(() => setSaveNotice(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowNewListModal(false);
    setNewListName('');
  };

  // Handle key press in modal
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newListName.trim().length > 0 && !saving) {
      handleCreateNewList();
    }
  };

  // Show skeleton during initial loading OR pagination loading (when no creators to show)
  if ((loading || paginationLoading) && creators.length === 0) {
    return (
      <section className="flex flex-col items-start gap-[5px] p-[15px] lg:p-[20px] xl:p-[25px] bg-section-bg rounded-[12px] flex-1 overflow-hidden shadow-sm">
        <div className="w-full h-[100px] rounded-lg animate-pulse mb-4" style={{ backgroundColor: '#1F2937' }} />
        <div className="flex-1 overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-[12px] lg:gap-[15px] xl:gap-[18px] 2xl:gap-[20px] w-full pb-4">
            {Array(12).fill(0).map((_, index) => (
              <Card key={index} className="w-full rounded-[15px] p-0 border-2 shadow-sm animate-pulse" style={{ borderColor: '#1F2937', backgroundColor: '#0F1419' }}>
                <CardContent className="flex flex-col gap-[8px] lg:gap-[10px] xl:gap-[12px] p-[12px] lg:p-[15px] xl:p-[18px]">
                  <div className="flex w-full items-start justify-between">
                    <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] xl:w-[70px] xl:h-[70px] rounded-full" style={{ backgroundColor: '#374151' }} />
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 rounded" style={{ backgroundColor: '#374151' }} />
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: '#374151' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-full" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded" style={{ backgroundColor: '#374151' }} />
                    <div className="h-6 w-20 rounded" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && creators.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 p-[15px] lg:p-[20px] xl:p-[25px] bg-section-bg rounded-[12px] flex-1 overflow-hidden shadow-sm">
        <div className="text-red-500 text-lg font-medium">Error loading influencers</div>
        <div className="text-gray-600 text-sm dark:text-gray-400">{error}</div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </section>
    );
  }

  // Show skeleton during pagination loading (even when creators exist)
  if (paginationLoading) {
    return (
      <section className="flex flex-col items-start gap-[5px] p-[15px] lg:p-[20px] xl:p-[25px] bg-section-bg rounded-[12px] flex-1 overflow-hidden shadow-sm">
        <div className="w-full h-[100px] rounded-lg animate-pulse mb-4" style={{ backgroundColor: '#1F2937' }} />
        <div className="flex-1 overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-[12px] lg:gap-[15px] xl:gap-[18px] 2xl:gap-[20px] w-full pb-4">
            {Array(12).fill(0).map((_, index) => (
              <Card key={index} className="w-full rounded-[15px] p-0 border-2 shadow-sm animate-pulse" style={{ borderColor: '#1F2937', backgroundColor: '#0F1419' }}>
                <CardContent className="flex flex-col gap-[8px] lg:gap-[10px] xl:gap-[12px] p-[12px] lg:p-[15px] xl:p-[18px]">
                  <div className="flex w-full items-start justify-between">
                    <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] xl:w-[70px] xl:h-[70px] rounded-full" style={{ backgroundColor: '#374151' }} />
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 rounded" style={{ backgroundColor: '#374151' }} />
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: '#374151' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-full" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#374151' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#374151' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-6 rounded" style={{ backgroundColor: '#374151' }} />
                    <div className="flex-1 h-6 rounded" style={{ backgroundColor: '#374151' }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If we're not loading and there are no creators, keep showing the skeleton instead of an empty state
  if (!loading && totalCreators === 0) {
    return (
      <section className="flex flex-col items-start gap-[5px] p-[15px] lg:p-[20px] xl:p-[25px] bg-section-bg rounded-[12px] flex-1 overflow-hidden shadow-sm">
        <div className="w-full h-[100px] rounded-lg animate-pulse mb-4" style={{ backgroundColor: '#1F2937' }} />
        <div className="flex-1 overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-[12px] lg:gap-[15px] xl:gap-[18px] 2xl:gap-[20px] w-full pb-4">
            {Array(12).fill(0).map((_, index) => (
              <Card key={index} className="w-full rounded-[15px] p-0 border-2 shadow-sm animate-pulse" style={{ borderColor: '#1F2937', backgroundColor: '#0F1419' }}>
                <CardContent className="flex flex-col gap-[8px] lg:gap-[10px] xl:gap-[12px] p-[12px] lg:p-[15px] xl:p-[18px]">
                  <div className="flex w-full items-start justify-between">
                    <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] xl:w-[70px] xl:h-[70px] rounded-full" style={{ backgroundColor: '#374151' }} />
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 rounded" style={{ backgroundColor: '#374151' }} />
                      <div className="w-5 h-5 rounded" style={{ backgroundColor: '#374151' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-full" style={{ backgroundColor: '#374151' }} />
                    <div className="h-3 rounded w-2/3" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-16 rounded" style={{ backgroundColor: '#111827' }} />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 rounded" style={{ backgroundColor: '#374151' }} />
                    <div className="h-6 w-20 rounded" style={{ backgroundColor: '#374151' }} />
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                    <div className="flex-1 h-20 rounded" style={{ backgroundColor: '#111827' }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-start gap-[5px] pt-0 pb-[15px] lg:pt-0 lg:pb-[20px] xl:pt-0 xl:pb-[25px] px-0 bg-section-bg rounded-[12px] flex-1 shadow-sm">
      {/* Background overlay wrapping controls + content */}
      <div className="w-full rounded-[16px] bg-[#0C1116] p-[12px] sm:p-[14px] lg:p-[18px] xl:p-[20px]">
        {/* Header with controls */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between w-full flex-shrink-0 mb-[12px] gap-3 sm:gap-4 xl:gap-6 min-w-0">
          {/* Left side - View mode toggle */}
          <div className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] min-w-0 overflow-hidden">
            <div className="inline-flex items-center h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] border border-solid border-[#1F2937] bg-[#0F1419] flex-shrink-0 min-w-0 overflow-hidden">
              <button
                onClick={() => handleViewModeChange('cards')}
                className={`inline-flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-full min-w-0 flex-shrink-0 transition-colors duration-200 text-[11px] lg:text-[12px] xl:text-[13px] font-medium ${
                  viewMode === 'cards' 
                    ? 'bg-[#1F2937] text-[#D1D5DB]'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#111827]'
                }`}
                >
                  <Icon
                    name={viewMode === 'cards' ? "CardsModeIcon.svg" : "CardsModeIconUnselected.svg"}
                  className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] xl:w-[12px] xl:h-[12px] flex-shrink-0"
                    alt="Cards mode icon"
                  />
                <span className="font-medium hidden sm:inline">Cards</span>
              </button>
              
              <div className="w-px h-[16px] sm:h-[20px] lg:h-[24px] xl:h-[28px] bg-[#1F2937] flex-shrink-0"></div>
              
              <button
                onClick={() => handleViewModeChange('list')}
                className={`inline-flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-full min-w-0 flex-shrink-0 transition-colors duration-200 text-[11px] lg:text-[12px] xl:text-[13px] font-medium ${
                  viewMode === 'list' 
                    ? 'bg-[#1F2937] text-[#D1D5DB]'
                    : 'bg-transparent text-[#9CA3AF] hover:bg-[#111827]'
                }`}
                >
                  <Icon
                    name={viewMode === 'list' ? "ListIconSelected.svg" : "ListIcon.svg"}
                  className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] xl:w-[12px] xl:h-[12px] flex-shrink-0"
                    alt="List mode icon"
                  />
                <span className="font-medium hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Right side - Save and Select All buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] w-full sm:w-auto min-w-0 relative">
            <div className="relative">
              <button
                ref={saveButtonRef}
                onClick={() => {
                  if (selectedCards.size > 0) {
                    setIsSaveDropdownOpen(!isSaveDropdownOpen);
                  }
                }}
                disabled={selectedCards.size === 0}
                className={`h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] text-[11px] lg:text-[12px] xl:text-[13px] font-medium w-full sm:w-auto transition-colors duration-200 border ${
                  selectedCards.size > 0
                    ? 'bg-[#1f2937] border-[#374151] text-[#f9fafb] hover:bg-[#2a3441] cursor-pointer'
                    : 'bg-[#0f1419] border-[#1f2937] text-[#4b5563] cursor-not-allowed'
                }`}
              >
                <Icon
                  name="SavedListIcon.svg"
                  className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] xl:w-[12px] xl:h-[12px] flex-shrink-0"
                  alt="Save icon"
                />
                <span className="font-medium truncate min-w-0">
                  Save
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isSaveDropdownOpen ? 'rotate-180' : ''
                  } ${selectedCards.size === 0 ? 'text-[#4b5563]' : 'text-[#f9fafb]'}`}
                />
              </button>

              {/* Save Dropdown */}
              {isSaveDropdownOpen && (
                <div
                  ref={saveDropdownRef}
                  className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-44 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999]"
                >
                  <button
                    onClick={openListPicker}
                    className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors"
                  >
                    In a list
                  </button>
                  <div className="h-px bg-[#2c3954]" />
                  <button
                    onClick={addSelectedToNetwork}
                    className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors"
                  >
                    To network
                  </button>
                </div>
              )}
              
              {/* List picker dropdown positioned relative to button */}
              {showListPicker && (
                <div ref={dropdownRef} className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-[#111827] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[9999]">
                  {/* Header */}
                  <div className="px-3 py-2">
                    <h3 className="text-sm font-semibold text-[#F9FAFB] font-['Plus_Jakarta_Sans',Helvetica]">Save to list</h3>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-[#2c3954] mx-2" />
                  
                  {/* Lists */}
                  <div className="py-2 max-h-48 overflow-y-auto">
                    {loadingLists ? (
                      <div className="px-3 py-2 text-xs text-[#99a0ad] flex items-center gap-2 font-['Plus_Jakarta_Sans',Helvetica]">
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading lists...
                      </div>
                    ) : availableLists.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-[#99a0ad] font-['Plus_Jakarta_Sans',Helvetica]">No lists found</div>
                    ) : (
                      availableLists.map(l => (
                        <button 
                          key={l.id} 
                          className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]" 
                          onClick={() => addSelectedToList(l.id)} 
                          disabled={saving}
                        >
                          <span>{l.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-[#2c3954] mx-2" />
                  
                  {/* Add new list */}
                  <div className="py-2">
                    <button 
                      onClick={() => setShowNewListModal(true)}
                      className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add new list</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

              <Button
                onClick={handleSelectAll}
                variant="outline"
              className="h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] text-[11px] lg:text-[12px] xl:text-[13px] font-medium w-full sm:w-auto"
                style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
              >
                <span className="font-medium text-gray-200 truncate min-w-0">
                  Select All
                </span>
              <div 
                className={`w-[14px] h-[14px] lg:w-[16px] lg:h-[16px] xl:w-[18px] xl:h-[18px] border-2 rounded-[3px] flex items-center justify-center transition-colors ${
                  selectAll 
                    ? 'bg-blue-600 border-[#2463eb]' 
                    : 'bg-[#0F1419] border-[#4B5563]'
                }`}
              >
                {selectAll && (
                  <svg 
                    className="w-[8px] h-[8px] lg:w-[9px] lg:h-[9px] xl:w-[10px] xl:h-[10px] text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
              </Button>
          </div>
        </header>

        <div className="w-full flex-shrink-0 mb-[12px]">
          <Separator className="w-full h-px bg-[#1F2937]" />
        </div>

        {/* Dynamic Creator content - Cards or List */}
        <div className="flex-1 overflow-y-auto w-full">
          {viewMode === 'cards' ? (
            <CreatorGridView
              creators={creators}
              currentMode={currentMode}
              selectedCards={selectedCards}
              handleCreatorClick={handleCreatorClick}
              handleCardSelection={handleCardSelection}
              selectedCreator={selectedCreator}
            />
          ) : (
            <CreatorListView
              creators={creators}
              currentMode={currentMode}
              selectedCards={selectedCards}
              handleCreatorClick={handleCreatorClick}
              handleCardSelection={handleCardSelection}
              selectedCreator={selectedCreator}
              sortState={sortState}
              handleSort={handleSort}
            />
          )}
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCreators}
          itemsPerPage={itemsPerPage}
          handlePageChange={handlePageChange}
          handleItemsPerPageChange={handleItemsPerPageChange}
          previousPage={previousPage}
          nextPage={nextPage}
          goToFirstPage={goToFirstPage}
          goToLastPage={goToLastPage}
        />
      </div>



      {/* Save notice modal (like list delete pop up style) */}
      {saveNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#1a1f2e] rounded-[15px] border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-50 mb-4">Save to List</h2>
            <p className="text-gray-300 mb-6 text-sm">{saveNotice}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSaveNotice(null)} className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 font-medium text-sm transition-colors duration-200">Okay</button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Profile Overlay */}
      {selectedCreator && (
        <ExpandedProfileOverlay
          creator={selectedCreator}
          isOpen={isOverlayOpen}
          onClose={handleOverlayClose}
          currentMode={creatorData.currentMode}
        />
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                onKeyPress={handleKeyPress}
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
                onClick={handleCloseModal}
                disabled={saving}
                className={`px-4 py-2 rounded-lg border [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  saving 
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewList}
                disabled={newListName.trim().length === 0 || saving}
                className={`px-4 py-2 rounded-lg [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  newListName.trim().length === 0 || saving
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {saving ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CreatorListSection;