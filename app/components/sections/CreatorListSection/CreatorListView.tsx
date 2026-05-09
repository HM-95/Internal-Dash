'use client'

import React, { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight, MessageSquare, Mail } from "lucide-react"
import { transformCreatorData } from '@/utils/creatorListIntegration'

// AI Chat specific interface
interface CreatorListViewAIProps {
  promptHash: string
  creators: any[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  prompt: string
  onPageChange: (promptHash: string, newPage: number, pageSize: number) => void
  onToggleSelection: (promptHash: string, creatorId: string) => void
  onToggleExpansion: (promptHash: string, creatorId: string) => void
  onSelectAll: (promptHash: string, creatorIds: string[]) => void
  onSaveSelected: () => void
  isCreatorSelected: (promptHash: string, creatorId: string) => boolean
  isRowExpanded: (promptHash: string, creatorId: string) => boolean
  loadingPages: Set<string>
}

// Discover page interface (legacy)
interface CreatorListViewProps {
  creators: any[]
  currentMode: string
  selectedCards: Set<string>
  handleCreatorClick: (creator: any) => void
  handleCardSelection: (creatorId: string) => void
  selectedCreator: any | null
  sortState: any
  handleSort: (field: any) => Promise<void>
}

interface CreatorRowProps {
  creator: any
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  searchQuery: string
  isSelected: boolean
  onToggleSelection: () => void
}

// Helper function to get match score color
const getMatchScoreColor = (score: number) => {
  if (score >= 75) return 'bg-green-500/20 text-green-400 border-green-500/30'
  if (score >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  return 'bg-red-500/20 text-red-400 border-red-500/30'
}

// Helper function to format numbers
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num.toLocaleString()
}

const CreatorRow: React.FC<CreatorRowProps> = ({ 
  creator, 
  index, 
  isExpanded, 
  onToggleExpand, 
  searchQuery, 
  isSelected, 
  onToggleSelection 
}) => {
  const c = transformCreatorData(creator)
  const [aiExplanation, setAiExplanation] = useState<string>('')
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false)
  const creatorId = creator?.id || creator?.username || `creator-${index}`

  React.useEffect(() => {
    if (isExpanded && !aiExplanation && !isLoadingExplanation) {
      setIsLoadingExplanation(true)
      // For now, generate a simple explanation
      setTimeout(() => {
        setAiExplanation(`This creator matches your search for "${searchQuery}" because they specialize in ${c.niches?.[0]?.name || 'content creation'} with a strong following of ${c.followers >= 1000000 ? `${(c.followers / 1000000).toFixed(1)}M` : c.followers >= 1000 ? `${(c.followers / 1000).toFixed(0)}K` : c.followers} followers and an engagement rate of ${(c.engagement_rate * 100).toFixed(2)}%.`)
        setIsLoadingExplanation(false)
      }, 1000)
    }
  }, [isExpanded, aiExplanation, isLoadingExplanation, c, searchQuery])

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on the checkbox area
    const target = e.target as HTMLElement
    if (target.closest('input[type="checkbox"]') || target.closest('.creator-list-checkbox')) {
      return
    }
    onToggleExpand()
  }

  const handleCheckboxClick = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onToggleSelection()
  }

  const handleDMClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('DM clicked for:', c.name)
  }

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Email clicked for:', c.name)
  }

  return (
    <>
      <div 
        className={`group cursor-pointer transition-all duration-200 ${isSelected ? 'border-l-4 border-l-blue-500' : ''}`}
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 100px 100px 100px 120px 100px 80px',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #1F2937',
          gap: '16px',
          backgroundColor: index % 2 === 0 ? '#0F1419' : '#0C1116'
        }}
        onClick={handleRowClick}
      >
        {/* Checkbox */}
            <div className="flex flex-col items-center gap-1">
              <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            onClick={handleCheckboxClick}
            className="creator-list-checkbox data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          {/* Email icon - show if creator has email */}
          {c.email && c.email.trim() !== '' && (
            <Mail className="w-3 h-3 text-blue-400" />
          )}
        </div>

        {/* Avatar + Name + Handle */}
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="w-12 h-12 flex-shrink-0" style={{ boxShadow: '0 0 0 2px rgba(55,65,81,0.35)', backgroundColor: '#111827' }}>
            <AvatarImage src={c.avatar_url || undefined} alt={c.name} />
            <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: '#374151', color: '#E5E7EB' }}>
              {c.initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="font-semibold text-sm truncate" style={{ color: '#F9FAFB' }}>
              {c.name}
            </div>
            <div className="text-xs truncate font-medium" style={{ color: '#9CA3AF' }}>
              {c.username_tag}
            </div>
          </div>
        </div>

        {/* Match Score */}
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={`${getMatchScoreColor(c.match_score || 0)} border font-medium text-xs px-2 py-1`}
          >
            {c.match_score || 0}%
          </Badge>
        </div>

        {/* Followers */}
        <div className="text-center font-mono text-sm font-medium" style={{ color: '#F9FAFB' }}>
          {formatNumber(c.followers)}
        </div>

        {/* Views */}
        <div className="text-center font-mono text-sm font-medium" style={{ color: '#F9FAFB' }}>
          {formatNumber(c.avg_views)}
        </div>

        {/* Engagement Rate */}
        <div className="text-center font-mono text-sm font-medium" style={{ color: '#F9FAFB' }}>
          {((c.engagement_rate || 0) * 100).toFixed(2)}%
        </div>

        {/* Category */}
        <div className="flex justify-center">
          {c.niches && c.niches.length > 0 ? (
            <Badge 
              variant="outline" 
              className={`${
                c.niches[0].isPrimary 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              } font-medium text-xs px-2 py-1`}
            >
              {c.niches[0].name}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground font-medium text-xs px-2 py-1">
              General
            </Badge>
                )}
              </div>

        {/* Location */}
        <div className="text-center text-sm truncate font-medium" style={{ color: '#D1D5DB' }}>
          {c.location || 'N/A'}
        </div>

        {/* Buzz Score */}
        <div className="text-center font-mono text-sm font-medium" style={{ color: '#F9FAFB' }}>
          {c.buzz_score || 0}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className=""
          style={{
            padding: '20px',
            animation: 'slideDown 0.3s ease-out',
            backgroundColor: '#0D1217',
            borderBottom: '1px solid #1F2937'
          }}
        >
          <div className="flex gap-8">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-3">About {c.name}</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">No bio available</p>
              
              {aiExplanation && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">AI Analysis</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">{aiExplanation}</p>
                  </div>
              )}
              
              {isLoadingExplanation && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Analyzing creator...</p>
                </div>
              )}
              </div>
            
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDMClick}
                className="w-full h-9"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send DM
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailClick}
                className="w-full h-9"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
                </div>
              </div>
            )}
    </>
  )
}

// AI Chat specific CreatorListView
export const CreatorListViewAI: React.FC<CreatorListViewAIProps> = ({
  promptHash,
  creators,
  total,
  totalPages,
  page,
  pageSize,
  prompt,
  onPageChange,
  onToggleSelection,
  onToggleExpansion,
  onSelectAll,
  onSaveSelected,
  isCreatorSelected,
  isRowExpanded,
  loadingPages
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!creators || creators.length === 0) {
    return null
  }

  return (
    <div className="mt-6 max-w-full">
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">Recommended Influencers</h3>
            <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
              {total} total
            </Badge>
          </div>
              </div>
            </div>

      {!isCollapsed && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allCreatorIds = creators.map((creator: any, index: number) => 
                  creator?.id || creator?.username || `creator-${index}`
                )
                onSelectAll(promptHash, allCreatorIds)
              }}
              className="h-9 px-4"
            >
              {creators.every((creator: any, index: number) => 
                isCreatorSelected(promptHash, creator?.id || creator?.username || `creator-${index}`)
              ) ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  Unselect All
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                  </svg>
                  Select All
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onSaveSelected}
              disabled={creators.every((creator: any, index: number) => 
                !isCreatorSelected(promptHash, creator?.id || creator?.username || `creator-${index}`)
              )}
              className="h-9 px-4"
            >
              Save Selected
            </Button>
          </div>
          
          {/* Table Container */}
          <div className="rounded-xl border bg-card shadow-sm">
            {/* Table Header */}
            <div 
              className="border-b bg-muted/30 rounded-t-xl"
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 100px 100px 100px 120px 100px 80px',
                alignItems: 'center',
                padding: '16px 20px',
                gap: '16px'
              }}
            >
              <div className="flex justify-center">
                <Checkbox 
                  checked={creators.every((creator: any, index: number) => 
                    isCreatorSelected(promptHash, creator?.id || creator?.username || `creator-${index}`)
                  )}
                  onCheckedChange={() => {
                    const allCreatorIds = creators.map((creator: any, index: number) => 
                      creator?.id || creator?.username || `creator-${index}`
                    )
                    onSelectAll(promptHash, allCreatorIds)
                  }}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
              </div>
              <div className="font-semibold text-sm text-muted-foreground">Influencers</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Match</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Followers</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Views</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Engagement</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Category</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Location</div>
              <div className="text-center font-semibold text-sm text-muted-foreground">Buzz Score</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-border">
              {creators.map((creator: any, index) => {
                const creatorId = creator?.id || creator?.username || `creator-${index}`
                return (
                  <CreatorRow
                    key={creatorId}
                    creator={creator}
                    index={index}
                    isExpanded={isRowExpanded(promptHash, creatorId)}
                    onToggleExpand={() => onToggleExpansion(promptHash, creatorId)}
                    searchQuery={prompt}
                    isSelected={isCreatorSelected(promptHash, creatorId)}
                    onToggleSelection={() => onToggleSelection(promptHash, creatorId)}
                  />
                )
              })}
            </div>
              </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(promptHash, page - 1, pageSize)}
                disabled={page <= 1 || loadingPages.has(promptHash)}
                className="h-9 px-4"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">Page {page} of {totalPages}</span>
                {loadingPages.has(promptHash) && (
                  <span className="text-blue-500 font-medium">Loading...</span>
                )}
              </div>
              
              <Button
                    variant="outline"
                size="sm"
                onClick={() => onPageChange(promptHash, page + 1, pageSize)}
                disabled={page >= totalPages || loadingPages.has(promptHash)}
                className="h-9 px-4"
              >
                Next
              </Button>
            </div>
          )}
                </div>
              )}
            </div>
  )
}

// Legacy CreatorListView for Discover page (placeholder - will be implemented separately)
export const CreatorListView: React.FC<CreatorListViewProps> = ({
  creators,
  currentMode,
  selectedCards,
  handleCreatorClick,
  handleCardSelection,
  selectedCreator,
  sortState,
  handleSort
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const isRowExpanded = (creatorId: string) => expandedRows.has(creatorId)
  const toggleRowExpansion = (creatorId: string) => {
    setExpandedRows(prev => {
      const s = new Set(prev)
      if (s.has(creatorId)) s.delete(creatorId)
      else s.add(creatorId)
      return s
    })
  }

  if (!creators || creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-500 text-lg font-medium mb-2 dark:text-gray-400">No influencers found</div>
        <div className="text-gray-400 text-sm dark:text-gray-500">Try adjusting your filters to see more results</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div
        className="rounded-t-xl"
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 100px 100px 100px 120px 100px 80px',
          alignItems: 'center',
          padding: '16px 20px',
          gap: '16px',
          backgroundColor: '#0F1419',
          borderBottom: '1px solid #1F2937'
        }}
      >
            <div className="flex justify-center">
          {/* empty cell for checkbox column */}
              </div>
        <div className="font-semibold text-sm" style={{ color: '#9CA3AF' }}>Influencers</div>
        <div className="text-center font-semibold text-sm cursor-pointer" style={{ color: '#9CA3AF' }} onClick={() => handleSort('match_score' as any)}>Match Score</div>
        <div className="text-center font-semibold text-sm cursor-pointer" style={{ color: '#9CA3AF' }} onClick={() => handleSort('followers' as any)}>Followers</div>
        <div className="text-center font-semibold text-sm cursor-pointer" style={{ color: '#9CA3AF' }} onClick={() => handleSort('avg_views' as any)}>Average Views</div>
        <div className="text-center font-semibold text-sm cursor-pointer" style={{ color: '#9CA3AF' }} onClick={() => handleSort('engagement_rate' as any)}>Engagement</div>
        <div className="text-center font-semibold text-sm" style={{ color: '#9CA3AF' }}>Category</div>
        <div className="text-center font-semibold text-sm" style={{ color: '#9CA3AF' }}>Location</div>
        <div className="text-center font-semibold text-sm cursor-pointer" style={{ color: '#9CA3AF' }} onClick={() => handleSort('buzz_score' as any)}>Buzz Score</div>
            </div>

      {/* Body */}
      <div className="divide-y" style={{ borderColor: '#1F2937' }}>
        {creators.map((creator: any, index: number) => {
          const creatorId = creator?.id || creator?.username || `creator-${index}`
          const isSelected = selectedCards.has(creatorId)
          return (
            <CreatorRow
              key={creatorId}
              creator={creator}
              index={index}
              isExpanded={isRowExpanded(creatorId)}
              onToggleExpand={() => toggleRowExpansion(creatorId)}
              searchQuery={''}
              isSelected={isSelected}
              onToggleSelection={() => handleCardSelection(creatorId)}
            />
          )
        })}
      </div>
    </div>
  )
}

// Default export for backward compatibility
export default CreatorListViewAI 