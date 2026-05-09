import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon-component";
import { formatNumber, getSocialMediaIcon, getMatchScoreColor, getMatchScoreStyle } from "@/utils/formatters";
import { Creator } from "@/types/database";

interface CreatorCardProps {
  creator: Creator;
  currentMode: string;
  selected: boolean;
  selectedCreator: Creator | null;
  onClick: () => void;
  onCheckboxChange: (checked: boolean) => void;
}

const getNicheBadgeClasses = (type: string): string => {
  // Standardize colors across app
  return type === 'primary'
    ? 'bg-[#1E3A8A]/50 border border-[#3B82F6] text-[#3B82F6]'
    : 'bg-[#14532D]/50 border border-[#22C55E] text-[#22C55E]';
};

const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  currentMode,
  selected,
  selectedCreator,
  onClick,
  onCheckboxChange,
}) => (
  <Card
    onClick={onClick}
    className={`w-full rounded-[18px] p-0 border transition-all cursor-pointer ${
      selected ? 'border-[#94c4fc]' : 'border-[#243042]'
    } ${
      selectedCreator?.id === creator.id ? 'bg-[#202a37]' : 'bg-[#202a37]'
    } shadow-sm hover:shadow-md`}
  >
    <CardContent className="flex flex-col gap-3 p-4">
      {/* Profile Section - Horizontal Layout */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-[44px] h-[44px] bg-[#384455] rounded-full flex-shrink-0 overflow-hidden">
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
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-gray-100 text-[15px] leading-[18px] truncate max-w-[calc(100%-8px)]">
              {creator.username}
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-gray-400 text-[12px] font-medium truncate max-w-[calc(100%-20px)]">{creator.username_tag}</span>
              {creator.social_media.map((social, iconIndex) => (
                <Icon
                  key={iconIndex}
                  name={getSocialMediaIcon(social.platform)}
                  className="w-[14px] h-[14px] ml-[1px] flex-shrink-0"
                  alt={`${social.platform} logo`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-[7px]">
          {currentMode === "ai" && (
            <div style={getMatchScoreStyle(creator.match_score || 0)}>
              <span>{creator.match_score || 0}%</span>
            </div>
          )}
          <Checkbox
            checked={selected}
            onCheckedChange={onCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            className="w-[18px] h-[18px] p-0 border-2 border-gray-300 rounded-[3px] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-gray-500"
            id={`select-${creator.id}`}
          />
        </div>
      </div>
      {/* Bio */}
      <div className="text-gray-400 text-[12px] font-medium leading-[16px] mb-1 line-clamp-2 min-h-[32px]">{creator.bio}</div>
      {/* Metrics Section */}
      <div className="flex items-center justify-between gap-2 w-full mb-2">
        {/* Followers */}
        <div className="flex flex-col items-center flex-1 bg-[#1B2432] border border-[#2A3546] rounded-lg p-2">
          <Icon name="FollowerIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Followers icon" />
          <span className="font-semibold text-gray-100 text-[13px] leading-[16px]">{formatNumber(creator.followers)}</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.followers_change ?? 0) === 0 ? 'text-gray-500' : (creator.followers_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            {(creator.followers_change ?? 0) === 0 ? (
              <span className="mr-0.5">-</span>
            ) : (
              <Icon name={(creator.followers_change ?? 0) > 0 ? "PositiveChangeIcon.svg" : "NegativeChangeIcon.svg"} className="w-[12px] h-[12px] mr-0.5" alt={(creator.followers_change ?? 0) > 0 ? "Up" : "Down"} />
            )}
            {Math.abs(creator.followers_change ?? 0).toFixed(2)}%
          </span>
        </div>
        {/* Avg Views */}
        <div className="flex flex-col items-center flex-1 bg-[#1B2432] border border-[#2A3546] rounded-lg p-2">
          <Icon name="AvgViewsIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Views icon" />
          <span className="font-semibold text-gray-100 text-[13px] leading-[16px]">{formatNumber(creator.avg_views)}</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.avg_views_change ?? 0) === 0 ? 'text-gray-500' : (creator.avg_views_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            {(creator.avg_views_change ?? 0) === 0 ? (
              <span className="mr-0.5">-</span>
            ) : (
              <Icon name={(creator.avg_views_change ?? 0) > 0 ? "PositiveChangeIcon.svg" : "NegativeChangeIcon.svg"} className="w-[12px] h-[12px] mr-0.5" alt={(creator.avg_views_change ?? 0) > 0 ? "Up" : "Down"} />
            )}
            {Math.abs(creator.avg_views_change ?? 0).toFixed(2)}%
          </span>
        </div>
        {/* Engagement */}
        <div className="flex flex-col items-center flex-1 bg-[#1B2432] border border-[#2A3546] rounded-lg p-2">
          <Icon name="AvgEngagementIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Engage icon" />
          <span className="font-semibold text-gray-100 text-[13px] leading-[16px]">{creator.engagement.toFixed(2)}%</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.engagement_change ?? 0) === 0 ? 'text-gray-500' : (creator.engagement_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            {(creator.engagement_change ?? 0) === 0 ? (
              <span className="mr-0.5">-</span>
            ) : (
              <Icon name={(creator.engagement_change ?? 0) > 0 ? "PositiveChangeIcon.svg" : "NegativeChangeIcon.svg"} className="w-[12px] h-[12px] mr-0.5" alt={(creator.engagement_change ?? 0) > 0 ? "Up" : "Down"} />
            )}
            {Math.abs(creator.engagement_change ?? 0).toFixed(2)}%
          </span>
        </div>
      </div>
      {/* Buzz Score Bar */}
      <div className="w-full h-[14px] bg-[#1b2432] border border-[#2A3546] rounded-[6px] relative overflow-hidden mb-2">
        <div
          className="h-full rounded-[6px] bg-gradient-to-r from-[#FC4C4B] via-[#CD45BA] to-[#6E57FF]"
          style={{ width: `${creator.buzz_score}%` }}
        />
        <div
          className="absolute top-0 h-full flex items-center text-white font-bold text-[11px] font-['Inter',Helvetica] px-[2.5px]"
          style={{
            left: `calc(${creator.buzz_score}% - 2.5px)`,
            transform: "translateX(-100%)",
          }}
        >
          {creator.buzz_score}%
        </div>
      </div>
      {/* Niches */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {creator.niches.map((niche, tagIndex) => (
          <Badge
            key={tagIndex}
            variant="outline"
            className={`px-2 py-1 rounded-[6px] ${getNicheBadgeClasses(niche.type)}`}
          >
            <span className="font-medium text-[11px]">{niche.name}</span>
          </Badge>
        ))}
      </div>
      {/* Thumbnails */}
      <div className="flex items-center gap-2">
        {[
          ...creator.thumbnails.slice(0, 3),
          ...Array(3 - creator.thumbnails.length).fill('/images/PostThumbnail-3.svg')
        ].slice(0, 3).map((thumbnail, thumbIndex) => (
          <div key={thumbIndex} className="flex-1">
            <img
              className="w-full aspect-[9/16] object-cover rounded-[8px] border border-[#2A3546]"
              alt={`${creator.username} post ${thumbIndex + 1}`}
              src={thumbnail}
            />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default CreatorCard; 