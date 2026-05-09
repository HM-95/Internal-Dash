import React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { Icon } from "../../ui/icon-component";
import { FilterDropdown } from "../../ui/filter-dropdown";
import { LocationFilterDropdown } from "../../ui/location-filter-dropdown";
import { PlatformFilterDropdown } from "../../ui/platform-filter-dropdown";
import { BuzzScoreFilterDropdown } from "../../ui/buzz-score-filter-dropdown";
import { EmailFilterDropdown } from "../../ui/email-filter-dropdown";
import { DatabaseFilters, CreatorListMode } from "../../../types/database";

interface CreatorFilterSectionProps {
  creatorData: {
    niches: any[];
    applyFilters: (filters: DatabaseFilters, mode?: CreatorListMode) => Promise<void>;
    currentMode: CreatorListMode;
    switchMode: (mode: CreatorListMode) => Promise<void>;
    loading: boolean;
  };
}

// Filter configurations
const filterConfigs = {
  engagement: {
    min: 0,
    max: 500,
    step: 1,
    formatValue: (value: number) => {
      if (value >= 500) return '500%+';
      return `${value}%`;
    },
    parseValue: (value: string) => {
      if (value.includes('500%+')) return 500;
      return parseFloat(value.replace('%', '')) || 0;
    },
    title: 'Filter by Engagement',
    unit: 'Engagement',
  },
  followers: {
    min: 10000,
    max: 10000000,
    step: 1000,
    formatValue: (value: number) => {
      if (value >= 10000000) return '10M+';
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
      return value.toString();
    },
    parseValue: (value: string) => {
      const numStr = value.toLowerCase().replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      if (value.includes('10m+')) return 10000000;
      if (value.includes('m')) return num * 1000000;
      if (value.includes('k')) return num * 1000;
      return num || 0;
    },
    title: 'Filter by Followers',
    unit: 'Followers',
  },
  avgViews: {
    min: 5000,
    max: 1000000,
    step: 1000,
    formatValue: (value: number) => {
      if (value >= 1000000) return '1M+';
      if (value >= 1000) {
        const kValue = value / 1000;
        // Display 500K instead of 503K for aesthetic purposes
        if (kValue >= 500 && kValue < 510) return '500K';
        return `${kValue.toFixed(0)}K`;
      }
      return value.toString();
    },
    parseValue: (value: string) => {
      const numStr = value.toLowerCase().replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      if (value.includes('m') || value.includes('1m+')) return 1000000;
      if (value.includes('k')) return num * 1000;
      return num || 0;
    },
    title: 'Filter by Avg. Views',
    unit: 'Views',
  },
};

export const CreatorFilterSection: React.FC<CreatorFilterSectionProps> = ({ creatorData }) => {
  const { niches, applyFilters, currentMode, switchMode, loading } = creatorData;

  // Filter dropdown options
  const filterOptions = [
    { name: "Followers", icon: "FollowersIcon.svg", key: "followers" },
    { name: "Avg. Views", icon: "EyeIcon.svg", key: "avgViews" },
    { name: "Engagement", icon: "EngagementIcon.svg", key: "engagement" },
    { name: "Location", icon: "LocationIcon.svg", key: "location" },
    { name: "Platform", icon: "PlatformIcon.svg", key: "platform" },
    { name: "Buzz Score", icon: "BuzzScoreIcon.svg", key: "buzzScore" },
    { name: "Email", icon: "EmailIcon.svg", key: "email" },
  ];

  // State for dropdown and visible categories
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [visibleCategories, setVisibleCategories] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  
  // Filter dropdown states
  const [openFilter, setOpenFilter] = React.useState<string | null>(null);
  const [filterValues, setFilterValues] = React.useState({
    engagement: [0, 500] as [number, number],
    followers: [10000, 10000000] as [number, number],
    avgViews: [5000, 1000000] as [number, number],
  });
  
  // Location filter state
  const [selectedLocations, setSelectedLocations] = React.useState<Set<string>>(new Set());
  
  // Buzz Score filter state (reset ranges)
  const [selectedBuzzScores, setSelectedBuzzScores] = React.useState<Set<string>>(new Set());
  
  // Platform filter state
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Set<string>>(new Set());
  
  // Email filter state - 'all' | 'email' | 'no-email'
  const [emailFilter, setEmailFilter] = React.useState<'all' | 'email' | 'no-email'>('all');
  
  // Track which filters have been applied (confirmed)
  const [appliedFilters, setAppliedFilters] = React.useState<Set<string>>(new Set());
  
  
  
  // Refs for measuring container width and filter buttons
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewAllButtonRef = React.useRef<HTMLButtonElement>(null);
  const clearAllButtonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const filterRowRef = React.useRef<HTMLDivElement>(null);
  const filterButtonRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Get dynamic niche names from database
  const allCategories = niches.map(niche => niche.name);
  
  // Hydrate filter UI state from persisted filters so chips/toggles show as applied on navigation
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedFiltersRaw = localStorage.getItem('discover_currentFilters');
      const savedEmailFilter = localStorage.getItem('discover_emailFilter');
      
      // Restore email filter
      if (savedEmailFilter === 'email' || savedEmailFilter === 'no-email') {
        setEmailFilter(savedEmailFilter);
      }
      
      // Mode is now always 'all' - no need to restore from localStorage
      if (!savedFiltersRaw) return;
      const saved = JSON.parse(savedFiltersRaw) as DatabaseFilters;
      // Normalize legacy buzz score labels so UI reflects the new buckets
      if (Array.isArray(saved.buzz_scores) && saved.buzz_scores.length) {
        const normalized = new Set<string>();
        saved.buzz_scores.forEach((label) => {
          switch (label) {
            case '90%+':
            case '70-90%':
            case '50-70%':
            case '30-50%':
            case 'Less than 30%':
              normalized.add(label);
              break;
            case '80-90%':
            case '70-80%':
              normalized.add('70-90%');
              break;
            case '60-70%':
              normalized.add('50-70%');
              break;
            case 'Less than 60%':
              normalized.add('30-50%');
              normalized.add('Less than 30%');
              break;
            default:
              break;
          }
        });
        saved.buzz_scores = Array.from(normalized);
      }
      if (saved.niches?.length) {
        setSelectedCategories(new Set(saved.niches));
      }
      if (saved.locations?.length) {
        setSelectedLocations(new Set(saved.locations));
      }
      if (saved.buzz_scores?.length) {
        setSelectedBuzzScores(new Set(saved.buzz_scores));
      }
      if (saved.platforms?.length) {
        setSelectedPlatforms(new Set(saved.platforms));
      }
      setFilterValues(prev => ({
        ...prev,
        engagement: [
          saved.engagement_min ?? filterConfigs.engagement.min,
          saved.engagement_max ?? filterConfigs.engagement.max,
        ],
        followers: [
          saved.followers_min ?? filterConfigs.followers.min,
          saved.followers_max ?? filterConfigs.followers.max,
        ],
        avgViews: [
          saved.avg_views_min ?? filterConfigs.avgViews.min,
          saved.avg_views_max ?? filterConfigs.avgViews.max,
        ],
      }));
      // Derive applied filters set
      const applied = new Set<string>();
      if (saved.niches?.length) applied.add('categories');
      if (saved.locations?.length) applied.add('location');
      if (saved.buzz_scores?.length) applied.add('buzzScore');
      if (saved.platforms?.length) applied.add('platform');
      if (
        (saved.engagement_min !== undefined && saved.engagement_min !== filterConfigs.engagement.min) ||
        (saved.engagement_max !== undefined && saved.engagement_max !== filterConfigs.engagement.max)
      ) {
        applied.add('engagement');
      }
      if (
        (saved.followers_min !== undefined && saved.followers_min !== filterConfigs.followers.min) ||
        (saved.followers_max !== undefined && saved.followers_max !== filterConfigs.followers.max)
      ) {
        applied.add('followers');
      }
      if (
        (saved.avg_views_min !== undefined && saved.avg_views_min !== filterConfigs.avgViews.min) ||
        (saved.avg_views_max !== undefined && saved.avg_views_max !== filterConfigs.avgViews.max)
      ) {
        applied.add('avgViews');
      }
      setAppliedFilters(applied);
    } catch (_e) {
      // ignore hydration errors
    }
    // run once on mount and when niches list length changes (to update chips order/visibility)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [niches.length]);

  // Helper function to get niche styling (all are primary niches now)
  const getNicheStyles = (nicheName: string, isSelected: boolean) => {
    // Match the creator card niche styling with our CSS variables
    return isSelected
      ? 'border rounded-[10px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap'
      : 'border rounded-[10px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap';
  };
  // Get ordered categories with selected ones first
  const getOrderedCategories = () => {
    const selected = allCategories.filter(cat => selectedCategories.has(cat));
    const unselected = allCategories.filter(cat => !selectedCategories.has(cat));
    return [...selected, ...unselected];
  };

  // Check if filter has non-default values
  const isFilterModified = (filterKey: string) => {
    if (filterKey === 'location') {
      return selectedLocations.size > 0;
    }
    
    if (filterKey === 'buzzScore') {
      return selectedBuzzScores.size > 0;
    }
    
    if (filterKey === 'platform') {
      return selectedPlatforms.size > 0;
    }
    
    if (filterKey === 'email') {
      return emailFilter !== 'all';
    }
    
    const config = filterConfigs[filterKey as keyof typeof filterConfigs];
    const currentValue = filterValues[filterKey as keyof typeof filterValues];
    if (!config || !currentValue) return false;
    
    return currentValue[0] !== config.min || currentValue[1] !== config.max;
  };

  // Calculate visible categories based on container width
  React.useEffect(() => {
    const calculateVisibleCategories = () => {
      if (!containerRef.current || !viewAllButtonRef.current || !clearAllButtonRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const viewAllButtonWidth = viewAllButtonRef.current.offsetWidth;
      const clearAllButtonWidth = clearAllButtonRef.current.offsetWidth;
      const isXLScreen = window.innerWidth >= 1280;
      const isLargeScreen = window.innerWidth >= 1024;
      const gap = isXLScreen ? 10 : isLargeScreen ? 8 : 6;
      
      const dividerWidth = 1;
      const buttonsWidth = viewAllButtonWidth + clearAllButtonWidth + dividerWidth;
      const buttonGaps = gap * 4;
      const safetyMargin = isXLScreen ? 25 : 15;
      const reservedWidth = buttonsWidth + buttonGaps + safetyMargin;
      
      const availableWidth = Math.max(0, containerWidth - reservedWidth);
      
      const visible: string[] = [];
      const orderedCategories = getOrderedCategories();

      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.whiteSpace = 'nowrap';
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      let totalTagsWidth = 0;

      for (let i = 0; i < orderedCategories.length; i++) {
        const category = orderedCategories[i];
        
        const tempBadge = document.createElement('button');
        tempBadge.className = `h-[32px] lg:h-[40px] xl:h-[44px] py-[6px] lg:py-[8px] xl:py-[10px] px-[8px] lg:px-[12px] xl:px-[16px] bg-sky-50 border border-[#dbe2eb] rounded-[8px] font-medium text-[12px] lg:text-[14px] xl:text-[15px] text-neutral-new900 ${
          selectedCategories.has(category) ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
        }`;
        tempBadge.textContent = category;
        tempContainer.appendChild(tempBadge);

        const badgeWidth = tempBadge.offsetWidth;
        const gapWidth = i > 0 ? gap : 0;
        const totalWidthWithThisTag = totalTagsWidth + gapWidth + badgeWidth;
        
        if (totalWidthWithThisTag <= availableWidth) {
          visible.push(category);
          totalTagsWidth = totalWidthWithThisTag;
        } else {
          break;
        }

        tempContainer.removeChild(tempBadge);
      }

      document.body.removeChild(tempContainer);
      setVisibleCategories(visible);
    };

    const timeoutId = setTimeout(calculateVisibleCategories, 50);
    
    const handleResize = () => {
      clearTimeout((window as any).categoryResizeTimeout);
      (window as any).categoryResizeTimeout = setTimeout(calculateVisibleCategories, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout((window as any).categoryResizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedCategories, allCategories]);

  // Handle category select
  const handleCategorySelect = (category: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    if (newSelectedCategories.has(category)) {
      newSelectedCategories.delete(category);
    } else {
      newSelectedCategories.add(category);
    }
    setSelectedCategories(newSelectedCategories);
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedCategories(new Set());
    // NO instant applyFilters call - only update local state
  };

  // Handle dropdown toggle
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle filter dropdown toggle
  const toggleFilterDropdown = (filterKey: string) => {
    setOpenFilter(openFilter === filterKey ? null : filterKey);
  };

  // Handle filter value changes
  const handleFilterValueChange = (filterKey: string, value: [number, number]) => {
    setFilterValues(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Handle location toggle
  const handleLocationToggle = (location: string) => {
    const newSelectedLocations = new Set(selectedLocations);
    if (newSelectedLocations.has(location)) {
      newSelectedLocations.delete(location);
    } else {
      newSelectedLocations.add(location);
    }
    setSelectedLocations(newSelectedLocations);
  };

  // Handle location reset
  const handleLocationReset = () => {
    setSelectedLocations(new Set());
  };

  // Handle location confirm
  const handleLocationConfirm = () => {
    const newAppliedFilters = new Set(appliedFilters);
    if (selectedLocations.size > 0) {
      newAppliedFilters.add('location');
    } else {
      newAppliedFilters.delete('location');
    }
    setAppliedFilters(newAppliedFilters);
    setOpenFilter(null);
  };

  // Handle match score toggle
  const handleBuzzScoreToggle = (score: string) => {
    const newSelectedScores = new Set(selectedBuzzScores);
    if (newSelectedScores.has(score)) {
      newSelectedScores.delete(score);
    } else {
      newSelectedScores.add(score);
    }
    setSelectedBuzzScores(newSelectedScores);
  };

  // Handle match score reset
  const handleBuzzScoreReset = () => {
    setSelectedBuzzScores(new Set());
  };

  // Handle match score confirm
  const handleBuzzScoreConfirm = () => {
    const newAppliedFilters = new Set(appliedFilters);
    if (selectedBuzzScores.size > 0) {
      newAppliedFilters.add('buzzScore');
    } else {
      newAppliedFilters.delete('buzzScore');
    }
    setAppliedFilters(newAppliedFilters);
    setOpenFilter(null);
  };

  // Handle platform toggle
  const handlePlatformToggle = (platform: string) => {
    const newSelectedPlatforms = new Set(selectedPlatforms);
    if (newSelectedPlatforms.has(platform)) {
      newSelectedPlatforms.delete(platform);
    } else {
      newSelectedPlatforms.add(platform);
    }
    setSelectedPlatforms(newSelectedPlatforms);
  };

  // Handle platform reset
  const handlePlatformReset = () => {
    setSelectedPlatforms(new Set());
  };

  // Handle platform confirm
  const handlePlatformConfirm = () => {
    const newAppliedFilters = new Set(appliedFilters);
    if (selectedPlatforms.size > 0) {
      newAppliedFilters.add('platform');
    } else {
      newAppliedFilters.delete('platform');
    }
    setAppliedFilters(newAppliedFilters);
    setOpenFilter(null);
  };

  // Handle filter apply (confirm)
  const handleFilterApply = (filterKey: string) => {
    const newAppliedFilters = new Set(appliedFilters);
    if (isFilterModified(filterKey)) {
      newAppliedFilters.add(filterKey);
    } else {
      newAppliedFilters.delete(filterKey);
    }
    setAppliedFilters(newAppliedFilters);
    setOpenFilter(null);
  };

  // Handle filter reset
  const handleFilterReset = (filterKey: string) => {
    const config = filterConfigs[filterKey as keyof typeof filterConfigs];
    if (config) {
      setFilterValues(prev => ({
        ...prev,
        [filterKey]: [config.min, config.max],
      }));
      
      const newAppliedFilters = new Set(appliedFilters);
      newAppliedFilters.delete(filterKey);
      setAppliedFilters(newAppliedFilters);
    }
  };

  // Handle Apply Filters button click - Convert to database filters and apply
  const handleApplyFilters = async () => {
    console.log('🔍 Applying filters with selected categories:', Array.from(selectedCategories));
    const databaseFilters: DatabaseFilters = {};

    // Add selected niches
    if (selectedCategories.size > 0) {
      databaseFilters.niches = Array.from(selectedCategories);
      console.log('🔍 Added niches to database filters:', databaseFilters.niches);
    }

    // Add selected locations
    if (selectedLocations.size > 0) {
      databaseFilters.locations = Array.from(selectedLocations);
    }

    // Add selected match scores
    if (selectedBuzzScores.size > 0) {
      databaseFilters.buzz_scores = Array.from(selectedBuzzScores);
    }

    // Add selected platforms
    if (selectedPlatforms.size > 0) {
      databaseFilters.platforms = Array.from(selectedPlatforms);
    }

    // Add email filter
    if (emailFilter !== 'all') {
      databaseFilters.email_required = emailFilter === 'email';
    }

    // Add range filters
    if (isFilterModified('engagement')) {
      databaseFilters.engagement_min = filterValues.engagement[0];
      databaseFilters.engagement_max = filterValues.engagement[1];
    }

    if (isFilterModified('followers')) {
      databaseFilters.followers_min = filterValues.followers[0];
      databaseFilters.followers_max = filterValues.followers[1];
    }

    if (isFilterModified('avgViews')) {
      databaseFilters.avg_views_min = filterValues.avgViews[0];
      databaseFilters.avg_views_max = filterValues.avgViews[1];
    }

    // Persist email filter to localStorage
    localStorage.setItem('discover_emailFilter', emailFilter);

    await applyFilters(databaseFilters, 'all');
  };

  // Handle email filter toggle
  const handleEmailFilterToggle = () => {
    if (emailFilter === 'all') {
      setEmailFilter('email');
    } else if (emailFilter === 'email') {
      setEmailFilter('no-email');
    } else {
      setEmailFilter('all');
    }
  };

  // Handle email filter reset
  const handleEmailFilterReset = () => {
    setEmailFilter('all');
  };

  // Handle email filter confirm
  const handleEmailFilterConfirm = () => {
    const newAppliedFilters = new Set(appliedFilters);
    if (emailFilter !== 'all') {
      newAppliedFilters.add('email');
    } else {
      newAppliedFilters.delete('email');
    }
    setAppliedFilters(newAppliedFilters);
    setOpenFilter(null);
  };

  // Handle dropdown positioning
  React.useEffect(() => {
    if (isDropdownOpen && dropdownRef.current && viewAllButtonRef.current) {
      const triggerRect = viewAllButtonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // Calculate optimal position
      let top = triggerRect.bottom + 8;
      let left = triggerRect.right - 320; // Align to right edge of button
      
      // Adjust for viewport boundaries
      const dropdownWidth = window.innerWidth < 640 ? 280 : window.innerWidth < 1024 ? 320 : 360;
      const dropdownHeight = 400; // Approximate height
      
      // Horizontal positioning
      if (left + dropdownWidth > viewport.width) {
        left = triggerRect.right - dropdownWidth;
      }
      if (left < 8) {
        left = 8;
      }
      
      // Vertical positioning - show above if not enough space below
      if (top + dropdownHeight > viewport.height && triggerRect.top > dropdownHeight) {
        top = triggerRect.top - dropdownHeight - 8;
      }
      
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
      dropdown.style.zIndex = '9999';
      
      // Handle scroll to keep dropdown positioned
      const handleScroll = () => {
        if (viewAllButtonRef.current && dropdownRef.current) {
          const newTriggerRect = viewAllButtonRef.current.getBoundingClientRect();
          let newTop = newTriggerRect.bottom + 8;
          let newLeft = newTriggerRect.right - dropdownWidth;
          
          // Reapply boundary checks
          if (newLeft + dropdownWidth > viewport.width) {
            newLeft = newTriggerRect.right - dropdownWidth;
          }
          if (newLeft < 8) {
            newLeft = 8;
          }
          
          if (newTop + dropdownHeight > viewport.height && newTriggerRect.top > dropdownHeight) {
            newTop = newTriggerRect.top - dropdownHeight - 8;
          }
          
          dropdownRef.current.style.top = `${newTop}px`;
          dropdownRef.current.style.left = `${newLeft}px`;
        }
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isDropdownOpen]);

  // Handle click outside dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <Card className="p-[12px] lg:p-[15px] xl:p-[18px] w-full rounded-[10px] flex-shrink-0 shadow-sm overflow-visible" style={{ backgroundColor: '#0F1419', borderColor: 'transparent' }}>
      <div className="flex flex-col gap-[10px] lg:gap-[12px] xl:gap-[15px] w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-[10px] lg:gap-[12px] xl:gap-[15px]">
            <h2 className="font-semibold text-[16px] lg:text-[18px] xl:text-[20px] leading-[20px] lg:leading-[24px] xl:leading-[28px] font-['Inter',Helvetica] text-white">
              Find Influencers
            </h2>
          </div>
        </div>

        {/* Dynamic Category badges row */}
        <div className="relative w-full overflow-visible">
            <div 
              ref={containerRef}
              className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] w-full min-w-0"
            >
              <div className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] flex-1 min-w-0 overflow-hidden">
                {visibleCategories.map((category, index) => (
                  <Button
                    key={`visible-category-${index}`}
                    variant="outline"
                    onClick={() => handleCategorySelect(category)}
                    className={`h-[28px] lg:h-[32px] xl:h-[36px] py-[4px] lg:py-[6px] xl:py-[8px] px-[6px] lg:px-[10px] xl:px-[12px] rounded-[10px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] transition-colors cursor-pointer flex-shrink-0 border whitespace-nowrap ${getNicheStyles(category, selectedCategories.has(category))}`}
                    style={{
                      // Match secondary niche colors from creator cards
                      backgroundColor: selectedCategories.has(category) ? '#14532d' : 'rgba(20, 83, 45, 0.5)',
                      borderColor: '#4ade80',
                      color: '#f9fafb',
                      background: selectedCategories.has(category) ? '#14532d !important' : 'rgba(20, 83, 45, 0.5) !important'
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="flex items-center flex-shrink-0">
                <Separator 
                  orientation="vertical" 
                  className="h-[28px] lg:h-[32px] xl:h-[36px] mr-[6px] lg:mr-[8px] xl:mr-[10px] bg-gray-600" 
                />

                <Button
                  ref={clearAllButtonRef}
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={selectedCategories.size === 0}
                  className={`h-[28px] lg:h-[32px] xl:h-[36px] py-[4px] lg:py-[6px] xl:py-[8px] px-[6px] lg:px-[10px] xl:px-[12px] rounded-[8px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] flex items-center gap-[4px] lg:gap-[6px] xl:gap-[8px] transition-colors whitespace-nowrap mr-[6px] lg:mr-[8px] xl:mr-[10px]`}
                  style={{
                    backgroundColor: selectedCategories.size === 0 ? '#374151' : '#1f2937',
                    borderColor: selectedCategories.size === 0 ? '#4b5563' : '#374151',
                    color: selectedCategories.size === 0 ? '#6b7280' : '#f9fafb',
                    background: selectedCategories.size === 0 ? '#374151 !important' : '#1f2937 !important'
                  }}
                >
                  Clear All
                </Button>

                <div className="relative" ref={dropdownRef}>
                  <Button
                    ref={viewAllButtonRef}
                    variant="outline"
                    onClick={toggleDropdown}
                    type="button"
                    className="h-[28px] lg:h-[32px] xl:h-[36px] py-[4px] lg:py-[6px] xl:py-[8px] px-[6px] lg:px-[10px] xl:px-[12px] rounded-[8px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] flex items-center gap-[4px] lg:gap-[6px] xl:gap-[8px] transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      color: '#f9fafb',
                      background: '#1f2937 !important'
                    }}
                  >
                    View All
                    <Icon
                      name="DropdownIcon.svg"
                      className={`w-[8px] h-[5px] lg:w-[10px] lg:h-[6px] xl:w-[12px] xl:h-[7px] transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                      alt="Dropdown icon"
                    />
                  </Button>

                  {isDropdownOpen && (
                    <div 
                      ref={dropdownRef}
                      className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] lg:w-[360px] rounded-[12px] shadow-lg overflow-hidden max-h-[90vh] z-[9999] border border-gray-700"
                      style={{
                        backgroundColor: '#1f2937',
                        position: 'fixed',
                        zIndex: 9999
                      }}
                    >
                      <div className="p-3 sm:p-4">
                        {/* Header */}
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-[14px] sm:text-[16px] font-semibold text-white">
                            All Categories
                          </h3>
                        </div>
                        
                        {/* Categories list */}
                        <div className="max-h-[200px] sm:max-h-[240px] lg:max-h-[280px] overflow-y-auto">
                          <div className="space-y-2">
                            {getOrderedCategories().map((category) => (
                              <div
                                key={category}
                                className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-[6px] cursor-pointer transition-colors`}
                                style={{
                                  backgroundColor: selectedCategories.has(category) ? '#1e40af' : 'transparent'
                                }}
                                onClick={() => handleCategorySelect(category)}
                              >
                                <span className={`text-[12px] sm:text-[14px] cursor-pointer flex-1`} style={{
                                  color: selectedCategories.has(category) ? '#f9fafb' : '#f9fafb',
                                  fontWeight: selectedCategories.has(category) ? '500' : 'normal'
                                }}>
                                  {category}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Filter buttons row */}
        <div className="flex items-center justify-between w-full gap-[6px] lg:gap-[8px] xl:gap-[10px]">
          {/* Filter dropdowns */}
          <div className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] flex-1 min-w-0">
              {filterOptions.map((filter) => (
              <div key={filter.key} className="relative flex-1 min-w-0">
                <Button
                  ref={(el) => {
                    if (filterButtonRefs.current) {
                      filterButtonRefs.current[filter.key] = el;
                    }
                  }}
                  variant="outline"
                  onClick={() => toggleFilterDropdown(filter.key)}
                  className={`h-[28px] lg:h-[32px] xl:h-[36px] py-[4px] lg:py-[6px] xl:py-[8px] px-[6px] lg:px-[10px] xl:px-[12px] rounded-[8px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] flex items-center gap-[3px] lg:gap-[4px] xl:gap-[6px] transition-colors cursor-pointer w-full border whitespace-nowrap`}
                  style={{
                    backgroundColor: isFilterModified(filter.key) ? '#1e40af' : '#1f2937',
                    borderColor: isFilterModified(filter.key) ? '#3b82f6' : '#374151',
                    color: '#f9fafb',
                    background: isFilterModified(filter.key) ? '#1e40af !important' : '#1f2937 !important'
                  }}
                >
                  <Icon
                    name={filter.icon}
                    className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px] flex-shrink-0"
                    alt={`${filter.name} icon`}
                  />
                  <span className="hidden sm:block lg:hidden truncate min-w-0">
                    {filter.name === "Buzz Score" ? "Buzz" : 
                     filter.name === "Engagement" ? "Engage" :
                     filter.name === "Followers" ? "Follow" :
                     filter.name === "Avg. Views" ? "Views" :
                     filter.name === "Platform" ? "Platform" :
                     filter.name === "Location" ? "Location" :
                     filter.name === "Email" ? "Email" : filter.name}
                  </span>
                  <span className="hidden lg:block truncate min-w-0">{filter.name}</span>
                  <Icon
                    name="DropdownIcon.svg"
                    className={`w-[5px] h-[3px] sm:w-[6px] sm:h-[4px] lg:w-[8px] lg:h-[5px] xl:w-[10px] xl:h-[6px] flex-shrink-0 transition-transform ${
                      openFilter === filter.key ? 'rotate-180' : ''
                    }`}
                    alt="Dropdown icon"
                  />
                </Button>

                {/* Location filter dropdown */}
                {filter.key === 'location' && (
                  <LocationFilterDropdown
                    isOpen={openFilter === 'location'}
                    onClose={() => setOpenFilter(null)}
                    selectedLocations={selectedLocations}
                    onLocationToggle={handleLocationToggle}
                    onReset={handleLocationReset}
                    onConfirm={handleLocationConfirm}
                    triggerRef={{ current: filterButtonRefs.current.location }}
                  />
                )}

                {/* Match Score filter dropdown */}
                {filter.key === 'buzzScore' && (
                  <BuzzScoreFilterDropdown
                    isOpen={openFilter === 'buzzScore'}
                    onClose={() => setOpenFilter(null)}
                    selectedScores={selectedBuzzScores}
                    onScoreToggle={handleBuzzScoreToggle}
                    onReset={handleBuzzScoreReset}
                    onConfirm={handleBuzzScoreConfirm}
                    triggerRef={{ current: filterButtonRefs.current.buzzScore }}
                  />
                )}

                {/* Platform filter dropdown */}
                {filter.key === 'platform' && (
                  <PlatformFilterDropdown
                    isOpen={openFilter === 'platform'}
                    onClose={() => setOpenFilter(null)}
                    selectedPlatforms={selectedPlatforms}
                    onPlatformToggle={handlePlatformToggle}
                    onReset={handlePlatformReset}
                    onConfirm={handlePlatformConfirm}
                    triggerRef={{ current: filterButtonRefs.current.platform }}
                  />
                )}

                {/* Email filter dropdown */}
                {filter.key === 'email' && (
                  <EmailFilterDropdown
                    isOpen={openFilter === 'email'}
                    onClose={() => setOpenFilter(null)}
                    selectedEmailFilter={emailFilter}
                    onEmailFilterToggle={handleEmailFilterToggle}
                    onReset={handleEmailFilterReset}
                    onConfirm={handleEmailFilterConfirm}
                    triggerRef={{ current: filterButtonRefs.current.email }}
                  />
                )}

                {/* Range filter dropdowns */}
                {['engagement', 'followers', 'avgViews'].includes(filter.key) && (
                  <FilterDropdown
                    isOpen={openFilter === filter.key}
                    onClose={() => setOpenFilter(null)}
                    config={filterConfigs[filter.key as keyof typeof filterConfigs]}
                    value={filterValues[filter.key as keyof typeof filterValues]}
                    onValueChange={(value) => handleFilterValueChange(filter.key, value)}
                    onApply={() => handleFilterApply(filter.key)}
                    onReset={() => handleFilterReset(filter.key)}
                    triggerRef={{ current: filterButtonRefs.current[filter.key] }}
                  />
                )}
              </div>
            ))}
          </div>
          
          {/* Apply Filters button */}
          <div className="flex items-center gap-[6px] lg:gap-[8px] xl:gap-[10px] flex-shrink-0">
              <Separator 
                orientation="vertical" 
                className="hidden sm:block h-[28px] lg:h-[32px] xl:h-[36px] dark:bg-gray-600" 
              />

              <Button
                onClick={handleApplyFilters}
                disabled={loading}
                className="h-[28px] lg:h-[32px] xl:h-[36px] py-[4px] lg:py-[6px] xl:py-[8px] px-[10px] sm:px-[12px] lg:px-[18px] xl:px-[24px] bg-[linear-gradient(90deg,#557EDD_0%,#6C40E4_100%)] hover:bg-[linear-gradient(90deg,#4A6BC8_0%,#5A36C7_100%)] border-transparent rounded-[8px] font-medium text-[11px] lg:text-[12px] xl:text-[13px] text-white flex items-center gap-[3px] lg:gap-[4px] xl:gap-[6px] hover:text-gray-100 transition-all justify-center whitespace-nowrap flex-shrink-0 min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] xl:min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
                variant="outline"
              >
                <Icon
                  name="FilterIcon.svg"
                  className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px] text-white flex-shrink-0"
                  alt="Filter icon"
                />
                <span className="hidden lg:inline">{loading ? 'Applying...' : 'Apply Filters'}</span>
                <span className="hidden sm:inline lg:hidden">{loading ? 'Applying...' : 'Apply'}</span>
                <span className="sm:hidden">{loading ? '...' : 'Apply'}</span>
              </Button>
            </div>
        </div>
      </div>
    </Card>
  );
};