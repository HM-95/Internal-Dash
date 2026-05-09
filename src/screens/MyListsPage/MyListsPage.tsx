"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
// Use a Lists-specific re-export to avoid confusion with other pages
import { ExpandedProfileOverlay, OverlayCreator } from "../../components/ui/expanded-profile-overlay.lists";
import { MetricsRowSm } from "../../features/lists/Metrics/MetricsRowSm";
import { BuzzScoreBarSm } from "../../features/lists/BuzzScoreBar/BuzzScoreBarSm";
import { ConfirmDialog } from "../../features/lists/modals/ConfirmDialog";
import { ListDetailModal } from "../../features/lists/ListDetailModal/ListDetailModal";
import ListDetailModalSkeleton from "../../features/lists/ListDetailModal/ListDetailModalSkeleton";
import { ImportCreatorsModal } from "../../features/lists/modals/ImportCreatorsModal";
import { mapCreatorToOverlay } from "../../features/lists/utils";
import { formatNumberShort, average } from "../../features/lists/utils";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";

import { Separator } from "../../components/ui/separator";
import { formatNumber } from "../../../app/utils/formatters";
import PaginationControls from "../../components/ui/pagination-controls";
import { listsClient, BASE_TAGS, type List as DbList } from "@/lib/listsClient";
import { getCurrentUser } from "@/lib/internal-auth-client";
import { ListGridSkeleton } from "../../components/ui/list-skeleton";
import type { ImportProgress } from "../../services/importService";
import { ImportService } from "../../services/importService";

export const MyListsPage = (): JSX.Element => {
  // Get search params to handle navigation from AI Search page
  const searchParams = useSearchParams();
  
  // Modal state
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showImportCreatorsModal, setShowImportCreatorsModal] = useState(false);
  const [showListDetailModal, setShowListDetailModal] = useState(false);
  const [selectedListForDetail, setSelectedListForDetail] = useState<any>(null);
  const [showImportInfoPopup, setShowImportInfoPopup] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [showRemoveCreatorsConfirmationModal, setShowRemoveCreatorsConfirmationModal] = useState(false);
  const [showExportNotice, setShowExportNotice] = useState(false);
  const [exportNoticeText, setExportNoticeText] = useState("");
  const importInfoRef = useRef<HTMLDivElement>(null);
  const importButtonRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LISTS_PER_PAGE = 6;
  
  // Creator selection state
  const [selectedCreators, setSelectedCreators] = useState<Set<number>>(new Set());
  
  // List title edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // List tags edit state
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [selectedListTags, setSelectedListTags] = useState<Set<string>>(new Set());
  const [searchTagQuery, setSearchTagQuery] = useState("");
  const [editingListId, setEditingListId] = useState<number | null>(null);
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

  function sanitizeFileName(name: string, fallback: string = 'list'): string {
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
      ? c.hashtags.map((h: string) => String(h).replace(/^#/, '')).join(',')
      : '';
    const username = c.username ?? (typeof c.handle === 'string' ? String(c.handle).replace(/^@+/, '') : '');
    
    // Extract average likes and comments properly from database fields
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
      c.profile_url ?? '',
      c.email ?? '',
      c.location ?? '',
      '', // Removed primary niche
      c.secondary_niche ?? '',
      String(c.followers_count ?? ''),
      String(c.average_views ?? ''),
      String(c.engagement_rate ?? c.engagement ?? ''),
      String(avgLikes || ''),
      String(avgComments || ''),
      String(c.buzz_score ?? ''),
      hashtags,
    ];
  }

  function exportCampaignCreators(campaign: any) {
    // Use creators from campaignCreators cache or fallback to sample data
    const creatorsRaw: any[] = campaignCreators[String(campaign.id)] || sampleCreators;
    if (!Array.isArray(creatorsRaw) || creatorsRaw.length === 0) return;
    const normalized = creatorsRaw.map((c: any) => {
      const overlay = mapCreatorToOverlay(c);
      return {
        ...c,
        username: c.username ?? String(c.handle ?? overlay.username_tag ?? '').replace(/^@+/, ''),
        hashtags: overlay.hashtags ?? [],
      };
    });
    const header = [
      'Display Name','Username','Platform','Profile Links','Email','Location','Secondary Niche',
      'Followers','Average Views','Engagement','Average Likes','Average Comments','Buzz Score','Hashtags'
    ];
    const rows = [header, ...normalized.map(mapCreatorToCsvRow)];
    const filename = `${sanitizeFileName(campaign.name || 'list')}.csv`;
    downloadCsv(filename, rows);
  }

  function handleExportSelected() {
    const selected = campaigns.filter(c => c.selected);
    if (selected.length === 0) return;

    if (selected.length === 1) {
      exportCampaignCreators(selected[0]);
      setExportNoticeText(`${selected[0].name}.csv has been downloaded. Please check your Downloads folder.`);
      setShowExportNotice(true);
      return;
    }

    // Multiple lists: generate multiple CSVs and download as one ZIP (client-side minimal zip)
    // Simple ZIP builder: store method 0 (no compression)
    function crc32(bytes: Uint8Array): number {
      let c = 0 ^ (-1);
      for (let i = 0; i < bytes.length; i++) {
        c = (c >>> 8) ^ CRC_TABLE[(c ^ bytes[i]) & 0xFF];
      }
      return (c ^ (-1)) >>> 0;
    }

    const CRC_TABLE = (() => {
      const table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1);
        }
        table[n] = c >>> 0;
      }
      return table;
    })();

    function dosDateTime(d: Date) {
      const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
      const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
      return { time, date };
    }

    type ZipEntry = { name: string; data: Uint8Array; crc: number; size: number; compSize: number; localOffset: number; modTime: number; modDate: number };
    const entries: ZipEntry[] = [];

    // Build CSVs
    for (const list of selected) {
      // Use creators from campaignCreators cache or fallback to sample data
      const creatorsRaw: any[] = campaignCreators[String(list.id)] || sampleCreators;
      const normalized = creatorsRaw.map((c: any) => {
        const overlay = mapCreatorToOverlay(c);
        return {
          ...c,
          username: c.username ?? String(c.handle ?? overlay.username_tag ?? '').replace(/^@+/, ''),
          hashtags: overlay.hashtags ?? [],
        };
      });
      const header = ['Display Name','Username','Platform','Profile Links','Email','Location','Primary Niche','Secondary Niche','Followers','Average Views','Engagement','Average Likes','Average Comments','Buzz Score','Hashtags'];
      const rows = [header, ...normalized.map(mapCreatorToCsvRow)];
      const csvText = rows.map(r => r.map(toCsvValue).join(',')).join('\n');
      const data = new TextEncoder().encode(csvText);
      const crc = crc32(data);
      const now = new Date();
      const { time, date } = dosDateTime(now);
      entries.push({ name: `${sanitizeFileName(list.name || 'list')}.csv`, data, crc, size: data.length, compSize: data.length, localOffset: 0, modTime: time, modDate: date });
    }

    // Assemble ZIP (no compression)
    const encoder = new TextEncoder();
    const fileNameBytes = (s: string) => encoder.encode(s);

    let offset = 0;
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];

    function concat(parts: Uint8Array[]): Uint8Array {
      const total = parts.reduce((s, p) => s + p.length, 0);
      const out = new Uint8Array(total);
      let pos = 0;
      for (const p of parts) { out.set(p, pos); pos += p.length; }
      return out;
    }

    function u16(n: number) { const b = new Uint8Array(2); b[0] = n & 0xFF; b[1] = (n >>> 8) & 0xFF; return b; }
    function u32(n: number) { const b = new Uint8Array(4); b[0] = n & 0xFF; b[1] = (n >>> 8) & 0xFF; b[2] = (n >>> 16) & 0xFF; b[3] = (n >>> 24) & 0xFF; return b; }

    for (const e of entries) {
      e.localOffset = offset;
      const nameBytes = fileNameBytes(e.name);
      const localHeader = concat([
        u32(0x04034b50), // local file header signature
        u16(20), // version needed
        u16(0), // general purpose
        u16(0), // compression method 0 (store)
        u16(e.modTime), u16(e.modDate),
        u32(e.crc), u32(e.compSize), u32(e.size),
        u16(nameBytes.length), u16(0), // file name length, extra length
        nameBytes,
      ]);
      const fileRecord = concat([localHeader, e.data]);
      localParts.push(fileRecord);
      offset += fileRecord.length;

      const centralHeader = concat([
        u32(0x02014b50), // central file header
        u16(20), u16(20), // version made by/needed
        u16(0), u16(0), // general purpose/compression
        u16(e.modTime), u16(e.modDate),
        u32(e.crc), u32(e.compSize), u32(e.size),
        u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0),
        u32(e.localOffset), // relative offset of local header
        nameBytes,
      ]);
      centralParts.push(centralHeader);
    }

    const locals = concat(localParts);
    const central = concat(centralParts);
    // End of central directory (valid EOCD structure)
    const end = concat([
      u32(0x06054b50),          // End of central directory signature
      u16(0), u16(0),           // Number of this disk / Disk where central directory starts
      u16(entries.length),      // Total entries on this disk
      u16(entries.length),      // Total entries
      u32(central.length),      // Size of central directory
      u32(locals.length),       // Offset of start of central directory relative to start of archive
      u16(0)                    // .ZIP file comment length
    ]);

    // Order MUST be [local files][central directory][EOCD]
    // Ensure proper ArrayBuffer type for Blob constructor
    const zipBlob = new Blob([locals.buffer as ArrayBuffer, central.buffer as ArrayBuffer, end.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Buzzberry Influencer Lists.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNoticeText('Buzzberry Influencer Lists.zip has been downloaded. Please check your Downloads folder.');
    setShowExportNotice(true);
  }

  // Handle query parameters to open modals (from AI Search page navigation)
  useEffect(() => {
    const addListParam = searchParams.get('addList');
    const importCreatorsParam = searchParams.get('importCreators');
    
    if (addListParam === 'true') {
      setShowNewListModal(true);
      // Clear the query parameter to avoid reopening on page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('addList');
      window.history.replaceState({}, '', url.toString());
    }
    
    if (importCreatorsParam === 'true') {
      setShowImportCreatorsModal(true);
      // Clear the query parameter to avoid reopening on page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('importCreators');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Listen to export events from the list detail modal (sm/md or lg/xl)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { list: any; creators: any[] } | undefined;
      if (!detail) return;
      const { list, creators } = detail;
      const normalized = (creators || []).map((c: any) => {
        const overlay = mapCreatorToOverlay(c);
        return {
          ...c,
          username: c.username ?? String(c.handle ?? overlay.username_tag ?? '').replace(/^@+/, ''),
          hashtags: overlay.hashtags ?? [],
        };
      });
      const header = [
        'Display Name','Username','Platform','Profile Links','Email','Location','Secondary Niche',
        'Followers','Average Views','Engagement','Average Likes','Average Comments','Buzz Score','Hashtags'
      ];
      const rows = [header, ...normalized.map(mapCreatorToCsvRow)];
      const filename = `${sanitizeFileName(list?.name || 'list')}.csv`;
      downloadCsv(filename, rows);

      setExportNoticeText(`${sanitizeFileName(list?.name || 'list')}.csv has been downloaded. Please check your Downloads folder.`);
      setShowExportNotice(true);
    };
    window.addEventListener('export-list', handler as EventListener);
    return () => window.removeEventListener('export-list', handler as EventListener);
  }, []);


  // Close import info popup when clicking outside
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

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      const inDropdown = (target as HTMLElement).closest('[data-tag-area]');
      const inTrigger = (target as HTMLElement).closest('[data-edit-tags-trigger]');
      if (inDropdown || inTrigger) return; // click is within dropdown or trigger; do not close
      if (showTagDropdown) {
        setShowTagDropdown(false);
        setSearchTagQuery("");
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showTagDropdown]);

  // Campaign data (backed by Supabase lists)
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Get current user and load lists from Supabase
  useEffect(() => {
    let isMounted = true;
    // If there is a pending reload flagged (completed while user was away), do a single soft reload behind skeleton
    const shouldReload = localStorage.getItem('pendingListPageReload') === 'true';
    if (shouldReload) {
      // Clear immediately to prevent loops
      localStorage.removeItem('pendingListPageReload');
      // Trigger a behind-the-scenes refresh by briefly toggling loading
      setIsLoading(true);
      // After load completes below, we'll set isLoading false
    }
    (async () => {
      try {
        // Get current user first
        const user = await getCurrentUser();
        if (!isMounted) return;
        setCurrentUser(user);

        const lists: DbList[] = await listsClient.getLists();
        if (!isMounted) return;
        const mapped = await Promise.all((lists || []).map(async (l) => {
          let tagNames: string[] = [];
          try {
            tagNames = await listsClient.getTagsForList(String(l.id));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to load tags for list', l.id, e);
          }
          const tags = tagNames.map(name => ({ name, bgColor: 'bg-[#56240580]', borderColor: 'border-[#CA3300]' }));
          return {
            id: l.id,
            selected: false,
            highlighted: false,
            pinned: false,
            buzzScore: 0,
            name: l.name,
            creatorCount: l.creatorCount ?? 0,
            tags,
            createdDate: new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          };
        }));
        setCampaigns(mapped);
        // Prefetch creators per list so cover metrics and counts render after reload
        try {
          const entries = await Promise.all(
            (lists || []).map(async (l) => {
              try {
                const creators = await listsClient.getCreatorsForList(String(l.id));
                return [String(l.id), creators as any[]];
              } catch {
                return [String(l.id), [] as any[]];
              }
            })
          );
          const dict: Record<string, any[]> = {};
          for (const entry of entries) {
            const id = entry[0] as string;
            const creators = entry[1] as any[];
            dict[id] = creators;
          }
          setCampaignCreators(dict);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to prefetch list creators', e);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load lists', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Listen for import progress to show thin bars on covers and modal
  const [importProgressByList, setImportProgressByList] = useState<Record<string, number>>({});
  useEffect(() => {
    const handleProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail as { listId: string; progress: ImportProgress } | undefined;
      if (!detail) return;
      setImportProgressByList(prev => ({ ...prev, [detail.listId]: Math.max(0, Math.min(100, Math.round(detail.progress.progress))) }));
    };
    const handleComplete = (e: Event) => {
      const detail = (e as CustomEvent).detail as { listId: string } | undefined;
      if (!detail) return;
      setImportProgressByList(prev => ({ ...prev, [detail.listId]: 100 }));
      // Auto-refresh lists when currently on lists page
      (async () => {
        try {
          // soft refresh creators for active list if open
          if (selectedListForDetail && String(selectedListForDetail.id) === String(detail.listId)) {
            const creators = await listsClient.getCreatorsForList(String(detail.listId));
            setListCreators(creators);
            setCampaignCreators(prev => ({ ...prev, [String(detail.listId)]: creators }));
            setCampaigns(prev => prev.map(c => c.id === selectedListForDetail.id ? { ...c, creatorCount: creators.length } : c));
          }
          // refresh list counts minimally (optional: full reload already flagged)
        } catch {}
        // Trigger a full page reload to ensure all data is fresh (behind skeleton on initial mount)
        try {
          if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard/mylists')) {
            window.location.reload();
          }
        } catch {}
      })();
    };

    window.addEventListener('import-progress', handleProgress as EventListener);
    window.addEventListener('import-complete', handleComplete as EventListener);

    // Hydrate from localStorage for any in-flight imports
    try {
      const next: Record<string, number> = {};
      (campaigns || []).forEach(c => {
        const raw = localStorage.getItem(`listImportProgress:${c.id}`);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && typeof p.progress === 'number') next[String(c.id)] = Math.round(p.progress);
        }
      });
      if (Object.keys(next).length) setImportProgressByList(prev => ({ ...prev, ...next }));
    } catch {}

    return () => {
      window.removeEventListener('import-progress', handleProgress as EventListener);
      window.removeEventListener('import-complete', handleComplete as EventListener);
    };
  }, [campaigns, selectedListForDetail]);

  // Available tags list is populated from DB; start empty to avoid stale predetermined values
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // List tags data
  // Removed static listTags; tags now come from DB exclusively

  
  

  // Add effect to handle body scroll when popup is open
  useEffect(() => {
    if (showListDetailModal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showListDetailModal]);

  // Expanded Profile Overlay state
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState<boolean>(false);
  const [overlayCreator, setOverlayCreator] = useState<OverlayCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isListDetailLoading, setIsListDetailLoading] = useState(false);

  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleCreatorRowClick = (creator: any) => {
    setOverlayCreator(mapCreatorToOverlay(creator));
    setIsProfileOverlayOpen(true);
  };

  // Handle pin toggle
  const handlePinToggle = (campaignId: number) => {
    setCampaigns(prevCampaigns => {
      const updatedCampaigns = prevCampaigns.map(campaign => {
        if (campaign.id === campaignId) {
          return { ...campaign, pinned: !campaign.pinned };
        }
        return campaign;
      });
      
      // Sort campaigns: pinned ones first, then unpinned
      return updatedCampaigns.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
    });
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = (campaignId: number) => {
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(campaign => {
        if (campaign.id === campaignId) {
          const newSelected = !campaign.selected;
          return { 
            ...campaign, 
            selected: newSelected,
            highlighted: newSelected // Update highlighted state based on selection
          };
        }
        return campaign;
      })
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const allSelected = campaigns.every(campaign => campaign.selected);
    setCampaigns(prevCampaigns =>
      prevCampaigns.map(campaign => ({
        ...campaign,
        selected: !allSelected,
        highlighted: !allSelected
      }))
    );
  };

  // Check if any campaigns are selected
  const hasSelectedCampaigns = campaigns.some(campaign => campaign.selected);

  // Sample creator data for the selected list
  const sampleCreators = [
    {
      id: 1,
      display_name: "Arturo Pestana",
      handle: "@drdollar",
      platform: "instagram",
      profile_url: "https://instagram.com/drdollar",
      profile_image_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 83000,
      average_views: 314000,
      engagement_rate: 91.37,
      buzz_score: 65,
      primary_niche: "Trading",
      secondary_niche: "Forex Trading",
      location: "Texas, USA",
      follower_change: 0.00,
      views_change: 20.00,
      engagement_change: 0.00,
      avg_likes: 12500,
      avg_likes_change: 15.50,
      avg_comments: 850,
      avg_comments_change: 8.20
    },
    {
      id: 2,
      display_name: "Sierra Aaliyah",
      handle: "@sierra.aaliyah",
      platform: "instagram",
      profile_url: "https://instagram.com/sierra.aaliyah",
      profile_image_url: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 73000,
      average_views: 776000,
      engagement_rate: 443.51,
      buzz_score: 75,
      primary_niche: "Trading",
      secondary_niche: "Options Trading",
      location: "Texas, USA",
      follower_change: 154.00,
      views_change: 3212.00,
      engagement_change: 0.00,
      avg_likes: 18500,
      avg_likes_change: 25.30,
      avg_comments: 1200,
      avg_comments_change: 12.80
    },
    {
      id: 3,
      display_name: "VirtualBacon | Cry...",
      handle: "@virtualbacon",
      platform: "tiktok",
      profile_url: "https://tiktok.com/@virtualbacon",
      profile_image_url: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 337000,
      average_views: 22000,
      engagement_rate: 1.59,
      buzz_score: 75,
      primary_niche: "Crypto",
      secondary_niche: "Crypto Trading",
      location: "California, USA",
      follower_change: 0.00,
      views_change: 0.00,
      engagement_change: 0.00,
      avg_likes: 8500,
      avg_likes_change: -5.20,
      avg_comments: 450,
      avg_comments_change: -2.10
    },
    {
      id: 4,
      display_name: "Tarek Ali trader",
      handle: "@tarekali_trader",
      platform: "tiktok",
      profile_image_url: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 336000,
      average_views: 188000,
      engagement_rate: 24.01,
      buzz_score: 75,
      primary_niche: "Crypto",
      secondary_niche: "Crypto Trading",
      location: "Egypt",
      follower_change: 0.00,
      views_change: 0.00,
      engagement_change: 0.00,
      avg_likes: 12500,
      avg_likes_change: 0.00,
      avg_comments: 800,
      avg_comments_change: 0.00
    },
    {
      id: 5,
      display_name: "Crypto Vic",
      handle: "@vic.laranja",
      platform: "tiktok",
      profile_image_url: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 335000,
      average_views: 30000,
      engagement_rate: 2.62,
      buzz_score: 75,
      primary_niche: "Crypto",
      secondary_niche: "Crypto Trading",
      location: "California, USA",
      follower_change: 0.00,
      views_change: 0.00,
      engagement_change: 0.00,
      avg_likes: 6500,
      avg_likes_change: 12.50,
      avg_comments: 350,
      avg_comments_change: 18.40
    },
    {
      id: 6,
      display_name: "Almas ✅",
      handle: "@muro_almas",
      platform: "tiktok",
      profile_image_url: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      followers_count: 335000,
      average_views: 101000,
      engagement_rate: 22.90,
      buzz_score: 75,
      primary_niche: "Crypto",
      secondary_niche: "Crypto Trading",
      location: "United Arab Emirates",
      follower_change: 0.00,
      views_change: 0.00,
      engagement_change: 0.00,
      avg_likes: 9800,
      avg_likes_change: -3.80,
      avg_comments: 650,
      avg_comments_change: -1.50
    }
  ];

  // Each list (campaign) owns its own creators array in UI; start empty until wired to list_items
  const [campaignCreators, setCampaignCreators] = useState<Record<string, any[]>>({});

  // Currently selected list creators (drives modal + averages)
  const [listCreators, setListCreators] = useState<any[]>([]);

  // Handle opening list detail
  const handleOpenListDetail = async (campaign: any) => {
    setSelectedListForDetail(campaign);
    setIsListDetailLoading(true);
    setShowListDetailModal(true);
    
    // Load creators from Supabase via list_items → creatordata
    try {
      const creators = await listsClient.getCreatorsForList(String(campaign.id));
      setListCreators(creators);
      setCampaignCreators(prev => ({ ...prev, [String(campaign.id)]: creators }));
    } catch (e) {
      console.error('Failed to load creators for list', campaign.id, e);
      setListCreators([]);
    } finally {
      setIsListDetailLoading(false);
    }
  };

  // Handle closing list detail
  const handleCloseListDetail = () => {
    setShowListDetailModal(false);
    setSelectedListForDetail(null);
    setIsListDetailLoading(false);
  };

  // Handle import completion - refresh the list data
  const handleImportComplete = async (result: any) => {
    console.log('Import completed, refreshing list data:', result);
    
    if (selectedListForDetail && result.found > 0) {
      try {
        // Refresh the creators for this list
        const creators = await listsClient.getCreatorsForList(String(selectedListForDetail.id));
        setListCreators(creators);
        setCampaignCreators(prev => ({ ...prev, [String(selectedListForDetail.id)]: creators }));
        
        // Update the campaign's creator count
        setCampaigns(prev => prev.map(c => 
          c.id === selectedListForDetail.id 
            ? { ...c, creatorCount: creators.length }
            : c
        ));
      } catch (e) {
        console.error('Failed to refresh list data after import:', e);
      }
    }
  };

  // Format number helper
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Derive averages from current list creators for cover and modal to match
  const avgFollowers = React.useMemo(() => listCreators.length ? listCreators.reduce((s, c) => s + (c.followers_count || 0), 0) / listCreators.length : 0, [listCreators]);
  const avgViews = React.useMemo(() => listCreators.length ? listCreators.reduce((s, c) => s + (c.average_views || 0), 0) / listCreators.length : 0, [listCreators]);
  const avgEngagement = React.useMemo(() => listCreators.length ? listCreators.reduce((s, c) => s + (c.engagement_rate || 0), 0) / listCreators.length : 0, [listCreators]);
  const avgBuzz = React.useMemo(() => listCreators.length ? listCreators.reduce((s, c) => s + (c.buzz_score || 0), 0) / listCreators.length : 0, [listCreators]);

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      'instagram': '📷',
      'tiktok': '🎵',
      'youtube': '📺',
      'x': '🐦'
    };
    return icons[platform.toLowerCase()] || '📱';
  };

  // Ensure dropdown always includes tags found on any list cover
  const availableTagOptions = React.useMemo(() => {
    const coverTags = campaigns.flatMap((c) => (c.tags ? c.tags.map((t: any) => t.name) : []));
    const set = new Set<string>([...availableTags, ...coverTags]);
    return Array.from(set);
  }, [availableTags, campaigns]);

  // Handle new list creation
  const handleCreateNewList = async () => {
    if (newListName.trim().length === 0) return;
    try {
      const created = await listsClient.createList(newListName.trim());
      const newList = {
        id: created.id,
        selected: false,
        highlighted: false,
        pinned: false,
        buzzScore: 0,
        name: created.name,
        creatorCount: 0,
        tags: [],
        createdDate: new Date(created.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setCampaigns(prev => [newList, ...prev]);
      setCampaignCreators(prev => ({ ...prev, [String(newList.id)]: [] }));
      setNewListName("");
      setShowNewListModal(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to create list', e);
    }
  };

  // Handle modal close (only if name is provided)
  const handleCloseModal = () => {
    setShowNewListModal(false);
    setNewListName("");
  };

  // Handle key press in modal
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateNewList();
    }
  };

  // Handle CSV import and auto-create list
  const handleImportCsv = async (file: File) => {
    try {
      // Extract list name from CSV filename (remove .csv extension)
      const listName = file.name.replace(/\.csv$/i, '');
      
      // Create a new list with the CSV filename
      const newList = await listsClient.createList(listName);

      // Optimistically add the list to UI and show initial progress
      const optimistic = {
        id: newList.id,
        selected: false,
        highlighted: false,
        pinned: false,
        buzzScore: 0,
        name: newList.name,
        creatorCount: 0,
        tags: [],
        createdDate: new Date(newList.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setCampaigns(prev => [optimistic, ...prev]);
      setCampaignCreators(prev => ({ ...prev, [String(newList.id)]: [] }));
      setImportProgressByList(prev => ({ ...prev, [String(newList.id)]: 1 }));

      // Close modal immediately
      setShowImportCreatorsModal(false);

      // Begin background import using the same service flow (with global events + persistence)
      const svc = new ImportService((progress) => {
        setImportProgressByList(prev => ({ ...prev, [String(newList.id)]: Math.max(0, Math.min(100, Math.round(progress.progress))) }));
      });
      // Fire and forget; events will handle refresh/reload
      svc.importCreatorsFromCSV(file, String(newList.id)).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Background import failed:', e);
      });

    } catch (error) {
      console.error('Failed to create list from CSV:', error);
      // For now, just close the modal on error
      setShowImportCreatorsModal(false);
    }
  };



  const handleCreatorSelection = (creatorId: number) => {
    const newSelected = new Set(selectedCreators);
    if (newSelected.has(creatorId)) {
      newSelected.delete(creatorId);
    } else {
      newSelected.add(creatorId);
    }
    setSelectedCreators(newSelected);
  };

  const handleSelectAllCreators = () => {
    if (selectedCreators.size === listCreators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(listCreators.map(creator => creator.id)));
    }
  };

  const handleRemoveSelectedCreators = () => {
    setShowRemoveCreatorsConfirmationModal(true);
  };

  const handleConfirmRemoveCreators = async () => {
    if (!selectedListForDetail) {
      setShowRemoveCreatorsConfirmationModal(false);
      return;
    }
    const listId = String(selectedListForDetail.id);
    const idsToRemove = Array.from(selectedCreators);
    try {
      // Persist removals
      await Promise.all(idsToRemove.map((cid) => listsClient.removeCreator(listId, String(cid))));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to remove one or more creators', e);
    }
    // Update UI state
    const updatedCreators = listCreators.filter(creator => !selectedCreators.has(creator.id));
    setListCreators(updatedCreators);
    setCampaignCreators(prev => ({ ...prev, [listId]: updatedCreators }));
    // Update cover creatorCount
    setCampaigns(prev => prev.map(c => c.id === selectedListForDetail.id ? { ...c, creatorCount: Math.max(0, (c.creatorCount || 0) - idsToRemove.length) } : c));
    // Clear selection and close dialog
    setSelectedCreators(new Set());
    setShowRemoveCreatorsConfirmationModal(false);
  };

  const handleCancelRemoveCreators = () => {
    setShowRemoveCreatorsConfirmationModal(false);
  };

  // Tag management functions
  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = new Set(selectedListTags);
    if (newSelectedTags.has(tagName)) {
      newSelectedTags.delete(tagName);
    } else if (newSelectedTags.size < 4) {
      newSelectedTags.add(tagName);
    }
    setSelectedListTags(newSelectedTags);
    // Immediately reflect on list detail & cover
    const updatedListTags = Array.from(newSelectedTags).map(name => ({
      name,
      bgColor: "bg-[#56240580]",
      borderColor: "border-[#CA3300]",
    }));
    if (editingListId != null) {
      setCampaigns(prevCampaigns => prevCampaigns.map(c => (c.id === editingListId ? { ...c, tags: updatedListTags } : c)));
      if (selectedListForDetail && selectedListForDetail.id === editingListId) {
        setSelectedListForDetail({ ...selectedListForDetail, tags: updatedListTags });
      }
    }
  };

  const handleCreateTag = async () => {
    const name = searchTagQuery.trim();
    if (!name) return;
    if (name.length > 20) return;
    if (selectedListTags.size >= 4) return;
    // Add to selected tags immediately
    const newSelectedTags = new Set(selectedListTags);
    newSelectedTags.add(name);
    setSelectedListTags(newSelectedTags);
    // Also add to available tags if not present so it shows in the dropdown list instantly
    setAvailableTags((prev) => (prev.includes(name) ? prev : [name, ...prev]));
    try {
      await listsClient.createTag(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to create tag', e);
    }
    setSearchTagQuery("");
  };

  const handleSaveTags = async () => {
    // Update the selected list's tags with selected tags
    const updatedListTags = Array.from(selectedListTags).map(tagName => ({
      name: tagName,
      bgColor: "bg-[#56240580]",
      borderColor: "border-[#CA3300]",
    }));
    
    // Update the campaigns state with the new tags for the selected list
    setCampaigns(prevCampaigns => 
      prevCampaigns.map(campaign => 
        campaign.id === editingListId 
          ? { ...campaign, tags: updatedListTags }
          : campaign
      )
    );
    
    // Update the selectedListForDetail to show changes immediately in popup
    if (selectedListForDetail && editingListId === selectedListForDetail.id) {
      setSelectedListForDetail({
        ...selectedListForDetail,
        tags: updatedListTags
      });
    }
    
    // Store the current editing list ID before closing dropdown
    const currentEditingListId = editingListId;
    
    // Close dropdown immediately for better UX
    setIsEditingTags(false);
    setShowTagDropdown(false);
    setEditingListId(null);
    
    // Save to database in background
    try {
      await listsClient.setTagsForList(String(currentEditingListId), Array.from(selectedListTags));
      // Refresh available options from DB to reflect merges/renames
      try {
        const fresh = await listsClient.getAvailableTags();
        setAvailableTags(Array.from(new Set(fresh)));
      } catch {}
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save tags', e);
    }
  };

  const handleCancelTags = () => {
    setIsEditingTags(false);
    setShowTagDropdown(false);
    setSearchTagQuery("");
    setSelectedListTags(new Set());
  };

  const handleStartTitleEdit = () => {
    setIsEditingTitle(true);
    setEditedTitle(selectedListForDetail?.name || "");
  };

  const handleSaveTitleEdit = async () => {
    if (selectedListForDetail && editedTitle.trim()) {
      const newName = editedTitle.trim();
      try {
        await listsClient.renameList(String(selectedListForDetail.id), newName);
        setCampaigns(prevCampaigns => prevCampaigns.map(c => (c.id === selectedListForDetail.id ? { ...c, name: newName } : c)));
        setSelectedListForDetail({ ...selectedListForDetail, name: newName });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to rename list', e);
      } finally {
        setIsEditingTitle(false);
      }
    }
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitleEdit();
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit();
    }
  };

  // Delete confirmation handlers
  const handleDeleteList = () => {
    setShowDeleteConfirmationModal(true);
  };

  const handleConfirmDelete = () => {
    const idsToDelete = campaigns.filter(c => c.selected).map(c => String(c.id));
    // Optimistic UI: hide immediately
    setCampaigns(prev => prev.filter(campaign => !campaign.selected));
    setShowDeleteConfirmationModal(false);
    // Persist soft-delete
    (async () => {
      try {
        await listsClient.softDeleteLists(idsToDelete);
      } catch (e) {
        console.error('Failed to delete lists', e);
      }
    })();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmationModal(false);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  // Calculate paginated campaigns
  const getPaginatedCampaigns = () => {
    const startIndex = (currentPage - 1) * LISTS_PER_PAGE;
    const endIndex = startIndex + LISTS_PER_PAGE;
    return campaigns.slice(startIndex, endIndex);
  };

  // Update total pages when campaigns change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(campaigns.length / LISTS_PER_PAGE));
    setTotalPages(totalPages);
    
    // Reset to page 1 if current page is beyond total pages
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [campaigns.length, currentPage]);

  // Load persistent tags for dropdown on mount (seed 5 base tags for the user if missing)
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        const tags = await listsClient.getAvailableTags();
        if (Array.isArray(tags) && tags.length) {
          setAvailableTags(Array.from(new Set(tags)));
        } else {
          // if empty, display BASE_TAGS so users see starters immediately while seeding occurs in client
          setAvailableTags(BASE_TAGS);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load tags', e);
        // fall back to base tags visually
        setAvailableTags(BASE_TAGS);
      }
    })();
  }, []);

  return (
    <>
      {/* Expanded Profile Overlay */}
      {overlayCreator && (
        <ExpandedProfileOverlay
          isOpen={isProfileOverlayOpen}
          creator={overlayCreator}
          onClose={() => setIsProfileOverlayOpen(false)}
          currentMode="ai"
        />
      )}
      <main className="flex flex-col h-screen bg-black w-full p-3 lg:p-4 overflow-y-auto custom-scrollbar">
      <section className="flex flex-col w-full flex-1">
        <header className="inline-flex items-center gap-2 relative flex-[0_0_auto] mb-3 lg:mb-4">
          <h1 className="relative [font-family:'Inter',Helvetica] font-bold text-gray-50 text-xl lg:text-2xl tracking-[0] leading-[28px] lg:leading-[32px]">
            My Lists
          </h1>
        </header>

        <Card className="w-full bg-[#0f1419] rounded-[12px] border-none flex-1 flex flex-col">
          <CardContent className="p-3 lg:p-4 flex-1 flex flex-col">
            <div className="flex flex-col items-start gap-3 lg:gap-4 relative self-stretch w-full flex-1">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="gap-2 inline-flex items-center flex-wrap">
                <Button
                  variant="outline"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border-gray-600 h-8 text-xs hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200"
                  onClick={() => setShowNewListModal(true)}
                >
                  <img
                      className="w-3 h-3"
                    alt="New list icon"
                    src="/NewListIcon.svg"
                  />
                  <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50">
                      Add list
                  </span>
                </Button>

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

                  <Button
                    variant="outline"
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg h-8 text-xs transition-colors duration-200 ${
                      hasSelectedCampaigns
                        ? 'bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 cursor-pointer hover:text-gray-50 active:text-gray-50'
                        : 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!hasSelectedCampaigns}
                    onClick={handleDeleteList}
                  >
                    <img
                      className={`w-3 h-3 ${
                        hasSelectedCampaigns ? '' : 'opacity-50'
                      }`}
                      alt="Delete icon"
                      src="/DeleteIcon.svg"
                    />
                    <span className="[font-family:'Inter',Helvetica] font-medium">
                      Delete list
                    </span>
                  </Button>
                </div>

                <div className="gap-2 inline-flex items-center flex-wrap">
                  <Button
                    variant="outline"
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg h-8 text-xs transition-colors duration-200 ${
                      hasSelectedCampaigns
                        ? 'bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 cursor-pointer hover:text-gray-50 active:text-gray-50'
                        : 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!hasSelectedCampaigns}
                    onClick={handleExportSelected}
                  >
                    <img
                      className={`w-3 h-3 ${
                        hasSelectedCampaigns ? '' : 'opacity-50'
                      }`}
                      alt="Export icon"
                      src="/ExportIcon.svg"
                    />
                    <span className="[font-family:'Inter',Helvetica] font-medium">
                      Export
                    </span>
                  </Button>

                  <label
                    htmlFor="select-all-checkbox"
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200 h-8"
                    onClick={handleSelectAll}
                  >
                    <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs">
                      Select All
                    </span>
                    {campaigns.length > 0 && campaigns.every(campaign => campaign.selected) ? (
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

              <div className="flex flex-col items-start gap-3 lg:gap-4 w-full flex-1 min-h-[400px] relative">
              {isLoading ? (
                <ListGridSkeleton />
              ) : (
                <>
              {getPaginatedCampaigns().map((campaign) => {
                const creatorsForCard = campaignCreators[String(campaign.id)] || [];
                const cAvgFollowers = creatorsForCard.length ? creatorsForCard.reduce((s, c) => s + (c.followers_count || 0), 0) / creatorsForCard.length : 0;
                const cAvgViews = creatorsForCard.length ? creatorsForCard.reduce((s, c) => s + (c.average_views || 0), 0) / creatorsForCard.length : 0;
                const cAvgEngagement = creatorsForCard.length ? creatorsForCard.reduce((s, c) => s + (c.engagement_rate || 0), 0) / creatorsForCard.length : 0;
                const cAvgBuzz = creatorsForCard.length ? creatorsForCard.reduce((s, c) => s + (c.buzz_score || 0), 0) / creatorsForCard.length : 0;
                return (
                  <Card
                    key={campaign.id}
                  className={`relative flex flex-col items-start p-3 lg:p-4 self-stretch w-full bg-[#1a1f2e] rounded-[12px] overflow-hidden cursor-pointer ${
                      campaign.highlighted
                        ? "border-2 border-blue-500"
                        : "border border-gray-700"
                    }`}
                    onClick={() => handleOpenListDetail(campaign)}
                  >
                  <CardContent className="p-3 w-full">
                      {/* Top edge thin progress bar when importing */}
                      {importProgressByList[String(campaign.id)] != null && importProgressByList[String(campaign.id)] < 100 && (
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-transparent">
                          <div
                            className="h-1 w-full bg-transparent"
                            style={{ position: 'relative' }}
                          >
                            <div
                              className="absolute left-0 top-0 h-1 rounded-r-full"
                              style={{
                                width: `${importProgressByList[String(campaign.id)]}%`,
                                background: 'linear-gradient(90deg, #60A5FA, #3B82F6)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Desktop Layout */}
                    <div className="hidden lg:flex flex-row items-center justify-between relative self-stretch w-full flex-[0_0_auto] gap-3">
                        <div className="flex-col items-start gap-2 inline-flex justify-center">
                          <div className="flex-col items-start gap-1 inline-flex justify-center">
                            <h2 className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-lg lg:text-xl tracking-[0] leading-[24px] lg:leading-[28px]">
                              {campaign.name}
                            </h2>

                          <div className="flex items-start gap-2 self-stretch w-full">
                            <div className="inline-flex items-center gap-1">
                                <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-sm tracking-[0] leading-[18px] whitespace-nowrap">{(campaignCreators[String(campaign.id)] || []).length}</span>
                              <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-sm tracking-[0] leading-[18px] whitespace-nowrap">
                                  Influencers
                                </span>
                              </div>

                              <Separator
                                orientation="vertical"
                              className="h-5"
                              />

                            <div className="inline-flex items-center justify-center gap-1">
                                <img
                                className="w-4 h-4"
                                  alt="Date icon"
                                  src="/DateIcon.svg"
                                />
                              <div className="inline-flex items-center gap-1">
                                <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-sm tracking-[0] leading-[18px] whitespace-nowrap">
                                    Created
                                  </span>
                                <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-sm tracking-[0] leading-[18px] whitespace-nowrap">
                                    {campaign.createdDate}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                        <div className="inline-flex items-center gap-1 flex-wrap">
                          {campaign.tags && campaign.tags.length > 0 ? (
                            campaign.tags.map((tag: { name: string; bgColor: string; borderColor: string }, index: number) => (
                                <Badge
                                  key={index}
                                className={`inline-flex items-center justify-center gap-1 px-2 py-1 ${tag.bgColor} rounded-[50px] border border-solid ${tag.borderColor}`}
                                  variant="outline"
                                >
                                <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs tracking-[0] leading-[14px] whitespace-nowrap">
                                    {tag.name}
                                  </span>
                                </Badge>
                            ))
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedListTags(new Set());
                                setEditingListId(campaign.id);
                                setShowTagDropdown(true);
                                // Open the list detail, so the dropdown has a place to render
                                handleOpenListDetail(campaign);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-[50px] border-gray-600 h-[28px] text-xs hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200"
                            >
                              <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs">
                                Add Tags
                              </span>
                            </button>
                          )}
                        </div>
                        </div>

                      <div className="inline-flex flex-col items-end justify-center gap-2 w-auto">
                          {/* Actions */}
                        <div className="flex flex-row items-center gap-1 w-[120px] h-8 justify-end">
                          {/* View List Button */}
                          <button className="flex flex-row justify-center items-center px-3 py-1.5 bg-[#31384A] border border-gray-600 rounded-lg hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] transition-colors duration-200 min-w-[70px] h-8">
                            <span className="text-[#F9FAFB] text-xs font-medium whitespace-nowrap">
                              View List
                            </span>
                            </button>
                            
                            {/* Pin Button */}
                          <button className="flex flex-row justify-center items-center p-1.5 gap-1.5 w-8 h-8 bg-[#31384A] border border-gray-600 rounded-lg hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] transition-colors duration-200" onClick={(e) => {
                            e.stopPropagation();
                            handlePinToggle(campaign.id);
                          }}>
                              <img
                              className="w-3 h-3"
                                alt={campaign.pinned ? "Unpin" : "Pin"}
                                src={campaign.pinned ? "/PinPinned.svg" : "/PinUnpinned.svg"}
                                style={{
                                  filter: campaign.pinned ? 'none' : 'brightness(0) invert(1)'
                                }}
                              />
                            </button>
                            
                            {/* Checkbox */}
                          <div className="flex flex-row items-center gap-2 w-4 h-4">
                              {campaign.selected ? (
                                <div 
                                className="flex items-center justify-center w-4 h-4 bg-[#217EFD] rounded-[3px] cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxToggle(campaign.id);
                                }}
                                >
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
                                <div 
                                className="w-4 h-4 bg-[#4B5563] rounded-[3px] border border-[#6B7280] cursor-pointer hover:bg-[#5B6573] transition-colors" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCheckboxToggle(campaign.id);
                                }}
                                />
                              )}
                            </div>
                          </div>

                        <div className="flex flex-col w-[548px] items-end gap-2">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                              <img className="w-[36px] h-[36px]" alt="Avg. Followers icon" src="/FollowerIcon.svg" />
                                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-xs">Avg. Followers</span>
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-sm whitespace-nowrap">{formatNumber(Math.round(cAvgFollowers))}</span>
                                    </div>
                                    </div>
                            <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                              <img className="w-[36px] h-[36px]" alt="Avg. Views icon" src="/AvgViewsIcon.svg" />
                              <div className="inline-flex flex-col items-start justify-center gap-0.5">
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-xs">Avg. Views</span>
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-sm whitespace-nowrap">{formatNumber(Math.round(cAvgViews))}</span>
                                  </div>
                                </div>
                            <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                              <img className="w-[36px] h-[36px]" alt="Avg. Engagement icon" src="/EngagementIcon.svg" />
                              <div className="inline-flex flex-col items-start justify-center gap-0.5">
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-xs">Avg. Engagement</span>
                                <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-sm whitespace-nowrap">{cAvgEngagement.toFixed(1)}%</span>
                              </div>
                            </div>
                            </div>

                          {false && (
                            <div className="relative flex-[0_0_auto] w-[548px]">
                              <div className="buzz-score-bar w-full h-[14px] bg-[#31384a] rounded-[8px] relative overflow-hidden">
                                <div 
                                  className="buzz-score-progress h-full rounded-[8px] transition-all duration-300 ease-in-out relative"
                                  style={{ width: `${Math.round(cAvgBuzz)}%`, background: 'linear-gradient(to right, #FC4C4B 0%, #CD45BA 50%, #6E57FF 100%)' }}
                                />
                                <div 
                                  className="buzz-score-text absolute top-0 h-full flex items-center text-white font-inter text-xs font-extrabold px-0.5 z-10"
                                  style={{ left: `calc(${Math.round(cAvgBuzz)}% - 2.5px)`, transform: 'translateX(-100%)' }}
                                >
                                  {Math.round(cAvgBuzz)}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                      {/* Tablet/Mobile Layout */}
                      <div className="flex lg:hidden flex-col items-start justify-between relative self-stretch w-full gap-3 sm:gap-4 md:gap-5">
                        {/* Title and Actions Row */}
                        <div className="flex flex-row items-start justify-between w-full">
                          {/* Title Section */}
                          <div className="flex flex-col items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
                            <div className="flex flex-col items-start gap-1 sm:gap-1.5">
                              <h2 className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-base sm:text-lg md:text-xl lg:text-[25px] tracking-[0] leading-[20px] sm:leading-[25px] md:leading-[28px] lg:leading-[35px] truncate w-full">
                                {campaign.name}
                              </h2>

                              <div className="flex items-start gap-1.5 sm:gap-2.5 flex-wrap">
                                <div className="inline-flex items-center gap-[3px]">
                                  <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-xs sm:text-sm md:text-base tracking-[0] leading-[16px] sm:leading-[20px] md:leading-[22.4px] whitespace-nowrap">{creatorsForCard.length}</span>
                                  <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-xs sm:text-sm md:text-base tracking-[0] leading-[16px] sm:leading-[20px] md:leading-[22.4px] whitespace-nowrap">
                                    Influencers
                                  </span>
                                </div>

                                <Separator
                                  orientation="vertical"
                                  className="h-4 sm:h-5 md:h-[25px]"
                                />

                                <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                                  <img
                                    className="w-3 sm:w-4 md:w-[16.67px] h-3 sm:h-4 md:h-[16.67px]"
                                    alt="Date icon"
                                    src="/DateIcon.svg"
                                  />
                                  <div className="inline-flex items-center gap-[3px]">
                                    <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-xs sm:text-sm md:text-base tracking-[0] leading-[16px] sm:leading-[20px] md:leading-[22.4px] whitespace-nowrap">
                                      Created
                                    </span>
                                    <span className="[font-family:'Inter',Helvetica] font-normal text-gray-50 text-xs sm:text-sm md:text-base tracking-[0] leading-[16px] sm:leading-[20px] md:leading-[22.4px] whitespace-nowrap">
                                      {campaign.createdDate}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                              <div className="inline-flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            {campaign.tags && campaign.tags.length > 0 ? (
                              campaign.tags.map((tag: { name: string; bgColor: string; borderColor: string }, index: number) => (
                                  <Badge
                                    key={index}
                                  className={`inline-flex items-center justify-center gap-1 sm:gap-2.5 px-1.5 py-1 sm:p-2 md:p-2.5 ${tag.bgColor} rounded-[50px] border border-solid ${tag.borderColor}`}
                                    variant="outline"
                                  >
                                    <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-[10px] sm:text-xs md:text-[15px] tracking-[0] leading-[10px] sm:leading-[12px] md:leading-[15px] whitespace-nowrap">
                                      {tag.name}
                                    </span>
                                  </Badge>
                              ))
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowTagDropdown(true);
                                  setSelectedListTags(new Set());
                                  setEditingListId(campaign.id);
                                }}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 rounded-[50px] border-gray-600 h-[28px] text-xs hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 transition-colors duration-200"
                              >
                                <span className="[font-family:'Inter',Helvetica] font-medium text-gray-50 text-xs">
                                  Add Tags
                                </span>
                              </button>
                            )}
                          </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-row items-center gap-1 sm:gap-1.5 ml-2 sm:ml-4 flex-shrink-0">
                            {/* Edit Button */}
                              <button className="flex flex-row justify-center items-center px-3 py-1.5 bg-[#31384A] border border-gray-600 rounded-lg hover:bg-[#3F4A5F] hover:border-gray-500 active:bg-[#4B5563] transition-colors duration-200 min-w-[70px] h-8">
                                <span className="text-[#F9FAFB] text-xs font-medium whitespace-nowrap">View List</span>
                            </button>
                            
                            {/* Pin Button */}
                            <button 
                              className="flex flex-row justify-center items-center p-1 sm:p-1.5 md:p-2 gap-2.5 w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 bg-[#31384A] border border-[#1F2937] rounded-[6px] sm:rounded-[8px] hover:bg-[#3F4A5F] hover:border-[#374151] active:bg-[#4B5563] transition-colors duration-200"
                              onClick={() => handlePinToggle(campaign.id)}
                            >
                              <img
                                className="w-2.5 sm:w-3 md:w-[15px] h-2.5 sm:h-3 md:h-[15px]"
                                alt={campaign.pinned ? "Unpin" : "Pin"}
                                src={campaign.pinned ? "/PinPinned.svg" : "/PinUnpinned.svg"}
                                style={{
                                  filter: campaign.pinned ? 'none' : 'brightness(0) invert(1)'
                                }}
                              />
                            </button>
                            
                            {/* Checkbox */}
                            <div className="flex flex-row items-center gap-2.5 w-4 sm:w-5 md:w-5 h-4 sm:h-5 md:h-5">
                              {campaign.selected ? (
                                <div 
                                  className="flex items-center justify-center w-4 sm:w-5 md:w-5 h-4 sm:h-5 md:h-5 bg-[#217EFD] rounded-[3px] sm:rounded-[4px] cursor-pointer"
                                  onClick={() => handleCheckboxToggle(campaign.id)}
                                >
                                  <svg 
                                    width="6" 
                                    height="5" 
                                    viewBox="0 0 12 9" 
                                    fill="none" 
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-1.5 sm:w-2 md:w-2.5 h-1 sm:h-1.5 md:h-1.5"
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
                                <div 
                                  className="w-4 sm:w-5 md:w-5 h-4 sm:h-5 md:h-5 bg-[#4B5563] rounded-[3px] sm:rounded-[4px] border border-[#6B7280] cursor-pointer hover:bg-[#5B6573] transition-colors" 
                                  onClick={() => handleCheckboxToggle(campaign.id)}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Metrics and Buzz Score */}
                          <div className="flex flex-col items-end gap-2 sm:gap-2.5 w-full">
                        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 lg:gap-1.5 w-full sm:w-full md:w-full">
                          <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-3 p-1.5 sm:p-2 md:p-2 lg:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                            <img className="w-4 sm:w-5 md:w-7 lg:w-[36px] h-4 sm:h-5 md:h-7 lg:h-[36px] flex-shrink-0" alt="Avg. Followers" src="/FollowerIcon.svg" />
                                <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-[7px] sm:text-[10px] md:text-xs lg:text-xs truncate">Avg. Followers</span>
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-[8px] sm:text-xs md:text-sm lg:text-sm whitespace-nowrap">{formatNumber(Math.round(cAvgFollowers))}</span>
                                  </div>
                                  </div>
                          <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-3 p-1.5 sm:p-2 md:p-2 lg:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                            <img className="w-4 sm:w-5 md:w-7 lg:w-[36px] h-4 sm:h-5 md:h-7 lg:h-[36px] flex-shrink-0" alt="Avg. Views" src="/AvgViewsIcon.svg" />
                            <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-[7px] sm:text-[10px] md:text-xs lg:text-xs truncate">Avg. Views</span>
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-[8px] sm:text-xs md:text-sm lg:text-sm whitespace-nowrap">{formatNumber(Math.round(cAvgViews))}</span>
                                </div>
                              </div>
                          <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-3 p-1.5 sm:p-2 md:p-2 lg:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                            <img className="w-4 sm:w-5 md:w-7 lg:w-[36px] h-4 sm:h-5 md:h-7 lg:h-[36px] flex-shrink-0" alt="Avg. Engagement" src="/EngagementIcon.svg" />
                            <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-400 text-[7px] sm:text-[10px] md:text-xs lg:text-xs truncate">Avg. Engagement</span>
                              <span className="[font-family:'Inter',Helvetica] font-semibold text-gray-50 text-[8px] sm:text-xs md:text-sm lg:text-sm whitespace-nowrap">{cAvgEngagement.toFixed(1)}%</span>
                          </div>
                              </div>
                        </div>

                        {false && (
                          <div className="relative flex-[0_0_auto] w-full sm:w-full md:w-full">
                            <div className="buzz-score-bar w-full h-2 sm:h-3 md:h-[14px] bg-[#31384a] rounded-[6px] sm:rounded-[8px] relative overflow-hidden">
                              <div className="buzz-score-progress h-full rounded-[6px] sm:rounded-[8px] transition-all duration-300 ease-in-out relative" style={{ width: `${Math.round(cAvgBuzz)}%`, background: 'linear-gradient(to right, #FC4C4B 0%, #CD45BA 50%, #6E57FF 100%)' }} />
                              <div className="buzz-score-text absolute top-0 h-full flex items-center text-white font-inter text-[8px] sm:text-xs font-extrabold px-0.5 z-10" style={{ left: `calc(${Math.round(cAvgBuzz)}% - 2.5px)`, transform: 'translateX(-100%)' }}>{Math.round(cAvgBuzz)}%</div>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Empty State */}
              {getPaginatedCampaigns().length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] text-center w-full absolute inset-0">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No lists yet</h3>
                  <p className="text-gray-500 mb-4">Create your first list to start organizing creators</p>
                  <button
                    onClick={() => setShowNewListModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create List
                  </button>
                </div>
              )}
                </>
              )}
                </div>
            </div>
            
            {/* Pagination Controls - Outside of content container for full width */}
            {!isLoading && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
                previousPage={previousPage}
                nextPage={nextPage}
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>

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
              className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNewList}
              disabled={newListName.trim().length === 0}
              className={`px-4 py-2 rounded-lg [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                newListName.trim().length === 0
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

   {/* List Detail Modal */}
   {showListDetailModal && selectedListForDetail && (
     isListDetailLoading ? (
       <ListDetailModalSkeleton />
     ) : (
       <ListDetailModal
       isOpen={showListDetailModal}
       list={selectedListForDetail}
       creators={listCreators}
       selectedCreatorIds={selectedCreators}
       onToggleSelectCreator={handleCreatorSelection}
       onSelectAllCreators={handleSelectAllCreators}
       onRemoveSelectedCreators={handleRemoveSelectedCreators}
       onClose={handleCloseListDetail}
       isEditingTitle={isEditingTitle}
       editedTitle={editedTitle}
       onStartTitleEdit={handleStartTitleEdit}
       onChangeEditedTitle={setEditedTitle}
       onSaveTitleEdit={handleSaveTitleEdit}
       onCancelTitleEdit={handleCancelTitleEdit}
       onTitleKeyPress={handleTitleKeyPress}
       availableTags={availableTags}
       showTagDropdown={showTagDropdown}
       selectedListTags={selectedListTags}
       searchTagQuery={searchTagQuery}
       setShowTagDropdown={setShowTagDropdown}
       setSelectedListTags={setSelectedListTags}
       setEditingListId={(id) => setEditingListId(id)}
       setSearchTagQuery={setSearchTagQuery}
       onTagToggle={handleTagToggle}
       onCreateTag={handleCreateTag}
       onCancelTags={handleCancelTags}
       onSaveTags={handleSaveTags}
       onImportComplete={handleImportComplete}
        // Rename tag: replace in selected and propagate to list cover immediately
        onRenameTag={async (oldName: string, newName: string) => {
          // Update UI
          const updated = new Set(Array.from(selectedListTags).map(t => (t === oldName ? newName : t)));
          setSelectedListTags(updated);
          const updatedListTags = Array.from(updated).map(name => ({ name, bgColor: "bg-[#56240580]", borderColor: "border-[#CA3300]" }));
          if (editingListId != null) {
            setCampaigns(prev => prev.map(c => (c.id === editingListId ? { ...c, tags: updatedListTags } : c)));
            if (selectedListForDetail && selectedListForDetail.id === editingListId) {
              setSelectedListForDetail({ ...selectedListForDetail, tags: updatedListTags });
            }
          }
          setAvailableTags(prev => (prev.includes(newName) ? prev : [newName, ...prev.filter(t => t !== oldName)]));
          // Persist rename
          try { await listsClient.renameTag(oldName, newName); } catch (e) { console.error('Failed to rename tag', e); }
        }}
        onCreatorRowClick={handleCreatorRowClick}
        // Immediate unlink on Remove from the dropdown + reflect in UI instantly
        onRemoveTag={async (name: string) => {
          try {
            // Delete the tag entirely for this user (removes it from all lists)
            await listsClient.deleteTag(name);
            // Remove from current selection if present
            setSelectedListTags(prev => {
              const next = new Set(prev);
              next.delete(name);
              return next;
            });
            // Remove from all lists' cover tags so dropdown doesn't resurface it via coverTags
            setCampaigns(prev => prev.map(c => ({
              ...c,
              tags: Array.isArray(c.tags) ? c.tags.filter((t: any) => t?.name !== name) : [],
            })));
            // Also update the open detail modal, if any
            if (selectedListForDetail) {
              setSelectedListForDetail({
                ...selectedListForDetail,
                tags: Array.isArray(selectedListForDetail.tags)
                  ? selectedListForDetail.tags.filter((t: any) => t?.name !== name)
                  : [],
              });
            }
            // Remove from available dropdown options
            setAvailableTags(prev => prev.filter(t => t !== name));
          } catch (e) {
            console.error('Failed to remove tag', e);
          }
        }}
       />
     )
   )}

  {/* Export Notice Modal */}
  {showExportNotice && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-[#1a1f2e] rounded-[15px] border border-gray-700 p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-50 mb-4 [font-family:'Inter',Helvetica]">Download started</h2>
        <p className="text-gray-300 mb-6 [font-family:'Inter',Helvetica] text-sm">{exportNoticeText}</p>
        <div className="flex gap-3 justify-end">
                  <button 
            onClick={() => setShowExportNotice(false)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200"
                  >
            Okay
                  </button>
                    </div>
                  </div>
                </div>
              )}

   {/* Remove Creators Confirmation Modal */}
   {showRemoveCreatorsConfirmationModal && (
     <ConfirmDialog 
       title="Remove Influencers"
       message={<><p>Are you sure you want to remove the selected influencer{selectedCreators.size > 1 ? 's' : ''} from this list? This action cannot be undone.</p><p className="text-xs text-[#9CA3AF] mt-2">Selected: {selectedCreators.size} influencer{selectedCreators.size !== 1 ? 's' : ''}</p></>}
       confirmText="Remove"
       onConfirm={handleConfirmRemoveCreators}
       onCancel={handleCancelRemoveCreators}
     />
   )}

   {/* Delete Confirmation Modal */}
   {showDeleteConfirmationModal && (
     <ConfirmDialog 
       title="Delete List"
       message={<><p>Are you sure you want to delete the selected list{hasSelectedCampaigns && campaigns.filter(c => c.selected).length > 1 ? 's' : ''}? This action cannot be undone.</p><p className="text-xs text-[#9CA3AF] mt-2">Selected: {campaigns.filter(c => c.selected).length} list{campaigns.filter(c => c.selected).length !== 1 ? 's' : ''}</p></>}
       confirmText="Delete"
       onConfirm={handleConfirmDelete}
       onCancel={handleCancelDelete}
     />
   )}

   {/* Import Creators Modal */}
   {showImportCreatorsModal && (
     <ImportCreatorsModal
       isOpen={showImportCreatorsModal}
       onClose={() => setShowImportCreatorsModal(false)}
       onUploadCsv={handleImportCsv}
       onAddFromDiscover={() => {
         setShowImportCreatorsModal(false);
         // Navigate to discover page
         window.location.href = '/dashboard/discover';
       }}
     />
   )}

   </>
 );
}