import React from "react";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon-component";
import { DonutChart } from "@/components/ui/donut-chart";
import { formatNumber, getSocialMediaIcon, getMatchScoreColor, getMatchScoreStyle } from "@/utils/formatters";
import { Creator, SortState, SortField } from "@/types/database";

interface CreatorListViewProps {
  creators: Creator[];
  currentMode: string;
  selectedCards: Set<string>;
  handleCreatorClick: (creator: Creator) => void;
  handleCardSelection: (creatorId: string) => void;
  selectedCreator: Creator | null;
  sortState: SortState;
  handleSort: (field: SortField) => Promise<void>;
}

const CreatorListView: React.FC<CreatorListViewProps> = ({
  creators,
  currentMode,
  selectedCards,
  handleCreatorClick,
  handleCardSelection,
  selectedCreator,
  sortState,
  handleSort,
}) => {
  const pathname = usePathname();
  
  // Don't render on chat page to prevent interference with AISearchCreatorTable
  if (pathname && pathname.includes('/chat')) {
    return null;
  }
  
  return (
  <div className="dark w-full overflow-x-auto lg:overflow-x-visible creator-list-container">
    <div className={`${currentMode === 'ai' ? "min-w-[900px] sm:min-w-[1050px] md:min-w-[1200px] lg:min-w-[1300px] xl:min-w-0" : "min-w-[880px] sm:min-w-[1000px] md:min-w-[1100px] lg:min-w-[1200px] xl:min-w-0"} creator-list-table`}>
      {/* Table Header */}
      <div className={`gap-3 sm:gap-4 lg:gap-5 px-4 py-3 rounded-t-lg border-b text-[10px] sm:text-xs lg:text-[13px] xl:text-[14px] font-medium creator-list-header bg-[#374151] border-[#4b5563] text-[#d1d5db] ${
        currentMode === 'ai'
          ? "grid grid-cols-[40px_180px_90px_90px_90px_90px_120px_110px_80px_40px] md:grid-cols-[50px_200px_100px_100px_100px_100px_140px_120px_90px_50px] lg:grid-cols-[60px_220px_110px_110px_110px_110px_140px_120px_100px_60px] xl:grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.1fr_1fr_0.9fr_60px]"
          : "grid grid-cols-[40px_180px_90px_90px_90px_130px_110px_80px_40px] md:grid-cols-[50px_200px_100px_100px_100px_140px_120px_90px_50px] lg:grid-cols-[60px_220px_110px_110px_110px_140px_120px_100px_60px] xl:grid-cols-[60px_2fr_1fr_1fr_1fr_1.1fr_1fr_0.9fr_60px]"
      }`}>
        <div></div>
        {/* Influencers - No sorting */}
        <div className="flex items-center gap-1 sm:gap-2 justify-start">
          <span className="truncate">Influencers</span>
        </div>
        {/* Match Score - Sortable - Only show in AI mode */}
        {currentMode === 'ai' && (
          <button onClick={() => handleSort('match_score')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
            <span className="truncate">Match Score</span>
            <Icon name="SortIcon.svg" className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState.field === 'match_score' && sortState.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
          </button>
        )}
        {/* Followers - Sortable */}
        <button onClick={() => handleSort('followers')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
          <span className="truncate">Followers</span>
          <Icon name="SortIcon.svg" className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState.field === 'followers' && sortState.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
        </button>
        {/* Average Views - Sortable */}
        <button onClick={() => handleSort('avg_views')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
          <span className="truncate"><span className="hidden md:inline lg:inline xl:hidden">Avg. Views</span><span className="md:hidden lg:hidden xl:inline">Average Views</span></span>
          <Icon name="SortIcon.svg" className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState.field === 'avg_views' && sortState.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
        </button>
        {/* Engagement - Sortable */}
        <button onClick={() => handleSort('engagement')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
          <span className="truncate">Engagement</span>
          <Icon name="SortIcon.svg" className={`w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState.field === 'engagement' && sortState.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
        </button>
        {/* Category - No sorting */}
        <div><span className="truncate">Category</span></div>
        {/* Location - No sorting */}
        <div className="flex items-center justify-center"><span className="truncate">Location</span></div>
        {/* Buzz Score - No sorting */}
        <div className="flex items-center justify-center"><span className="truncate">Buzz Score</span></div>
        <div></div>
      </div>
      {/* Table Rows */}
      <div className="rounded-b-lg border border-t-0 overflow-hidden creator-list-body bg-[#202a37] border-[#374151]">
        {creators.map((creator: Creator, index: number) => (
          <div
            key={creator.id}
            onClick={() => handleCreatorClick(creator)}
            className={`creator-list-row gap-3 sm:gap-4 lg:gap-5 px-4 py-4 items-center hover:bg-[#374151] transition-colors cursor-pointer bg-[#202a37] ${
              index !== creators.length - 1 ? 'border-b border-[#374151]' : ''
            } ${
              selectedCreator?.id === creator.id ? 'bg-blue-900/20' : ''
            } ${
              selectedCards.has(creator.id) ? 'border-l-4 border-l-[#94c4fc]' : ''
            } ${
              currentMode === 'ai'
                ? "grid grid-cols-[40px_180px_90px_90px_90px_90px_120px_110px_80px_40px] md:grid-cols-[50px_200px_100px_100px_100px_100px_140px_120px_90px_50px] lg:grid-cols-[60px_220px_110px_110px_110px_110px_140px_120px_100px_60px] xl:grid-cols-[60px_2fr_1fr_1fr_1fr_1fr_1.1fr_1fr_0.9fr_60px]"
                : "grid grid-cols-[40px_180px_90px_90px_90px_130px_110px_80px_40px] md:grid-cols-[50px_200px_100px_100px_100px_140px_120px_90px_50px] lg:grid-cols-[60px_220px_110px_110px_110px_140px_120px_100px_60px] xl:grid-cols-[60px_2fr_1fr_1fr_1fr_1.1fr_1fr_0.9fr_60px]"
            }`}
          >
            {/* Checkbox - Leftmost position */}
            <div className="flex justify-center">
              <Checkbox
                checked={selectedCards.has(creator.id)}
                onCheckedChange={(checked) => {
                  handleCardSelection(creator.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#DBE2EB] rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-gray-500"
              />
            </div>
            {/* Creator Info - Always show name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-[#384455] rounded-full overflow-hidden flex-shrink-0">
                {creator.profile_pic ? (
                  <img
                    src={creator.profile_pic}
                    alt={`${creator.username} profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#384455]" />
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="font-semibold text-gray-100 text-xs lg:text-[13px] xl:text-[14px] min-w-0 max-w-[140px] xl:max-w-none truncate">
                  {creator.username}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-gray-400 text-[10px] lg:text-[11px] xl:text-[12px] font-medium truncate">
                    {creator.username_tag}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {creator.social_media.map((social, iconIndex) => (
                      <Icon
                        key={iconIndex}
                        name={getSocialMediaIcon(social.platform)}
                        className="w-[10px] h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px]"
                        alt={`${social.platform} logo`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Match Score - Only show in AI mode */}
            {currentMode === 'ai' && (
              <div className="flex justify-center">
                <div style={getMatchScoreStyle(creator.match_score || 0)}>
                  {creator.match_score || 0}%
                </div>
              </div>
            )}
            {/* Followers */}
            <div className="text-center text-xs lg:text-[13px] xl:text-[13px] font-medium text-gray-100">
              <div>{formatNumber(creator.followers)}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {((creator.followers_change ?? 0) === 0) ? (
                  <span className="mr-0.5 text-gray-500">-</span>
                ) : (
                  <Icon name={(creator.followers_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={(creator.followers_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                )}
                <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.followers_change ?? 0) === 0) ? 'text-gray-500' : (creator.followers_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.followers_change ?? 0).toFixed(2)}%</span>
              </div>
            </div>
            {/* Average Views */}
            <div className="text-center text-xs lg:text-[13px] xl:text-[13px] font-medium text-gray-100">
              <div>{formatNumber(creator.avg_views)}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {((creator.avg_views_change ?? 0) === 0) ? (
                  <span className="mr-0.5 text-gray-500">-</span>
                ) : (
                  <Icon name={(creator.avg_views_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={(creator.avg_views_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                )}
                <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.avg_views_change ?? 0) === 0) ? 'text-gray-500' : (creator.avg_views_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.avg_views_change ?? 0).toFixed(2)}%</span>
              </div>
            </div>
            {/* Engagement */}
            <div className="text-center">
              <div className="text-gray-100 font-medium text-xs lg:text-[13px] xl:text-[13px]">
                {creator.engagement.toFixed(2)}%
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {((creator.engagement_change ?? 0) === 0) ? (
                  <span className="mr-0.5 text-gray-500">-</span>
                ) : (
                  <Icon name={(creator.engagement_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={(creator.engagement_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                )}
                <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.engagement_change ?? 0) === 0) ? 'text-gray-500' : (creator.engagement_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.engagement_change ?? 0).toFixed(2)}%</span>
              </div>
            </div>
            {/* Category */}
            <div className="flex flex-col gap-1 min-w-0">
              {creator.niches.map((niche, index) => (
                <div key={index} className="flex items-center">
                  <Badge
                    variant="outline"
                    className={`px-[6px] lg:px-[8px] xl:px-[10px] py-[2px] lg:py-[3px] xl:py-[4px] rounded-[4px] lg:rounded-[6px] xl:rounded-[8px] ${niche.type === 'primary' ? 'bg-[#1E3A8A]/50 border-[#3B82F6] text-[#3B82F6]' : 'bg-[#14532D]/50 border-[#22C55E] text-[#22C55E]'}`}
                  >
                    <span className="font-medium text-[10px] lg:text-[11px] xl:text-[12px]">{niche.name}</span>
                  </Badge>
                </div>
              ))}
            </div>
            {/* Location */}
            <div className="text-xs lg:text-[13px] xl:text-[13px] text-gray-100 text-center">
              {creator.location ? (
                <div className="flex flex-col">
                  <div className="truncate">{creator.location.split(', ')[0]}</div>
                  {creator.location.includes(', ') && <div className="truncate">{creator.location.split(', ')[1]}</div>}
                </div>
              ) : (
                'N/A'
              )}
            </div>
            {/* Buzz Score - Donut Chart */}
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-full max-w-[60px] sm:max-w-[70px] lg:max-w-[80px] xl:max-w-none">
                <DonutChart score={creator.buzz_score} size={38} strokeWidth={4} />
              </div>
            </div>
            {/* Empty space for alignment */}
            <div></div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default CreatorListView; 