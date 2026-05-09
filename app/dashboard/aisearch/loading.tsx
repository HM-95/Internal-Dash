'use client';

export default function AISearchLoading() {
  // Skeleton UI for AI Search page matching the actual homepage structure
  return (
    <div className="bg-black min-h-screen">
      <section className="flex flex-col w-full max-w-[820px] items-center gap-8 sm:gap-10 md:gap-10 lg:gap-12 mx-auto py-6 sm:py-6 md:py-6 lg:py-8 px-4">
        
        {/* Welcome Section Skeleton */}
        <div className="flex flex-col items-center gap-3 sm:gap-[3px] w-full max-w-xs sm:max-w-sm md:max-w-none">
          {/* Video Placeholder */}
          <div className="flex flex-col w-full max-w-[180px] sm:max-w-[228px] items-start gap-2.5">
            <div className="w-full h-[90px] sm:h-[90px] md:h-[110px] lg:h-[130px] bg-gray-800 rounded-lg animate-pulse" />
          </div>

          {/* Title and Description Skeleton */}
          <div className="flex flex-col items-start gap-3 sm:gap-2.5 p-2 sm:p-2.5 w-full">
            <div className="flex flex-col w-full max-w-[780px] items-start gap-2 sm:gap-2 mx-auto px-2 sm:px-4 md:px-0">
              <div className="w-full flex justify-center">
                <div className="h-8 sm:h-10 md:h-12 w-80 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="w-full flex flex-col items-center gap-2">
                <div className="h-4 sm:h-5 md:h-6 w-96 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 sm:h-5 md:h-6 w-80 bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards and Search Section Skeleton */}
        <div className="flex flex-col w-full max-w-[804px] items-center gap-6 sm:gap-6 md:gap-8 lg:gap-10">
          
          {/* Feature Cards Skeleton */}
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 xs:gap-2 sm:gap-3 w-full px-2 sm:px-0">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] bg-[#0f1419] border border-[#2c3954] rounded-xl animate-pulse"
              >
                <div className="flex flex-col h-[80px] xs:h-[90px] sm:h-[100px] md:h-[120px] items-start pt-2 pb-3 sm:pb-4 px-2 sm:px-3">
                  {/* Icon and Social Icons Area */}
                  {index === 0 ? (
                    <div className="flex items-center gap-2 xs:gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-2">
                      <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-700 rounded" />
                      <div className="flex items-center overflow-hidden">
                        {[...Array(5)].map((_, socialIndex) => (
                          <div
                            key={socialIndex}
                            className={`w-4 xs:w-5 sm:w-6 md:w-7 h-4 xs:h-5 sm:h-6 md:h-7 rounded-full bg-gray-700 ${
                              socialIndex > 0 ? '-ml-0.5 xs:-ml-0.5 sm:-ml-1 md:-ml-1.5' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-600 text-gray-400 rounded-2xl mt-2 sm:mt-3 text-xs px-3 py-1 h-6 w-20" />
                  )}

                  {/* Title and Description */}
                  <div className="flex flex-col items-start justify-center gap-1 w-full mt-auto">
                    <div className="h-4 sm:h-5 md:h-6 w-32 bg-gray-700 rounded" />
                    <div className="h-3 sm:h-4 w-28 bg-gray-600 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Input Skeleton */}
          <div className="w-full max-w-[776px] px-2 sm:px-0">
            <div className="border border-gray-700 rounded-xl bg-[#0f1419]">
              <div className="flex flex-col p-0">
                <div className="flex flex-wrap items-start gap-4 sm:gap-[36px_1px] px-2.5 py-3.5 w-full">
                  <div className="flex items-center justify-start gap-2.5 w-full">
                    {/* Search Input Placeholder */}
                    <div className="flex-1 h-6 bg-gray-700 rounded animate-pulse" />
                    
                    {/* Dropdown Button Skeleton */}
                    <div className="flex items-center gap-2 bg-[#1a1f2e] border border-[#2c3954] rounded-lg px-3 py-2 min-w-[200px]">
                      <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-4 bg-gray-600 rounded animate-pulse" />
                    </div>

                    {/* Send Button Skeleton */}
                    <div className="h-6 w-6 bg-gray-600 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat History Button Skeleton */}
          <div className="flex justify-center">
            <div className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}