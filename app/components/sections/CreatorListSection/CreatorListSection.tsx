import React, { useState } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { Separator } from "../../ui/separator";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../ui/toggle-group";
import { Icon } from "../../ui/icon-component";
import { DonutChart } from "../../ui/donut-chart";
import { ExpandedProfileOverlay } from "../../ui/expanded-profile-overlay";
import { formatNumber, formatEngagement, getSocialMediaIcon, getMatchScoreColor } from "../../../utils/formatters";
import { ViewMode, SortField, SortDirection, SortState, Creator, CreatorListMode } from "../../../types/database";

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
}
import CreatorGridView from "./CreatorGridView";
import PaginationControls from "./PaginationControls";

export const CreatorListSection: React.FC<CreatorListSectionProps> = ({ creatorData }) => {
    const { 
    creators, 
    loading, 
    paginationLoading = false, // NEW: Dedicated pagination loading state with default
    error, 
    currentMode,
    currentPage, 
    totalPages, 
    totalCreators,
    handlePageChange,
    nextPage,
    previousPage,
    sortState,
    handleSort
  } = creatorData;

  // State for tracking selected cards
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

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



  // Show skeleton during initial loading OR pagination loading
  if (loading || paginationLoading) {
    return (
      <section className="flex flex-col items-start gap-[5px] p-[15px] lg:p-[20px] xl:p-[25px] bg-gray-800 rounded-[12px] flex-1 overflow-hidden shadow-sm border border-gray-700">
        <div className="w-full h-[100px] bg-gray-700 rounded-lg animate-pulse mb-4" />
        <div className="flex-1 overflow-y-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-[12px] lg:gap-[15px] xl:gap-[18px] 2xl:gap-[20px] w-full pb-4">
            {Array(12).fill(0).map((_, index) => (
              <Card key={index} className="w-full rounded-[15px] p-0 border-2 border-gray-700 shadow-sm animate-pulse bg-gray-800">
                <CardContent className="flex flex-col gap-[8px] lg:gap-[10px] xl:gap-[12px] p-[12px] lg:p-[15px] xl:p-[18px]">
                  <div className="flex w-full items-start justify-between">
                    <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] xl:w-[70px] xl:h-[70px] bg-gray-600 rounded-full" />
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-6 bg-gray-600 rounded" />
                      <div className="w-5 h-5 bg-gray-600 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-600 rounded w-full" />
                    <div className="h-3 bg-gray-600 rounded w-2/3" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 bg-gray-600 rounded" />
                    <div className="flex-1 h-16 bg-gray-600 rounded" />
                    <div className="flex-1 h-16 bg-gray-600 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-600 rounded" />
                    <div className="h-6 w-20 bg-gray-600 rounded" />
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 h-20 bg-gray-600 rounded" />
                    <div className="flex-1 h-20 bg-gray-600 rounded" />
                    <div className="flex-1 h-20 bg-gray-600 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 p-[15px] lg:p-[20px] xl:p-[25px] bg-gray-800 rounded-[12px] flex-1 overflow-hidden shadow-sm border border-gray-700">
        <div className="text-red-400 text-lg font-medium">Error loading influencers</div>
        <div className="text-gray-400 text-sm">{error}</div>
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
          Try Again
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-start gap-[5px] p-[15px] lg:p-[20px] xl:p-[25px] rounded-[12px] flex-1 overflow-hidden shadow-sm border border-gray-700" style={{ backgroundColor: '#0F1419' }}>
      {/* Header with controls */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between w-full flex-shrink-0 mb-[10px] gap-3 sm:gap-4 xl:gap-6 min-w-0 overflow-hidden">
        {/* Left side - View mode toggle */}
        <div className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] min-w-0 overflow-hidden">
          <div className="inline-flex items-center h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] border border-solid flex-shrink-0 min-w-0 overflow-hidden border-gray-600 bg-gray-700">
            <button
              onClick={() => handleViewModeChange('cards')}
              className={`inline-flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-full min-w-0 flex-shrink-0 transition-colors duration-200 text-[11px] lg:text-[12px] xl:text-[13px] font-medium`}
              style={{
                backgroundColor: viewMode === 'cards' ? '#374151' : 'transparent',
                color: viewMode === 'cards' ? '#f9fafb' : '#6b7280',
                background: viewMode === 'cards' ? '#374151 !important' : 'transparent !important'
              }}
              >
                <Icon
                  name={viewMode === 'cards' ? "CardsModeIcon.svg" : "CardsModeIconUnselected.svg"}
                className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] xl:w-[12px] xl:h-[12px] flex-shrink-0"
                  alt="Cards mode icon"
                />
              <span className="font-medium hidden sm:inline">Cards</span>
            </button>
            
            <div className="w-px h-[16px] sm:h-[20px] lg:h-[24px] xl:h-[28px] flex-shrink-0 bg-gray-600"></div>
            
            <button
              onClick={() => handleViewModeChange('list')}
              className={`inline-flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] h-full min-w-0 flex-shrink-0 transition-colors duration-200 text-[11px] lg:text-[12px] xl:text-[13px] font-medium`}
              style={{
                backgroundColor: viewMode === 'list' ? '#374151' : 'transparent',
                color: viewMode === 'list' ? '#f9fafb' : '#6b7280',
                background: viewMode === 'list' ? '#374151 !important' : 'transparent !important'
              }}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] w-full sm:w-auto min-w-0 overflow-hidden">
          <Button
            variant="outline"
            className="h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] text-[11px] lg:text-[12px] xl:text-[13px] font-medium w-full sm:w-auto"
            style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
          >
            <Icon
              name="SavedListIcon.svg"
              className="w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] xl:w-[12px] xl:h-[12px] flex-shrink-0"
              alt="Save in list icon"
            />
            <span className="font-medium text-[#f9fafb] truncate min-w-0">
              Save in a list
            </span>
          </Button>

            <Button
              onClick={handleSelectAll}
              variant="outline"
            className="h-[28px] lg:h-[32px] xl:h-[36px] rounded-[8px] flex items-center justify-center gap-[4px] lg:gap-[6px] xl:gap-[8px] px-[6px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[6px] xl:py-[8px] text-[11px] lg:text-[12px] xl:text-[13px] font-medium w-full sm:w-auto"
            style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb' }}
            >
              <span className="font-medium text-[#f9fafb] truncate min-w-0">
                Select All
              </span>
            <div 
              className={`w-[12px] h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px] border-2 rounded-[3px] flex items-center justify-center transition-colors ${
                selectAll 
                  ? 'bg-blue-600 border-[#2463eb]' 
                  : 'bg-[#374151] border-[#4b5563]'
              }`}
            >
              {selectAll && (
                <svg 
                  className="w-[1px] h-[1px] lg:w-[2px] lg:h-[2px] xl:w-[3px] xl:h-[3px] text-white" 
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

      <div className="w-full flex-shrink-0 mb-[15px]">
        <Separator className="w-full h-px bg-[#f1f4f9] dark:bg-gray-600" />
      </div>

      {/* Dynamic Creator content - Cards or List */}
      <div className="flex-1 overflow-y-auto w-full">
        {totalCreators === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-500 text-lg font-medium mb-2 dark:text-gray-400">No influencers found</div>
            <div className="text-gray-400 text-sm dark:text-gray-500">Try adjusting your filters to see more results</div>
          </div>
        ) : viewMode === 'cards' ? (
          <CreatorGridView
            creators={creators}
            currentMode={currentMode}
            selectedCards={selectedCards}
            handleCreatorClick={handleCreatorClick}
            handleCardSelection={handleCardSelection}
            selectedCreator={selectedCreator}
          />
        ) : (
          <div className="p-4 rounded-lg border border-gray-700 bg-[#0f1419] text-gray-300">
            The Discover page list view is temporarily disabled while we integrate the finalized list experience. Use the Cards view here, or check the AI Chat where the tabular list is integrated with creator suggestions.
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        previousPage={previousPage}
        nextPage={nextPage}
      />

      {/* Expanded Profile Overlay */}
      {selectedCreator && (
        <ExpandedProfileOverlay
          creator={selectedCreator}
          isOpen={isOverlayOpen}
          onClose={handleOverlayClose}
          currentMode={creatorData.currentMode}
        />
      )}
    </section>
  );
};