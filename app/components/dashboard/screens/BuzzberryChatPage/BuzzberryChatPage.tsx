'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { ChatHistorySection } from "../BuzzberryDashboard/sections/ChatHistorySection";
import { useAIChat } from '@/hooks/useAIChat'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from '@supabase/supabase-js'
import { transformCreatorData } from '@/utils/creatorListIntegration';
import { DonutChart } from '@/components/ui/donut-chart';
import { listsClient } from '@/lib/listsClient';
import { AISearchCreatorTable } from './AISearchCreatorTable';
import { Plus } from "lucide-react";

// Import SortField type
type SortField = 'followers' | 'avg_views' | 'engagement' | 'buzz_score' | 'final_score';

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
}

interface BuzzberryChatPageProps {
  initialPrompt?: string;
  onBack?: () => void;
  user?: User;
}

interface CreatorRowProps {
  creator: any;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (creatorId: string) => void;
  searchQuery: string;
  isSelected: boolean;
  onToggleSelection: (creatorId: string) => void;
}

const CreatorRow: React.FC<CreatorRowProps> = ({ creator, index, isExpanded, onToggleExpand, searchQuery, isSelected, onToggleSelection }) => {
  const c = transformCreatorData(creator);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const creatorId = creator?.id || creator?.creator_id || creator?.username || `creator-${index}`;

  useEffect(() => {
    if (isExpanded && !aiExplanation && !isLoadingExplanation) {
      setIsLoadingExplanation(true);
      setTimeout(() => {
        setAiExplanation(`This creator matches your search for "${searchQuery}" because they specialize in ${c.niches?.[0]?.name || 'content creation'} with a strong following of ${c.followers >= 1000000 ? `${(c.followers / 1000000).toFixed(1)}M` : c.followers >= 1000 ? `${(c.followers / 1000).toFixed(0)}K` : c.followers} followers and an engagement rate of ${(c.engagement_rate * 100).toFixed(2)}%.`);
        setIsLoadingExplanation(false);
      }, 1000);
    }
  }, [isExpanded, aiExplanation, isLoadingExplanation, c, searchQuery]);

  const handleRowClick = () => {
    onToggleExpand(creatorId);
  };

  const handleCheckboxClick = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelection(creatorId);
  };

  const handleDMClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('DM clicked for:', c.name);
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Email clicked for:', c.name);
  };

  return (
    <>
      <div 
        className="creator-list-row cursor-pointer transition-all duration-300" 
        style={{
          backgroundColor: isExpanded ? '#2a2f3a' : '#1a1f2e',
          color: '#e5e7eb',
          borderBottomColor: '#374151',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          position: 'relative',
          borderLeft: isSelected ? '4px solid #3b82f6' : 'none',
          borderRadius: '6px',
          margin: '0.25rem',
          border: '1px solid #374151',
          transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isExpanded ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
        }}
        onClick={handleRowClick}
      >
        {/* Expand indicator */}
        <div className="flex justify-center" style={{width: '24px'}}>
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

                <div className="creator-info" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', width: '200px'}}>
          <div className="creator-avatar">
            {creator.profile_image_url ? (
              <img 
                src={creator.profile_image_url} 
                alt={creator.display_name || creator.handle} 
                className="creator-profile-image" 
                style={{width: '2.25rem', height: '2.25rem', borderRadius: '50%', objectFit: 'cover'}}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.creator-initials') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className={`creator-initials ${creator.profile_image_url ? 'hidden' : ''}`} style={{
              display: creator.profile_image_url ? 'none' : 'flex', 
              width: '2.25rem', 
              height: '2.25rem', 
              fontSize: '0.875rem',
              backgroundColor: '#4b5563',
              color: '#e5e7eb',
              borderRadius: '50%',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(creator.display_name || creator.handle || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="creator-details" style={{flex: 1}}>
            <div className="creator-name" style={{fontSize: '0.8rem', fontWeight: '600', color: '#e5e7eb', marginBottom: '0.125rem'}}>
              {creator.display_name || creator.handle}
            </div>
            <div className="creator-username" style={{fontSize: '0.7rem', color: '#9ca3af'}}>
              @{creator.handle}
          </div>
            {/* Platform icon */}
            {creator.platform && (
              <div className="platform-icon" style={{marginTop: '0.125rem'}}>
                {creator.platform === 'Instagram' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.059 1.645-.07 4.849-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E4405F"/>
                  </svg>
                )}
                {creator.platform === 'TikTok' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="#000000"/>
                  </svg>
                )}
                {creator.platform === 'YouTube' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
                  </svg>
                )}
                {creator.platform === 'X' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="match-score" style={{
          backgroundColor: 'transparent',
          color: '#86efac',
          width: '40px',
          textAlign: 'center',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>{creator.final_score ? Math.round(creator.final_score * 100) : 0}</div>
        
        <div className="metric-column" style={{width: '60px', textAlign: 'center'}}>
          <div style={{color: '#e5e7eb', fontSize: '0.75rem'}}>
              {creator.followers_count >= 1000000 
                ? `${(creator.followers_count / 1000000).toFixed(1)}M`
                : creator.followers_count >= 1000 
                ? `${(creator.followers_count / 1000).toFixed(0)}K`
              : creator.followers_count?.toLocaleString() || '0'}
            </div>
          </div>

        <div className="metric-column" style={{width: '60px', textAlign: 'center'}}>
          <div style={{color: '#e5e7eb', fontSize: '0.75rem'}}>
            {creator.average_views >= 1000000 
              ? `${(creator.average_views / 1000000).toFixed(1)}M` 
              : creator.average_views >= 1000 
              ? `${(creator.average_views / 1000).toFixed(0)}K` 
              : creator.average_views?.toLocaleString() || '0'}
            </div>
          </div>

        <div className="metric-column" style={{width: '70px', textAlign: 'center'}}>
          <div style={{color: '#e5e7eb', fontSize: '0.75rem'}}>
            {creator.engagement_rate ? `${(creator.engagement_rate * 100).toFixed(1)}%` : '0%'}
          </div>
        </div>

        <div className="category-badges flex-col gap-1" style={{gap: '0.125rem', width: '100px', textAlign: 'center'}}>
          {creator.primary_niche && (
            <div className="category-badge primary" style={{
              fontSize: '0.625rem', 
              padding: '0.125rem 0.375rem',
              backgroundColor: '#1e3a8a',
              color: '#93c5fd',
              borderRadius: '0.25rem',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: '500'
            }}>{creator.primary_niche}</div>
          )}
          {creator.secondary_niche && creator.secondary_niche !== creator.primary_niche && (
            <div className="category-badge secondary" style={{
              fontSize: '0.625rem', 
              padding: '0.125rem 0.375rem',
              backgroundColor: '#374151',
              color: '#9ca3af',
              borderRadius: '0.25rem',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: '500'
            }}>{creator.secondary_niche}</div>
          )}
          {!creator.primary_niche && !creator.secondary_niche && (
            <div className="category-badge general" style={{
              fontSize: '0.625rem', 
              padding: '0.125rem 0.375rem',
                backgroundColor: '#374151',
              color: '#9ca3af',
              borderRadius: '0.25rem',
              textAlign: 'center'
            }}>General</div>
          )}
        </div>

        <div className="text-center" style={{width: '80px'}}>
          <div className="location-text" style={{fontSize: '0.75rem', color: '#9ca3af'}}>
            {creator.location_region || creator.location || 'Global'}
        </div>
      </div>

        <div className="donut-chart-container" style={{width: '70px', display: 'flex', justifyContent: 'center'}}>
          <DonutChart score={creator.buzz_score || 0} size={32} />
        </div>
        
        {/* Selection Checkbox */}
        <div className="flex justify-center" style={{width: '24px'}}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={handleCheckboxClick}
            onClick={handleCheckboxClick}
            className="creator-list-checkbox" 
          style={{
              width: '1rem', 
              height: '1rem', 
              backgroundColor: isSelected ? '#3b82f6' : 'transparent', 
              borderColor: isSelected ? '#3b82f6' : '#4b5563',
              border: '1px solid',
              borderRadius: '3px',
              cursor: 'pointer'
            }} 
          />
              </div>
      </div>

      {/* Expanded Content - Inline within the card */}
      {isExpanded && (
        <div className="expanded-content-inline" style={{
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid #374151',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Bio & Details */}
            <div className="space-y-3">
              {/* Bio */}
            {creator.bio && (
                <div className="bio">
                  <h4 className="text-xs font-semibold text-gray-200 mb-1">Bio</h4>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{creator.bio}</p>
                </div>
              )}

              {/* Top Hashtags */}
              {creator.hashtags && Array.isArray(creator.hashtags) && creator.hashtags.length > 0 && (
                <div className="hashtags">
                  <h4 className="text-xs font-semibold text-gray-200 mb-1">Top Hashtags</h4>
                  <div className="flex flex-wrap gap-1">
                    {creator.hashtags.slice(0, 4).map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="text-xs text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-800"
                      >
                        #{tag}
                      </span>
                    ))}
            </div>
              </div>
              )}
              </div>
            
            {/* Right Column - Performance & Contact */}
            <div className="space-y-3">
              {/* Performance Metrics */}
              <div className="performance-metrics">
                <h4 className="text-xs font-semibold text-gray-200 mb-1">Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Followers</div>
                    <div className="text-xs font-semibold text-white">
                      {creator.followers_count >= 1000000 
                        ? `${(creator.followers_count / 1000000).toFixed(1)}M`
                        : creator.followers_count >= 1000 
                        ? `${(creator.followers_count / 1000).toFixed(0)}K`
                        : creator.followers_count?.toLocaleString() || '0'}
              </div>
              </div>
                  <div className="bg-gray-800/50 p-2 rounded text-center">
                    <div className="text-xs text-gray-400">Engagement</div>
                    <div className="text-xs font-semibold text-white">
                      {creator.engagement_rate ? `${(creator.engagement_rate * 100).toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Actions */}
              <div className="contact-actions">
                <h4 className="text-xs font-semibold text-gray-200 mb-1">Contact</h4>
                <div className="flex gap-2">
                  {creator.email && (
                    <button
                      onClick={handleEmailClick}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Email
                    </button>
                  )}
                  <button
                    onClick={handleDMClick}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    DM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const BuzzberryChatPage = ({ initialPrompt, onBack, user }: BuzzberryChatPageProps): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState("");
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  // AI Chat management
  const { 
    messages, 
    isLoading, 
    chatHistory,
    streamingMessage,
    sendMessage: aiSendMessage, 
    clearMessages, 
    removeChat, 
    clearHistory, 
    formatTimestamp,
    loadChatSession,
    refreshChatHistory,
    creatorResults,
    isLoadingCreators
  } = useAIChat();

  // Add state for UI interactions and pagination
  const [expandedCreators, setExpandedCreators] = useState<Set<string>>(new Set());
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [showListPicker, setShowListPicker] = useState(false);
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const creatorsPerPage = 5;

  // Add sorting state
  const [sortState, setSortState] = useState<{field: SortField | null, direction: 'asc' | 'desc'}>({
    field: null,
    direction: 'desc'
  });

  // Sort creators based on current sort state
  const sortCreators = (creators: any[]) => {
    if (!sortState.field) return creators;

    return [...creators].sort((a, b) => {
      let aValue, bValue;

      switch (sortState.field) {
        case 'followers':
          aValue = a.followers_count || 0;
          bValue = b.followers_count || 0;
          break;
        case 'avg_views':
          aValue = a.average_views || 0;
          bValue = b.average_views || 0;
          break;
        case 'engagement':
          aValue = a.engagement_rate || 0;
          bValue = b.engagement_rate || 0;
          break;
        case 'buzz_score':
          aValue = a.buzz_score || 0;
          bValue = b.buzz_score || 0;
          break;
        case 'final_score':
          aValue = a.final_score || 0;
          bValue = b.final_score || 0;
          break;
        default:
          return 0;
      }

      const result = sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
      return result;
    });
  };

  // Get creator results for each AI message
  const getCreatorResultsForMessage = (messageIndex: number) => {
    // Find the corresponding creator result for this message
    const message = messages[messageIndex];
    if (!message || message.role !== 'assistant') return null;
    
    // Look for creator results that match this message
    // We'll try multiple matching strategies
    let result = creatorResults.find(cr => {
      // Strategy 1: Try to match by prompt content (most reliable)
      if (cr.prompt && message.content.includes(cr.prompt.substring(0, 20))) {
        return true;
      }
      
      // Strategy 2: Try to match by finding the most recent result before this message
      const messageTimestamp = new Date(message.timestamp);
      const resultTimestamp = new Date(cr.timestamp);
      return resultTimestamp <= messageTimestamp;
    });
    
    // Strategy 3: If no direct match, try to find the most recent result
    if (!result && creatorResults.length > 0) {
      result = creatorResults[creatorResults.length - 1];
    }
    
    // Debug logging
    console.log(`getCreatorResultsForMessage(${messageIndex}):`, {
      messageRole: message?.role,
      messageContent: message?.content?.substring(0, 50),
      foundResult: !!result,
      resultPrompt: result?.prompt?.substring(0, 30),
      resultCreatorCount: result?.creators?.length || 0
    });
    
    return result;
  };

  // Get the latest creator results for current display
  const latestCreatorResult = creatorResults.length > 0 ? creatorResults[creatorResults.length - 1] : null;
  const rawCreators = latestCreatorResult?.creators || [];
  const allCreators = sortCreators(rawCreators);

  // Calculate paginated creators
  const startIndex = (currentPage - 1) * creatorsPerPage;
  const endIndex = startIndex + creatorsPerPage;
  const influencers = allCreators.slice(startIndex, endIndex);
  const totalPages = Math.ceil(allCreators.length / creatorsPerPage);
  
  // Show loading state when we're waiting for creators
  const shouldShowLoadingState = isLoadingCreators || (allCreators.length === 0 && !isLoading);
  
  // Get the current search query from the latest message
  const currentMessage = messages[messages.length - 1];
  const currentQuery = currentMessage?.role === 'user' ? currentMessage.content : currentSearchQuery;
  
  // Debug logging
  console.log('Creator Results:', creatorResults.length);
  console.log('Latest Result:', latestCreatorResult);
  console.log('All Creators:', allCreators.length);
  console.log('Influencers:', influencers.length);
  console.log('Is Loading Creators:', isLoadingCreators);
  console.log('Should Show Loading:', shouldShowLoadingState);
  console.log('Current Query:', currentQuery);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const creatorList = document.querySelector('.creator-list-container');
    if (creatorList) {
      creatorList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset to first page when new creator results arrive
  useEffect(() => {
    if (latestCreatorResult) {
      setCurrentPage(1);
      setCurrentSearchQuery(latestCreatorResult.prompt);
    }
  }, [latestCreatorResult]);

  // Reset to first page when sort state changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortState]);

  // Simplified send message function using useAIChat
  const sendMessageWithCreators = async (message: string) => {
    if (!message.trim()) return;
    setCurrentSearchQuery(message);
    await aiSendMessage(message);
  };

  // Helper functions
  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const displayName = getUserDisplayName();
    if (displayName === 'User') {
      return user.email?.charAt(0)?.toUpperCase() || 'U';
    }
    return displayName.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    const name = user.user_metadata?.full_name || 
                 user.user_metadata?.name ||
                 user.user_metadata?.display_name ||
                 user.email?.split('@')[0] ||
                 'User';
    return name;
  };

  // Set page as loaded after a brief delay
  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  // Initialize with the initial prompt if provided
  useEffect(() => {
    const promptFromUrl = searchParams.get('prompt');
    const sessionIdFromUrl = searchParams.get('sessionId');
    const prompt = initialPrompt || promptFromUrl;
    
    if (sessionIdFromUrl && !initializedRef.current) {
      initializedRef.current = true;
      loadChatSession(sessionIdFromUrl);
    } else if (prompt && !initializedRef.current) {
      initializedRef.current = true;
      sendMessageWithCreators(prompt);
    }
  }, [initialPrompt, searchParams, loadChatSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Refresh chat history when component mounts
  useEffect(() => {
    console.log('Refreshing chat history on mount...');
    refreshChatHistory();
  }, [refreshChatHistory]);

  // Refresh chat history when sidebar is opened
  useEffect(() => {
    if (isChatHistoryOpen) {
      console.log('Refreshing chat history when sidebar opened...');
      refreshChatHistory();
    }
  }, [isChatHistoryOpen, refreshChatHistory]);

  // Load user lists on component mount
  useEffect(() => {
    const loadLists = async () => {
      try {
        const lists = await listsClient.getLists();
        setUserLists(lists);
      } catch (error) {
        console.error('Error loading lists:', error);
      }
    };
    loadLists();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowListPicker(false);
        setLoadingLists(false);
      }
    };

    if (showListPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListPicker]);

  // Send message using AI chat hook
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setCurrentSearchQuery(message);
    setInputValue('');
    
    await sendMessageWithCreators(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;
      
      const message = inputValue.trim();
      setCurrentSearchQuery(message);
      setInputValue('');
      
      sendMessageWithCreators(message);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard/aisearch');
    }
  };

  // Function to render markdown formatting
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const handleToggleCreatorExpand = (creatorId: string) => {
    setExpandedCreators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creatorId)) {
        newSet.delete(creatorId);
      } else {
        newSet.add(creatorId);
      }
      return newSet;
    });
  };

  const handleToggleCreatorSelection = (creatorId: string) => {
    // Only allow valid database IDs, not fake IDs
    if (!creatorId || creatorId === '' || creatorId.startsWith('creator-')) {
      console.log('🔥 Ignoring invalid creator ID:', creatorId);
      return;
    }
    
    setSelectedCreators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creatorId)) {
        newSet.delete(creatorId);
      } else {
        newSet.add(creatorId);
      }
      return newSet;
    });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Handle select all
  const handleSelectAll = () => {
    // Only include creators that have valid database IDs
    const allCreatorIds = allCreators
      .map(creator => creator.id || creator.creator_id?.toString())
      .filter(id => id && id !== '' && !id.startsWith('creator-')); // Exclude fake IDs
    
    console.log('🔥 Select All clicked. Current selection:', selectedCreators.size, 'Total creators:', allCreatorIds.length);
    console.log('🔥 All creator IDs:', allCreatorIds);
    
    if (selectedCreators.size === allCreatorIds.length) {
      console.log('🔥 Deselecting all creators');
      setSelectedCreators(new Set());
    } else {
      console.log('🔥 Selecting all creators');
      setSelectedCreators(new Set(allCreatorIds));
    }
  };



  const handleSelectAllOld = () => {
    const allCreatorIds = allCreators.map((creator: any, index: number) => creator?.id || creator?.creator_id || creator?.username || `creator-${index}`);
    
    if (selectedCreators.size === allCreatorIds.length && allCreatorIds.length > 0) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(allCreatorIds));
    }
  };

  // Load lists for dropdown when opened
  const openListPicker = async () => {
    if (selectedCreators.size === 0) return;
    
    // Show dropdown immediately with loading state
    setShowListPicker(true);
    setLoadingLists(true);
    
    try {
      const lists = await listsClient.getLists();
      
      setAvailableLists(lists.map(list => ({ id: list.id, name: list.name })));
    } catch (error) {
      console.error('Error loading lists:', error);
      setAvailableLists([]);
    } finally {
      setLoadingLists(false);
    }
  };

  const addSelectedToList = async (listId: string) => {
    if (!listId || selectedCreators.size === 0) {
      setShowListPicker(false);
      return;
    }
    setSaving(true);
    try {
      const creatorIds = Array.from(selectedCreators);
      
      await listsClient.addCreators(listId, creatorIds);
      
      setSaveNotice(`${creatorIds.length} influencer${creatorIds.length === 1 ? '' : 's'} added to list`);
      
      // Signal My Lists page to refresh when user navigates there
      localStorage.setItem('pendingListPageReload', 'true');
      
      // Clear selection after successful save
      setSelectedCreators(new Set());
    } catch (e) {
      console.error('Failed to add creators to list', e);
      setSaveNotice('Failed to add influencers to list');
    } finally {
      setSaving(false);
      setShowListPicker(false);
      setTimeout(() => setSaveNotice(null), 3000);
    }
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      alert('Please enter a name for the new list.');
      return;
    }
    setSaving(true);
    try {
      const newList = await listsClient.createList(newListName.trim());
      const creatorIds = Array.from(selectedCreators);
      await listsClient.addCreators(newList.id, creatorIds);
      setSaveNotice(`Successfully created "${newListName}" and saved ${creatorIds.length} creators!`);
      
      // Signal My Lists page to refresh when user navigates there
      localStorage.setItem('pendingListPageReload', 'true');
      console.log('🔥 Set pendingListPageReload flag after creating new list with creators');
      setSelectedCreators(new Set());
      setNewListName('');
      setShowNewListModal(false);
      setShowListPicker(false);
      
      // Reload lists
      const lists = await listsClient.getLists();
      setUserLists(lists);
      
      // Auto-hide notice after 3 seconds
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (error) {
      console.error('Error creating new list:', error);
      setSaveNotice('Failed to create new list. Please try again.');
      setTimeout(() => setSaveNotice(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col transition-opacity duration-300 opacity-100">
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .expanded-content {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .expanded-content-inline {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .creator-list-row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .creator-list-row:hover {
          background-color: #2a2f3a;
          transform: translateY(-1px);
        }
      `}</style>
      
      {/* Top navigation */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-2 xs:p-4 bg-black/80 backdrop-blur-sm">
        {/* Back button */}
          <Button
            variant="outline"
          onClick={handleBackClick}
          className="flex items-center gap-1 xs:gap-2 px-2 xs:px-3.5 py-2 xs:py-3 bg-[#0f1419] rounded-[34px] border-gray-700 hover:bg-[#1a1f2e]"
        >
          <img 
            className="w-4 h-4" 
            alt="Back arrow" 
            src="/Arrow down button vector.png"
            style={{ transform: 'rotate(90deg)' }}
          />
          <span className="hidden xs:inline font-medium text-white text-sm tracking-[-0.08px] leading-5">
            Back
          </span>
          </Button>

        {/* Right side buttons */}
        <div className="flex gap-1 xs:gap-2">
            <Button
              variant="outline"
            onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
              className="flex items-center gap-1 px-2 xs:px-3.5 py-2 xs:py-3 bg-[#0f1419] rounded-[34px] border-gray-700 hover:bg-[#1a1f2e]"
            >
            <img
              className="w-3 xs:w-4 h-3 xs:h-4"
              alt="Chat history icon"
              src="/Chat History.svg"
            />
            <span className="hidden sm:inline font-medium text-white text-xs tracking-[-0.08px] leading-5">
              Chat History
            </span>
            </Button>

            <Button
              variant="outline"
            onClick={() => {
              clearMessages();
              router.push('/dashboard/aisearch');
            }}
            className="flex items-center justify-center px-3 py-2 xs:py-3 bg-[#0f1419] rounded-full border-gray-700 hover:bg-[#1a1f2e]"
          >
            <img 
              className="w-3 xs:w-4 h-3 xs:h-4" 
              alt="Plus icon" 
              src="/plus-icon.svg"
            />
            </Button>
          </div>
        </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col pt-16 xs:pt-20">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-4xl mx-auto px-2 xs:px-4">
            {messages.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-full text-center py-10 xs:py-20">
                <div className="w-16 h-16 bg-[#0f1419] rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                  >
                    <source 
                      src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm" 
                      type="video/webm" 
                    />
                    <img
                      className="w-8 h-8"
                      alt="Buzzberry AI"
                      src="/AI Blurb Icon.svg"
                    />
                  </video>
              </div>
                <h2 className="font-medium text-white text-lg xs:text-xl mb-2">
                  Start a conversation
                </h2>
                <p className="font-normal text-[#99a0ad] text-xs xs:text-sm px-4">
                  Ask me about influencers, creators, or audience insights
                </p>
              </div>
            ) : (
              // Messages
              <div className="py-6 space-y-6">
                {messages.map((msg, idx) => {
                  // Skip CREATOR_RESULTS messages to avoid showing the hash ID
                  if (msg.content.startsWith('CREATOR_RESULTS:')) {
                    return null;
                  }

                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id || idx} className="flex justify-end">
                        <div className="flex items-start gap-2 xs:gap-3 max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[70%] flex-row-reverse">
                          {/* User Avatar - 30% smaller */}
                          <div className="flex-shrink-0">
                            <Avatar style={{ width: '1.925rem', height: '1.925rem' }}>
                              <AvatarImage src={getUserAvatar() || undefined} alt={getUserDisplayName()} />
                              <AvatarFallback style={{ backgroundColor: '#374151', color: '#F9FAFB', fontWeight: 600 }}>
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {/* User message content */}
                          <div className="bg-blue-600 text-white px-3 xs:px-4 py-2 xs:py-3 rounded-2xl rounded-br-md break-words overflow-wrap-anywhere">
                            <div className="font-normal text-sm xs:text-[15px] leading-6 xs:leading-7 whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // AI message - find the corresponding creator results for this message
                    const messageCreatorResults = getCreatorResultsForMessage(idx);
                    const hasCreatorResults = messageCreatorResults && messageCreatorResults.creators.length > 0;
                    
                    // Show creators if we have results OR if we're the latest AI message and waiting for results
                    const isLatestAIMessage = idx === messages.filter(m => m.role === 'assistant').length - 1;
                    const shouldShowCreators = hasCreatorResults && !streamingMessage && !isLoading;
                    const shouldShowLoading = isLatestAIMessage && isLoadingCreators && !hasCreatorResults;
                    
                    // Fallback: if no specific results found, show the latest available results for the latest AI message
                    const fallbackResults = !hasCreatorResults && isLatestAIMessage && creatorResults.length > 0 ? creatorResults[creatorResults.length - 1] : null;
                    const shouldShowFallback = fallbackResults && !streamingMessage && !isLoading;
                    
                    // Debug logging for this message
                    console.log(`Message ${idx}:`, {
                      hasResults: hasCreatorResults,
                      shouldShow: shouldShowCreators,
                      shouldShowLoading,
                      isLatestAI: isLatestAIMessage,
                      creatorCount: messageCreatorResults?.creators?.length || 0,
                      messageContent: msg.content.substring(0, 50) + '...'
                    });
                
                return (
                      <div key={msg.id || idx} className="w-full">
                        <div className="flex justify-start">
                          <div className="flex items-start gap-2 xs:gap-3 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[98%] xl:max-w-[98%] flex-row">
                            {/* AI Avatar */}
                            <div className="flex-shrink-0">
                              <div className="w-11 xs:w-14 h-11 xs:h-14 rounded-full overflow-hidden relative">
                                <video
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  preload="auto"
                                >
                                  <source
                                    src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm"
                                    type="video/webm"
                                  />
                                  <div className="w-11 xs:w-14 h-11 xs:h-14 bg-[#0f1419] rounded-full flex items-center justify-center">
                                    <img
                                      className="w-6 xs:w-8 h-6 xs:h-8"
                                      alt="Buzzberry AI"
                                      src="/AI Blurb Icon.svg"
                                    />
                          </div>
                                </video>
                          </div>
              </div>

                            {/* AI message content */}
                            <div className="text-white break-words overflow-wrap-anywhere w-full max-w-full overflow-hidden">
                              <div className="font-normal text-sm xs:text-[15px] leading-6 xs:leading-7 whitespace-pre-wrap break-words [&>strong]:font-semibold [&>ul]:mt-2 [&>ul]:mb-2 [&>li]:ml-4">
                                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                              </div>
                              
                              {/* Show multi-step loading animation while waiting for creators */}
                              {shouldShowLoading && (
                                <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                                  </div>
                                      <div>
                                        <h4 className="text-sm font-semibold text-white">Preparing Creator Recommendations</h4>
                                        <p className="text-xs text-gray-400 mt-1">Analyzing your requirements and matching with our database...</p>
                                  </div>
                                  </div>
                                  
                                    {/* Progress steps */}
                                    <div className="ml-11 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-blue-400">Processing your request...</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                                        <span className="text-xs text-green-400">Scanning creator database...</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                                        <span className="text-xs text-purple-400">Calculating match scores...</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.9s'}}></div>
                                        <span className="text-xs text-yellow-400">Preparing recommendations...</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Show creators for this AI message if it has results */}
                              {shouldShowCreators && messageCreatorResults && (
                                    <>
                                        {/* Results Summary */}
                                        {messageCreatorResults.creators.length > 0 && (
                                          <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                            <div className="flex items-center gap-6 text-sm">
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Total Results:</span>
                                                <span className="text-white font-medium">{messageCreatorResults.creators.length}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Showing:</span>
                                                <span className="text-white font-medium">
                                                  {((currentPage - 1) * creatorsPerPage) + 1}-{Math.min(currentPage * creatorsPerPage, allCreators.length)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Page:</span>
                                                <span className="text-white font-medium">{currentPage} of {totalPages}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                      {/* Creator List with Loading State */}
                                  {shouldShowLoadingState ? (
                                    <div className="mt-4 w-full max-w-full overflow-hidden">
                                        <div className="mb-4 text-center">
                                          <div className="flex items-center justify-center gap-2 text-blue-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                            <span className="text-sm font-medium">
                                              {isLoadingCreators ? 'Analyzing creators...' : 'Searching for matches...'}
                                            </span>
                                          </div>
                                        </div>
                                      <AISearchCreatorTable
                                        creators={[]}
                                        selectedIds={new Set()}
                                        expandedIds={new Set()}
                                        onToggleSelect={() => {}}
                                        onToggleAll={() => {}}
                                        onRowClick={() => {}}
                                        onSort={() => {}}
                                        sortState={{ field: null, direction: 'asc' }}
                                        isLoading={true}
                                        showMatchScore={true}
                                        showRecommendationReason={false}
                                      />
                                    </div>
                                  ) : influencers.length > 0 ? (
                                    <div className="mt-3 w-full max-w-full overflow-hidden">
                                      <div className="creator-list-container">
                                        {/* Action Buttons - Styled like Discover page */}
                                        <div className="flex justify-end gap-2 mb-3">
                                          <div className="relative">
                                            <button
                                              onClick={openListPicker}
                                              disabled={selectedCreators.size === 0}
                                              className="h-8 rounded-lg flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium ai-search-save-button"
                                              style={{ 
                                                backgroundColor: '#1f2937', 
                                                borderColor: '#374151', 
                                                color: selectedCreators.size === 0 ? '#6b7280' : '#f9fafb',
                                                border: '1px solid',
                                                cursor: selectedCreators.size === 0 ? 'not-allowed' : 'pointer'
                                              }}
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H14L21 10V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M17 14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M17 18H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M10 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              </svg>
                                              <span className="font-medium text-gray-200">
                                                Save in a list {selectedCreators.size > 0 && `(${selectedCreators.size})`}
                                              </span>
                                            </button>
                                            
                                            {/* List picker dropdown positioned relative to button */}
                                            {showListPicker && (
                                              <div ref={dropdownRef} className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-[#111827] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[9999]">
                                                {/* Header */}
                                                <div className="px-3 py-2">
                                                  <h3 className="text-sm font-semibold text-[#F9FAFB] font-['Plus_Jakarta_Sans',Helvetica]">Save to list</h3>
                                                </div>
                                                
                                                {/* Divider */}
                                                <div className="h-px bg-[#2c3954] mx-2" />
                                                
                                                {/* Lists */}
                                                <div className="py-2 max-h-48 overflow-y-auto">
                                                  {loadingLists ? (
                                                    <div className="px-3 py-2 text-xs text-[#99a0ad] flex items-center gap-2 font-['Plus_Jakarta_Sans',Helvetica]">
                                                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                      Loading lists...
                                                    </div>
                                                  ) : availableLists.length === 0 ? (
                                                    <div className="px-3 py-2 text-xs text-[#99a0ad] font-['Plus_Jakarta_Sans',Helvetica]">No lists found</div>
                                                  ) : (
                                                    availableLists.map(l => (
                                                      <button 
                                                        key={l.id} 
                                                        className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]" 
                                                        onClick={() => {
                                                          console.log('🔥 List button clicked for list:', l.name, 'ID:', l.id);
                                                          addSelectedToList(l.id);
                                                        }} 
                                                        disabled={saving}
                                                      >
                                                        <span>{l.name}</span>
                                                      </button>
                                                    ))
                                                  )}
                                                </div>
                                                
                                                {/* Divider */}
                                                <div className="h-px bg-[#2c3954] mx-2" />
                                                
                                                {/* Add new list */}
                                                <div className="py-2">
                                                  <button 
                                                    onClick={() => setShowNewListModal(true)}
                                                    className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                                  >
                                                    <Plus className="h-3 w-3" />
                                                    <span>Add new list</span>
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          
                                                                                  <button
                                          onClick={handleSelectAll}
                                          className="h-8 rounded-lg flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium ai-search-select-all-button"
                                          style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', border: '1px solid' }}
                                          >
                                            <span className="font-medium text-gray-200">
                                              Select All
                                            </span>
                                            <div 
                                              className={`w-4 h-4 border-2 rounded-[3px] flex items-center justify-center transition-colors ${
                                                selectedCreators.size === allCreators.length && allCreators.length > 0
                                                  ? 'bg-blue-600 border-[#2463eb]' 
                                                  : 'bg-transparent border-gray-400'
                                              }`}
                                            >
                                              {selectedCreators.size === allCreators.length && allCreators.length > 0 && (
                                                <svg width="10" height="8" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                  <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                                            )}
                        </div>
                                          </button>
                                              </div>

                                        <AISearchCreatorTable
                                          creators={influencers.map((creator: any, index: number) => ({
                                            ...creator,
                                            id: creator?.id || creator?.creator_id?.toString() || '', // Use empty string instead of fake ID
                                            hasValidId: !!(creator?.id || creator?.creator_id) // Track if this creator has a valid ID
                                          }))}
                                          selectedIds={selectedCreators}
                                          expandedIds={expandedCreators}
                                          onToggleSelect={handleToggleCreatorSelection}
                                          onToggleAll={handleSelectAll}
                                          onRowClick={(creator) => {
                                            const creatorId = creator.id || creator.creator_id?.toString() || '';
                                            handleToggleCreatorExpand(creatorId);
                                          }}
                                          onSort={handleSort}
                                          sortState={sortState}
                                          isLoading={isLoadingCreators}
                                          showMatchScore={true}
                                          showRecommendationReason={false}
                                        />
                                        
                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                          <div className="flex justify-center items-center gap-2 mt-4">
                                            <button
                                              onClick={() => handlePageChange(currentPage - 1)}
                                              disabled={currentPage === 1}
                                              className={`px-3 py-1 rounded-lg text-sm ${
                                                currentPage === 1
                                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                                              }`}
                                            >
                                              Previous
                                            </button>
                                            <span className="text-white text-sm">
                                              Page {currentPage} of {totalPages}
                                                </span>
                                            <button
                                              onClick={() => handlePageChange(currentPage + 1)}
                                              disabled={currentPage === totalPages}
                                              className={`px-3 py-1 rounded-lg text-sm ${
                                                currentPage === totalPages
                                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                                              }`}
                                            >
                                              Next
                                            </button>
                                            </div>
                                          )}
                        </div>
                    </div>
                                  ) : null}
                                  
                                  {/* Fallback: Show latest available creator results if no specific match found */}
                                  {shouldShowFallback && fallbackResults && (
                                    <>
                                        {/* Results Summary */}
                                        {fallbackResults.creators.length > 0 && (
                                          <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                            <div className="flex items-center gap-6 text-sm">
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Total Results:</span>
                                                <span className="text-white font-medium">{fallbackResults.creators.length}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">Showing:</span>
                                                <span className="text-white font-medium">
                                                  1-{Math.min(5, fallbackResults.creators.length)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                      {/* Action Buttons - Styled like Discover page */}
                                      <div className="flex justify-end gap-2 mb-3">
                                        <div className="relative">
                                          <button
                                            onClick={openListPicker}
                                            disabled={selectedCreators.size === 0}
                                            className="h-8 rounded-lg flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium ai-search-save-button"
                                            style={{ 
                                              backgroundColor: '#1f2937', 
                                              borderColor: '#374151', 
                                              color: selectedCreators.size === 0 ? '#6b7280' : '#f9fafb',
                                              border: '1px solid',
                                              cursor: selectedCreators.size === 0 ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H14L21 10V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M14 3V10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M17 14H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M17 18H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                              <path d="M10 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <span className="font-medium text-gray-200">
                                              Save in a list {selectedCreators.size > 0 && `(${selectedCreators.size})`}
                                            </span>
                                          </button>
                                          
                                          {/* List picker dropdown positioned relative to button */}
                                          {showListPicker && (
                                            <div ref={dropdownRef} className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-[#111827] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-[9999]">
                                              {/* Header */}
                                              <div className="px-3 py-2">
                                                <h3 className="text-sm font-semibold text-[#F9FAFB] font-['Plus_Jakarta_Sans',Helvetica]">Save to list</h3>
                                              </div>
                                              
                                              {/* Divider */}
                                              <div className="h-px bg-[#2c3954] mx-2" />
                                              
                                              {/* Lists */}
                                              <div className="py-2 max-h-48 overflow-y-auto">
                                                {loadingLists ? (
                                                  <div className="px-3 py-2 text-xs text-[#99a0ad] flex items-center gap-2 font-['Plus_Jakarta_Sans',Helvetica]">
                                                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                    Loading lists...
                                                  </div>
                                                ) : availableLists.length === 0 ? (
                                                  <div className="px-3 py-2 text-xs text-[#99a0ad] font-['Plus_Jakarta_Sans',Helvetica]">No lists found</div>
                                                ) : (
                                                  availableLists.map(l => (
                                                    <button 
                                                      key={l.id} 
                                                      className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]" 
                                                      onClick={() => {
                                                        console.log('🔥 List button clicked for list:', l.name, 'ID:', l.id);
                                                        addSelectedToList(l.id);
                                                      }} 
                                                      disabled={saving}
                                                    >
                                                      <span>{l.name}</span>
                                                    </button>
                                                  ))
                                                )}
                                              </div>
                                              
                                              {/* Divider */}
                                              <div className="h-px bg-[#2c3954] mx-2" />
                                              
                                              {/* Add new list */}
                                              <div className="py-2">
                                                <button 
                                                  onClick={() => setShowNewListModal(true)}
                                                  className="w-full px-3 py-2 text-left hover:bg-[#1a1f2e] flex items-center gap-2 text-[#99a0ad] text-xs font-['Plus_Jakarta_Sans',Helvetica]"
                                                >
                                                  <Plus className="h-3 w-3" />
                                                  <span>Add new list</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <button
                                          onClick={handleSelectAll}
                                          className="h-8 rounded-lg flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium ai-search-select-all-button"
                                          style={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f9fafb', border: '1px solid' }}
                                        >
                                          <span className="font-medium text-gray-200">
                                            Select All
                                          </span>
                                          <div 
                                            className={`w-4 h-4 border-2 rounded-[3px] flex items-center justify-center transition-colors ${
                                              selectedCreators.size === allCreators.length && allCreators.length > 0
                                                ? 'bg-blue-600 border-[#2463eb]' 
                                                : 'bg-transparent border-gray-400'
                                            }`}
                                          >
                                            {selectedCreators.size === allCreators.length && allCreators.length > 0 && (
                                              <svg width="10" height="8" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                      </svg>
                    )}
                          </div>
                                        </button>
                        </div>

                                      {/* Creator List - New AISearchCreatorTable */}
                                      <div className="mt-3 w-full max-w-full overflow-hidden">
                                        <AISearchCreatorTable
                                          creators={influencers.map((creator: any, index: number) => ({
                                            ...creator,
                                            id: creator?.id || creator?.creator_id?.toString() || '', // Use empty string instead of fake ID
                                            hasValidId: !!(creator?.id || creator?.creator_id) // Track if this creator has a valid ID
                                          }))}
                                          selectedIds={selectedCreators}
                                          expandedIds={expandedCreators}
                                          onToggleSelect={handleToggleCreatorSelection}
                                          onToggleAll={handleSelectAll}
                                          onRowClick={(creator) => {
                                            const creatorId = creator.id || creator.creator_id?.toString() || '';
                                            handleToggleCreatorExpand(creatorId);
                                          }}
                                          onSort={handleSort}
                                          sortState={sortState}
                                          isLoading={isLoadingCreators}
                                          showMatchScore={true}
                                          showRecommendationReason={false}
                                        />
                                        
                                        {/* Pagination Controls for Fallback Results */}
                                        {totalPages > 1 && (
                                          <div className="flex justify-center items-center gap-2 mt-4">
                                            <button
                                              onClick={() => handlePageChange(currentPage - 1)}
                                              disabled={currentPage === 1}
                                              className={`px-3 py-1 rounded-lg text-sm ${
                                                currentPage === 1
                                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                                              }`}
                                            >
                                              Previous
                                            </button>
                                            <span className="text-white text-sm">
                                              Page {currentPage} of {totalPages}
                                                  </span>
                                            <button
                                              onClick={() => handlePageChange(currentPage + 1)}
                                              disabled={currentPage === totalPages}
                                              className={`px-3 py-1 rounded-lg text-sm ${
                                                currentPage === totalPages
                                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                  : 'bg-gray-800 text-white hover:bg-gray-700'
                                              }`}
                                            >
                                              Next
                                            </button>
                            </div>
                                            )}
                  </div>
                                    </>
                                  )}
                                </>
                              )}
                          </div>
                            </div>
                      </div>
                    </div>
                    );
            }
          })}

                                {/* Loading indicator - Processing prompt */}
                {isLoading && !streamingMessage && !isLoadingCreators && (
            <div className="flex justify-start">
                    <div className="flex items-start gap-2 xs:gap-3 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[98%] xl:max-w-[98%]">
                      <div className="flex-shrink-0">
                        <div className="w-11 xs:w-14 h-11 xs:h-14 rounded-full overflow-hidden">
                          <video
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                          >
                            <source
                              src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm"
                              type="video/webm"
                            />
                            <div className="w-11 xs:w-14 h-11 xs:h-14 bg-[#0f1419] rounded-full flex items-center justify-center">
                              <img
                                className="w-6 xs:w-8 h-6 xs:h-8"
                                alt="Buzzberry AI"
                                src="/AI Blurb Icon.svg"
                              />
                          </div>
                          </video>
                        </div>
                      </div>
                      <div className="text-white flex items-center w-full max-w-full overflow-hidden">
                        <div className="flex flex-col gap-3">
                          <div className="text-xs xs:text-sm text-gray-400">
                            Processing...
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Fluid wave dots */}
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '1.4s'}}></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s', animationDuration: '1.4s'}}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s', animationDuration: '1.4s'}}></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.6s', animationDuration: '1.4s'}}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.8s', animationDuration: '1.4s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Streaming message */}
                {isLoading && streamingMessage && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 xs:gap-3 max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[98%] xl:max-w-[98%]">
                      <div className="flex-shrink-0">
                        <div className="w-11 xs:w-14 h-11 xs:h-14 rounded-full overflow-hidden relative">
                          <video
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                          >
                            <source
                              src="https://epwm2xeeqm8soa6z.public.blob.vercel-storage.com/Buzzberry%20AI%20Chat.webm"
                              type="video/webm"
                            />
                            <div className="w-11 xs:w-14 h-11 xs:h-14 bg-[#0f1419] rounded-full flex items-center justify-center">
                              <img
                                className="w-6 xs:w-8 h-6 xs:h-8"
                                alt="Buzzberry AI"
                                src="/AI Blurb Icon.svg"
                              />
                  </div>
                          </video>
                        </div>
                      </div>

                      <div className="text-white break-words overflow-wrap-anywhere w-full max-w-full overflow-hidden">
                        <div className="font-normal text-sm xs:text-[15px] leading-6 xs:leading-7 whitespace-pre-wrap break-words [&>strong]:font-semibold [&>ul]:mt-2 [&>ul]:mb-2 [&>li]:ml-4">
                          <span dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingMessage) }} />
                          {isLoading && (
                            <span className="inline-block w-0.5 h-4 bg-slate-800 ml-0.5 animate-pulse" />
                          )}
                  </div>
                </div>
              </div>
            </div>
          )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area - Sticky */}
        <div className="sticky bottom-0 bg-black p-3 xs:p-6 border-t border-gray-800">
          <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center gap-2 xs:gap-3 bg-[#2f2f2f] rounded-3xl border-0 px-3 xs:px-4 py-2 xs:py-3 shadow-lg">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Buzzberry AI..."
                  className="flex-1 bg-transparent border-none outline-none font-normal text-white text-sm xs:text-base resize-none min-h-[20px] xs:min-h-[24px] max-h-32 placeholder-gray-400 py-1 break-words"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="p-3 flex-shrink-0 hover:bg-transparent focus:bg-transparent hover:shadow-lg hover:shadow-black/30 rounded-full bg-transparent transition-shadow duration-200"
                  disabled={!inputValue.trim() || isLoading}
                  style={{
                    filter: 'drop-shadow(0 0 0 transparent)',
                    transition: 'filter 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
                  }}
                >
                  <img
                    className="h-6 xs:h-7 w-6 xs:w-7 transition-transform duration-200 hover:scale-110"
                    alt="Send prompt button"
                    src="/Send Prompt Button.png"
                  />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      <div className={`fixed inset-0 bg-black transition-opacity duration-300 z-[55] ${
        isChatHistoryOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setIsChatHistoryOpen(false)} />

      {/* Chat History Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-[60] ${
        isChatHistoryOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <ChatHistorySection
          onClose={() => setIsChatHistoryOpen(false)}
          onChatSelect={async (chatId) => {
            console.log('Loading chat:', chatId)
            await loadChatSession(chatId)
            setIsChatHistoryOpen(false)
          }}
        />
      </div>

      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-[80] max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border ${
            notificationType === 'success' 
              ? 'bg-green-900 border-green-700 text-green-100' 
              : 'bg-red-900 border-red-700 text-red-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                notificationType === 'success' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">{notificationMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4">
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newListName.trim().length > 0 && !saving) {
                    handleCreateNewList();
                  }
                }}
                placeholder="Enter list name..."
                className="w-full px-3 py-2 bg-[#31384a] border border-gray-600 rounded-lg text-gray-50 placeholder-gray-400 focus:outline-none focus:border-blue-500 [font-family:'Inter',Helvetica]"
                autoFocus
                disabled={saving}
              />
              {newListName.trim().length === 0 && (
                <p className="text-xs text-gray-500 mt-1 [font-family:'Inter',Helvetica]">
                  Please enter at least one character
                </p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewListModal(false);
                  setNewListName('');
                }}
                disabled={saving}
                className={`px-4 py-2 rounded-lg border [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  saving 
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewList}
                disabled={newListName.trim().length === 0 || saving}
                className={`px-4 py-2 rounded-lg [font-family:'Inter',Helvetica] font-medium text-sm transition-colors duration-200 ${
                  newListName.trim().length === 0 || saving
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {saving ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save notice modal (like discover page style) */}
      {saveNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#1a1f2e] rounded-[15px] border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-50 mb-4">Save to List</h2>
            <p className="text-gray-300 mb-6 text-sm">{saveNotice}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setSaveNotice(null)} className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-gray-50 hover:bg-gray-700 hover:border-gray-500 active:bg-gray-600 font-medium text-sm transition-colors duration-200">Okay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

