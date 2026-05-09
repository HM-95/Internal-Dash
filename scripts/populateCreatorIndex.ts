#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateCreatorEmbeddings } from '../app/lib/ai/embeddings'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CreatorData {
  id: number
  handle: string
  display_name: string
  bio: string
  primary_niche: string
  secondary_niche: string
  followers_count: number
  average_views: number
  engagement_rate: number
  buzz_score: number
  hashtags: string[]
  engagement_rate_change: number
  followers_change: number
  average_views_change: number
  // Recent posts are objects with caption property
  recent_post_1: { caption: string } | null
  recent_post_2: { caption: string } | null
  recent_post_3: { caption: string } | null
  // New filtering metadata fields (actual field names from database)
  location: string // Broader classification (e.g., "Europe", "Asia", "United States")
  locationRegion: string // Specific location (e.g., "Romania", "El Nido, Philippines")
  platform: string
  brand_tags: string
  bio_links: string
  email: string
  past_ad_placements: string[]
}

interface CreatorIndexData {
  creator_id: number
  handle: string
  display_name: string
  bio: string
  primary_niche: string
  secondary_niche: string
  followers_count: number
  average_views: number
  engagement_rate: number
  buzz_score: number
  hashtags: string[]
  engagement_rate_change: number
  followers_change: number
  average_views_change: number
  recent_post_captions: string
  // New filtering metadata fields
  location: string
  location_region: string
  platform: string
  brand_tags: string
  bio_links: string
  email: string
  past_ad_placements: string[]
  // Embeddings (existing)
  bio_embedding: number[]
  hashtags_embedding: number[]
  recent_content_embedding: number[]
}

/**
 * Normalize text fields for consistent filtering
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text.trim().toLowerCase()
}

/**
 * Normalize location and extract region
 */
function normalizeLocation(location: string | null | undefined): { location: string; location_region: string } {
  if (!location) return { location: '', location_region: '' }
  
  const normalized = location.trim()
  if (!normalized) return { location: '', location_region: '' }

  // Extract region from common location patterns
  const regionMap: { [key: string]: string } = {
    'florida': 'Florida',
    'california': 'California',
    'texas': 'Texas',
    'new york': 'Northeast',
    'miami': 'Florida',
    'orlando': 'Florida',
    'tampa': 'Florida',
    'jacksonville': 'Florida',
    'los angeles': 'California',
    'san francisco': 'California',
    'san diego': 'California',
    'houston': 'Texas',
    'dallas': 'Texas',
    'austin': 'Texas',
    'new york city': 'Northeast',
    'boston': 'Northeast',
    'philadelphia': 'Northeast',
    'chicago': 'Midwest',
    'detroit': 'Midwest',
    'atlanta': 'Southeast',
    'nashville': 'Southeast',
    'charlotte': 'Southeast',
    'seattle': 'Northwest',
    'portland': 'Northwest',
    'denver': 'Mountain West',
    'phoenix': 'Southwest',
    'las vegas': 'Southwest'
  }

  const lowerLocation = normalized.toLowerCase()
  let region = ''

  // Find matching region
  for (const [key, value] of Object.entries(regionMap)) {
    if (lowerLocation.includes(key)) {
      region = value
      break
    }
  }

  return { location: normalized, location_region: region }
}

/**
 * Normalize platform field
 */
function normalizePlatform(platform: string | null | undefined): string {
  if (!platform) return ''
  
  const normalized = platform.trim().toLowerCase()
  
  // Standardize common platform names
  const platformMap: { [key: string]: string } = {
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'twitter': 'Twitter',
    'x': 'Twitter',
    'facebook': 'Facebook',
    'linkedin': 'LinkedIn',
    'twitch': 'Twitch',
    'snapchat': 'Snapchat',
    'pinterest': 'Pinterest'
  }

  return platformMap[normalized] || normalized
}

/**
 * Normalize brand tags
 */
function normalizeBrandTags(brandTags: string | null | undefined): string {
  if (!brandTags) return ''
  
  // Clean and normalize brand tags
  return brandTags
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s,]/g, '') // Remove special characters except spaces and commas
}

/**
 * Normalize past ad placements array
 */
function normalizePastAdPlacements(placements: string[] | null | undefined): string[] {
  if (!placements || !Array.isArray(placements)) return []
  
  return placements
    .filter(placement => placement && placement.trim())
    .map(placement => placement.trim().toLowerCase())
    .filter((placement, index, arr) => arr.indexOf(placement) === index) // Remove duplicates
}

/**
 * Fetch all creators from creatordata table
 */
async function fetchCreators(limit?: number): Promise<CreatorData[]> {
  console.log('Fetching creators from creatordata table...')
  
  let allCreators: CreatorData[] = []
  let from = 0
  const pageSize = 1000 // Supabase default limit
  
  while (true) {
    let query = supabase
      .from('creatordata')
      .select('*')
      .order('id')
      .range(from, from + pageSize - 1)

    if (limit) {
      const remainingLimit = limit - allCreators.length
      if (remainingLimit <= 0) break
      
      query = query.limit(Math.min(remainingLimit, pageSize))
      console.log(`Limiting to ${limit} creators for testing`)
    }
    
    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching creators: ${error.message}`)
    }

    if (!data || data.length === 0) {
      break // No more data
    }

    allCreators = allCreators.concat(data)
    console.log(`Fetched ${allCreators.length} creators so far...`)

    if (limit && allCreators.length >= limit) {
      break // Reached the limit
    }

    if (data.length < pageSize) {
      break // Last page
    }

    from += pageSize
  }

  console.log(`Found ${allCreators.length} creators total`)
  return allCreators
}

/**
 * Prepare creator data for insertion into creator_index
 */
function prepareCreatorData(creator: CreatorData): Omit<CreatorIndexData, 'bio_embedding' | 'hashtags_embedding' | 'recent_content_embedding'> {
  // Concatenate recent post captions (handle object structure)
  const recentCaptions = [
    creator.recent_post_1?.caption || '',
    creator.recent_post_2?.caption || '',
    creator.recent_post_3?.caption || ''
  ].filter(caption => caption && typeof caption === 'string' && caption.trim().length > 0).join(' ')

  // Use existing location classification from creatordata
  const location = creator.location || '' // Broader classification (e.g., "Europe", "Asia")
  const location_region = creator.locationRegion || '' // Specific location (e.g., "Romania", "El Nido, Philippines")

  // Normalize other fields
  const normalizedPlatform = normalizePlatform(creator.platform)
  const normalizedBrandTags = normalizeBrandTags(creator.brand_tags)
  const normalizedBioLinks = normalizeText(creator.bio_links)
  const normalizedEmail = normalizeText(creator.email)
  const normalizedPastAdPlacements = normalizePastAdPlacements(creator.past_ad_placements)

  return {
    creator_id: creator.id,
    handle: creator.handle,
    display_name: creator.display_name || '',
    bio: creator.bio || '',
    primary_niche: creator.primary_niche || '',
    secondary_niche: creator.secondary_niche || '',
    followers_count: creator.followers_count || 0,
    average_views: creator.average_views || 0,
    engagement_rate: creator.engagement_rate || 0,
    buzz_score: creator.buzz_score || 0,
    hashtags: Array.isArray(creator.hashtags) ? creator.hashtags : [],
    engagement_rate_change: creator.engagement_rate_change || 0,
    followers_change: creator.followers_change || 0,
    average_views_change: creator.average_views_change || 0,
    recent_post_captions: recentCaptions,
    // New normalized filtering metadata
    location,
    location_region,
    platform: normalizedPlatform,
    brand_tags: normalizedBrandTags,
    bio_links: normalizedBioLinks,
    email: normalizedEmail,
    past_ad_placements: normalizedPastAdPlacements
  }
}

/**
 * Insert creator data into creator_index table
 */
async function insertCreatorIndex(creatorData: CreatorIndexData): Promise<void> {
  const { error } = await supabase
    .from('creator_index')
    .insert(creatorData)

  if (error) {
    throw new Error(`Error inserting creator ${creatorData.handle}: ${error.message}`)
  }
}

/**
 * Update existing creator data in creator_index table (for metadata updates)
 */
async function updateCreatorIndex(creatorData: Omit<CreatorIndexData, 'bio_embedding' | 'hashtags_embedding' | 'recent_content_embedding'>): Promise<void> {
  const { error } = await supabase
    .from('creator_index')
    .update(creatorData)
    .eq('creator_id', creatorData.creator_id)

  if (error) {
    throw new Error(`Error updating creator ${creatorData.handle}: ${error.message}`)
  }
}

/**
 * Check if creator already exists in creator_index
 */
async function creatorExists(creatorId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('creator_index')
    .select('id')
    .eq('creator_id', creatorId)
    .limit(1)

  if (error) {
    throw new Error(`Error checking if creator exists: ${error.message}`)
  }

  return data && data.length > 0
}

/**
 * Check if creator has embeddings (for backward compatibility)
 */
async function creatorHasEmbeddings(creatorId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('creator_index')
    .select('bio_embedding')
    .eq('creator_id', creatorId)
    .not('bio_embedding', 'is', null)
    .limit(1)

  if (error) {
    throw new Error(`Error checking creator embeddings: ${error.message}`)
  }

  return data && data.length > 0 && data[0].bio_embedding !== null
}

/**
 * Main function to populate creator_index
 */
async function populateCreatorIndex(limit?: number) {
  try {
    console.log('Starting creator_index population with OpenAI embeddings and metadata...')
    console.log('Using OpenAI text-embedding-3-small model (1536 dimensions)')
    
    // Fetch all creators
    const creators = await fetchCreators(limit)
    
    if (creators.length === 0) {
      console.log('No creators found in creatordata table')
      return
    }

    let processed = 0
    let skipped = 0
    let updated = 0
    let errors = 0

    // Configuration
    const batchSize = 20 // Increased from 5
    const delayBetweenCreators = 50 // Reduced from 200ms
    const delayBetweenBatches = 500 // Reduced from 3000ms
    const maxRetries = 3
    const retryDelay = 1000

    // Process creators in batches to avoid rate limits
    for (let i = 0; i < creators.length; i += batchSize) {
      const batch = creators.slice(i, i + batchSize)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(creators.length / batchSize)} (${batch.length} creators)`)
      
      // Process each creator in the batch
      for (const creator of batch) {
        let retries = 0
        while (retries < maxRetries) {
          try {
            const exists = await creatorExists(creator.id)
            const hasEmbeddings = exists ? await creatorHasEmbeddings(creator.id) : false

            if (exists && hasEmbeddings) {
              // Creator exists with embeddings - only update metadata
              console.log(`Updating metadata for ${creator.handle} (embeddings preserved)...`)
              const preparedData = prepareCreatorData(creator)
              await updateCreatorIndex(preparedData)
              updated++
              break // Exit retry loop for this creator
            } else if (exists && !hasEmbeddings) {
              // Creator exists but no embeddings - generate embeddings
              console.log(`Generating embeddings for existing ${creator.handle}...`)
              const preparedData = prepareCreatorData(creator)
              const embeddings = await generateCreatorEmbeddings(creator)
              const creatorIndexData: CreatorIndexData = {
                ...preparedData,
                bio_embedding: embeddings.bio_embedding,
                hashtags_embedding: embeddings.hashtags_embedding,
                recent_content_embedding: embeddings.recent_content_embedding
              }
              await updateCreatorIndex(creatorIndexData)
              processed++
              break // Exit retry loop for this creator
            } else {
              // New creator - insert with embeddings
              console.log(`Processing new creator ${creator.handle}...`)
              const preparedData = prepareCreatorData(creator)
              const embeddings = await generateCreatorEmbeddings(creator)
              const creatorIndexData: CreatorIndexData = {
                ...preparedData,
                bio_embedding: embeddings.bio_embedding,
                hashtags_embedding: embeddings.hashtags_embedding,
                recent_content_embedding: embeddings.recent_content_embedding
              }
              await insertCreatorIndex(creatorIndexData)
              processed++
              break // Exit retry loop for this creator
            }
          } catch (error) {
            console.error(`✗ Error processing ${creator.handle} (Attempt ${retries + 1}/${maxRetries}):`, error)
            retries++
            if (retries < maxRetries) {
              console.log(`Retrying in ${retryDelay}ms...`)
              await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
          }
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, delayBetweenCreators))
      }

      // Add delay between batches
      if (i + batchSize < creators.length) {
        console.log('Waiting 3 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    console.log('\n=== Population Complete ===')
    console.log(`Total creators: ${creators.length}`)
    console.log(`New creators processed: ${processed}`)
    console.log(`Existing creators updated: ${updated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Errors: ${errors}`)

  } catch (error) {
    console.error('Fatal error during population:', error)
    process.exit(1)
  }
}

/**
 * Clear all data from creator_index table
 */
async function clearCreatorIndex() {
  try {
    console.log('Clearing creator_index table...')
    
    const { error } = await supabase
      .from('creator_index')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      throw new Error(`Error clearing creator_index: ${error.message}`)
    }

    console.log('✓ creator_index table cleared')
  } catch (error) {
    console.error('Error clearing creator_index:', error)
    throw error
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  // Parse limit parameter
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1]) : undefined

  switch (command) {
    case 'clear':
      await clearCreatorIndex()
      break
    case 'populate':
      await populateCreatorIndex(limit)
      break
    case 'reset':
      console.log('Clearing and repopulating creator_index...')
      await clearCreatorIndex()
      await populateCreatorIndex(limit)
      break
    default:
      console.log('Usage:')
      console.log('  npm run populate-creator-index clear    - Clear all data from creator_index')
      console.log('  npm run populate-creator-index populate - Populate creator_index with OpenAI embeddings and metadata')
      console.log('  npm run populate-creator-index reset    - Clear and repopulate creator_index')
      console.log('')
      console.log('Options:')
      console.log('  --limit <number>                       - Limit the number of creators to process (for testing)')
      console.log('')
      console.log('Examples:')
      console.log('  npm run populate-creator-index populate --limit 50    - Process only 50 creators')
      console.log('  npm run populate-creator-index reset --limit 10       - Reset and process only 10 creators')
      console.log('')
      console.log('Environment Variables Required:')
      console.log('  OPENAI_API_KEY - OpenAI API key for embeddings')
      console.log('  NEXT_PUBLIC_SUPABASE_URL - Supabase project URL')
      console.log('  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key')
      console.log('')
      console.log('Features:')
      console.log('  - OpenAI text-embedding-3-small embeddings (1536 dimensions)')
      console.log('  - Metadata normalization (location, platform, brand tags)')
      console.log('  - Backward compatibility (preserves existing embeddings)')
      console.log('  - Batch processing with rate limiting')
      break
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
} 