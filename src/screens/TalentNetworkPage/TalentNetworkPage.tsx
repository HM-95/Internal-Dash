"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "../../components/ui/button";
import { ExpandedProfileOverlay, OverlayCreator } from "../../components/ui/expanded-profile-overlay.lists";
import { ConfirmDialog } from "../../features/lists/modals/ConfirmDialog";
import { ImportCreatorsModal } from "../../features/lists/modals/ImportCreatorsModal";
import { mapCreatorToOverlay } from "../../features/lists/utils";
import { Card, CardContent } from "../../components/ui/card";
import { TalentNetworkCreatorTable } from "../../features/talent-network/TalentNetworkCreatorTable/TalentNetworkCreatorTable";
import { ChevronDown, Plus } from "lucide-react";
import { listsClient } from "@/lib/listsClient";
import { parseCreatorCSV, readFileAsText } from "../../utils/csvParser";
import { ImportService, type ImportProgress } from "../../services/importService";
import PaginationControls from "../../../app/dashboard/discover/CreatorListSection/PaginationControls";

type SortField = 'followers' | 'avg_views' | 'engagement' | 'price';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export const TalentNetworkPage = (): JSX.Element => {
  // Creator data state
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showImportCreatorsModal, setShowImportCreatorsModal] = useState(false);
  const [showRemoveCreatorsConfirmationModal, setShowRemoveCreatorsConfirmationModal] = useState(false);
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  const [overlayCreator, setOverlayCreator] = useState<OverlayCreator | null>(null);
  
  // Creator selection state
  const [selectedCreators, setSelectedCreators] = useState<Set<number>>(new Set());
  
  // Action dropdown state
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);
  
  // List picker state (for "Add to list" action)
  const [showListPicker, setShowListPicker] = useState(false);
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [savingToList, setSavingToList] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sorting state
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: 'desc'
  });

  // Import progress state
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [totalPages, setTotalPages] = useState(1);

  // CSV Export helpers
  function toCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    let text = String(value).replace(/\r?\n|\r/g, ' ');
    // Prevent CSV formula injection when opened in spreadsheet apps
    if (/^[=+\-@]/.test(text)) {
      text = "'" + text;
    }
    if (text.includes(',') || text.includes('"')) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function sanitizeFileName(name: string, fallback: string = 'talent-network'): string {
    const base = (name || fallback).trim();
    // Remove path separators and control chars; allow alnum, space, dash, underscore, dot, parentheses
    let safe = base.replace(/[^a-zA-Z0-9 _\-\.()]/g, '');
    // Collapse spaces
    safe = safe.replace(/\s+/g, ' ').trim();
    // Avoid dotfiles or empty
    if (!safe || safe === '.' || safe === '..') safe = fallback;
    // Limit length
    if (safe.length > 80) safe = safe.slice(0, 80);
    return safe;
  }

  function downloadCsv(filename: string, rows: string[][]) {
    const csv = rows.map(r => r.map(toCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function mapCreatorToCsvRow(c: any): string[] {
    const hashtags = Array.isArray(c.hashtags)
      ? c.hashtags.map((h: string) => String(h).replace(/^#/, '')).join('; ')
      : '';
    const username = c.username ?? (typeof c.handle === 'string' ? String(c.handle).replace(/^@+/, '') : '');
    
    // Extract niches
    const primaryNiche = c.primary_niche ?? c.niche ?? '';
    const secondaryNiche = c.secondary_niche ?? '';
    
    // Format price with $
    const price = c.price != null ? `$${c.price}` : 'N/A';
    
    // Extract social media URLs
    const socialMedia = Array.isArray(c.social_media)
      ? c.social_media.map((s: any) => s.url).filter(Boolean).join('; ')
      : '';
    
    // Extract average likes and comments properly
    const extractAverageLikes = (averageLikesData: any): number => {
      if (averageLikesData === null || averageLikesData === undefined) return 0;
      if (typeof averageLikesData === 'number') return averageLikesData;
      if (typeof averageLikesData === 'object' && averageLikesData.average_likes !== undefined) {
        return averageLikesData.average_likes;
      }
      return averageLikesData || 0;
    };
    
    const extractAverageComments = (averageCommentsData: any): number => {
      if (averageCommentsData === null || averageCommentsData === undefined) return 0;
      if (typeof averageCommentsData === 'number') return averageCommentsData;
      if (typeof averageCommentsData === 'object' && averageCommentsData.average_comments !== undefined) {
        return averageCommentsData.average_comments;
      }
      return averageCommentsData || 0;
    };
    
    const avgLikes = c.avg_likes ?? extractAverageLikes(c.average_likes);
    const avgComments = c.avg_comments ?? extractAverageComments(c.average_comments);
    
    return [
      c.display_name ?? c.username ?? '',
      username,
      c.platform ?? '',
      socialMedia || (c.profile_url ?? ''),
      c.email ?? '',
      c.location ?? '',
      primaryNiche,
      secondaryNiche,
      String(c.followers_count ?? ''),
      String(c.average_views ?? ''),
      String(c.engagement_rate ?? c.engagement ?? ''),
      String(avgLikes || ''),
      String(avgComments || ''),
      String(c.buzz_score ?? ''),
      hashtags,
      price,
      c.status ?? 'No reply',
      c.channel ?? '',
      c.note ?? '',
      c.what_do_you_post ?? '',
    ];
  }

  function handleExportSelected() {
    // Get selected creator IDs
    const selectedIds = Array.from(selectedCreators);
    if (selectedIds.length === 0) return;

    // Filter creators to only include selected ones
    const selectedCreatorsList = creators.filter(c => selectedIds.includes(c.id));
    if (selectedCreatorsList.length === 0) return;

    // Normalize creators
    const normalized = selectedCreatorsList.map((c: any) => {
      const overlay = mapCreatorToOverlay(c);
      return {
        ...c,
        username: c.username ?? String(c.handle ?? overlay.username_tag ?? '').replace(/^@+/, ''),
        hashtags: overlay.hashtags ?? [],
        social_media: overlay.social_media ?? [],
      };
    });

    // Create CSV header with talent network specific fields
    const header = [
      'Display Name',
      'Username',
      'Platform',
      'Profile Links',
      'Email',
      'Location',
      'Primary Niche',
      'Secondary Niche',
      'Followers',
      'Average Views',
      'Engagement',
      'Average Likes',
      'Average Comments',
      'Buzz Score',
      'Hashtags',
      'Price',
      'Status',
      'Channel',
      'Note',
      'What Do You Post'
    ];

    const rows = [header, ...normalized.map(mapCreatorToCsvRow)];
    const filename = `${sanitizeFileName('talent-network')}.csv`;
    downloadCsv(filename, rows);
  }

  // Fetch creators from talent network
  const fetchCreators = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/talent-network?action=getCreators', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch creators');
      const data = await response.json();
      setCreators(data || []);
    } catch (error) {
      console.error('Failed to fetch talent network creators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionButtonRef.current && 
        !actionButtonRef.current.contains(event.target as Node) &&
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsActionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle creator selection
  const handleToggleSelect = (id: number) => {
    setSelectedCreators(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedCreators.size === filteredAndSortedCreators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(filteredAndSortedCreators.map(c => c.id)));
    }
  };

  // Handle row click (open expanded profile)
  const handleCreatorRowClick = (creator: any) => {
    const overlayData = mapCreatorToOverlay(creator);
    setOverlayCreator(overlayData);
    setIsProfileOverlayOpen(true);
  };

  // Handle price update
  const handlePriceUpdate = async (creatorId: string, newPrice: number | null) => {
    try {
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updatePrice', creatorId, price: newPrice }),
      });
      if (!response.ok) throw new Error('Failed to update price');
      
      // Update local state
      setCreators(prev => prev.map(c => 
        c.id === Number(creatorId) ? { ...c, price: newPrice } : c
      ));
    } catch (error) {
      console.error('Failed to update price:', error);
      throw error;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (creatorId: string, status: string) => {
    try {
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updateStatus', creatorId, status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      // Update local state
      setCreators(prev => prev.map(c => 
        c.id === Number(creatorId) ? { ...c, status } : c
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  // Handle channel update
  const handleChannelUpdate = async (creatorId: string, channel: string | null) => {
    try {
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updateChannel', creatorId, channel }),
      });
      if (!response.ok) throw new Error('Failed to update channel');
      
      // Update local state
      setCreators(prev => prev.map(c => 
        c.id === Number(creatorId) ? { ...c, channel } : c
      ));
    } catch (error) {
      console.error('Failed to update channel:', error);
      throw error;
    }
  };

  // Handle what do you post update
  const handleWhatDoYouPostUpdate = async (creatorId: string, whatDoYouPost: string | null) => {
    try {
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updateWhatDoYouPost', creatorId, whatDoYouPost }),
      });
      if (!response.ok) throw new Error('Failed to update what do you post');
      
      // Update local state
      setCreators(prev => prev.map(c => 
        c.id === Number(creatorId) ? { ...c, what_do_you_post: whatDoYouPost } : c
      ));
      
      // Update overlay creator if it's the same one
      if (overlayCreator && String(overlayCreator.creator_id) === String(creatorId)) {
        setOverlayCreator({ ...overlayCreator, what_do_you_post: whatDoYouPost });
      }
    } catch (error) {
      console.error('Failed to update what do you post:', error);
      throw error;
    }
  };

  // Handle note update
  const handleNoteUpdate = async (creatorId: string, note: string | null) => {
    try {
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'updateNote', creatorId, note }),
      });
      if (!response.ok) throw new Error('Failed to update note');
      
      // Update local state
      setCreators(prev => prev.map(c => 
        c.id === Number(creatorId) ? { ...c, note } : c
      ));
      
      // Update overlay creator if it's the same one
      if (overlayCreator && String(overlayCreator.creator_id) === String(creatorId)) {
        setOverlayCreator({ ...overlayCreator, note });
      }
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filter and sort creators
  const filteredAndSortedCreators = useMemo(() => {
    let filtered = creators;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = creators.filter(creator => 
        (creator.display_name || '').toLowerCase().includes(query) ||
        (creator.handle || '').toLowerCase().includes(query) ||
        (creator.username || '').toLowerCase().includes(query)
      );
    }

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
          aValue = a.price ?? -1;
          bValue = b.price ?? -1;
          break;
        default:
          return 0;
      }

      return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [creators, sortState, searchQuery]);

  // Pagination calculations
  const paginatedCreators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCreators.slice(startIndex, endIndex);
  }, [filteredAndSortedCreators, currentPage, itemsPerPage]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredAndSortedCreators.length / itemsPerPage));
    setTotalPages(total);
    if (currentPage > total) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedCreators.length, itemsPerPage, currentPage]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Handle remove creators
  const handleRemoveSelectedCreators = () => {
    if (selectedCreators.size === 0) return;
    setShowRemoveCreatorsConfirmationModal(true);
  };

  const handleConfirmRemoveCreators = async () => {
    try {
      const creatorIds = Array.from(selectedCreators).map(id => String(id));
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'removeCreators', creatorIds }),
      });
      if (!response.ok) throw new Error('Failed to remove creators');
      
      setCreators(prev => prev.filter(c => !selectedCreators.has(c.id)));
      setSelectedCreators(new Set());
      setShowRemoveCreatorsConfirmationModal(false);
    } catch (error) {
      console.error('Failed to remove creators:', error);
      setShowRemoveCreatorsConfirmationModal(false);
    }
  };

  const handleCancelRemoveCreators = () => {
    setShowRemoveCreatorsConfirmationModal(false);
  };

  // Handle action dropdown
  const toggleActionDropdown = () => {
    setIsActionDropdownOpen(!isActionDropdownOpen);
  };

  // Handle "Add to list" action
  const openSaveToListMenu = async () => {
    if (selectedCreators.size === 0) return;
    setIsActionDropdownOpen(false);
    setShowListPicker(true);
    try {
      const lists = await listsClient.getLists();
      setAvailableLists(lists || []);
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  };

  const addSelectedCreatorsToList = async (listId: string) => {
    if (!listId || selectedCreators.size === 0) {
      setShowListPicker(false);
      return;
    }
    setSavingToList(true);
    try {
      const creatorIds = Array.from(selectedCreators).map((id) => String(id));
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

  const handleCreateNewList = async () => {
    if (newListName.trim().length === 0 || selectedCreators.size === 0) return;
    setSavingToList(true);
    try {
      const created = await listsClient.createList(newListName.trim());
      const creatorIds = Array.from(selectedCreators).map((id) => String(id));
      await listsClient.addCreators(created.id, creatorIds);
      setActionNotice(`Created "${newListName.trim()}" and added ${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'}.`);
      setShowNewListModal(false);
      setNewListName('');
      setShowListPicker(false);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (error) {
      console.error('Failed to create list', error);
      setActionNotice('Failed to create list');
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSavingToList(false);
    }
  };

  // Handle CSV import with progress tracking
  const handleImportCsv = async (file: File) => {
    try {
      setImportProgress(null);
      setShowImportCreatorsModal(false);

      // Parse CSV file
      const csvContent = await readFileAsText(file);
      const parseResult = parseCreatorCSV(csvContent);
      
      if (!parseResult.success || parseResult.data.length === 0) {
        console.error('CSV parsing failed:', parseResult.errors);
        return;
      }

      // Update progress: parsing complete
      setImportProgress({
        phase: 'matching',
        message: 'Matching creators with database...',
        progress: 30,
        details: {
          totalCreators: parseResult.data.length,
          foundCreators: 0,
          scrapingCreators: 0,
          completedScraping: 0,
          errors: parseResult.errors
        }
      });

      // Send parsed creators to API for matching and adding to talent network
      const response = await fetch('/api/talent-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'importFromCSV', 
          creators: parseResult.data 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import creators');
      }

      const result = await response.json();
      console.log('Import result:', result);

      // Update progress: completed
      setImportProgress({
        phase: 'completed',
        message: `Import completed! Added ${result.matched} creator${result.matched !== 1 ? 's' : ''} to your talent network.`,
        progress: 100,
        details: {
          totalCreators: parseResult.data.length,
          foundCreators: result.matched,
          scrapingCreators: 0,
          completedScraping: 0,
          errors: result.errors || []
        }
      });

      // Wait a moment to show completion, then reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to import CSV:', error);
      setImportProgress({
        phase: 'error',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 0,
        details: {
          totalCreators: 0,
          foundCreators: 0,
          scrapingCreators: 0,
          completedScraping: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
    }
  };

  return (
    <>
      {/* Expanded Profile Overlay */}
      {overlayCreator && (
        <ExpandedProfileOverlay
          isOpen={isProfileOverlayOpen}
          creator={overlayCreator}
          onClose={() => setIsProfileOverlayOpen(false)}
          currentMode="talent-network"
          onPriceUpdate={handlePriceUpdate}
          onStatusUpdate={handleStatusUpdate}
          onChannelUpdate={handleChannelUpdate}
          onWhatDoYouPostUpdate={handleWhatDoYouPostUpdate}
          onNoteUpdate={handleNoteUpdate}
        />
      )}
      
      <main className="flex flex-col h-screen bg-black w-full p-3 lg:p-4 overflow-y-auto custom-scrollbar">
        <section className="flex flex-col w-full flex-1">
          <header className="inline-flex items-center gap-2 relative flex-[0_0_auto] mb-3 lg:mb-4">
            <h1 className="relative [font-family:'Inter',Helvetica] font-bold text-gray-50 text-xl lg:text-2xl tracking-[0] leading-[28px] lg:leading-[32px]">
              Talent Network
            </h1>
          </header>

          <Card className="w-full bg-[#0f1419] rounded-[12px] border-none flex-1 flex flex-col">
            <CardContent className="p-3 lg:p-4 flex-1 flex flex-col">
              <div className="flex flex-col items-start gap-3 lg:gap-4 relative self-stretch w-full flex-1">
                {/* Action Buttons */}
                <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                  <div className="gap-2 inline-flex items-center flex-wrap">
                    <Button
                      variant="outline"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border-gray-600 h-8 text-xs hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200"
                      onClick={() => setShowImportCreatorsModal(true)}
                    >
                      <img
                        className="w-3 h-3"
                        alt="Import icon"
                        src="/ImportIcon.svg"
                      />
                      <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50">
                        Add/Import Influencers
                      </span>
                    </Button>

                    {/* Action Dropdown */}
                    <div className="relative">
                      <button
                        ref={actionButtonRef}
                        onClick={toggleActionDropdown}
                        disabled={selectedCreators.size === 0}
                        className={`inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg h-8 text-[11px] sm:text-xs transition-colors duration-200 border border-solid ${
                          selectedCreators.size > 0
                            ? 'bg-[#31384A] border-gray-600 text-[#F9FAFB] hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] cursor-pointer'
                            : 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="[font-family:'Inter',Helvetica] font-medium">Action</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${
                            isActionDropdownOpen ? 'rotate-180' : ''
                          } ${selectedCreators.size === 0 ? 'text-gray-500' : 'text-[#F9FAFB]'}`}
                        />
                      </button>

                      {isActionDropdownOpen && (
                        <div
                          ref={actionDropdownRef}
                          className="absolute top-full left-0 mt-2 w-44 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999]"
                        >
                          <button
                            onClick={handleRemoveSelectedCreators}
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
                        </div>
                      )}

                      {/* List Picker */}
                      {showListPicker && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[10000]">
                          <div className="max-h-60 overflow-y-auto">
                            {availableLists.length > 0 ? (
                              availableLists.map((list) => (
                                <button
                                  key={list.id}
                                  onClick={() => addSelectedCreatorsToList(list.id)}
                                  disabled={savingToList}
                                  className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors disabled:opacity-50"
                                >
                                  {list.name}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-gray-400">No lists available</div>
                            )}
                          </div>
                          <div className="h-px bg-[#2c3954]" />
                          <button
                            onClick={() => {
                              setShowListPicker(false);
                              setShowNewListModal(true);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#F9FAFB] hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            Create new list
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={handleExportSelected}
                      disabled={selectedCreators.size === 0}
                      className={`inline-flex items-center justify-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg h-8 text-[11px] sm:text-xs transition-colors duration-200 border border-solid ${
                        selectedCreators.size > 0
                          ? 'bg-[#31384A] border-gray-600 text-[#F9FAFB] hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] cursor-pointer'
                          : 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <img 
                        className={`w-3 h-3 ${selectedCreators.size === 0 ? 'opacity-50' : ''}`} 
                        alt="Export" 
                        src="/ExportIcon.svg" 
                      />
                      <span className="[font-family:'Inter',Helvetica] font-medium">Export</span>
                    </button>
                  </div>

                  {/* Search Bar and Select All - Right aligned */}
                  <div className="gap-2 inline-flex items-center flex-wrap">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search Influencers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-2 bg-[#31384A] border border-gray-600 rounded-lg text-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-xs sm:text-sm w-48 sm:w-64 h-8"
                      />
                    </div>

                    {/* Select All */}
                    <label
                      htmlFor="select-all-checkbox"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200 h-8"
                      onClick={handleSelectAll}
                    >
                      <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs">
                        Select All
                      </span>
                      {creators.length > 0 && selectedCreators.size === filteredAndSortedCreators.length ? (
                        <div className="flex items-center justify-center w-3 h-3 bg-[#217EFD] rounded-[2px]">
                          <svg 
                            width="8" 
                            height="6" 
                            viewBox="0 0 12 9" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-2 h-1.5"
                          >
                            <path 
                              d="M1 4.5L4.5 8L11 1.5" 
                              stroke="white" 
                              strokeWidth="1.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-3 h-3 bg-[#4B5563] rounded-[2px] border border-[#6B7280] hover:bg-[#5B6573] transition-colors" />
                      )}
                    </label>
                  </div>
                </div>

                {/* Import Progress Bar */}
                {importProgress && (
                  <div className="w-full bg-[#111827] border border-gray-700 rounded-lg p-4">
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
                        <p>Total: {importProgress.details.totalCreators} | Found: {importProgress.details.foundCreators}</p>
                        {importProgress.details.errors.length > 0 && (
                          <p className="text-yellow-400 mt-1">Warnings: {importProgress.details.errors.length}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Creator List */}
                <div className="flex flex-col items-start gap-3 lg:gap-4 w-full flex-1 min-h-[400px] relative">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64 w-full text-gray-400">
                      <div className="text-center">
                        <div className="text-lg mb-2">Loading...</div>
                      </div>
                    </div>
                  ) : paginatedCreators.length === 0 ? (
                    <div className="flex items-center justify-center h-64 w-full text-gray-400">
                      <div className="text-center">
                        <div className="text-lg mb-2">No creators in talent network yet</div>
                        <div className="text-sm text-gray-500">Add creators to see them here</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <TalentNetworkCreatorTable
                        creators={paginatedCreators}
                        selectedIds={selectedCreators}
                        onToggleSelect={handleToggleSelect}
                        onRowClick={handleCreatorRowClick}
                        sortState={sortState}
                        onSort={handleSort}
                        onPriceUpdate={handlePriceUpdate}
                        onStatusUpdate={handleStatusUpdate}
                        onChannelUpdate={handleChannelUpdate}
                      />
                      {/* Pagination Controls */}
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedCreators.length}
                        itemsPerPage={itemsPerPage}
                        handlePageChange={handlePageChange}
                        handleItemsPerPageChange={handleItemsPerPageChange}
                        previousPage={previousPage}
                        nextPage={nextPage}
                        goToFirstPage={goToFirstPage}
                        goToLastPage={goToLastPage}
                      />
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Import Creators Modal */}
      {showImportCreatorsModal && (
        <ImportCreatorsModal
          isOpen={showImportCreatorsModal}
          onClose={() => setShowImportCreatorsModal(false)}
          onUploadCsv={handleImportCsv}
          onAddFromDiscover={() => {
            setShowImportCreatorsModal(false);
            window.location.href = '/dashboard/discover';
          }}
        />
      )}

      {/* Remove Creators Confirmation Modal */}
      {showRemoveCreatorsConfirmationModal && (
        <ConfirmDialog 
          title="Remove Influencers"
          message={
            <>
              <p>Are you sure you want to remove the selected influencer{selectedCreators.size > 1 ? 's' : ''} from the talent network? This action cannot be undone.</p>
              <p className="text-xs text-[#9CA3AF] mt-2">Selected: {selectedCreators.size} influencer{selectedCreators.size !== 1 ? 's' : ''}</p>
            </>
          }
          confirmText="Remove"
          onConfirm={handleConfirmRemoveCreators}
          onCancel={handleCancelRemoveCreators}
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newListName.trim().length > 0 && !savingToList) {
                    handleCreateNewList();
                  }
                }}
                placeholder="Enter list name..."
                className="w-full px-3 py-2 bg-[#31384a] border border-gray-600 rounded-lg text-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-500 [font-family:'Inter',Helvetica]"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewListModal(false);
                  setNewListName('');
                }}
                className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200"
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
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Notice */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 bg-[#1a1f2e] border border-gray-700 rounded-lg px-4 py-3 shadow-lg z-[10001]">
          <p className="text-sm text-gray-50">{actionNotice}</p>
        </div>
      )}
    </>
  );
};

