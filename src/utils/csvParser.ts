export interface ImportedCreator {
  username: string;
  platform: string;
  // Optional fields that might be in the CSV
  display_name?: string;
  followers_count?: number;
  engagement_rate?: number;
}

export interface ParsedCSVResult {
  success: boolean;
  data: ImportedCreator[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse CSV content and extract creator data
 */
export function parseCreatorCSV(csvContent: string): ParsedCSVResult {
  const result: ParsedCSVResult = {
    success: false,
    data: [],
    errors: [],
    totalRows: 0,
    validRows: 0
  };

  try {
    console.log('CSV Content length:', csvContent.length);
    console.log('CSV Content preview:', csvContent.substring(0, 200));
    
    // Split into lines and filter out empty lines
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Parsed lines:', lines.length);
    console.log('First few lines:', lines.slice(0, 3));
    
    if (lines.length === 0) {
      result.errors.push('CSV file is empty');
      return result;
    }

    result.totalRows = lines.length - 1; // Exclude header

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    console.log('Parsed headers:', headers);
    
    // Validate required headers
    const requiredHeaders = ['username', 'platform'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      result.errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      return result;
    }

    // Get header indices
    const usernameIndex = headers.indexOf('username');
    const platformIndex = headers.indexOf('platform');
    const displayNameIndex = headers.indexOf('display_name') !== -1 ? headers.indexOf('display_name') : headers.indexOf('name');
    const followersIndex = headers.indexOf('followers_count') !== -1 ? headers.indexOf('followers_count') : headers.indexOf('followers');
    const engagementIndex = headers.indexOf('engagement_rate') !== -1 ? headers.indexOf('engagement_rate') : headers.indexOf('engagement');

    console.log('Header indices:', { usernameIndex, platformIndex, displayNameIndex, followersIndex, engagementIndex });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      
      console.log(`Row ${i}:`, { line, values, valuesLength: values.length });
      
      if (values.length < Math.max(usernameIndex, platformIndex) + 1) {
        result.errors.push(`Row ${i}: Insufficient columns`);
        continue;
      }

            const username = values[usernameIndex]?.trim();
      const platform = values[platformIndex]?.trim(); // Don't convert to lowercase - preserve original case
      
      console.log(`Row ${i} parsed:`, { username, platform });
      
      // Validate required fields
      if (!username || !platform) {
        result.errors.push(`Row ${i}: Missing username or platform`);
        continue;
      }

      // Clean username (remove @ symbol if present)
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

      // Validate platform (case-insensitive)
      const validPlatforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'x'];
      const platformLower = platform.toLowerCase();
      if (!validPlatforms.includes(platformLower)) {
        result.errors.push(`Row ${i}: Invalid platform "${platform}". Supported: ${validPlatforms.join(', ')}`);
        continue;
      }

      // Create creator object
      const creator: ImportedCreator = {
        username: cleanUsername,
        platform: platformLower === 'x' ? 'twitter' : platform // Keep original case, only normalize X to Twitter
      };

      // Add optional fields if present
      if (displayNameIndex !== -1 && values[displayNameIndex]) {
        creator.display_name = values[displayNameIndex].trim();
      }

      if (followersIndex !== -1 && values[followersIndex]) {
        const followers = parseInt(values[followersIndex].replace(/,/g, ''));
        if (!isNaN(followers)) {
          creator.followers_count = followers;
        }
      }

      if (engagementIndex !== -1 && values[engagementIndex]) {
        const engagement = parseFloat(values[engagementIndex].replace('%', ''));
        if (!isNaN(engagement)) {
          creator.engagement_rate = engagement;
        }
      }

      result.data.push(creator);
      result.validRows++;
    }

    console.log('Final parsing result:', {
      totalRows: result.totalRows,
      validRows: result.validRows,
      data: result.data,
      errors: result.errors
    });

    result.success = result.validRows > 0;
    
    if (result.validRows === 0) {
      result.errors.push('No valid rows found in CSV');
    }

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
