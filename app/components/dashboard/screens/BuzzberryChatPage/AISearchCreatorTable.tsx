import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon-component';
import { AISearchDonutChart } from './AISearchDonutChart';

// AI Search specific creator type (matching CreatorRecommendation from useAIChat)
interface AICreator {
  id: string;
  creator_id: number;
  handle: string;
  display_name: string;
  bio: string;
  primary_niche: string;
  secondary_niche: string;
  followers_count: number;
  average_views: number;
  engagement_rate: number;
  buzz_score: number;
  hashtags: string[];
  location: string;
  location_region: string;
  platform: string;
  profile_image_url?: string;
  final_score?: number;
  // Optional fields for trend data
  followers_change?: number;
  average_views_change?: number;
  engagement_rate_change?: number;
}

type SortField = 'followers' | 'avg_views' | 'engagement' | 'buzz_score' | 'final_score';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

interface AISearchCreatorTableProps {
  creators: AICreator[];
  selectedIds: Set<string>;
  expandedIds?: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll?: () => void;
  onRowClick: (creator: AICreator) => void;
  onSort?: (field: SortField) => void;
  sortState?: SortState;
  isLoading?: boolean;
  showMatchScore?: boolean; // AI-specific feature
  showRecommendationReason?: boolean; // AI-specific feature
}

// Helper functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const getMatchScoreStyle = (score: number) => ({
  backgroundColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
  color: 'white',
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '600'
});

export const AISearchCreatorTable: React.FC<AISearchCreatorTableProps> = ({
  creators,
  selectedIds,
  expandedIds = new Set(),
  onToggleSelect,
  onToggleAll,
  onRowClick,
  onSort,
  sortState,
  isLoading = false,
  showMatchScore = true,
  showRecommendationReason = false
}) => {
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="dark w-full creator-list-container" data-ai-search="true">
        <div className="overflow-x-auto lg:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="creator-list-table">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 lg:gap-6 pl-4 pr-4 py-3 rounded-t-lg border-b text-[11px] lg:text-[13px] font-medium creator-list-header bg-[#374151] border-[#4b5563] text-[#d1d5db]">
            <div className="w-10 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-28 lg:w-32 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 lg:w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 lg:w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 lg:w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-20 lg:w-24 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 lg:w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-16 lg:w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
          </div>
          
          {/* Row skeletons */}
          <div className="rounded-b-lg border border-t-0 overflow-hidden creator-list-body bg-[#1f2937] border-[#374151]">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="flex items-center gap-4 lg:gap-6 pl-4 pr-4 py-4 border-b border-[#374151] last:border-b-0">
                <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="flex items-center gap-3 w-28 lg:w-32">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-600 rounded mb-2 animate-pulse"></div>
                    <div className="h-2 bg-gray-600 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-16 lg:w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (creators.length === 0) {
    return (
      <div className="dark w-full creator-list-container" data-ai-search="true">
        <div className="text-center py-8">
          <p className="text-gray-400">No creators found</p>
        </div>
      </div>
    );
  }

  const getPlatformLogo = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      'instagram': 'InstagramLogo.svg',
      'tiktok': 'TikTokLogo.svg',
      'youtube': 'YoutubeLogo.svg',
      'x': 'XLogo.svg',
      'twitter': 'XLogo.svg'
    };
    return platformMap[platform.toLowerCase()] || 'InstagramLogo.svg';
  };

  return (
    <div className="dark w-full creator-list-container" data-ai-search="true">
      <div className="overflow-x-auto lg:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="creator-list-table">
        {/* Table Header */}
        <div className="flex items-center gap-4 lg:gap-6 pl-4 pr-4 py-3 rounded-t-lg border-b text-[11px] lg:text-[13px] font-medium creator-list-header bg-[#374151] border-[#4b5563] text-[#d1d5db]">
          {/* Checkbox Column */}
          <div className="w-10 lg:w-12 flex justify-center">
            <div className="w-4 h-4"></div>
          </div>
          
          {/* Influencers Column */}
          <div className="flex-1 min-w-[180px]">
            <span className="truncate">Influencers</span>
          </div>
          
          {/* Match Score Column */}
          <div className="w-20 lg:w-24 text-center">
            {onSort ? (
              <button onClick={() => onSort('final_score')} className="flex items-center gap-1 justify-center hover:text-gray-100 transition-colors cursor-pointer w-full">
                <span className="truncate">Match</span>
                <Icon name="SortIcon.svg" className={`w-2 h-2 flex-shrink-0 transition-transform ${sortState?.field === 'final_score' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
              </button>
            ) : (
              <span className="truncate">Match</span>
            )}
          </div>
          
          {/* Followers Column */}
          <div className="w-20 lg:w-24 text-center">
            {onSort ? (
              <button onClick={() => onSort('followers')} className="flex items-center gap-1 justify-center hover:text-gray-100 transition-colors cursor-pointer w-full">
                <span className="truncate">Followers</span>
                <Icon name="SortIcon.svg" className={`w-2 h-2 flex-shrink-0 transition-transform ${sortState?.field === 'followers' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
              </button>
            ) : (
              <span className="truncate">Followers</span>
            )}
          </div>
          
          {/* Average Views Column */}
          <div className="w-20 lg:w-24 text-center">
            {onSort ? (
              <button onClick={() => onSort('avg_views')} className="flex items-center gap-1 justify-center hover:text-gray-100 transition-colors cursor-pointer w-full">
                <span className="truncate">Views</span>
                <Icon name="SortIcon.svg" className={`w-2 h-2 flex-shrink-0 transition-transform ${sortState?.field === 'avg_views' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
              </button>
            ) : (
              <span className="truncate">Views</span>
            )}
          </div>
          
          {/* Category Column */}
          <div className="w-28 lg:w-32">
            <span className="truncate">Category</span>
          </div>
          
          {/* Location Column */}
          <div className="w-20 lg:w-24 text-center">
            <span className="truncate">Location</span>
          </div>
          
          {/* Buzz Score Column */}
          <div className="w-16 lg:w-20 text-center">
            <span className="truncate">Buzz</span>
          </div>
        </div>

        {/* Table Rows */}
        <div className="rounded-b-lg border border-t-0 overflow-hidden creator-list-body bg-[#1f2937] border-[#374151]">
          {creators.map((creator, index) => (
            <div
              key={creator.id}
              onClick={() => onRowClick(creator)}
              className={`flex items-center gap-4 lg:gap-6 pl-4 pr-4 py-4 hover:bg-[#4b5563] transition-colors cursor-pointer bg-[#1f2937] ${
                index !== creators.length - 1 ? 'border-b border-[#374151]' : ''
              } ${
                selectedIds.has(creator.id) ? 'border-l-4 border-l-[#94c4fc]' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="w-10 lg:w-12 flex justify-center">
                <Checkbox
                  checked={selectedIds.has(creator.id)}
                  onCheckedChange={(checked) => {
                    onToggleSelect(creator.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 border-2 border-[#DBE2EB] rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-gray-500"
                />
              </div>

              {/* Creator Info */}
              <div className="flex-1 min-w-[180px] flex items-center gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#384455] rounded-full overflow-hidden flex-shrink-0">
                  {creator.profile_image_url ? (
                    <img
                      src={creator.profile_image_url}
                      alt={`${creator.display_name} profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#384455] flex items-center justify-center text-white font-semibold text-xs">
                      {creator.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="font-semibold text-gray-100 text-[10px] lg:text-[12px] truncate">
                    {creator.display_name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-[9px] lg:text-[11px] font-medium truncate">
                      {creator.handle}
                    </span>
                    <img 
                      src={`/${getPlatformLogo(creator.platform)}`} 
                      className="w-3.5 h-3.5 flex-shrink-0" 
                      alt={`${creator.platform} logo`} 
                    />
                  </div>
                </div>
              </div>

              {/* Match Score */}
              <div className="w-20 lg:w-24 flex justify-center">
                <div style={getMatchScoreStyle((creator as any).match_score || creator.final_score || 0)}>
                  {Math.round((creator as any).match_score || creator.final_score || 0)}%
                </div>
              </div>

              {/* Followers */}
              <div className="w-20 lg:w-24 text-center">
                <div className="text-[10px] lg:text-[12px] font-medium text-gray-100">
                  {formatNumber(creator.followers_count)}
                </div>
                {creator.followers_change !== undefined && creator.followers_change !== 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Icon 
                      name={creator.followers_change > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} 
                      className="w-2 h-2 flex-shrink-0" 
                      alt={creator.followers_change > 0 ? 'Positive change' : 'Negative change'} 
                    />
                    <span className={`text-[10px] font-medium ${creator.followers_change > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>
                      {Math.abs(creator.followers_change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Average Views */}
              <div className="w-20 lg:w-24 text-center">
                <div className="text-[10px] lg:text-[12px] font-medium text-gray-100">
                  {formatNumber(creator.average_views)}
                </div>
                {creator.average_views_change !== undefined && creator.average_views_change !== 0 && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Icon 
                      name={creator.average_views_change > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} 
                      className="w-2 h-2 flex-shrink-0" 
                      alt={creator.average_views_change > 0 ? 'Positive change' : 'Negative change'} 
                    />
                    <span className={`text-[10px] font-medium ${creator.average_views_change > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>
                      {Math.abs(creator.average_views_change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="w-28 lg:w-32 flex flex-col gap-1">
                {/* Primary Niche */}
                <Badge
                  variant="outline"
                  className="px-2 py-0.5 rounded-lg bg-[#1E3A8A]/70 border-[#2563EB] text-[#2563EB] w-fit"
                >
                  <span className="font-medium text-[9px] lg:text-[11px]">{creator.primary_niche}</span>
                </Badge>
                {/* Secondary Niche */}
                {creator.secondary_niche && (
                  <Badge
                    variant="outline"
                    className="px-2 py-0.5 rounded-lg bg-[#14532D]/70 border-[#16A34A] text-[#16A34A] w-fit"
                  >
                    <span className="font-medium text-[9px] lg:text-[11px]">{creator.secondary_niche}</span>
                  </Badge>
                )}
              </div>

              {/* Location */}
              <div className="w-20 lg:w-24 text-center">
                <div className="text-[9px] lg:text-[11px] text-gray-100">
                  {creator.location || creator.location_region ? (
                    <div className="flex flex-col">
                      <div className="truncate">{(creator.location || creator.location_region || '').split(', ')[0]}</div>
                      {(creator.location || creator.location_region || '').includes(', ') && (
                        <div className="truncate text-[10px] text-gray-400">
                          {(creator.location || creator.location_region || '').split(', ')[1]}
                        </div>
                      )}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>

              {/* Buzz Score */}
              <div className="w-16 lg:w-20 flex justify-center">
                <AISearchDonutChart score={creator.buzz_score} size={32} strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
