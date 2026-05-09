import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (itemsPerPage: number) => void;
  previousPage: () => void;
  nextPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  handlePageChange,
  handleItemsPerPageChange,
  previousPage,
  nextPage,
  goToFirstPage,
  goToLastPage,
}) => {
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [pageInputValue, setPageInputValue] = useState(currentPage.toString());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure totalPages is at least 1 and currentPage is valid
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Items per page options
  const itemsPerPageOptions = [12, 24, 36, 48, 60];

  // Handle page input change
  const handlePageInputChange = (value: string) => {
    setPageInputValue(value);
  };

  // Handle page input submit (on Enter or blur)
  const handlePageInputSubmit = () => {
    let pageNumber = parseFloat(pageInputValue);
    
    // Handle validation rules
    if (isNaN(pageNumber) || pageNumber <= 0) {
      pageNumber = 1;
    } else if (pageNumber > safeTotalPages) {
      pageNumber = safeTotalPages;
    } else {
      // Round decimal numbers
      pageNumber = Math.round(pageNumber);
    }
    
    setPageInputValue(pageNumber.toString());
    handlePageChange(pageNumber);
  };

  // Handle items per page change
  const handleItemsChange = (newItemsPerPage: number) => {
    console.log('PaginationControls: handleItemsChange called with:', newItemsPerPage);
    console.log('Current totalPages before change:', totalPages);
    console.log('Current totalItems:', totalItems);
    handleItemsPerPageChange(newItemsPerPage);
    setShowItemsDropdown(false);
  };

  // Update page input when currentPage changes externally
  React.useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowItemsDropdown(false);
      }
    };

    if (showItemsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showItemsDropdown]);

  return (
    <div className="flex-shrink-0 mt-[20px] lg:mt-[25px] xl:mt-[30px] w-full">
      {/* Full-width divider */}
      <div className="w-full border-t border-[#1F2937] mb-[15px] lg:mb-[20px] xl:mb-[25px]"></div>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-between w-full px-4 py-3">
        {/* Items per page selector - moved to left */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-inter">Items per page</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Dropdown button clicked, current state:', showItemsDropdown);
                setShowItemsDropdown(!showItemsDropdown);
              }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-white font-inter bg-black border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-900 transition-colors h-9"
            >
              <span>{itemsPerPage}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showItemsDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown */}
            {showItemsDropdown && (
              <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-[9999] min-w-[60px]">
                {itemsPerPageOptions.map((option) => (
                  <button
                    key={option}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Dropdown option clicked:', option);
                      handleItemsChange(option);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm font-inter hover:bg-gray-700 transition-colors cursor-pointer ${
                      option === itemsPerPage ? 'bg-gray-700 text-white' : 'text-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-6">
          {/* Page display with editable input */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-inter">Page</span>
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePageInputSubmit();
                }
              }}
              onBlur={handlePageInputSubmit}
              className="w-10 px-2 py-2 text-sm text-center text-white font-inter bg-black border border-gray-600 rounded-lg focus:outline-none focus:border-gray-400 h-9"
            />
            <span className="text-sm text-white font-inter">of {safeTotalPages}</span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {/* First page */}
            <button
              onClick={goToFirstPage}
              disabled={safeCurrentPage === 1}
              className="flex items-center justify-center w-9 h-9 text-white bg-black border border-gray-600 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>

            {/* Previous page */}
            <button
              onClick={previousPage}
              disabled={safeCurrentPage === 1}
              className="flex items-center justify-center w-9 h-9 text-white bg-black border border-gray-600 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Next page */}
            <button
              onClick={nextPage}
              disabled={safeCurrentPage === safeTotalPages}
              className="flex items-center justify-center w-9 h-9 text-white bg-black border border-gray-600 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Last page */}
            <button
              onClick={goToLastPage}
              disabled={safeCurrentPage === safeTotalPages}
              className="flex items-center justify-center w-9 h-9 text-white bg-black border border-gray-600 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls; 