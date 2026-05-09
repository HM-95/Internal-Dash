'use client';

export default function DiscoverLoading() {
  // Skeleton UI for Discover page with consistent design patterns
  return (
    <div className="bg-black min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-800 rounded mb-4 animate-pulse" />
          
          {/* Metrics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0f1419] border border-[#2c3954] rounded-xl p-4 animate-pulse">
                <div className="h-4 w-20 bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-gray-600 rounded mb-1" />
                <div className="h-3 w-12 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
          
          {/* Filter Controls Skeleton */}
          <div className="bg-[#0f1419] border border-[#2c3954] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-32 bg-gray-700 rounded animate-pulse" />
                <div className="h-10 w-24 bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Creator Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-[#0f1419] border border-[#2c3954] rounded-xl p-4 animate-pulse">
              {/* Profile Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-20 bg-gray-600 rounded" />
                </div>
                <div className="w-8 h-6 bg-gray-600 rounded" />
              </div>
              
              {/* Bio Skeleton */}
              <div className="space-y-2 mb-3">
                <div className="h-3 w-full bg-gray-700 rounded" />
                <div className="h-3 w-3/4 bg-gray-700 rounded" />
              </div>
              
              {/* Metrics Row */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 text-center">
                  <div className="h-4 w-8 bg-gray-600 rounded mx-auto mb-1" />
                  <div className="h-3 w-12 bg-gray-700 rounded mx-auto" />
                </div>
                <div className="flex-1 text-center">
                  <div className="h-4 w-8 bg-gray-600 rounded mx-auto mb-1" />
                  <div className="h-3 w-12 bg-gray-700 rounded mx-auto" />
                </div>
                <div className="flex-1 text-center">
                  <div className="h-4 w-8 bg-gray-600 rounded mx-auto mb-1" />
                  <div className="h-3 w-12 bg-gray-700 rounded mx-auto" />
                </div>
              </div>
              
              {/* Tags and Actions */}
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-gray-600 rounded" />
                <div className="h-6 w-20 bg-gray-600 rounded" />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-700 rounded" />
                <div className="h-8 w-8 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination Skeleton */}
        <div className="flex justify-center items-center gap-2 mt-8">
          <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-8 bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}