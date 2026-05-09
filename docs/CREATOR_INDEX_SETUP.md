# Creator Index Setup Guide

## Overview
The Creator Index system provides semantic search capabilities for the BuzzBerry creator database using OpenAI vector embeddings and comprehensive filtering metadata. This system creates a new `creator_index` table optimized for fast filtering and AI-enhanced matching with support for location, platform, and niche-based filtering.

## Prerequisites

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# OpenAI API Key for embeddings
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Required Packages
The following packages should be installed:

```bash
npm install openai dotenv
npm install -D tsx
```

## Setup Steps

### Step 1: Create the Database Table

Run the SQL migration to create the `creator_index` table:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase-migration-creator-index.sql
```

### Step 2: Expand the Table with Filtering Metadata

Run the expansion migration to add filtering fields:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase-migration-creator-index-expanded.sql
```

This adds:
- Location and region fields for geographic filtering
- Platform information for platform-specific searches
- Brand tags and past ad placements for collaboration history
- Contact information for outreach capabilities
- Comprehensive indexes for fast filtering

### Step 3: Populate the Creator Index

Use the provided script to populate the `creator_index` table with data from `creatordata`:

```bash
# Populate the creator_index table
npm run populate-creator-index populate

# Clear all data from creator_index (if needed)
npm run populate-creator-index clear

# Reset (clear and repopulate)
npm run populate-creator-index reset
```

## Script Usage

### Available Commands

```bash
# Populate creator_index with OpenAI embeddings and metadata
npm run populate-creator-index populate

# Clear all data from creator_index
npm run populate-creator-index clear

# Reset (clear and repopulate)
npm run populate-creator-index reset

# Show help
npm run populate-creator-index
```

### What the Script Does

1. **Fetches Data**: Retrieves all creators from the `creatordata` table
2. **Normalizes Metadata**: Cleans and standardizes filtering fields:
   - Location normalization and region extraction
   - Platform name standardization
   - Brand tag cleaning and formatting
   - Past ad placement deduplication
3. **Generates Embeddings**: Creates vector embeddings using OpenAI's text-embedding-3-small model for:
   - Bio text
   - Hashtags
   - Recent post captions
4. **Inserts Data**: Populates the `creator_index` table with:
   - Basic creator information
   - Metrics and performance data
   - Normalized filtering metadata
   - Vector embeddings (1536 dimensions each)
   - Concatenated recent post captions

### Processing Details

- **Batch Processing**: Processes creators in batches of 5 to avoid OpenAI rate limits
- **Rate Limiting**: Includes delays between API calls and batches
- **Error Handling**: Continues processing even if individual creators fail
- **Backward Compatibility**: Preserves existing embeddings, only updates metadata
- **Progress Tracking**: Shows detailed progress and statistics
- **Retry Logic**: Automatic retries with exponential backoff for rate limits
- **Data Normalization**: Standardizes text fields for consistent filtering

## Database Schema

### creator_index Table Structure

```sql
CREATE TABLE creator_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic creator information
    handle VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    primary_niche VARCHAR(100),
    secondary_niche VARCHAR(100),
    
    -- Metrics
    followers_count INTEGER DEFAULT 0,
    average_views INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    buzz_score INTEGER DEFAULT 0,
    
    -- Content and tags
    hashtags TEXT[] DEFAULT '{}',
    engagement_rate_change DECIMAL(5,2) DEFAULT 0,
    followers_change DECIMAL(5,2) DEFAULT 0,
    average_views_change DECIMAL(5,2) DEFAULT 0,
    recent_post_captions TEXT,
    
    -- Filtering metadata (NEW)
    location TEXT,
    location_region TEXT,
    platform TEXT,
    brand_tags TEXT,
    bio_links TEXT,
    email TEXT,
    past_ad_placements TEXT[],
    
    -- Embeddings for semantic search
    bio_embedding VECTOR(1536),
    hashtags_embedding VECTOR(1536),
    recent_content_embedding VECTOR(1536),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key reference to original creatordata
    creator_id INTEGER REFERENCES creatordata(id) ON DELETE CASCADE
);
```

### Indexes Created

#### Basic Indexes
- **Primary Fields**: handle, niches, metrics, creator_id
- **Vector Indexes**: bio_embedding, hashtags_embedding, recent_content_embedding
- **GIN Index**: hashtags array for fast array operations

#### New Filtering Indexes
- **Location Indexes**: location, location_region, case-insensitive variants
- **Platform Index**: platform, case-insensitive variant
- **Brand Tags**: Full-text search index for brand_tags
- **Past Ad Placements**: GIN index for array operations

#### Composite Indexes
- **Location + Platform**: location_platform
- **Location + Niche**: location_niche
- **Platform + Niche**: platform_niche
- **Location + Platform + Niche**: location_platform_niche

## Data Normalization

### Location Normalization
- **Standardization**: Converts to lowercase, trims whitespace
- **Region Extraction**: Automatically maps cities to regions:
  - Miami, Orlando, Tampa → Florida
  - Los Angeles, San Francisco → California
  - New York City, Boston → Northeast
  - Chicago, Detroit → Midwest
  - Atlanta, Nashville → Southeast
  - Seattle, Portland → Northwest
  - Denver → Mountain West
  - Phoenix, Las Vegas → Southwest

### Platform Normalization
- **Standardization**: Converts common variations to standard names:
  - tiktok → TikTok
  - instagram → Instagram
  - youtube → YouTube
  - twitter/x → Twitter
  - facebook → Facebook
  - linkedin → LinkedIn
  - twitch → Twitch
  - snapchat → Snapchat
  - pinterest → Pinterest

### Brand Tags Normalization
- **Cleaning**: Removes special characters, normalizes spacing
- **Formatting**: Converts to lowercase, removes duplicates
- **Structure**: Maintains comma-separated format for easy parsing

### Past Ad Placements Normalization
- **Deduplication**: Removes duplicate entries
- **Standardization**: Converts to lowercase, trims whitespace
- **Array Structure**: Maintains as TEXT[] for efficient querying

## Embedding Generation

### OpenAI Configuration

- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Format**: Float encoding
- **Rate Limits**: 3,000 requests per minute

### Embedding Types

1. **Bio Embedding**: Vector representation of creator bio text
2. **Hashtags Embedding**: Vector representation of hashtags array
3. **Recent Content Embedding**: Vector representation of recent post captions

### Text Processing

- **Bio**: Raw bio text (cleaned and trimmed)
- **Hashtags**: Joined array elements with spaces
- **Recent Content**: Concatenated captions from recent_post_1, recent_post_2, recent_post_3

### Error Handling

- **Empty Text**: Returns zero vector (1536 dimensions)
- **API Failures**: Retries up to 3 times with exponential backoff
- **Rate Limits**: Automatic retry with increasing delays
- **Server Errors**: Retry on 5xx errors
- **Validation**: Ensures all embeddings are exactly 1536 dimensions

## Performance Considerations

### Rate Limiting
- **OpenAI API**: 5 creators per batch with 200ms delay between creators
- **Batch Processing**: 3-second delay between batches
- **Retry Logic**: Exponential backoff for rate limits (1s, 2s, 3s)
- **Error Handling**: Continues processing on individual failures

### Database Performance
- **Vector Indexes**: Optimized for cosine similarity searches
- **Composite Indexes**: Fast filtering by multiple criteria
- **GIN Indexes**: Efficient array operations on hashtags and past_ad_placements
- **Full-text Search**: Brand tags indexed for semantic search

### Memory Usage
- **Batch Size**: 5 creators per batch to manage memory and rate limits
- **Vector Storage**: 1536 dimensions × 3 embeddings per creator
- **Metadata Storage**: Normalized text fields for efficient filtering
- **Error Recovery**: Graceful handling of API failures

## Monitoring and Maintenance

### Population Statistics
The script provides detailed statistics:
- Total creators processed
- New creators processed (with embeddings)
- Existing creators updated (metadata only)
- Skipped count
- Error count

### Error Handling
- **API Failures**: Returns zero vectors and continues processing
- **Database Errors**: Logs errors and continues with next creator
- **Rate Limits**: Built-in delays and batch processing
- **Retry Logic**: Automatic retries with exponential backoff
- **Backward Compatibility**: Preserves existing embeddings during updates

### Maintenance Tasks
- **Regular Updates**: Re-run population script when new creators are added
- **Index Maintenance**: Monitor vector index performance
- **Storage Monitoring**: Track embedding storage usage
- **API Usage**: Monitor OpenAI API usage and costs
- **Data Quality**: Review normalized metadata for consistency

## Integration with AI Chat

### Usage in Search Functions
The `creator_index` table can be used for:
- **Semantic Search**: Find creators by content similarity
- **Hybrid Search**: Combine vector similarity with metadata filters
- **Geographic Filtering**: Filter by location or region
- **Platform Filtering**: Filter by specific platforms
- **Niche Filtering**: Filter by content categories
- **Collaboration History**: Filter by past brand partnerships

### Example Queries

#### Semantic + Geographic Search
```sql
-- Find crypto creators in Florida with high similarity
SELECT * FROM creator_index 
WHERE location_region = 'Florida' 
  AND primary_niche = 'crypto'
  AND bio_embedding <-> '[query_embedding]' < 0.3
ORDER BY bio_embedding <-> '[query_embedding]';
```

#### Platform + Engagement Filter
```sql
-- Find TikTok creators with high engagement
SELECT * FROM creator_index 
WHERE platform = 'TikTok' 
  AND engagement_rate > 0.05
  AND followers_count > 50000
ORDER BY engagement_rate DESC;
```

#### Brand Collaboration Search
```sql
-- Find creators with specific brand experience
SELECT * FROM creator_index 
WHERE past_ad_placements @> ARRAY['nike', 'adidas']
  AND location_region = 'California'
ORDER BY buzz_score DESC;
```

#### Full-text Brand Tags Search
```sql
-- Find creators with specific brand tags
SELECT * FROM creator_index 
WHERE to_tsvector('english', brand_tags) @@ plainto_tsquery('english', 'tech lifestyle')
  AND platform = 'Instagram'
ORDER BY followers_count DESC;
```

### API Functions Available

```typescript
// Core embedding functions
embedText(text: string): Promise<number[]>
embedBatch(texts: string[]): Promise<number[][]>

// Creator-specific functions
generateCreatorEmbeddings(creator: any): Promise<{...}>
generateQueryEmbedding(query: string): Promise<number[]>

// Utility functions
cosineSimilarity(vectorA: number[], vectorB: number[]): number
findSimilarCreators(queryEmbedding: number[], creators: any[], limit: number): Array<{id: string, similarity: number}>

// Normalization functions (internal)
normalizeLocation(location: string): { location: string; location_region: string }
normalizePlatform(platform: string): string
normalizeBrandTags(brandTags: string): string
normalizePastAdPlacements(placements: string[]): string[]
```

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key configuration
   - Verify rate limits and quotas
   - Ensure sufficient credits
   - Check API key permissions

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure RLS policies are correct

3. **Memory Issues**
   - Reduce batch size if needed
   - Monitor system resources
   - Check for memory leaks

4. **Rate Limit Issues**
   - Increase delays between requests
   - Reduce batch size
   - Check OpenAI usage dashboard

5. **Data Normalization Issues**
   - Check for unexpected location formats
   - Verify platform name variations
   - Review brand tag formatting

### Debug Mode
Add debug logging to the script by modifying the console.log statements or adding environment variables for verbose output.

## Cost Considerations

### OpenAI API Costs
- **text-embedding-3-small**: $0.00002 per 1K tokens
- **Typical Usage**: ~100-500 tokens per creator
- **Cost per Creator**: ~$0.000002-0.00001
- **2,720 Creators**: ~$0.005-0.027 total cost

### Optimization Tips
- **Batch Processing**: Reduces API overhead
- **Caching**: Avoid re-embedding existing data
- **Selective Updates**: Only embed new or changed creators
- **Monitoring**: Track usage to optimize costs
- **Backward Compatibility**: Preserves existing embeddings during updates

## Next Steps

After setting up the expanded creator index:

1. **Test Hybrid Search**: Implement search functions combining semantic similarity with metadata filters
2. **Optimize Performance**: Monitor query performance and adjust indexes
3. **Update Regularly**: Set up automated population updates
4. **Extend Functionality**: Add more filtering criteria or search features
5. **Cost Monitoring**: Set up alerts for OpenAI API usage
6. **Data Quality**: Implement validation for normalized metadata
7. **Search UI**: Build user interface for advanced filtering options

This expanded system provides a comprehensive foundation for AI-enhanced creator discovery with powerful semantic search and metadata filtering capabilities using OpenAI's state-of-the-art embedding model. 