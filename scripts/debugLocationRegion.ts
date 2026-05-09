#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    'las vegas': 'Southwest',
    // Add more international locations
    'romania': 'Europe',
    'philippines': 'Asia',
    'el nido': 'Asia',
    'palawan': 'Asia',
    'hong kong': 'Asia',
    'singapore': 'Asia',
    'london': 'Europe',
    'paris': 'Europe',
    'berlin': 'Europe',
    'madrid': 'Europe',
    'rome': 'Europe',
    'amsterdam': 'Europe',
    'toronto': 'Canada',
    'vancouver': 'Canada',
    'montreal': 'Canada',
    'sydney': 'Australia',
    'melbourne': 'Australia',
    'brisbane': 'Australia',
    'auckland': 'New Zealand',
    'mexico city': 'Mexico',
    'sao paulo': 'Brazil',
    'rio de janeiro': 'Brazil',
    'buenos aires': 'Argentina',
    'santiago': 'Chile',
    'lima': 'Peru',
    'bogota': 'Colombia',
    'caracas': 'Venezuela',
    'panama city': 'Panama',
    'san jose': 'Costa Rica',
    'guatemala city': 'Guatemala',
    'tegucigalpa': 'Honduras',
    'managua': 'Nicaragua',
    'san salvador': 'El Salvador',
    'belize city': 'Belize'
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

async function debugLocationRegion() {
  try {
    console.log('Debugging location region extraction...')
    
    // Check what's in the creator_index table
    const { data: creatorIndexData, error: indexError } = await supabase
      .from('creator_index')
      .select('handle, location, location_region')
      .limit(5)

    if (indexError) {
      console.error('Error fetching creator_index data:', indexError)
      return
    }

    console.log('\n=== CURRENT CREATOR_INDEX DATA ===')
    creatorIndexData?.forEach(creator => {
      console.log(`${creator.handle}:`)
      console.log(`  location: "${creator.location}"`)
      console.log(`  location_region: "${creator.location_region}"`)
    })

    // Check what's in the creatordata table
    const { data: creatorData, error: dataError } = await supabase
      .from('creatordata')
      .select('handle, location, locationRegion')
      .limit(5)

    if (dataError) {
      console.error('Error fetching creatordata:', dataError)
      return
    }

    console.log('\n=== SOURCE CREATORDATA ===')
    creatorData?.forEach(creator => {
      console.log(`${creator.handle}:`)
      console.log(`  location: "${creator.location}"`)
      console.log(`  locationRegion: "${creator.locationRegion}"`)
      
      // Test our normalization function
      const { location, location_region } = normalizeLocation(creator.locationRegion || creator.location)
      console.log(`  Normalized location: "${location}"`)
      console.log(`  Extracted region: "${location_region}"`)
      console.log('')
    })

    // Check if there are any creators with location data
    const { count, error: countError } = await supabase
      .from('creatordata')
      .select('location, locationRegion', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting location data:', countError)
    } else {
      console.log(`\nTotal creators in creatordata: ${count}`)
    }

    // Check for non-null location data
    const { data: locationData, error: locationError } = await supabase
      .from('creatordata')
      .select('handle, location, locationRegion')
      .not('location', 'is', null)
      .limit(3)

    if (locationError) {
      console.error('Error fetching location data:', locationError)
    } else {
      console.log('\n=== CREATORS WITH LOCATION DATA ===')
      locationData?.forEach(creator => {
        console.log(`${creator.handle}:`)
        console.log(`  location: "${creator.location}"`)
        console.log(`  locationRegion: "${creator.locationRegion}"`)
        
        const { location, location_region } = normalizeLocation(creator.locationRegion || creator.location)
        console.log(`  Normalized: "${location}"`)
        console.log(`  Region: "${location_region}"`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the debug
debugLocationRegion().catch(console.error) 