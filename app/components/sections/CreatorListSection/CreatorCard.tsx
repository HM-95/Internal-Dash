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

const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  currentMode,
  selected,
  selectedCreator,
  onClick,
  onCheckboxChange,
}) => {
    return (
    <div
      onClick={onClick}
      className={`w-full rounded-[18px] p-0 border transition-all cursor-pointer shadow-sm hover:shadow-md`}
      style={{
        borderColor: selected ? '#3b82f6' : '#374151',
        backgroundColor: selectedCreator?.id === creator.id ? '#1e40af' : '#1f2937',
        background: selectedCreator?.id === creator.id ? '#1e40af !important' : '#1f2937 !important'
      }}
    >
    <CardContent className="flex flex-col gap-3 p-4">
      {/* Profile Section - Horizontal Layout */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-[44px] h-[44px] rounded-full flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#384455' }}>
            {creator.profile_pic ? (
              <img
                src={creator.profile_pic}
                alt={`${creator.username} profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full" style={{ backgroundColor: '#384455' }} />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-[15px] leading-[18px] truncate max-w-[calc(100%-8px)]" style={{ color: '#f9fafb' }}>
              {creator.username}
            </span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[12px] font-medium truncate max-w-[calc(100%-20px)]" style={{ color: '#9ca3af' }}>{creator.username_tag}</span>
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
          <div className="flex flex-col items-center gap-1">
            <Checkbox
              checked={selected}
              onCheckedChange={onCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="w-[18px] h-[18px] p-0 border-2 border-gray-300 rounded-[3px] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-gray-500"
              id={`select-${creator.id}`}
            />
            {/* Email icon - show if creator has email */}
            {creator.email && creator.email.trim() !== '' && (
              <Icon
                name="EmailIcon.svg"
                className="w-[12px] h-[12px] text-blue-400"
                alt="Email available"
              />
            )}
          </div>
        </div>
      </div>
      {/* Bio */}
      <div className="text-[12px] font-medium leading-[16px] mb-1 line-clamp-2 min-h-[32px]" style={{ color: '#9ca3af' }}>{creator.bio}</div>
      {/* Metrics Section */}
      <div className="flex items-center justify-between gap-2 w-full mb-2">
        {/* Followers */}
        <div className="flex flex-col items-center flex-1 rounded-lg p-2" style={{ backgroundColor: '#374151' }}>
          <Icon name="FollowerIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Followers icon" />
          <span className="font-semibold text-[13px] leading-[16px]" style={{ color: '#f9fafb' }}>{formatNumber(creator.followers)}</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.followers_change ?? 0) === 0 ? 'text-gray-400' : (creator.followers_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            {(creator.followers_change ?? 0) === 0 ? (
              <span className="mr-0.5">-</span>
            ) : (
              <Icon name={(creator.followers_change ?? 0) > 0 ? "PositiveChangeIcon.svg" : "NegativeChangeIcon.svg"} className="w-[12px] h-[12px] mr-0.5" alt={(creator.followers_change ?? 0) > 0 ? "Up" : "Down"} />
            )}
            {Math.abs(creator.followers_change ?? 0).toFixed(2)}%
          </span>
        </div>
        {/* Avg Views */}
        <div className="flex flex-col items-center flex-1 rounded-lg p-2" style={{ backgroundColor: '#374151' }}>
          <Icon name="AvgViewsIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Views icon" />
          <span className="font-semibold text-[13px] leading-[16px]" style={{ color: '#f9fafb' }}>{formatNumber(creator.avg_views)}</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.avg_views_change ?? 0) === 0 ? 'text-gray-400' : (creator.avg_views_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
            {(creator.avg_views_change ?? 0) === 0 ? (
              <span className="mr-0.5">-</span>
            ) : (
              <Icon name={(creator.avg_views_change ?? 0) > 0 ? "PositiveChangeIcon.svg" : "NegativeChangeIcon.svg"} className="w-[12px] h-[12px] mr-0.5" alt={(creator.avg_views_change ?? 0) > 0 ? "Up" : "Down"} />
            )}
            {Math.abs(creator.avg_views_change ?? 0).toFixed(2)}%
          </span>
        </div>
        {/* Engagement */}
        <div className="flex flex-col items-center flex-1 rounded-lg p-2" style={{ backgroundColor: '#374151' }}>
          <Icon name="AvgEngagementIcon.svg" className="w-[20px] h-[20px] mb-1" alt="Engage icon" />
          <span className="font-semibold text-[13px] leading-[16px]" style={{ color: '#f9fafb' }}>{creator.engagement.toFixed(2)}%</span>
          <span className={`flex items-center text-[10px] font-medium mt-0.5 ${(creator.engagement_change ?? 0) === 0 ? 'text-gray-400' : (creator.engagement_change ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}> 
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
      <div className="w-full h-[14px] rounded-[6px] relative overflow-hidden mb-2" style={{ backgroundColor: '#374151' }}>
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
      {/* Niches - Only show secondary niches */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {creator.niches
          .filter(niche => niche.type === "secondary") // Only show secondary niches
          .map((niche, tagIndex) => (
            <div
              key={tagIndex}
              className="px-2 py-1 rounded-[6px] border font-medium text-[11px]"
              style={{
                backgroundColor: '#14532d',
                borderColor: '#4ade80',
                color: '#f9fafb'
              }}
            >
              <span>{niche.name}</span>
            </div>
          ))}
      </div>
      {/* Thumbnails */}
      <div className="flex items-center gap-2">
        {Array(3).fill(null).map((_, thumbIndex) => {
          const thumbnail = creator.thumbnails[thumbIndex];
          const hasThumbnail = thumbnail && thumbnail !== '/images/PostThumbnail-3.svg';
          
          return (
            <div key={thumbIndex} className="flex-1 aspect-[9/16] min-h-[60px]">
              {hasThumbnail ? (
                <img
                  className="w-full h-full object-cover rounded-[8px] border"
                  style={{ borderColor: '#4b5563' }}
                  alt={`${creator.username} post ${thumbIndex + 1}`}
                  src={thumbnail}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full rounded-[8px] border flex items-center justify-center ${hasThumbnail ? 'hidden' : ''}`}
                style={{ 
                  borderColor: '#4b5563',
                  backgroundColor: '#374151'
                }}
              >
                <img 
                  src="/placeholder.png"
                  className="w-full h-full object-cover opacity-50" 
                  alt="Post thumbnail placeholder"
                  onError={(e) => {
                    // Fallback to a simple icon if the placeholder image fails
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-6 h-6 opacity-50">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </div>
  );
};

export default CreatorCard; 