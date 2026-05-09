import React from 'react';

const ListDetailModalSkeleton: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6 py-8"
    >
      <div className="bg-[#1a1f2e] rounded-[12px] border border-gray-700 w-full max-w-6xl h-[80vh] min-h-[80vh] max-h-[110vh] overflow-hidden flex flex-col pb-4">
        {/* Top Section */}
        <div className="px-6 py-4 flex-shrink-0 mt-3 lg:mt-2 mb-6">
          {/* Mobile Layout */}
          <div className="lg:hidden w-full flex flex-row items-start justify-between gap-3">
            {/* Left stack: title + count/date + tags */}
            <div className="flex flex-col justify-center items-start gap-2 flex-1 min-w-[220px]">
              <div className="flex flex-col justify-center items-start gap-1 w-full">
                {/* List Title */}
                <div className="flex items-center gap-1.5 w-full min-h-[28px]">
                  <div className="h-6 rounded w-48 skeleton-shimmer"></div>
                  <div className="w-4 h-4 rounded skeleton-shimmer"></div>
                </div>

                {/* Number + Date row */}
                <div className="flex flex-row items-center gap-2 w-full min-h-[20px]">
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <div className="h-4 rounded w-4 skeleton-shimmer"></div>
                    <div className="h-4 rounded w-16 skeleton-shimmer"></div>
                  </div>
                  <div className="w-px h-5 bg-gray-700"></div>
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                  <div className="w-4 h-4 rounded skeleton-shimmer"></div>
                  <div className="h-4 rounded w-20 skeleton-shimmer"></div>
                  </div>
                </div>

                {/* Tags */}
                <div className="relative flex flex-row items-center gap-2 w-full h-[28px] flex-wrap mt-2">
                  <div className="h-7 rounded-full w-16 skeleton-shimmer"></div>
                  <div className="h-7 rounded-full w-20 skeleton-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex flex-col items-end gap-2 min-w-[120px]">
              <div className="flex flex-row items-center gap-2">
                <div className="h-8 rounded-lg w-16 skeleton-shimmer"></div>
                <div className="h-8 rounded-lg w-16 skeleton-shimmer"></div>
                <div className="w-8 h-8 rounded-lg skeleton-shimmer"></div>
              </div>
            </div>

            {/* Metrics for mobile */}
            <div className="w-full lg:hidden order-4 mt-2 mb-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="inline-flex items-center gap-2 p-2 bg-[#31384a] rounded-lg">
                  <div className="w-8 h-8 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-16 skeleton-shimmer"></div>
                    <div className="h-4 rounded w-8 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 p-2 bg-[#31384a] rounded-lg">
                  <div className="w-8 h-8 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-12 skeleton-shimmer"></div>
                    <div className="h-4 rounded w-6 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 p-2 bg-[#31384a] rounded-lg">
                  <div className="w-8 h-8 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-18 skeleton-shimmer"></div>
                    <div className="h-4 rounded w-8 skeleton-shimmer"></div>
                  </div>
                </div>
              </div>
              {/* Buzz Score Bar */}
              <div className="mt-2 w-full h-3 bg-[#31384a] rounded-lg relative overflow-hidden">
                <div className="h-full rounded-lg w-2/3 skeleton-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex flex-row lg:flex-nowrap justify-between items-start gap-4 w-full min-h-[80px]">
            {/* Title */}
            <div className="flex flex-col justify-center items-start gap-2 flex-1 order-1 lg:order-1 min-w-[260px] mt-0 lg:mt-3">
              <div className="flex flex-col justify-center items-start gap-1 w-full mt-0">
                {/* List Title */}
                <div className="flex items-center gap-1.5 w-full min-h-[28px]">
                  <div className="h-7 rounded w-56 skeleton-shimmer"></div>
                  <div className="w-4 h-4 rounded skeleton-shimmer"></div>
                </div>

                {/* Number + Date row */}
                <div className="flex flex-row items-center gap-2 w-full min-h-[20px]">
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <div className="h-4 rounded w-4 skeleton-shimmer"></div>
                    <div className="h-4 rounded w-16 skeleton-shimmer"></div>
                  </div>
                  <div className="w-px h-5 bg-gray-700"></div>
                  <div className="flex flex-row items-center gap-1 whitespace-nowrap">
                    <div className="w-4 h-4 rounded skeleton-shimmer"></div>
                    <div className="h-4 rounded w-24 skeleton-shimmer"></div>
                  </div>
                </div>

                {/* Tags */}
                <div className="relative flex flex-row items-center gap-2 w-full h-[28px] flex-wrap mt-2">
                  <div className="h-7 rounded-full w-16 skeleton-shimmer"></div>
                  <div className="h-7 rounded-full w-20 skeleton-shimmer"></div>
                  <div className="h-7 rounded-full w-14 skeleton-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Right Section (large/extra-large screens) */}
            <div className="hidden lg:flex flex-col items-end gap-2 w-full max-w-[556px] h-[85px] order-2 ml-auto">
              {/* Top-right actions */}
              <div className="flex flex-row justify-end items-center gap-2 w-full h-8">
                <div className="h-8 rounded-lg w-16 skeleton-shimmer"></div>
                <div className="h-8 rounded-lg w-16 skeleton-shimmer"></div>
                <div className="w-8 h-8 rounded-lg skeleton-shimmer"></div>
              </div>

              {/* Metrics Row */}
              <div className="flex flex-row items-center gap-2 w-full">
                <div className="inline-flex items-center gap-3 p-3 bg-[#31384a] rounded-lg flex-1">
                  <div className="w-10 h-10 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-20 skeleton-shimmer"></div>
                    <div className="h-5 rounded w-12 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 p-3 bg-[#31384a] rounded-lg flex-1">
                  <div className="w-10 h-10 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-16 skeleton-shimmer"></div>
                    <div className="h-5 rounded w-10 skeleton-shimmer"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 p-3 bg-[#31384a] rounded-lg flex-1">
                  <div className="w-10 h-10 rounded skeleton-shimmer"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 rounded w-24 skeleton-shimmer"></div>
                    <div className="h-5 rounded w-8 skeleton-shimmer"></div>
                  </div>
                </div>
              </div>

              {/* Buzz Score Bar */}
              <div className="w-full h-4 bg-[#31384a] rounded-lg relative overflow-hidden">
                <div className="h-full rounded-lg w-3/4 skeleton-shimmer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Creator List Action Buttons */}
          <div className="relative self-stretch w-full flex-[0_0_auto] px-6 py-3 border-t border-gray-700 mt-6 flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="gap-2 inline-flex items-center flex-wrap">
              <div className="h-8 rounded-lg w-48 skeleton-shimmer"></div>
              <div className="h-8 rounded-lg w-32 skeleton-shimmer"></div>
          </div>
          <div className="gap-2 inline-flex items-center flex-wrap justify-end ml-auto">
              <div className="h-8 rounded-lg w-24 skeleton-shimmer"></div>
          </div>
        </div>

        {/* Creator List Skeleton */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0 border-t-0">
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-[#0f1419] rounded-lg border border-gray-700">
                {/* Checkbox */}
                <div className="w-4 h-4 rounded skeleton-shimmer"></div>
                
                {/* Profile pic */}
                <div className="w-12 h-12 rounded-full skeleton-shimmer"></div>
                
                {/* Creator info */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-32 skeleton-shimmer"></div>
                  <div className="h-3 rounded w-24 skeleton-shimmer"></div>
                </div>
                
                {/* Metrics */}
                <div className="hidden sm:flex items-center gap-6">
                    <div className="text-center">
                      <div className="h-3 rounded w-12 mb-1 skeleton-shimmer"></div>
                      <div className="h-4 rounded w-8 skeleton-shimmer"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-3 rounded w-10 mb-1 skeleton-shimmer"></div>
                      <div className="h-4 rounded w-6 skeleton-shimmer"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-3 rounded w-16 mb-1 skeleton-shimmer"></div>
                      <div className="h-4 rounded w-8 skeleton-shimmer"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-3 rounded w-12 mb-1 skeleton-shimmer"></div>
                      <div className="h-4 rounded w-6 skeleton-shimmer"></div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListDetailModalSkeleton;
