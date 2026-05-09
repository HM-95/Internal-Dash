'use client'

import React from "react";
import { DiscoverPageContent } from "./discover/DiscoverPageContent";

/**
 * Discover - Main component for the Discover page
 * 
 * This is the main entry point for the Discover page that can be directly
 * imported and used in your dashboard routing system.
 * 
 * Usage in dashboard:
 * import { Discover } from "@/components/dashboard/discover";
 * 
 * Then use <Discover /> in your dashboard routing
 */
export function Discover(): JSX.Element {
  return <DiscoverPageContent />;
}

export default Discover; 