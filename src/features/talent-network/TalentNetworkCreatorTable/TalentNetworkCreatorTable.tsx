import React, { useState, useEffect, useRef } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { Icon } from '../../../components/ui/icon-component';
import { ChevronDown } from 'lucide-react';

type Creator = any;

type SortField = 'followers' | 'avg_views' | 'engagement' | 'price';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

type Props = {
  creators: Creator[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll?: () => void;
  onRowClick: (creator: Creator) => void;
  sortState?: SortState;
  onSort?: (field: SortField) => void;
  onPriceUpdate?: (creatorId: string, newPrice: number | null) => void;
  onStatusUpdate?: (creatorId: string, status: string) => void;
  onChannelUpdate?: (creatorId: string, channel: string | null) => void;
};

// Status options with colors
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

// Channel options with colors
const CHANNEL_OPTIONS = [
  { value: 'Email w/o brand', label: 'Email w/o brand', textColor: '#000000', bgColor: '#ffe5a0' },
  { value: 'Inbound', label: 'Inbound', textColor: '#ffffff', bgColor: '#8550be' },
  { value: 'Email with brand', label: 'Email with brand', textColor: '#ffffff', bgColor: '#11734b' },
  { value: 'DM w/o brand', label: 'DM w/o brand', textColor: '#ffffff', bgColor: '#f58282' },
  { value: 'DM w/ brand', label: 'DM w/ brand', textColor: '#000000', bgColor: '#ffa3d7' },
];

export function TalentNetworkCreatorTable({ 
  creators, 
  selectedIds, 
  onToggleSelect, 
  onRowClick, 
  sortState, 
  onSort, 
  onPriceUpdate,
  onStatusUpdate,
  onChannelUpdate,
}: Props) {
  // State for managing price editing
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [priceValues, setPriceValues] = useState<Record<number, number | null>>({});
  const [tempPriceValue, setTempPriceValue] = useState<string>('');

  // State for dropdowns
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null);
  const [openChannelDropdown, setOpenChannelDropdown] = useState<number | null>(null);
  const statusDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const channelDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Initialize price values from creators data
  useEffect(() => {
    const initialPrices: Record<number, number | null> = {};
    creators.forEach((creator) => {
      initialPrices[creator.id] = creator.price ?? null;
    });
    setPriceValues(initialPrices);
  }, [creators]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openStatusDropdown !== null) {
        const ref = statusDropdownRefs.current[openStatusDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenStatusDropdown(null);
        }
      }
      if (openChannelDropdown !== null) {
        const ref = channelDropdownRefs.current[openChannelDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenChannelDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openStatusDropdown, openChannelDropdown]);

  // Format price for display (add $ prefix or show N/A)
  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price}`;
  };

  // Handle price editing
  const handleStartEditPrice = (creatorId: number, currentPrice: number | null) => {
    setEditingPriceId(creatorId);
    setTempPriceValue(currentPrice !== null ? String(currentPrice) : '');
  };

  const handleSavePrice = async (creatorId: number) => {
    const trimmed = tempPriceValue.trim();
    const numericPrice = trimmed === '' ? null : parseInt(trimmed, 10);
    
    if (trimmed !== '' && (isNaN(numericPrice!) || numericPrice! < 0)) {
      setEditingPriceId(null);
      setTempPriceValue('');
      return;
    }

    setPriceValues(prev => ({ ...prev, [creatorId]: numericPrice }));
    setEditingPriceId(null);

    if (onPriceUpdate) {
      try {
        await onPriceUpdate(String(creatorId), numericPrice);
      } catch (error) {
        console.error('Failed to update price:', error);
        const creator = creators.find(c => c.id === creatorId);
        if (creator) {
          setPriceValues(prev => ({ ...prev, [creatorId]: creator.price ?? null }));
        }
      }
    }
  };

  const handleCancelEditPrice = () => {
    setEditingPriceId(null);
    setTempPriceValue('');
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent, creatorId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSavePrice(creatorId);
    } else if (e.key === 'Escape') {
      handleCancelEditPrice();
    }
  };

  // Handle status update
  const handleStatusSelect = async (creatorId: number, status: string) => {
    setOpenStatusDropdown(null);
    if (onStatusUpdate) {
      try {
        await onStatusUpdate(String(creatorId), status);
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    }
  };

  // Handle channel update
  const handleChannelSelect = async (creatorId: number, channel: string | null) => {
    setOpenChannelDropdown(null);
    if (onChannelUpdate) {
      try {
        await onChannelUpdate(String(creatorId), channel);
      } catch (error) {
        console.error('Failed to update channel:', error);
      }
    }
  };

  const getStatusOption = (status: string | null | undefined) => {
    return STATUS_OPTIONS.find(opt => opt.value === (status || 'No reply')) || STATUS_OPTIONS[0];
  };

  const getChannelOption = (channel: string | null | undefined) => {
    if (!channel) return null;
    return CHANNEL_OPTIONS.find(opt => opt.value === channel) || null;
  };

  if (!creators || creators.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 py-8">
        <div className="text-center">
          <div className="text-lg mb-2">No creators in talent network yet</div>
          <div className="text-sm">Add creators to see them here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto lg:overflow-x-visible">
      <div className="min-w-[1200px] lg:min-w-[1400px] xl:min-w-0">
        <div className="gap-2 sm:gap-3 lg:gap-4 px-3 py-2 bg-[#374151] rounded-t-lg border-b border-[#4b5563] text-[10px] sm:text-xs lg:text-[13px] xl:text-[14px] font-medium text-[#d1d5db] grid grid-cols-[40px_160px_70px_90px_90px_90px_100px_120px_120px_40px] lg:grid-cols-[50px_180px_80px_100px_100px_100px_120px_140px_140px_50px] xl:grid-cols-[50px_2fr_0.7fr_1fr_1fr_1fr_1fr_1.2fr_1.2fr_50px]">
          <div></div>
          <div className="flex items-center gap-1 sm:gap-2 justify-start"><span className="truncate">Influencers</span></div>
          {onSort ? (
            <button onClick={() => onSort('price')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
              <span className="truncate">Price</span>
              <Icon name="SortIcon.svg" className={`w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState?.field === 'price' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 justify-center"><span className="truncate">Price</span></div>
          )}
          {onSort ? (
            <button onClick={() => onSort('followers')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
              <span className="truncate">Followers</span>
              <Icon name="SortIcon.svg" className={`w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState?.field === 'followers' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 justify-center"><span className="truncate">Followers</span></div>
          )}
          {onSort ? (
            <button onClick={() => onSort('avg_views')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
              <span className="truncate">Avg. Views</span>
              <Icon name="SortIcon.svg" className={`w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState?.field === 'avg_views' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 justify-center"><span className="truncate">Avg. Views</span></div>
          )}
          {onSort ? (
            <button onClick={() => onSort('engagement')} className="flex items-center gap-1 sm:gap-2 justify-center hover:text-gray-100 transition-colors cursor-pointer">
              <span className="truncate">Engagement</span>
              <Icon name="SortIcon.svg" className={`w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0 transition-transform ${sortState?.field === 'engagement' && sortState?.direction === 'asc' ? 'rotate-180' : ''}`} alt="Sort" />
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 justify-center"><span className="truncate">Engagement</span></div>
          )}
          <div className="flex items-center justify-center"><span className="truncate">Location</span></div>
          <div className="flex items-center justify-center"><span className="truncate">Status</span></div>
          <div className="flex items-center justify-center"><span className="truncate">Channel</span></div>
          <div></div>
        </div>

        <div className="bg-[#1f2937] rounded-b-lg border border-[#374151] border-t-0 overflow-hidden">
          {creators.map((creator, index) => {
            const statusOption = getStatusOption(creator.status);
            const channelOption = getChannelOption(creator.channel);

            return (
              <div key={creator.id} className={`gap-2 sm:gap-3 lg:gap-4 px-3 py-3 items-center hover:bg-[#374151] transition-colors cursor-pointer ${index !== creators.length - 1 ? 'border-b border-[#374151]' : ''} ${selectedIds.has(creator.id) ? 'border-l-4 border-l-[#94c4fc]' : ''} grid grid-cols-[40px_160px_70px_90px_90px_90px_100px_120px_120px_40px] lg:grid-cols-[50px_180px_80px_100px_100px_100px_120px_140px_140px_50px] xl:grid-cols-[50px_2fr_0.7fr_1fr_1fr_1fr_1fr_1.2fr_1.2fr_50px]`} onClick={() => onRowClick(creator)}>
                <div className="flex justify-center">
                  <div className="flex flex-row items-center gap-1 w-4 h-4">
                    {selectedIds.has(creator.id) ? (
                      <div className="flex items-center justify-center w-4 h-4 bg-[#217EFD] rounded-[3px] cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleSelect(creator.id); }}>
                        <svg width="8" height="6" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2 h-1.5"><path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-[#4B5563] rounded-[3px] border border-[#6B7280] cursor-pointer hover:bg-[#5B6573] transition-colors" onClick={(e) => { e.stopPropagation(); onToggleSelect(creator.id); }} />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0 -ml-[2px]">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-[#384455] rounded-full overflow-hidden flex-shrink-0">
                    {creator.profile_image_url ? (
                      <img src={creator.profile_image_url} alt={`${creator.display_name} profile`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#384455]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-semibold text-[#f8f9fa] text-xs lg:text-[13px] xl:text-[14px] min-w-0 max-w-[120px] xl:max-w-none truncate">{creator.display_name}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[#9ca3af] text-[10px] lg:text-[11px] xl:text-[12px] font-medium truncate">{creator.handle}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <img src={`/${creator.platform}Logo.svg`} className="w-[10px] h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px]" alt={`${creator.platform} logo`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Column - Editable */}
                <div className="flex justify-center items-center -ml-[2px]" onClick={(e) => e.stopPropagation()}>
                  {editingPriceId === creator.id ? (
                    <input
                      type="number"
                      value={tempPriceValue}
                      onChange={(e) => setTempPriceValue(e.target.value)}
                      onKeyDown={(e) => handlePriceKeyDown(e, creator.id)}
                      onBlur={() => handleSavePrice(creator.id)}
                      placeholder="N/A"
                      min="0"
                      className="w-full max-w-[60px] px-1 py-0.5 text-center text-xs lg:text-[13px] xl:text-[13px] font-medium text-[#f8f9fa] bg-[#374151] border-b border-[#94c4fc] outline-none"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-xs lg:text-[13px] xl:text-[13px] font-medium text-[#f8f9fa] cursor-pointer hover:underline hover:text-[#94c4fc] transition-colors"
                      onClick={() => handleStartEditPrice(creator.id, priceValues[creator.id] ?? null)}
                    >
                      {formatPrice(priceValues[creator.id])}
                    </span>
                  )}
                </div>

                <div className="text-center text-xs lg:text-[13px] xl:text-[13px] font-medium text-[#f8f9fa] -ml-[2px]">
                  <div>{formatNumber(creator.followers_count)}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {((creator.followers_change ?? creator.follower_change ?? 0) === 0) ? (
                      <span className="mr-0.5 text-gray-500">-</span>
                    ) : (
                      <Icon name={((creator.followers_change ?? creator.follower_change ?? 0) > 0) ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={((creator.followers_change ?? creator.follower_change ?? 0) > 0) ? 'Positive change' : 'Negative change'} />
                    )}
                    <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.followers_change ?? creator.follower_change ?? 0) === 0) ? 'text-gray-500' : ((creator.followers_change ?? creator.follower_change ?? 0) > 0) ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.followers_change ?? creator.follower_change ?? 0).toFixed(2)}%</span>
                  </div>
                </div>

                <div className="text-center text-xs lg:text-[13px] xl:text-[13px] font-medium text-[#f8f9fa]">
                  <div>{formatNumber(creator.average_views)}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {((creator.average_views_change ?? creator.views_change ?? 0) === 0) ? (
                      <span className="mr-0.5 text-gray-500">-</span>
                    ) : (
                      <Icon name={((creator.average_views_change ?? creator.views_change ?? 0) > 0) ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={((creator.average_views_change ?? creator.views_change ?? 0) > 0) ? 'Positive change' : 'Negative change'} />
                    )}
                    <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.average_views_change ?? creator.views_change ?? 0) === 0) ? 'text-gray-500' : ((creator.average_views_change ?? creator.views_change ?? 0) > 0) ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.average_views_change ?? creator.views_change ?? 0).toFixed(2)}%</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[#f8f9fa] font-medium text-xs lg:text-[13px] xl:text-[13px]">
                    {(creator.engagement_rate ?? 0).toFixed(2)}%
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {((creator.engagement_rate_change ?? creator.engagement_change ?? 0) === 0) ? (
                      <span className="mr-0.5 text-gray-500">-</span>
                    ) : (
                      <Icon name={((creator.engagement_rate_change ?? creator.engagement_change ?? 0) > 0) ? 'PositiveChangeIcon.svg' : 'NegativeChangeIcon.svg'} className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 flex-shrink-0" alt={((creator.engagement_rate_change ?? creator.engagement_change ?? 0) > 0) ? 'Positive change' : 'Negative change'} />
                    )}
                    <span className={`text-[10px] lg:text-[11px] xl:text-[11px] font-medium ${((creator.engagement_rate_change ?? creator.engagement_change ?? 0) === 0) ? 'text-gray-500' : ((creator.engagement_rate_change ?? creator.engagement_change ?? 0) > 0) ? 'text-[#1ad598]' : 'text-[#ea3a3d]'}`}>{Math.abs(creator.engagement_rate_change ?? creator.engagement_change ?? 0).toFixed(2)}%</span>
                  </div>
                </div>

                <div className="text-xs lg:text-[13px] xl:text-[13px] text-[#f8f9fa] text-center">
                  {creator.location ? (
                    <div className="flex flex-col">
                      <div className="truncate">{String(creator.location).split(', ')[0]}</div>
                      {String(creator.location).includes(', ') && <div className="truncate">{String(creator.location).split(', ')[1]}</div>}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </div>

                {/* Status Column - Dropdown */}
                <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-full" ref={(el) => { statusDropdownRefs.current[creator.id] = el; }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusDropdown(openStatusDropdown === creator.id ? null : creator.id);
                        setOpenChannelDropdown(null);
                      }}
                      className="w-full px-2 py-1 rounded-[20px] text-xs lg:text-[13px] xl:text-[13px] font-medium transition-colors hover:opacity-90 flex items-center justify-between gap-1"
                      style={{
                        backgroundColor: statusOption.bgColor,
                        color: statusOption.textColor,
                      }}
                    >
                      <span className="truncate">{statusOption.label}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openStatusDropdown === creator.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openStatusDropdown === creator.id && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999] max-h-60 overflow-y-auto">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusSelect(creator.id, option.value);
                            }}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                            style={{
                              backgroundColor: option.value === statusOption.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
                </div>

                {/* Channel Column - Dropdown */}
                <div className="flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-full" ref={(el) => { channelDropdownRefs.current[creator.id] = el; }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenChannelDropdown(openChannelDropdown === creator.id ? null : creator.id);
                        setOpenStatusDropdown(null);
                      }}
                      className="w-full px-2 py-1 rounded-[20px] text-xs lg:text-[13px] xl:text-[13px] font-medium transition-colors hover:opacity-90 flex items-center justify-between gap-1"
                      style={{
                        backgroundColor: channelOption?.bgColor || '#374151',
                        color: channelOption?.textColor || '#f8f9fa',
                      }}
                    >
                      <span className="truncate">{channelOption?.label || 'N/A'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${openChannelDropdown === creator.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openChannelDropdown === creator.id && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-[#111827] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[9999] max-h-60 overflow-y-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChannelSelect(creator.id, null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                          style={{
                            backgroundColor: !channelOption ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          }}
                        >
                          <div className="w-4 h-4 rounded border border-gray-600 bg-[#374151]" />
                          <span style={{ color: '#ffffff' }}>N/A</span>
                        </button>
                        {CHANNEL_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChannelSelect(creator.id, option.value);
                            }}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a1f2e] transition-colors flex items-center gap-2"
                            style={{
                              backgroundColor: option.value === channelOption?.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
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
                </div>

                <div></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

