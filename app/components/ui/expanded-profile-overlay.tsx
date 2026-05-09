import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icon-component';
import { Badge } from './badge';
import { Button } from './button';
import { Creator } from '../../types/database';
import { formatNumber, getSocialMediaIcon, getMatchScoreColor, getMatchScoreStyle } from '../../utils/formatters';

interface ExpandedProfileOverlayProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  currentMode?: 'ai' | 'all';
}

export const ExpandedProfileOverlay: React.FC<ExpandedProfileOverlayProps> = ({
  creator,
  isOpen,
  onClose,
  currentMode = 'ai',
}) => {
  const [showAllHashtags, setShowAllHashtags] = useState(false);
  const [emailButtonText, setEmailButtonText] = useState('Copy Email ID');
  const [showBuzzScoreInfo, setShowBuzzScoreInfo] = useState(false);
  const buzzScoreInfoRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        setShowBuzzScoreInfo(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Close buzz score info popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        buzzScoreInfoRef.current && 
        !buzzScoreInfoRef.current.contains(event.target as Node)
      ) {
        setShowBuzzScoreInfo(false);
      }
    };

    if (showBuzzScoreInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showBuzzScoreInfo]);
  // Handle email copy
  const handleEmailClick = async () => {
    if (creator.email) {
      try {
        await navigator.clipboard.writeText(creator.email);
        setEmailButtonText('Copied to clipboard');
        setTimeout(() => {
          setEmailButtonText('Copy Email ID');
        }, 2000);
      } catch (err) {
        
      }
    }
  };

  // Handle DM click
  const handleDMClick = () => {
    const primarySocial = creator.social_media[0];
    if (primarySocial?.url) {
      window.open(primarySocial.url, '_blank');
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className={`
          absolute bg-[#0C1116] border-[#374151] overflow-y-auto pointer-events-auto
          ${/* Mobile: Full screen */ ''}
          w-full h-full top-0 right-0 rounded-none border-0
          ${/* Medium: 60% width, XL: 50% width, right side */ ''}
          md:w-[60%] md:h-full md:top-0 md:right-0 md:rounded-tl-[16px] md:rounded-bl-[16px] md:border-l md:border-t-0 md:border-r-0 md:border-b-0
          lg:w-[60%] lg:rounded-tl-[15px] lg:rounded-bl-[15px]
          xl:w-[50%] xl:rounded-tl-[16px] xl:rounded-bl-[16px]
          px-[4px]
        `}
        style={{ borderWidth: '1px', backgroundColor: '#0C1116' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-[16px] md:px-[19px] py-[20px] md:py-[23px] mb-[10px] md:mb-[15px]">
          <div className="flex items-center gap-[10px] md:gap-[12px] lg:gap-[15px] xl:gap-[18px] flex-1">
            {/* Profile Picture - now clickable with subtle hover effects */}
            <a 
              href={creator.social_media[0]?.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-[65px] h-[65px] md:w-[77px] md:h-[77px] lg:w-[87px] lg:h-[87px] xl:w-[87px] xl:h-[87px] bg-[#384455] rounded-full overflow-hidden flex-shrink-0 relative group hover:scale-102 transition-all duration-300 ease-out border-2 border-gray-200 dark:border-gray-600"
            >
              {creator.profile_pic ? (
                <img 
                  src={creator.profile_pic} 
                  alt={`${creator.username} profile`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-[#384455]" />
              )}
              
              {/* Animated border on hover */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-[#557EDD]/30 group-hover:scale-105 transition-all duration-300 ease-out" />
            </a>

            {/* Creator Info */}
            <div className="flex flex-col gap-0 md:gap-[0px] lg:gap-[2px] xl:gap-[4px] flex-1 min-w-0">
                <button 
                  onClick={() => {
                    const primarySocial = creator.social_media[0];
                    if (primarySocial?.url) {
                      window.open(primarySocial.url, '_blank');
                    }
                  }}
                  className="text-[#f9fafb] text-[12px] md:text-[19px] lg:text-[18px] xl:text-[22px] font-bold hover:text-[#557EDD] transition-colors cursor-pointer text-left"
                >
                  {creator.username}
                </button>
              <div className="flex items-center gap-[6px] md:gap-[8px] lg:gap-[10px] xl:gap-[11px]">
                <button 
                  onClick={() => {
                    const primarySocial = creator.social_media[0];
                    if (primarySocial?.url) {
                      window.open(primarySocial.url, '_blank');
                    }
                  }}
                  className="text-[#71737c] text-[12px] md:text-[14px] lg:text-[16px] xl:text-[18px] font-medium hover:text-[#557EDD] transition-all duration-200 cursor-pointer text-left dark:text-gray-400"
                >
                  {creator.username_tag || `@${creator.username.toLowerCase().replace(/\s+/g, '')}`}
                </button>
                <div className="flex items-center gap-[2px] md:gap-[2px] lg:gap-[3px] bg-gray-800 rounded-full px-2 py-1">
                  {creator.social_media.map((social, iconIndex) => (
                    <Icon
                      key={iconIndex}
                      name={getSocialMediaIcon(social.platform)}
                      className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] lg:w-[15px] lg:h-[15px]"
                      alt={`${social.platform} logo`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Action Buttons - Positioned below username tag */}
              <div className="flex items-center gap-[6px] md:gap-[8px] lg:gap-[10px] mt-[2px] md:mt-[2px] lg:mt-[2px] xl:mt-[2px]">
                {creator.email && creator.email !== '' && creator.email !== '0' && (
                  <button
                    onClick={handleEmailClick}
                    className="flex items-center gap-[3px] md:gap-[4px] lg:gap-[6px] px-[8px] md:px-[10px] lg:px-[12px] py-[4px] md:py-[6px] lg:py-[6px] xl:py-[6px] bg-gray-800 rounded-[10px] hover:bg-gray-700 transition-colors border border-gray-600 text-gray-200"
                  >
                    <Icon
                      name="EmailIcon.svg"
                      className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] lg:w-[15px] lg:h-[15px]"
                      alt="Email"
                    />
                    <span className="text-[10px] md:text-[12px] lg:text-[13px] font-medium text-[#f9fafb]">
                      {emailButtonText}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleDMClick}
                  className="flex items-center gap-[3px] md:gap-[4px] lg:gap-[6px] px-[8px] md:px-[10px] lg:px-[12px] py-[4px] md:py-[6px] lg:py-[6px] xl:py-[6px] bg-gray-800 rounded-[10px] hover:bg-gray-700 transition-colors border border-gray-600 text-gray-200"
                >
                  <Icon
                    name="DMIcon.svg"
                    className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] lg:w-[15px] lg:h-[15px]"
                    alt="DM"
                  />
                  <span className="text-[10px] md:text-[12px] lg:text-[13px] font-medium text-[#f9fafb]">
                    DM Creator
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Match Score and Close Button */}
          <div className="flex items-center gap-[6px] md:gap-[8px] lg:gap-[10px] flex-shrink-0">
            {currentMode === 'ai' && (
              <div style={{
                ...getMatchScoreStyle(creator.match_score || 0),
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '13px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                Match {creator.match_score || 0}%
              </div>
            )}
            <button
              onClick={onClose}
              className="bg-transparent hover:bg-gray-700/40 transition-colors cursor-pointer p-1 rounded-full"
            >
              <svg 
                width="17" 
                height="17" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400 dark:text-white"
              >
                <path 
                  d="M12 4L4 12M4 4L12 12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Location */}
        {creator.location && (
          <div className="px-[16px] md:px-[19px] mb-[9px] md:mb-[14px]">
            <div className="flex items-center gap-[5px] md:gap-[6px] lg:gap-[8px]">
              <Icon
                name="LocationIcon.svg"
                className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] lg:w-[16px] lg:h-[16px] text-gray-600 dark:text-gray-400"
                alt="Location"
              />
              <span className="text-[#71737c] text-[12px] md:text-[14px] lg:text-[16px] font-medium dark:text-gray-400">
                {creator.location}
              </span>
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="px-[16px] md:px-[19px] mb-[12px] md:mb-[17px]">
          <p className="text-[#71737c] text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-[18px] md:leading-[20px] lg:leading-[24px] dark:text-gray-400">
            {creator.bio}
          </p>
        </div>

        {/* Category Badges */}
        <div className="px-[16px] md:px-[19px] mb-[12px] md:mb-[17px]">
          <div className="flex items-center gap-[6px] md:gap-[8px] lg:gap-[10px] flex-wrap">
            {creator.niches
              .filter(niche => niche.type === 'secondary') // Only show secondary niches
              .map((niche, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`px-[8px] md:px-[12px] lg:px-[16px] py-[2px] md:py-[4px] lg:py-[6px] rounded-[6px] md:rounded-[8px] ${
                  niche.type === 'primary' 
                    ? 'bg-blue-900/20 border-blue-700 text-blue-400' 
                    : 'bg-green-900/20 border-green-700 text-green-400'
                }`}
              >
                <span className="font-medium text-[11px] md:text-[13px] lg:text-[15px]">
                  {niche.name}
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Metrics Cards - Single Row */}
        <div className="px-[16px] md:px-[19px] mb-[12px] md:mb-[17px]">
          <div className="grid grid-cols-5 gap-[2px] md:gap-[3px] lg:gap-[4px]">
            {/* Followers */}
            <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px]">
              <div className="flex items-center justify-center">
                <Icon
                  name="FollowerIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Followers"
                />
              </div>
              <div className="text-center">
                <div className="text-[#f9fafb] text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.followers.toLocaleString()}
                </div>
                <div className="text-[#9ca3af] text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Followers
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.followers_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-400">-</span>
                  ) : (
                    <Icon name={(creator.followers_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.followers_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.followers_change ?? 0) === 0) ? 'text-gray-400' : (creator.followers_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.followers_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Avg. Views */}
            <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px]">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgViewsIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Views"
                />
              </div>
              <div className="text-center">
                <div className="text-[#f9fafb] text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.avg_views.toLocaleString()}
                </div>
                <div className="text-[#9ca3af] text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Avg. Views
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.avg_views_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-400">-</span>
                  ) : (
                    <Icon name={(creator.avg_views_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.avg_views_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.avg_views_change ?? 0) === 0) ? 'text-gray-400' : (creator.avg_views_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.avg_views_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px]">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgEngagementIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Engagement"
                />
              </div>
              <div className="text-center">
                <div className="text-[#f9fafb] text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.engagement.toFixed(1)}%
                </div>
                <div className="text-[#9ca3af] text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Engagement
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.engagement_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-400">-</span>
                  ) : (
                    <Icon name={(creator.engagement_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.engagement_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.engagement_change ?? 0) === 0) ? 'text-gray-400' : (creator.engagement_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.engagement_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Avg. Likes */}
            <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px]">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgLikesIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Avg. Likes"
                />
              </div>
              <div className="text-center">
                <div className="text-[#f9fafb] text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {(creator.avg_likes || 0).toLocaleString()}
                </div>
                <div className="text-[#9ca3af] text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Avg. Likes
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.avg_likes_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-400">-</span>
                  ) : (
                    <Icon name={(creator.avg_likes_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.avg_likes_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.avg_likes_change ?? 0) === 0) ? 'text-gray-400' : (creator.avg_likes_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.avg_likes_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Avg. Comments */}
            <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px]">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgCommentsIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Comments"
                />
              </div>
              <div className="text-center">
                <div className="text-[#f9fafb] text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {(creator.avg_comments || 0).toLocaleString()}
                </div>
                <div className="text-[#9ca3af] text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Avg. Comments
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.avg_comments_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-400">-</span>
                  ) : (
                    <Icon name={(creator.avg_comments_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.avg_comments_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.avg_comments_change ?? 0) === 0) ? 'text-gray-400' : (creator.avg_comments_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.avg_comments_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buzz Score Card */}
        <div className="px-[16px] md:px-[19px] mb-[12px] md:mb-[17px]">
          <div className="bg-gray-800 rounded-[8px] md:rounded-[12px] px-[12px] md:px-[20px] lg:px-[24px] pt-[10px] md:pt-[13px] lg:pt-[12px] pb-[12px] md:pb-[20px] lg:pb-[24px]">
            <div className="flex items-center justify-between mb-[8px] md:mb-[12px] lg:mb-[15px]">
              <div className="flex items-center gap-[7px] lg:gap-[10px]">
                <span className="text-white text-[12px] md:text-[15px] lg:text-[17px] font-bold">
                  Buzz Score
                </span>
                <span 
                  className="text-[12px] md:text-[15px] lg:text-[17px] font-bold"
                  style={{
                    background: 'linear-gradient(90deg, #FC4C4B 0%, #CD45BA 50%, #6E57FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {creator.buzz_score}%
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowBuzzScoreInfo(!showBuzzScoreInfo)}
                  className="bg-transparent hover:bg-gray-700 p-1 rounded-full transition-colors"
                >
                <Icon
                  name="InformationIcon.svg"
                  className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] lg:w-[14px] lg:h-[14px] text-gray-400"
                  alt="Info"
                />
                </button>
                
                {/* Buzz Score Info Popup */}
                {showBuzzScoreInfo && (
                  <div
                    ref={buzzScoreInfoRef}
                    className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-[#f9fafb] mb-2 text-sm">Buzz Score</h3>
                        <p className="text-sm text-[#9ca3af]">
                          The Buzz Score is a performance metric that we calculate based on account growth, engagement, and consistency. It provides a comprehensive view of a creator's overall performance and trending potential.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Buzz Score Bar */}
            <div className="relative">
              {/* Indicating Arrow - Above the bar */}
              <div 
                className="absolute -top-[6px] md:-top-[8px] transform -translate-x-1/2"
                style={{ left: `${creator.buzz_score}%` }}
              >
                <div 
                  className="border-l-[4px] md:border-l-[5.355px] border-r-[4px] md:border-r-[5.355px] border-t-[4px] md:border-t-[5.25px] border-l-transparent border-r-transparent border-t-white"
                  style={{ width: '8px', height: '4px' }}
                />
              </div>
              
              <div className="w-full h-[8px] md:h-[12px] lg:h-[14px] bg-gradient-to-r from-[#FC4C4B] via-[#CD45BA] to-[#6E57FF] rounded-[4px] md:rounded-[6px] lg:rounded-[7px] relative">
                {/* Indicating Dot */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${creator.buzz_score}%` }}
                >
                  <div className="w-[3px] h-[3px] md:w-[4px] md:h-[4px] lg:w-[6px] lg:h-[6px] bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Posts */}
        <div className="px-[16px] md:px-[19px] mb-[12px] md:mb-[17px]">
          <h3 className="text-white text-[12px] md:text-[16px] lg:text-[16px] font-bold mb-[8px] md:mb-[12px] lg:mb-[15px] flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-[#557EDD] to-[#6C40E4] rounded-full"></div>
            Latest Posts
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-[4px] md:gap-[8px] lg:gap-[15px]">
            {(() => {
              const thumbnails = creator.expanded_thumbnails || [];
              
              return Array(4).fill(null).map((_, index) => {
                const thumbnail = thumbnails[index];
                const hasThumbnail = thumbnail && thumbnail !== '/images/PostThumbnail-3.svg';
                const shareUrl = creator.share_urls?.[index];
                const isTikTok = creator.social_media[0]?.platform === 'tiktok';
                const isInstagram = creator.social_media[0]?.platform === 'instagram';
                const primarySocial = creator.social_media[0];
                const profileUrl = primarySocial?.url;
                
                // For TikTok accounts, use the specific post URL if available, otherwise fall back to profile
                // For Instagram and other platforms, always use profile URL
                const clickUrl = isTikTok && shareUrl ? shareUrl : profileUrl;
                
                return (
                  <div key={index} className="aspect-[9/16] rounded-[6px] md:rounded-[10px] lg:rounded-[12px] overflow-hidden border border-[#2A3546] group relative">
                    {/* TikTok-style hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 ease-in-out z-10" />
                    
                    {/* Clickable link - TikTok leads to specific post, others to profile */}
                    <a
                      href={clickUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full relative z-20"
                    >
                      {hasThumbnail ? (
                        <img
                          src={thumbnail}
                          alt={`${creator.username} post ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-in-out"
                          loading="eager"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      
                      {/* Placeholder for missing/expired thumbnails */}
                      <div 
                        className={`w-full h-full flex items-center justify-center ${hasThumbnail ? 'hidden' : ''}`}
                        style={{ backgroundColor: '#374151' }}
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
                      
                      {/* TikTok-style play button overlay on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                        <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[8px] md:border-l-[10px] lg:border-l-[12px] border-l-white border-t-[6px] md:border-t-[8px] lg:border-t-[10px] border-t-transparent border-b-[6px] md:border-b-[8px] lg:border-b-[10px] border-b-transparent ml-[2px] md:ml-[3px] lg:ml-[4px]" />
                        </div>
                      </div>
                    </a>
                  </div>
                );
              });
            })()}
          </div>
          {/* Hashtags below thumbnails */}
          {creator.hashtags && creator.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {creator.hashtags.map((hashtag, idx) => (
                <span key={idx} className="text-xs text-purple-600 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full px-3 py-1 font-medium border border-purple-300 shadow-sm !dark:bg-purple-800/40 !dark:border-purple-600 !dark:text-purple-200 dark:shadow-purple-500/20">{hashtag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};