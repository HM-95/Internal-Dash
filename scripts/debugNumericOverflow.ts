#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { generateCreatorEmbeddings } from '../app/lib/ai/embeddings'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  recent_post_1: { caption: string } | null
  recent_post_2: { caption: string } | null
  recent_post_3: { caption: string } | null
  location: string
  locationRegion: string
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
  location: string
  location_region: string
  platform: string
  brand_tags: string
  bio_links: string
  email: string
  past_ad_placements: string[]
  bio_embedding: number[]
  hashtags_embedding: number[]
  recent_content_embedding: number[]
}

// Copy the normalization functions from the main script
function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  return text.trim().toLowerCase()
}

function normalizeLocation(location: string | null | undefined): { location: string; location_region: string } {
  if (!location) return { location: '', location_region: '' }
  
  const normalized = location.trim()
  if (!normalized) return { location: '', location_region: '' }

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

  for (const [key, value] of Object.entries(regionMap)) {
    if (lowerLocation.includes(key)) {
      region = value
      break
    }
  }

  return { location: normalized, location_region: region }
}

function normalizePlatform(platform: string | null | undefined): string {
  if (!platform) return ''
  
  const normalized = platform.trim().toLowerCase()
  
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

function normalizeBrandTags(brandTags: string | null | undefined): string {
  if (!brandTags) return ''
  
  return brandTags
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s,]/g, '')
}

function normalizePastAdPlacements(placements: string[] | null | undefined): string[] {
  if (!placements || !Array.isArray(placements)) return []
  
  return placements
    .filter(placement => placement && placement.trim())
    .map(placement => placement.trim().toLowerCase())
    .filter((placement, index, arr) => arr.indexOf(placement) === index)
}

function prepareCreatorData(creator: CreatorData): Omit<CreatorIndexData, 'bio_embedding' | 'hashtags_embedding' | 'recent_content_embedding'> {
  const recentCaptions = [
    creator.recent_post_1?.caption || '',
    creator.recent_post_2?.caption || '',
    creator.recent_post_3?.caption || ''
  ].filter(caption => caption && typeof caption === 'string' && caption.trim().length > 0).join(' ')

  const { location, location_region } = normalizeLocation(creator.locationRegion || creator.location)
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
    location,
    location_region,
    platform: normalizedPlatform,
    brand_tags: normalizedBrandTags,
    bio_links: normalizedBioLinks,
    email: normalizedEmail,
    past_ad_placements: normalizedPastAdPlacements
  }
}

async function debugNumericOverflow() {
  try {
    console.log('Debugging numeric field overflow...')
    
    // Fetch one creator to test
    const { data: creators, error } = await supabase
      .from('creatordata')
      .select('*')
      .limit(1)

    if (error) {
      throw new Error(`Error fetching creators: ${error.message}`)
    }

    if (!creators || creators.length === 0) {
      console.log('No creators found')
      return
    }

    const creator = creators[0]
    console.log(`Testing with creator: ${creator.handle}`)

    // Prepare the data
    const preparedData = prepareCreatorData(creator)
    
    // Generate embeddings
    console.log('Generating embeddings...')
    const embeddings = await generateCreatorEmbeddings(creator)
    
    const creatorIndexData: CreatorIndexData = {
      ...preparedData,
      bio_embedding: embeddings.bio_embedding,
      hashtags_embedding: embeddings.hashtags_embedding,
      recent_content_embedding: embeddings.recent_content_embedding
    }

    // Log all numeric fields to identify the issue
    console.log('\n=== NUMERIC FIELD VALUES ===')
    console.log(`creator_id: ${creatorIndexData.creator_id} (type: ${typeof creatorIndexData.creator_id})`)
    console.log(`followers_count: ${creatorIndexData.followers_count} (type: ${typeof creatorIndexData.followers_count})`)
    console.log(`average_views: ${creatorIndexData.average_views} (type: ${typeof creatorIndexData.average_views})`)
    console.log(`engagement_rate: ${creatorIndexData.engagement_rate} (type: ${typeof creatorIndexData.engagement_rate})`)
    console.log(`buzz_score: ${creatorIndexData.buzz_score} (type: ${typeof creatorIndexData.buzz_score})`)
    console.log(`engagement_rate_change: ${creatorIndexData.engagement_rate_change} (type: ${typeof creatorIndexData.engagement_rate_change})`)
    console.log(`followers_change: ${creatorIndexData.followers_change} (type: ${typeof creatorIndexData.followers_change})`)
    console.log(`average_views_change: ${creatorIndexData.average_views_change} (type: ${typeof creatorIndexData.average_views_change})`)

    // Check for very large numbers
    const largeNumbers = [
      { field: 'creator_id', value: creatorIndexData.creator_id },
      { field: 'followers_count', value: creatorIndexData.followers_count },
      { field: 'average_views', value: creatorIndexData.average_views },
      { field: 'engagement_rate', value: creatorIndexData.engagement_rate },
      { field: 'buzz_score', value: creatorIndexData.buzz_score },
      { field: 'engagement_rate_change', value: creatorIndexData.engagement_rate_change },
      { field: 'followers_change', value: creatorIndexData.followers_change },
      { field: 'average_views_change', value: creatorIndexData.average_views_change }
    ]

    console.log('\n=== LARGE NUMBER ANALYSIS ===')
    largeNumbers.forEach(({ field, value }) => {
      if (value > 2147483647) { // Max INT32
        console.log(`⚠️  ${field}: ${value} (exceeds INT32 max: 2147483647)`)
      } else if (value > 999999999) { // Very large number
        console.log(`⚠️  ${field}: ${value} (very large number)`)
      } else {
        console.log(`✅ ${field}: ${value}`)
      }
    })

    // Try to insert and catch the specific error
    console.log('\n=== ATTEMPTING INSERT ===')
    try {
      const { error: insertError } = await supabase
        .from('creator_index')
        .insert(creatorIndexData)

      if (insertError) {
        console.log('❌ Insert failed with error:', insertError)
        console.log('Error details:', JSON.stringify(insertError, null, 2))
      } else {
        console.log('✅ Insert successful!')
      }
    } catch (error) {
      console.log('❌ Insert failed with exception:', error)
    }

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the debug
debugNumericOverflow().catch(console.error) 