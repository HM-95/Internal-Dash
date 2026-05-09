import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icon-component';
import { Badge } from './badge';
import { Button } from './button';
import { formatNumber, getSocialMediaIcon, getMatchScoreStyle } from '../../../app/utils/formatters';

// Local, self-contained type for the overlay so this component does not depend on external types
export interface OverlayCreator {
  username: string;
  username_tag?: string;
  profile_pic?: string;
  email?: string;
  location?: string;
  bio?: string;
  social_media: Array<{ platform: string; url?: string }>;
  niches: Array<{ name: string; type: 'primary' | 'secondary' }>;
  followers: number;
  followers_change?: number;
  avg_views: number;
  avg_views_change?: number;
  engagement: number;
  engagement_change?: number;
  avg_likes?: number;
  avg_likes_change?: number;
  avg_comments?: number;
  avg_comments_change?: number;
  buzz_score: number;
  match_score?: number;
  hashtags?: string[];
  expanded_thumbnails?: string[];
  share_urls?: string[];
  // Talent network specific fields
  price?: number | null;
  status?: string;
  channel?: string | null;
  what_do_you_post?: string | null;
  note?: string | null;
  creator_id?: string | number;
}

interface ExpandedProfileOverlayProps {
  creator: OverlayCreator;
  isOpen: boolean;
  onClose: () => void;
  currentMode?: 'ai' | 'all' | 'talent-network';
  onPriceUpdate?: (creatorId: string, newPrice: number | null) => Promise<void>;
  onStatusUpdate?: (creatorId: string, status: string) => Promise<void>;
  onChannelUpdate?: (creatorId: string, channel: string | null) => Promise<void>;
  onWhatDoYouPostUpdate?: (creatorId: string, whatDoYouPost: string | null) => Promise<void>;
  onNoteUpdate?: (creatorId: string, note: string | null) => Promise<void>;
}

// Status and Channel options (same as in TalentNetworkCreatorTable)
const STATUS_OPTIONS = [
  { value: 'No reply', label: 'No reply', textColor: '#000000', bgColor: '#e6e6e6' },
  { value: 'Form filled', label: 'Form filled', textColor: '#000000', bgColor: '#d4edbc' },
  { value: 'Not interested', label: 'Not interested', textColor: '#000000', bgColor: '#ff917d' },
  { value: 'Follow-up DM', label: 'Follow-up DM', textColor: '#000000', bgColor: '#ffc285' },
  { value: 'Follow-up email', label: 'Follow-up email', textColor: '#000000', bgColor: '#ffc285' },
  { value: 'Form filled via DM', label: 'Form filled via DM', textColor: '#000000', bgColor: '#b8d7d8' },
  { value: 'Replied w/price req.', label: 'Replied w/price req.', textColor: '#000000', bgColor: '#fcbdf8' },
  { value: 'Price confirmed', label: 'Price confirmed', textColor: '#ffffff', bgColor: '#11734b' },
];

const CHANNEL_OPTIONS = [
  { value: 'Email w/o brand', label: 'Email w/o brand', textColor: '#000000', bgColor: '#ffe5a0' },
  { value: 'Inbound', label: 'Inbound', textColor: '#ffffff', bgColor: '#8550be' },
  { value: 'Email with brand', label: 'Email with brand', textColor: '#ffffff', bgColor: '#11734b' },
  { value: 'DM w/o brand', label: 'DM w/o brand', textColor: '#ffffff', bgColor: '#f58282' },
  { value: 'DM w/ brand', label: 'DM w/ brand', textColor: '#000000', bgColor: '#ffa3d7' },
];

export const ExpandedProfileOverlay: React.FC<ExpandedProfileOverlayProps> = ({
  creator,
  isOpen,
  onClose,
  currentMode = 'ai',
  onPriceUpdate,
  onStatusUpdate,
  onChannelUpdate,
  onWhatDoYouPostUpdate,
  onNoteUpdate,
}) => {
  const [showAllHashtags, setShowAllHashtags] = useState(false);
  const [emailButtonText, setEmailButtonText] = useState('Copy Email ID');
  const [showBuzzScoreInfo, setShowBuzzScoreInfo] = useState(false);
  const buzzScoreInfoRef = useRef<HTMLDivElement>(null);
  
  // Talent network specific state
  const isTalentNetwork = currentMode === 'talent-network';
  const [editingPrice, setEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [openChannelDropdown, setOpenChannelDropdown] = useState(false);
  const [editingWhatDoYouPost, setEditingWhatDoYouPost] = useState(false);
  const [tempWhatDoYouPost, setTempWhatDoYouPost] = useState<string>('');
  const [editingNote, setEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState<string>('');
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const channelDropdownRef = useRef<HTMLDivElement>(null);

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
      if (
        statusDropdownRef.current && 
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenStatusDropdown(false);
      }
      if (
        channelDropdownRef.current && 
        !channelDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenChannelDropdown(false);
      }
    };

    if (showBuzzScoreInfo || openStatusDropdown || openChannelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showBuzzScoreInfo, openStatusDropdown, openChannelDropdown]);
  
  // Initialize temp values
  useEffect(() => {
    if (isTalentNetwork) {
      setTempPrice(creator.price !== null && creator.price !== undefined ? String(creator.price) : '');
      setTempWhatDoYouPost(creator.what_do_you_post || '');
      setTempNote(creator.note || '');
    }
  }, [creator, isTalentNetwork]);
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
  
  // Talent network handlers
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price}`;
  };
  
  const handleSavePrice = async () => {
    if (!onPriceUpdate || !creator.creator_id) return;
    const trimmed = tempPrice.trim();
    const numericPrice = trimmed === '' ? null : parseInt(trimmed, 10);
    
    if (trimmed !== '' && (isNaN(numericPrice!) || numericPrice! < 0)) {
      setEditingPrice(false);
      setTempPrice(creator.price !== null && creator.price !== undefined ? String(creator.price) : '');
      return;
    }
    
    setEditingPrice(false);
    try {
      await onPriceUpdate(String(creator.creator_id), numericPrice);
    } catch (error) {
      console.error('Failed to update price:', error);
      setTempPrice(creator.price !== null && creator.price !== undefined ? String(creator.price) : '');
    }
  };
  
  const handleStatusSelect = async (status: string) => {
    setOpenStatusDropdown(false);
    if (onStatusUpdate && creator.creator_id) {
      try {
        await onStatusUpdate(String(creator.creator_id), status);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
  };
  
  const handleChannelSelect = async (channel: string | null) => {
    setOpenChannelDropdown(false);
    if (onChannelUpdate && creator.creator_id) {
      try {
        await onChannelUpdate(String(creator.creator_id), channel);
      } catch (error) {
        console.error('Failed to update channel:', error);
      }
    }
  };
  
  const handleSaveWhatDoYouPost = async () => {
    if (!onWhatDoYouPostUpdate || !creator.creator_id) return;
    setEditingWhatDoYouPost(false);
    try {
      await onWhatDoYouPostUpdate(String(creator.creator_id), tempWhatDoYouPost.trim() || null);
    } catch (error) {
      console.error('Failed to update what do you post:', error);
      setTempWhatDoYouPost(creator.what_do_you_post || '');
    }
  };
  
  const handleSaveNote = async () => {
    if (!onNoteUpdate || !creator.creator_id) return;
    setEditingNote(false);
    try {
      await onNoteUpdate(String(creator.creator_id), tempNote.trim() || null);
    } catch (error) {
      console.error('Failed to update note:', error);
      setTempNote(creator.note || '');
    }
  };
  
  const getStatusOption = (status: string | null | undefined) => {
    return STATUS_OPTIONS.find(opt => opt.value === (status || 'No reply')) || STATUS_OPTIONS[0];
  };
  
  const getChannelOption = (channel: string | null | undefined) => {
    if (!channel) return null;
    return CHANNEL_OPTIONS.find(opt => opt.value === channel) || null;
  };

  if (!isOpen) return null;

  // Centered modal with blurred, dark backdrop
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      <div
        className="bg-[#0f1419] border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[16px] pointer-events-auto text-gray-50 custom-scrollbar"
      >
        <div className="transform mx-auto px-[12px] md:px-[14px] pb-[20px] md:pb-[23px]" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
        {/* Header */}
        <div className="flex items-start justify-between px-[12px] md:px-[14px] py-[20px] md:py-[23px] mb-[10px] md:mb-[15px]">
          <div className="flex items-center gap-[10px] md:gap-[12px] lg:gap-[15px] xl:gap-[18px] flex-1">
            {/* Profile Picture - now clickable with subtle hover effects */}
            <a 
              href={creator.social_media[0]?.url} 
              target="_blank" 
              rel="noopener noreferrer"
               className="w-[65px] h-[65px] md:w-[77px] md:h-[77px] lg:w-[87px] lg:h-[87px] xl:w-[87px] xl:h-[87px] bg-[#384455] rounded-full overflow-hidden flex-shrink-0 relative group hover:scale-102 transition-all duration-300 ease-out border-2 border-gray-600"
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
                  className="text-gray-50 text-[12px] md:text-[19px] lg:text-[18px] xl:text-[22px] font-bold hover:text-[#557EDD] transition-colors cursor-pointer text-left"
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
                 className="text-gray-400 text-[12px] md:text-[14px] lg:text-[16px] xl:text-[18px] font-medium hover:text-[#557EDD] transition-all duration-200 cursor-pointer text-left"
                >
                  {(creator.username_tag || `@${creator.username.toLowerCase().replace(/\s+/g, '')}`).replace(/^@+/, '@')}
                </button>
                 <div className="flex items-center gap-[2px] md:gap-[2px] lg:gap-[3px] bg-gray-700 rounded-full px-2 py-1">
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
                    className="flex items-center gap-[3px] md:gap-[4px] lg:gap-[6px] px-[8px] md:px-[10px] lg:px-[12px] py-[4px] md:py-[6px] lg:py-[6px] xl:py-[6px] bg-[#1f2937] rounded-[10px] hover:bg-[#374151] transition-colors border border-gray-700 text-gray-200"
                  >
                    <Icon
                      name="EmailIcon.svg"
                      className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] lg:w-[15px] lg:h-[15px]"
                      alt="Email"
                    />
                    <span className="text-[10px] md:text-[12px] lg:text-[13px] font-medium text-gray-300">
                      {emailButtonText}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleDMClick}
                  className="flex items-center gap-[3px] md:gap-[4px] lg:gap-[6px] px-[8px] md:px-[10px] lg:px-[12px] py-[4px] md:py-[6px] lg:py-[6px] xl:py-[6px] bg-[#1f2937] rounded-[10px] hover:bg-[#374151] transition-colors border border-gray-700 text-gray-200"
                >
                  <Icon
                    name="DMIcon.svg"
                    className="w-[11px] h-[11px] md:w-[13px] md:h-[13px] lg:w-[15px] lg:h-[15px]"
                    alt="DM"
                  />
                  <span className="text-[10px] md:text-[12px] lg:text-[13px] font-medium text-gray-300">
                    DM Creator
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Talent Network: Status and Channel Dropdowns + Close Button */}
          <div className="flex items-center gap-[6px] md:gap-[8px] lg:gap-[10px] flex-shrink-0">
            {isTalentNetwork && (
              <>
                {/* Status Dropdown */}
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => {
                      setOpenStatusDropdown(!openStatusDropdown);
                      setOpenChannelDropdown(false);
                    }}
                    className="px-2 py-1 rounded-[20px] text-xs md:text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-between gap-1"
                    style={{
                      backgroundColor: getStatusOption(creator.status).bgColor,
                      color: getStatusOption(creator.status).textColor,
                    }}
                  >
                    <span className="truncate max-w-[100px]">{getStatusOption(creator.status).label}</span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none"
                      className={`transition-transform ${openStatusDropdown ? 'rotate-180' : ''}`}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openStatusDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-[#111827] border border-gray-700 rounded-[20px] shadow-xl overflow-hidden z-[9999] max-h-60 overflow-y-auto">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusSelect(option.value)}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: option.value === getStatusOption(creator.status).value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-600"
                            style={{ backgroundColor: option.bgColor }}
                          />
                          <span style={{ color: '#ffffff' }}>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Channel Dropdown */}
                <div className="relative" ref={channelDropdownRef}>
                  <button
                    onClick={() => {
                      setOpenChannelDropdown(!openChannelDropdown);
                      setOpenStatusDropdown(false);
                    }}
                    className="px-2 py-1 rounded-[20px] text-xs md:text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-between gap-1"
                    style={{
                      backgroundColor: getChannelOption(creator.channel)?.bgColor || '#374151',
                      color: getChannelOption(creator.channel)?.textColor || '#f8f9fa',
                    }}
                  >
                    <span className="truncate max-w-[100px]">{getChannelOption(creator.channel)?.label || 'N/A'}</span>
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none"
                      className={`transition-transform ${openChannelDropdown ? 'rotate-180' : ''}`}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openChannelDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-[#111827] border border-gray-700 rounded-[20px] shadow-xl overflow-hidden z-[9999] max-h-60 overflow-y-auto">
                      <button
                        onClick={() => handleChannelSelect(null)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                        style={{
                          backgroundColor: !getChannelOption(creator.channel) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        }}
                      >
                        <div className="w-4 h-4 rounded border border-gray-600 bg-[#374151]" />
                        <span style={{ color: '#ffffff' }}>N/A</span>
                      </button>
                      {CHANNEL_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleChannelSelect(option.value)}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: option.value === getChannelOption(creator.channel)?.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-600"
                            style={{ backgroundColor: option.bgColor }}
                          />
                          <span style={{ color: '#ffffff' }}>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <button
              onClick={onClose}
              className="bg-transparent hover:bg-gray-700/40 transition-colors cursor-pointer p-1 rounded-full"
            >
              <svg 
                width="22" 
                height="22" 
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

        {/* Talent Network: Price (above location) */}
        {isTalentNetwork && (
          <div className="px-[12px] md:px-[14px] mb-[9px] md:mb-[14px]">
            <div className="flex items-center gap-[5px] md:gap-[6px] lg:gap-[8px]">
              <span className="text-gray-400 text-[12px] md:text-[14px] lg:text-[16px] font-medium">Price:</span>
              {editingPrice ? (
                <input
                  type="number"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(e.target.value)}
                  onBlur={handleSavePrice}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePrice();
                    } else if (e.key === 'Escape') {
                      setEditingPrice(false);
                      setTempPrice(creator.price !== null && creator.price !== undefined ? String(creator.price) : '');
                    }
                  }}
                  placeholder="N/A"
                  min="0"
                  className="px-2 py-1 text-[12px] md:text-[14px] lg:text-[16px] font-medium text-[#f8f9fa] bg-[#374151] border-b border-[#94c4fc] outline-none rounded"
                  autoFocus
                />
              ) : (
                <span
                  className="text-[#f8f9fa] text-[12px] md:text-[14px] lg:text-[16px] font-medium cursor-pointer hover:underline hover:text-[#94c4fc] transition-colors"
                  onClick={() => setEditingPrice(true)}
                >
                  {formatPrice(creator.price)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        {creator.location && (
          <div className="px-[12px] md:px-[14px] mb-[9px] md:mb-[14px]">
            <div className="flex items-center gap-[5px] md:gap-[6px] lg:gap-[8px]">
              <Icon
                name="LocationIcon.svg"
               className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] lg:w-[16px] lg:h-[16px] text-gray-400"
                alt="Location"
              />
              <span className="text-gray-400 text-[12px] md:text-[14px] lg:text-[16px] font-medium">
                {creator.location}
              </span>
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
          <p className="text-gray-300 text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-[18px] md:leading-[20px] lg:leading-[24px]">
            {creator.bio}
          </p>
        </div>

        {/* Category Badges - show only secondary niches */}
        <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
          <div className="flex items-center gap-[8px] md:gap-[10px] lg:gap-[12px] flex-wrap">
            {creator.niches
              .filter((n) => n.type === 'secondary')
              .map((niche, index) => (
                <div key={index} className="flex items-center">
                  <div
                    aria-label={`Secondary niche: ${niche.name}`}
                    className={`px-[8px] lg:px-[10px] xl:px-[12px] py-[4px] lg:py-[5px] xl:py-[6px] rounded-[12px] flex items-center bg-[rgba(20,83,45,0.5)] border border-solid border-[#22C55E]`}
                  >
                    <span className="font-inter font-medium text-[11px] md:text-[12px] lg:text-[14px] text-[#F9FAFB] leading-none">
                      {niche.name}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Talent Network: Note */}
        {isTalentNetwork && (
          <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
            <div className="flex items-start gap-[8px] md:gap-[10px]">
              <h3 className="text-white text-[12px] md:text-[14px] lg:text-[16px] font-medium">Note</h3>
              {!editingNote && (
                <button
                  onClick={() => setEditingNote(true)}
                  className="mt-0.5"
                >
                  <Icon
                    name="EditIcon.svg"
                    className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] text-gray-400 hover:text-gray-300 transition-colors"
                    alt="Edit"
                  />
                </button>
              )}
            </div>
            {editingNote ? (
              <div className="mt-2">
                <textarea
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  onBlur={handleSaveNote}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingNote(false);
                      setTempNote(creator.note || '');
                    }
                  }}
                  placeholder="Add note..."
                  className="w-full px-3 py-2 text-[12px] md:text-[14px] lg:text-[16px] font-medium text-gray-300 bg-[#1f2937] border border-gray-600 rounded-lg outline-none focus:border-[#94c4fc] resize-none"
                  rows={4}
                  autoFocus
                />
              </div>
            ) : (
              <p 
                className="text-gray-300 text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-[18px] md:leading-[20px] lg:leading-[24px] mt-2 cursor-pointer hover:text-gray-200 transition-colors"
                onClick={() => setEditingNote(true)}
              >
                {creator.note || 'No note added yet.'}
              </p>
            )}
          </div>
        )}

        {/* Talent Network: What do you post? */}
        {isTalentNetwork && (
          <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
            <div className="flex items-start gap-[8px] md:gap-[10px]">
              <h3 className="text-white text-[12px] md:text-[14px] lg:text-[16px] font-medium">What do you post?</h3>
              {!editingWhatDoYouPost && (
                <button
                  onClick={() => setEditingWhatDoYouPost(true)}
                  className="mt-0.5"
                >
                  <Icon
                    name="EditIcon.svg"
                    className="w-[12px] h-[12px] md:w-[14px] md:h-[14px] text-gray-400 hover:text-gray-300 transition-colors"
                    alt="Edit"
                  />
                </button>
              )}
            </div>
            {editingWhatDoYouPost ? (
              <div className="mt-2">
                <textarea
                  value={tempWhatDoYouPost}
                  onChange={(e) => setTempWhatDoYouPost(e.target.value)}
                  onBlur={handleSaveWhatDoYouPost}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingWhatDoYouPost(false);
                      setTempWhatDoYouPost(creator.what_do_you_post || '');
                    }
                  }}
                  placeholder="Add description..."
                  className="w-full px-3 py-2 text-[12px] md:text-[14px] lg:text-[16px] font-medium text-gray-300 bg-[#1f2937] border border-gray-600 rounded-lg outline-none focus:border-[#94c4fc] resize-none"
                  rows={4}
                  autoFocus
                />
              </div>
            ) : (
              <p 
                className="text-gray-300 text-[12px] md:text-[14px] lg:text-[16px] font-medium leading-[18px] md:leading-[20px] lg:leading-[24px] mt-2 cursor-pointer hover:text-gray-200 transition-colors"
                onClick={() => setEditingWhatDoYouPost(true)}
              >
                {creator.what_do_you_post || 'No description added yet.'}
              </p>
            )}
          </div>
        )}

        {/* Metrics Cards - Single Row */}
        <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
          <div className="grid grid-cols-5 gap-[8px] md:gap-[10px] lg:gap-[12px]">
            {/* Followers */}
            <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px] border border-gray-700">
              <div className="flex items-center justify-center">
                <Icon
                  name="FollowerIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Followers"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-50 text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.followers.toLocaleString()}
                </div>
                <div className="text-gray-400 text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
                  Followers
                </div>
                <div className="flex items-center justify-center gap-[2px] md:gap-1">
                  {((creator.followers_change ?? 0) === 0) ? (
                    <span className="mr-0.5 text-gray-500">-</span>
                  ) : (
                    <Icon name={(creator.followers_change ?? 0) > 0 ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-[6px] h-[6px] md:w-[8px] md:h-[8px] lg:w-[10px] lg:h-[10px]" alt={(creator.followers_change ?? 0) > 0 ? 'Positive change' : 'Negative change'} />
                  )}
                  <span className={`text-[10px] lg:text-[11px] font-medium ${((creator.followers_change ?? 0) === 0) ? 'text-gray-400' : (creator.followers_change ?? 0) > 0 ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.followers_change ?? 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Avg. Views */}
            <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px] border border-gray-700">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgViewsIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Views"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-50 text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.avg_views.toLocaleString()}
                </div>
                <div className="text-gray-400 text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
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
            <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px] border border-gray-700">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgEngagementIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Engagement"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-50 text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {creator.engagement.toFixed(1)}%
                </div>
                <div className="text-gray-400 text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
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
            <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px] border border-gray-700">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgLikesIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Avg. Likes"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-50 text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {(creator.avg_likes || 0).toLocaleString()}
                </div>
                <div className="text-gray-400 text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
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
            <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[3px] md:px-[6px] py-[6px] md:py-[10px] flex flex-col items-center gap-[4px] md:gap-[8px] lg:gap-[10px] xl:gap-[12px] border border-gray-700">
              <div className="flex items-center justify-center">
                <Icon
                  name="AvgCommentsIcon.svg"
                  className="w-[24px] h-[24px] md:w-[40px] md:h-[40px] lg:w-[44px] lg:h-[44px]"
                  alt="Avg. Comments"
                />
              </div>
              <div className="text-center">
                <div className="text-gray-50 text-[9px] md:text-[13px] lg:text-[15px] font-bold mb-1">
                  {(creator.avg_comments || 0).toLocaleString()}
                </div>
                <div className="text-gray-400 text-[8px] md:text-[10px] lg:text-[13px] font-medium mb-1">
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
        <div className="px-[12px] md:px-[14px] mb-[12px] md:mb-[17px]">
          <div className="bg-[#1f2937] rounded-[8px] md:rounded-[12px] px-[12px] md:px-[20px] lg:px-[24px] pt-[10px] md:pt-[13px] lg:pt-[12px] pb-[12px] md:pb-[20px] lg:pb-[24px] border border-gray-700">
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
                  className="bg-transparent hover:bg-gray-800 p-1 rounded-full transition-colors"
                >
                <Icon
                  name="InformationIcon.svg"
                  className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] lg:w-[14px] lg:h-[14px] text-gray-600 dark:text-gray-400"
                  alt="Info"
                />
                </button>
                
                {/* Buzz Score Info Popup */}
                {showBuzzScoreInfo && (
                  <div
                    ref={buzzScoreInfoRef}
                    className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] bg-[#111827] border border-gray-700 rounded-lg shadow-lg z-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-100 mb-2 text-sm">Buzz Score</h3>
                        <p className="text-sm text-gray-300">
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
              const displayThumbnails = [
                ...thumbnails.slice(0, 4),
                ...Array(4 - thumbnails.length).fill('/images/PostThumbnail-3.svg')
              ].slice(0, 4);
              
              return displayThumbnails.map((thumbnail, index) => {
                const shareUrl = creator.share_urls?.[index];
                const isTikTok = creator.social_media[0]?.platform === 'tiktok';
                const isInstagram = creator.social_media[0]?.platform === 'instagram';
                const primarySocial = creator.social_media[0];
                const profileUrl = primarySocial?.url;
                
                // For TikTok accounts, use the specific post URL if available, otherwise fall back to profile
                // For Instagram and other platforms, always use profile URL
                const clickUrl = isTikTok && shareUrl ? shareUrl : profileUrl;
                
                return (
                  <div key={index} className="aspect-[9/16] rounded-[6px] md:rounded-[10px] lg:rounded-[12px] overflow-hidden border border-gray-700 group relative">
                    {/* TikTok-style hover overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 ease-in-out z-10" />
                    
                    {/* Clickable link - TikTok leads to specific post, others to profile */}
                    <a
                      href={clickUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full relative z-20"
                    >
                      <img
                        src={thumbnail}
                        alt={`${creator.username} post ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-in-out"
                        loading="eager"
                      />
                      
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
    </div>
  );
};