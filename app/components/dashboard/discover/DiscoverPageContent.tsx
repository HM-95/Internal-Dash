'use client'

import React from "react";
import { CreatorFilterSection } from "../../sections/CreatorFilterSection/CreatorFilterSection";
import { CreatorListSection } from "@/dashboard/discover/CreatorListSection/CreatorListSection";
import { MetricsTitleSection } from "../../sections/MetricsTitleSection/MetricsTitleSection";
import { useCreatorData } from "../../../hooks/useCreatorData";
import { useInternalAuth } from "../../../contexts/InternalAuthContext";

/**
 * DiscoverPageContent - Modular component for the Discover page
 * 
 * This component contains all the Discover page functionality and can be easily
 * integrated into any dashboard layout. It handles its own data fetching and state.
 * 
 * Features:
 * - Creator metrics display
 * - Advanced filtering (location, platform, buzz score, etc.)
 * - Creator cards/list view with pagination
 * - Server-side sorting and filtering
 * - Dark theme compatible
 * 
 * @returns JSX.Element - The complete Discover page content
 */
export function DiscoverPageContent(): JSX.Element {
  const creatorData = useCreatorData();
  const { user } = useInternalAuth();
  
  // Check for discover page reload flag and reload once if needed
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const needsReload = localStorage.getItem('discover_needs_reload');
      if (needsReload === 'true') {
        // Clear the flag first to prevent infinite reloads
        localStorage.removeItem('discover_needs_reload');
        
        // Force reload the creator data
        console.log('🔄 Reloading discover page due to AI preferences update');
        creatorData.loadCreators(creatorData.currentMode);
      }
    }
  }, [creatorData]);
  
  return (
    <div className="flex flex-col w-full h-full">
      {/* Page Header with Metrics */}
      <div className="mb-[15px] lg:mb-[20px] xl:mb-[25px]">
        <MetricsTitleSection creatorData={creatorData} />
      </div>
      
      {/* Filter Controls - contains the AI toggle */}
      <div className="mb-[15px] lg:mb-[20px] xl:mb-[25px]">
        <CreatorFilterSection creatorData={creatorData} />
      </div>
      
      {/* Creator List/Cards */}
      <CreatorListSection creatorData={creatorData} userId={user?.userId} />
    </div>
  );
}

export default DiscoverPageContent;
