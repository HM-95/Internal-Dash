import React from 'react';

const ListSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-start self-stretch w-full bg-[#1a1f2e] rounded-[12px] border border-gray-700 p-3 lg:p-4 animate-pulse">
      <div className="p-3 w-full">
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-row items-center justify-between relative self-stretch w-full flex-[0_0_auto] gap-3">
          {/* Left side - Title, info, tags */}
          <div className="flex-col items-start gap-2 inline-flex justify-center">
            <div className="flex-col items-start gap-1 inline-flex justify-center">
              {/* Title */}
              <div className="h-6 bg-gray-700 rounded w-48"></div>
              
              {/* Creator count and date */}
              <div className="flex items-start gap-2 self-stretch w-full">
                <div className="inline-flex items-center gap-1">
                  <div className="h-4 bg-gray-700 rounded w-6"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="w-px h-5 bg-gray-700"></div>
                <div className="inline-flex items-center justify-center gap-1">
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            </div>
            
            {/* Tags */}
            <div className="inline-flex items-center gap-1 flex-wrap">
              <div className="h-7 bg-gray-700 rounded-full w-16"></div>
              <div className="h-7 bg-gray-700 rounded-full w-20"></div>
            </div>
          </div>
          
          {/* Right side - Actions and metrics */}
          <div className="inline-flex flex-col items-end justify-center gap-2 w-auto">
            {/* Actions */}
            <div className="flex flex-row items-center gap-1 w-[120px] h-8 justify-end">
              <div className="h-8 bg-gray-700 rounded-lg w-[70px]"></div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
              <div className="w-4 h-4 bg-gray-700 rounded"></div>
            </div>
            
            {/* Metrics */}
            <div className="flex flex-col w-[548px] items-end gap-2">
              <div className="inline-flex items-center gap-1 justify-end">
                <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                  <div className="w-[36px] h-[36px] bg-gray-600 rounded"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-600 rounded w-12"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                  <div className="w-[36px] h-[36px] bg-gray-600 rounded"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-gray-600 rounded w-10"></div>
                  </div>
                </div>
                <div className="inline-flex items-center gap-3 p-2 bg-[#31384a] rounded-[12px] w-[180px]">
                  <div className="w-[36px] h-[36px] bg-gray-600 rounded"></div>
                  <div className="inline-flex flex-col items-start justify-center gap-0.5">
                    <div className="h-3 bg-gray-600 rounded w-24"></div>
                    <div className="h-4 bg-gray-600 rounded w-8"></div>
                  </div>
                </div>
              </div>
              
              {/* Buzz Score Bar */}
              <div className="relative flex-[0_0_auto] w-[548px]">
                <div className="w-full h-[14px] bg-[#31384a] rounded-[8px] relative overflow-hidden">
                  <div className="h-full rounded-[8px] bg-gray-600 w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet/Mobile Layout */}
        <div className="flex lg:hidden flex-col items-start justify-between relative self-stretch w-full gap-3 sm:gap-4 md:gap-5">
          {/* Title and Actions Row */}
          <div className="flex flex-row items-start justify-between w-full">
            {/* Title Section */}
            <div className="flex flex-col items-start gap-2 sm:gap-2.5 flex-1 min-w-0">
              <div className="flex flex-col items-start gap-1 sm:gap-1.5">
                {/* Title */}
                <div className="h-5 sm:h-6 md:h-7 bg-gray-700 rounded w-32 sm:w-40 md:w-48"></div>
                
                {/* Creator count and date */}
                <div className="flex items-start gap-1.5 sm:gap-2.5 flex-wrap">
                  <div className="inline-flex items-center gap-[3px]">
                    <div className="h-4 bg-gray-700 rounded w-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                  </div>
                  <div className="w-px h-4 sm:h-5 bg-gray-700"></div>
                  <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <div className="h-6 bg-gray-700 rounded-full w-12"></div>
                <div className="h-6 bg-gray-700 rounded-full w-16"></div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-row items-center gap-1 sm:gap-1.5 ml-2 sm:ml-4 flex-shrink-0">
              <div className="h-8 bg-gray-700 rounded-lg w-[70px]"></div>
              <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 bg-gray-700 rounded-lg"></div>
              <div className="w-4 sm:w-5 h-4 sm:h-5 bg-gray-700 rounded"></div>
            </div>
          </div>
          
          {/* Metrics and Buzz Score */}
          <div className="flex flex-col items-end gap-2 sm:gap-2.5 w-full">
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2 lg:gap-1.5 w-full">
              <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 p-1.5 sm:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                <div className="w-4 sm:w-5 md:w-7 h-4 sm:h-5 md:h-7 bg-gray-600 rounded flex-shrink-0"></div>
                <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                  <div className="h-2 sm:h-3 bg-gray-600 rounded w-12"></div>
                  <div className="h-3 sm:h-4 bg-gray-600 rounded w-8"></div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 p-1.5 sm:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                <div className="w-4 sm:w-5 md:w-7 h-4 sm:h-5 md:h-7 bg-gray-600 rounded flex-shrink-0"></div>
                <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                  <div className="h-2 sm:h-3 bg-gray-600 rounded w-10"></div>
                  <div className="h-3 sm:h-4 bg-gray-600 rounded w-6"></div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 sm:gap-2 md:gap-3 p-1.5 sm:p-2 bg-[#31384a] rounded-[6px] sm:rounded-[8px] md:rounded-[12px] w-full">
                <div className="w-4 sm:w-5 md:w-7 h-4 sm:h-5 md:h-7 bg-gray-600 rounded flex-shrink-0"></div>
                <div className="inline-flex flex-col items-start justify-center gap-0.5 min-w-0">
                  <div className="h-2 sm:h-3 bg-gray-600 rounded w-14"></div>
                  <div className="h-3 sm:h-4 bg-gray-600 rounded w-6"></div>
                </div>
              </div>
            </div>
            
            {/* Buzz Score Bar */}
            <div className="relative flex-[0_0_auto] w-full">
              <div className="w-full h-2 sm:h-3 md:h-[14px] bg-[#31384a] rounded-[6px] sm:rounded-[8px] relative overflow-hidden">
                <div className="h-full rounded-[6px] sm:rounded-[8px] bg-gray-600 w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ListGridSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-start gap-3 lg:gap-4 w-full">
      {Array.from({ length: 6 }).map((_, index) => (
        <ListSkeleton key={index} />
      ))}
    </div>
  );
};

export { ListSkeleton, ListGridSkeleton };
