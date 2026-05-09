import React, { useState } from 'react';
import { Icon } from './icon-component';
import { Badge } from './badge';
import { DonutChart } from './donut-chart';
import { ExpandedProfileOverlay } from './expanded-profile-overlay';
import { Creator } from '../../types/database';
import { formatNumber, getSocialMediaIcon, getMatchScoreColor, getMatchScoreStyle } from '../../utils/formatters';

interface CreatorCardProps {
  creator: Creator;
  showMatchScore?: boolean; // Whether to show match score (AI mode)
  onClick?: (creator: Creator) => void;
  className?: string;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({
  creator,
  showMatchScore = false,
  onClick,
  className = ""
}) => {
  const [showExpandedProfile, setShowExpandedProfile] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(creator);
    } else {
      setShowExpandedProfile(true);
    }
  };

  const handleCloseExpandedProfile = () => {
    setShowExpandedProfile(false);
  };

  return (
    <>
      <div 
        className={`rounded-[10px] lg:rounded-[12px] xl:rounded-[15px] p-[8px] lg:p-[12px] xl:p-[15px] cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-700 shadow-sm ${className}`}
        style={{ backgroundColor: '#0F1419' }}
        onClick={handleCardClick}
      >
        {/* Header with profile pic, match score, and buzz score */}
        <div className="flex items-start justify-between mb-[8px] lg:mb-[10px] xl:mb-[12px]">
          {/* Profile Picture */}
          <div className="w-[40px] h-[40px] lg:w-[48px] lg:h-[48px] xl:w-[56px] xl:h-[56px] bg-[#384455] rounded-full overflow-hidden flex-shrink-0">
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

          {/* Match Score and Buzz Score */}
          <div className="flex items-center gap-[4px] lg:gap-[6px] xl:gap-[8px] flex-shrink-0">
            {/* Match Score - Only show if showMatchScore is true */}
            {showMatchScore && creator.match_score && (
              <div style={getMatchScoreStyle(creator.match_score)}>
                <span>
                  {creator.match_score}%
                </span>
              </div>
            )}

            {/* Buzz Score */}
            <div className="flex items-center justify-center">
              <DonutChart score={creator.buzz_score} />
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="mb-[8px] lg:mb-[10px] xl:mb-[12px]">
          <div className="flex items-center gap-[4px] lg:gap-[6px] xl:gap-[8px] mb-[2px] lg:mb-[3px] xl:mb-[4px]">
            <h3 className="font-semibold text-[14px] lg:text-[16px] xl:text-[18px] text-[#06152b] leading-[18px] lg:leading-[20px] xl:leading-[22px] truncate flex-1">
              {creator.username}
            </h3>
            <div className="flex items-center gap-[2px] lg:gap-[3px] xl:gap-[4px] flex-shrink-0">
              {creator.social_media.map((social, index) => (
                <Icon
                  key={index}
                  name={getSocialMediaIcon(social.platform)}
                  className="w-[12px] h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px]"
                  alt={`${social.platform} logo`}
                />
              ))}
            </div>
          </div>
          
          <p className="text-[#71737c] text-[12px] lg:text-[13px] xl:text-[14px] font-medium leading-[16px] lg:leading-[18px] xl:leading-[20px] mb-[2px] lg:mb-[3px] xl:mb-[4px]">
            {creator.username_tag}
          </p>
          
          {creator.location && (
            <div className="flex items-center gap-[4px] lg:gap-[5px] xl:gap-[6px]">
              <Icon
                name="LocationIcon.svg"
                className="w-[10px] h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px] text-gray-500 flex-shrink-0"
                alt="Location"
              />
              <span className="text-[#71737c] text-[11px] lg:text-[12px] xl:text-[13px] font-medium leading-[14px] lg:leading-[16px] xl:leading-[18px] truncate">
                {creator.location}
              </span>
            </div>
          )}
        </div>

        {/* Bio */}
        <p className="text-[#71737c] text-[11px] lg:text-[12px] xl:text-[13px] font-medium leading-[16px] lg:leading-[18px] xl:leading-[20px] mb-[8px] lg:mb-[10px] xl:mb-[12px] line-clamp-2">
          {creator.bio}
        </p>

        {/* Category Badges */}
        <div className="flex items-center gap-[4px] lg:gap-[6px] xl:gap-[8px] mb-[8px] lg:mb-[10px] xl:mb-[12px] flex-wrap">
          {creator.niches.map((niche, index) => (
            <Badge
              key={index}
              variant="outline"
              className={`px-[6px] lg:px-[8px] xl:px-[10px] py-[2px] lg:py-[3px] xl:py-[4px] rounded-[6px] lg:rounded-[7px] xl:rounded-[8px] flex-shrink-0 ${
                niche.type === 'primary' 
                  ? 'bg-sky-50 border-[#dbe2eb] text-neutral-new900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400' 
                  : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
              }`}
            >
              <span className="font-medium text-[10px] lg:text-[11px] xl:text-[12px] leading-[12px] lg:leading-[14px] xl:leading-[16px]">
                {niche.name}
              </span>
            </Badge>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-[6px] lg:gap-[8px] xl:gap-[10px] mb-[8px] lg:mb-[10px] xl:mb-[12px]">
          {/* Followers */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-[2px] lg:mb-[3px] xl:mb-[4px]">
              <Icon
                name="FollowerIcon.svg"
                className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px]"
                alt="Followers"
              />
            </div>
            <div className="text-[#06152b] text-[11px] lg:text-[12px] xl:text-[13px] font-bold leading-[14px] lg:leading-[16px] xl:leading-[18px] mb-[1px]">
              {formatNumber(creator.followers)}
            </div>
            <div className="text-[#71737c] text-[9px] lg:text-[10px] xl:text-[11px] font-medium leading-[12px] lg:leading-[14px] xl:leading-[16px] mb-[1px]">
              Followers
            </div>
            <div className="flex items-center gap-[2px] lg:gap-[3px] xl:gap-[4px]">
              <Icon 
                name={creator.followers_change_type === 'positive' ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'}
                className="w-[6px] h-[6px] lg:w-[7px] lg:h-[7px] xl:w-[8px] xl:h-[8px]" 
                alt={creator.followers_change_type === 'positive' ? 'Positive change' : 'Negative change'} 
              />
              <span className={`text-[8px] lg:text-[9px] xl:text-[10px] font-medium leading-[10px] lg:leading-[12px] xl:leading-[14px] ${
                creator.followers_change_type === 'positive' ? 'text-[#1ad598]' : 'text-[#ea3a3d]'
              }`}>
                {creator.followers_change?.toFixed(2) || '0.00'}%
              </span>
            </div>
          </div>

          {/* Avg. Views */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-[2px] lg:mb-[3px] xl:mb-[4px]">
              <Icon
                name="AvgViewsIcon.svg"
                className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px]"
                alt="Avg. Views"
              />
            </div>
            <div className="text-[#06152b] text-[11px] lg:text-[12px] xl:text-[13px] font-bold leading-[14px] lg:leading-[16px] xl:leading-[18px] mb-[1px]">
              {formatNumber(creator.avg_views)}
            </div>
            <div className="text-[#71737c] text-[9px] lg:text-[10px] xl:text-[11px] font-medium leading-[12px] lg:leading-[14px] xl:leading-[16px] mb-[1px]">
              Avg. Views
            </div>
            <div className="flex items-center gap-[2px] lg:gap-[3px] xl:gap-[4px]">
              <Icon 
                name={creator.avg_views_change_type === 'positive' ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'}
                className="w-[6px] h-[6px] lg:w-[7px] lg:h-[7px] xl:w-[8px] xl:h-[8px]" 
                alt={creator.avg_views_change_type === 'positive' ? 'Positive change' : 'Negative change'} 
              />
              <span className={`text-[8px] lg:text-[9px] xl:text-[10px] font-medium leading-[10px] lg:leading-[12px] xl:leading-[14px] ${
                creator.avg_views_change_type === 'positive' ? 'text-[#1ad598]' : 'text-[#ea3a3d]'
              }`}>
                {creator.avg_views_change?.toFixed(2) || '0.00'}%
              </span>
            </div>
          </div>

          {/* Engagement */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center mb-[2px] lg:mb-[3px] xl:mb-[4px]">
              <Icon
                name="AvgEngagementIcon.svg"
                className="w-[16px] h-[16px] lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px]"
                alt="Engagement"
              />
            </div>
            <div className="text-[#06152b] text-[11px] lg:text-[12px] xl:text-[13px] font-bold leading-[14px] lg:leading-[16px] xl:leading-[18px] mb-[1px]">
              {creator.engagement.toFixed(1)}%
            </div>
            <div className="text-[#71737c] text-[9px] lg:text-[10px] xl:text-[11px] font-medium leading-[12px] lg:leading-[14px] xl:leading-[16px] mb-[1px]">
              Engagement
            </div>
            <div className="flex items-center gap-[2px] lg:gap-[3px] xl:gap-[4px]">
              <Icon 
                name={creator.engagement_change_type === 'positive' ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'}
                className="w-[6px] h-[6px] lg:w-[7px] lg:h-[7px] xl:w-[8px] xl:h-[8px]" 
                alt={creator.engagement_change_type === 'positive' ? 'Positive change' : 'Negative change'} 
              />
              <span className={`text-[8px] lg:text-[9px] xl:text-[10px] font-medium leading-[10px] lg:leading-[12px] xl:leading-[14px] ${
                creator.engagement_change_type === 'positive' ? 'text-[#1ad598]' : 'text-[#ea3a3d]'
              }`}>
                {creator.engagement_change?.toFixed(2) || '0.00'}%
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-3 gap-[4px] lg:gap-[6px] xl:gap-[8px]">
          {creator.thumbnails.slice(0, 3).map((thumbnail, index) => (
            <div key={index} className="aspect-[9/16] rounded-[6px] lg:rounded-[8px] xl:rounded-[10px] overflow-hidden">
              <img
                src={thumbnail}
                alt={`${creator.username} post ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Profile Overlay */}
      {showExpandedProfile && (
        <ExpandedProfileOverlay
          creator={creator}
          isOpen={showExpandedProfile}
          onClose={handleCloseExpandedProfile}
        />
      )}
    </>
  );
};