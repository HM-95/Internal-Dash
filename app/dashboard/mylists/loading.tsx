'use client';

import { ListGridSkeleton } from '@/src/components/ui/list-skeleton';

export default function MyListsLoading() {
  // Skeleton UI for My Lists page with consistent design patterns
  return (
    <main className="flex flex-col min-h-screen bg-black w-full p-3 lg:p-4">
      <section className="flex flex-col w-full">
        {/* Page Title Skeleton */}
        <div className="h-7 w-28 bg-gray-800 rounded mb-4 animate-pulse" />

        {/* Main Content Container */}
        <div className="w-full bg-[#0f1419] rounded-[12px] border border-[#2c3954] p-3 lg:p-4">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-24 bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-28 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Lists Grid - Using consistent ListGridSkeleton */}
          <ListGridSkeleton />
          
          {/* Pagination Skeleton */}
          <div className="flex justify-center items-center gap-2 mt-6">
            <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-8 bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  );
}