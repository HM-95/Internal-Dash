#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCreatorIndexSchema() {
  try {
    console.log('Checking creator_index table schema...')
    
    // Check if table exists and get its structure
    const { data, error } = await supabase
      .from('creator_index')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error accessing creator_index table:', error)
      return
    }

    console.log('✅ creator_index table exists and is accessible')
    
    // Get table info
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'creator_index' })
      .single()

    if (tableError) {
      console.log('Could not get detailed table info, but table exists')
    } else {
      console.log('Table info:', tableInfo)
    }

    // Check if table is empty
    const { count, error: countError } = await supabase
      .from('creator_index')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting rows:', countError)
    } else {
      console.log(`📊 creator_index table has ${count} rows`)
    }

    // Check a sample creator from creatordata to see the data structure
    const { data: sampleCreator, error: sampleError } = await supabase
      .from('creatordata')
      .select('*')
      .limit(1)
      .single()

    if (sampleError) {
      console.error('Error fetching sample creator:', sampleError)
    } else {
      console.log('📋 Sample creator data structure:')
      console.log(JSON.stringify(sampleCreator, null, 2))
    }

  } catch (error) {
    console.error('Fatal error:', error)
  }
}

// Run the check
checkCreatorIndexSchema().catch(console.error) 