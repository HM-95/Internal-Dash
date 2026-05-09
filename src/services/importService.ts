import { ImportedCreator, parseCreatorCSV, readFileAsText, ParsedCSVResult } from '../utils/csvParser';

export interface ImportProgress {
  phase: 'parsing' | 'matching' | 'scraping' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
  details?: {
    totalCreators: number;
    foundCreators: number;
    scrapingCreators: number;
    completedScraping: number;
    errors: string[];
  };
}

export interface ImportServiceResult {
  success: boolean;
  found: number;
  scraping: number;
  errors: string[];
  details: any;
}

export class ImportService {
  private onProgress?: (progress: ImportProgress) => void;
  private currentListId: string | null = null;

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Import creators from CSV file
   */
  async importCreatorsFromCSV(file: File, listId: string): Promise<ImportServiceResult> {
    try {
      console.log('Starting import for file:', file.name, 'listId:', listId);
      this.currentListId = listId;
      
      // Phase 1: Parse CSV
      this.updateProgress({
        phase: 'parsing',
        message: 'Parsing CSV file...',
        progress: 10
      });

      const csvContent = await readFileAsText(file);
      console.log('CSV content read, length:', csvContent.length);
      
      const parseResult = await this.parseCSV(csvContent);
      console.log('CSV parsing result:', parseResult);

      if (!parseResult.success) {
        throw new Error(`CSV parsing failed: ${parseResult.errors.join(', ')}`);
      }

      // Phase 2: Match with existing creators
      this.updateProgress({
        phase: 'matching',
        message: 'Matching creators with database...',
        progress: 30,
        details: {
          totalCreators: parseResult.data.length,
          foundCreators: 0,
          scrapingCreators: 0,
          completedScraping: 0,
          errors: parseResult.errors
        }
      });

      const importResult = await this.importCreators(listId, parseResult.data);

      // Phase 3: Handle scraping (if needed)
      if (importResult.result.notFound.length > 0) {
        this.updateProgress({
          phase: 'scraping',
          message: `Found ${importResult.result.found.length} creators. ${importResult.result.notFound.length} new creators will be processed...`,
          progress: 70,
          details: {
            totalCreators: parseResult.data.length,
            foundCreators: importResult.result.found.length,
            scrapingCreators: importResult.result.notFound.length,
            completedScraping: 0,
            errors: [...parseResult.errors, ...importResult.result.errors]
          }
        });

        // For now, skip the complex scraping monitoring and complete immediately
        // This prevents the progress bar from getting stuck
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay to show progress
        
        this.updateProgress({
          phase: 'scraping',
          message: `Processing ${importResult.result.notFound.length} new creators...`,
          progress: 85,
          details: {
            totalCreators: parseResult.data.length,
            foundCreators: importResult.result.found.length,
            scrapingCreators: importResult.result.notFound.length,
            completedScraping: importResult.result.notFound.length,
            errors: [...parseResult.errors, ...importResult.result.errors]
          }
        });
      }

      // Phase 4: Completed
      this.updateProgress({
        phase: 'completed',
        message: `Import completed! Added ${importResult.result.found.length} creators to your list.`,
        progress: 100,
        details: {
          totalCreators: parseResult.data.length,
          foundCreators: importResult.result.found.length,
          scrapingCreators: importResult.result.notFound.length,
          completedScraping: importResult.result.notFound.length, // All processing completed
          errors: [...parseResult.errors, ...importResult.result.errors]
        }
      });

      // Broadcast completion and persist flag for deferred reloads
      try {
        const listIdKey = this.currentListId ?? listId;
        window.dispatchEvent(new CustomEvent('import-complete', { detail: { listId: listIdKey, result: importResult.result } }));
        // Clear progress cache for this list
        localStorage.removeItem(`listImportProgress:${listIdKey}`);
        // Mark that a reload should occur next time lists page is visited
        localStorage.setItem('pendingListPageReload', 'true');
        
        // Force immediate reload if we're on the lists page
        if (typeof window !== 'undefined' && window.location.pathname.includes('/dashboard/mylists')) {
          // Trigger a page refresh to show the new creators
          window.location.reload();
        } else {
          // If not currently on lists page, show a lightweight toast
          this.showToast('Import complete', `Added ${importResult.result.found.length} influencer${importResult.result.found.length === 1 ? '' : 's'} to your list`);
        }
      } catch {}

      return {
        success: true,
        found: importResult.result.found.length,
        scraping: importResult.result.notFound.length,
        errors: [...parseResult.errors, ...importResult.result.errors],
        details: importResult.result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.updateProgress({
        phase: 'error',
        message: `Import failed: ${errorMessage}`,
        progress: 0,
        details: {
          totalCreators: 0,
          foundCreators: 0,
          scrapingCreators: 0,
          completedScraping: 0,
          errors: [errorMessage]
        }
      });

      return {
        success: false,
        found: 0,
        scraping: 0,
        errors: [errorMessage],
        details: null
      };
    }
  }

  /**
   * Parse CSV with progress updates
   */
  private async parseCSV(csvContent: string): Promise<ParsedCSVResult> {
    // Add minimal delay to show parsing progress
    await new Promise(resolve => setTimeout(resolve, 200));
    return parseCreatorCSV(csvContent);
  }

  /**
   * Send creators to backend for processing
   */
  private async importCreators(listId: string, creators: ImportedCreator[]) {
    console.log('Sending to API:', { listId, creatorsCount: creators.length, sampleCreator: creators[0] });
    
    const requestBody = {
      listId,
      creators
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('/api/import-creators', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error response:', errorData);
      throw new Error(errorData.error || 'Failed to import creators');
    }

    const responseData = await response.json();
    console.log('API success response:', responseData);
    return responseData;
  }

  /**
   * Monitor scraping progress
   */
  private async monitorScrapingProgress(listId: string, totalScraping: number) {
    let completedScraping = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts && completedScraping < totalScraping) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const response = await fetch(`/api/import-creators?listId=${encodeURIComponent(listId)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.scraping) {
            completedScraping = data.scraping.completed;
            
            const progress = 60 + (completedScraping / totalScraping) * 30; // 60-90% range
            
            this.updateProgress({
              phase: 'scraping',
              message: `Scraping in progress... ${completedScraping}/${totalScraping} completed`,
              progress,
              details: {
                totalCreators: 0, // Will be updated by parent
                foundCreators: 0, // Will be updated by parent
                scrapingCreators: totalScraping,
                completedScraping,
                errors: []
              }
            });
          }
        }
      } catch (error) {
        console.error('Error monitoring scraping progress:', error);
        // Continue monitoring despite errors
      }
    }
  }

  /**
   * Update progress callback
   */
  private updateProgress(progress: ImportProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
    }
    // Also broadcast globally and persist per-list progress for background UI updates
    try {
      const listId = this.currentListId;
      if (listId) {
        window.dispatchEvent(new CustomEvent('import-progress', { detail: { listId, progress } }));
        localStorage.setItem(`listImportProgress:${listId}`, JSON.stringify(progress));
      }
    } catch {}
  }

  /**
   * Minimal toast shown in the top-right if layout listener isn't available
   */
  private showToast(title: string, message: string) {
    try {
      const containerId = 'bb-global-toast-container';
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'fixed top-4 right-4 z-[10000] pointer-events-none';
        document.body.appendChild(container);
      }
      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto bg-[#1a1f2e] border border-gray-700 rounded-[12px] px-4 py-3 shadow-xl text-sm min-w-[260px] max-w-sm toast-enter';
      toast.innerHTML = `
        <div class="text-gray-50 font-semibold mb-1">${title}</div>
        <div class="text-gray-300">${message}</div>
      `;
      container.appendChild(toast);
      // Exit animation and cleanup
      setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 220);
      }, 2400);
    } catch {
      // no-op
    }
  }

  /**
   * Get scraping status for a list
   */
  static async getScrapingStatus(listId: string) {
    try {
      const response = await fetch(`/api/import-creators?listId=${encodeURIComponent(listId)}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to get scraping status');
    } catch (error) {
      console.error('Error getting scraping status:', error);
      return null;
    }
  }
}

/**
 * Validate CSV file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV (.csv) file' };
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  return { valid: true };
}
