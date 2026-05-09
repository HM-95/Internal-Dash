import React from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon-component";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  previousPage: () => void;
  nextPage: () => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  handlePageChange,
  previousPage,
  nextPage,
}) => {
  // Ensure totalPages is at least 1 and currentPage is valid
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Only hide pagination if there's truly no content (but we should always show at least 1 page)
  if (safeTotalPages <= 1 && totalPages <= 0) return null;

  // Responsive page count based on screen size
  const maxVisiblePages = typeof window !== 'undefined' && window.innerWidth < 480 ? 5 : typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 7;

  const getPages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    pages.push(1);
    if (safeTotalPages <= maxVisiblePages) {
      for (let i = 2; i <= safeTotalPages; i++) pages.push(i);
    } else {
      const showEarly = safeCurrentPage <= 3;
      const showLate = safeCurrentPage >= safeTotalPages - 2;
      if (showEarly) {
        for (let i = 2; i <= Math.min(4, safeTotalPages - 1); i++) pages.push(i);
        if (safeTotalPages > 5) pages.push('...');
      } else if (showLate) {
        pages.push('...');
        for (let i = safeTotalPages - 3; i < safeTotalPages; i++) pages.push(i);
      } else {
        pages.push('...');
        for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) pages.push(i);
        pages.push('...');
      }
      pages.push(safeTotalPages);
    }
    return pages;
  };

  return (
    <div className="flex-shrink-0 mt-[20px] lg:mt-[25px] xl:mt-[30px] w-full">
      {/* Full-width divider */}
      <div className="w-full border-t border-gray-600 mb-[15px] lg:mb-[20px] xl:mb-[25px]"></div>
      
      {/* Centered pagination controls */}
      <div className="flex flex-col items-center gap-[8px] sm:gap-[10px] lg:gap-[12px] xl:gap-[15px] w-full">
        <div className="flex items-center justify-center gap-[4px] xs:gap-[6px] sm:gap-[8px] lg:gap-[10px] xl:gap-[12px] w-full overflow-x-auto">
          <div className="flex items-center gap-[4px] xs:gap-[6px] sm:gap-[8px] lg:gap-[10px] xl:gap-[12px] flex-shrink-0 min-w-fit px-2 sm:px-0">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={safeCurrentPage === 1}
              className="h-[28px] xs:h-[30px] lg:h-[34px] xl:h-[38px] px-[6px] xs:px-[8px] sm:px-[10px] lg:px-[14px] xl:px-[18px] bg-gray-800 border-gray-600 rounded-[6px] sm:rounded-[8px] font-medium text-[10px] xs:text-[11px] sm:text-[12px] lg:text-[13px] xl:text-[14px] text-gray-200 hover:bg-gray-700 hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[3px] xs:gap-[4px] sm:gap-[6px] lg:gap-[8px] xl:gap-[10px] flex-shrink-0"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-[10px] h-[10px] xs:w-[12px] xs:h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px] text-white"
              >
                <path 
                  d="M10 12L6 8L10 4" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <div className="flex items-center gap-[2px] xs:gap-[3px] sm:gap-[4px] lg:gap-[6px] xl:gap-[8px] flex-shrink-0">
              {getPages().map((page, idx) =>
                page === '...'
                  ? <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                  : <Button
                      key={`page-${page}`}
                      variant="outline"
                      onClick={() => handlePageChange(Number(page))}
                      className={`h-[28px] xs:h-[30px] lg:h-[34px] xl:h-[38px] w-[28px] xs:w-[30px] lg:w-[34px] xl:w-[38px] p-0 rounded-[6px] sm:rounded-[8px] font-medium text-[10px] xs:text-[11px] sm:text-[12px] lg:text-[13px] xl:text-[14px] transition-colors flex-shrink-0 ${safeCurrentPage === page ? 'bg-[linear-gradient(90deg,#557EDD_0%,#6C40E4_100%)] border-transparent text-white hover:bg-[linear-gradient(90deg,#4A6BC8_0%,#5A36C7_100%)] hover:text-white' : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100'}`}
                    >
                      {page}
                    </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={nextPage}
              disabled={safeCurrentPage === safeTotalPages}
              className="h-[28px] xs:h-[30px] lg:h-[34px] xl:h-[38px] px-[6px] xs:px-[8px] sm:px-[10px] lg:px-[14px] xl:px-[18px] bg-gray-800 border-gray-600 rounded-[6px] sm:rounded-[8px] font-medium text-[10px] xs:text-[11px] sm:text-[12px] lg:text-[13px] xl:text-[14px] text-gray-200 hover:bg-gray-700 hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[3px] xs:gap-[4px] sm:gap-[6px] lg:gap-[8px] xl:gap-[10px] flex-shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 16 16" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-[10px] h-[10px] xs:w-[12px] xs:h-[12px] lg:w-[14px] lg:h-[14px] xl:w-[16px] xl:h-[16px] text-white"
              >
                <path 
                  d="M6 12L10 8L6 4" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>
        <div className="text-[12px] font-medium text-gray-400">
          Page {safeCurrentPage} of {safeTotalPages}
        </div>
      </div>
    </div>
  );
};

export default PaginationControls; 