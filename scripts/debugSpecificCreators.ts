#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSpecificCreators() {
  try {
    console.log('Debugging specific creators location data...')
    
    // Check specific creators that were just updated
    const creatorsToCheck = ['cryptotv_io', 'moneygameproject', 'thantaicrypto39']
    
    for (const handle of creatorsToCheck) {
      console.log(`\n=== ${handle} ===`)
      
      // Get data from creatordata
      const { data: creatorData, error: dataError } = await supabase
        .from('creatordata')
        .select('handle, location, locationRegion')
        .eq('handle', handle)
        .single()

      if (dataError) {
        console.error(`Error fetching ${handle}:`, dataError)
        continue
      }

      console.log('Source data from creatordata:')
      console.log(`  location: "${creatorData.location}"`)
      console.log(`  locationRegion: "${creatorData.locationRegion}"`)

      // Get data from creator_index
      const { data: indexData, error: indexError } = await supabase
        .from('creator_index')
        .select('handle, location, location_region')
        .eq('handle', handle)
        .single()

      if (indexError) {
        console.error(`Error fetching ${handle} from creator_index:`, indexError)
        continue
      }

      console.log('Stored data in creator_index:')
      console.log(`  location: "${indexData.location}"`)
      console.log(`  location_region: "${indexData.location_region}"`)
    }

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the debug
debugSpecificCreators().catch(console.error) 