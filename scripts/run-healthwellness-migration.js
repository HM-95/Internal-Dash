#!/usr/bin/env node

/**
 * Script to run the healthwellness migration
 * This populates the healthwellness table with health/wellness focused creators
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Starting healthwellness migration...');
    
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../database/migrations/migrate_creatordata_to_healthwellness.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Get statistics
    const { data: healthwellnessCount } = await supabase
      .from('healthwellness')
      .select('*', { count: 'exact', head: true });
    
    const { data: creatordataCount } = await supabase
      .from('creatordata')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Migration Statistics:');
    console.log(`   Creators in healthwellness table: ${healthwellnessCount?.length || 0}`);
    console.log(`   Creators in creatordata table: ${creatordataCount?.length || 0}`);
    
    // Check for secondary wellness niches
    const { data: nichesData } = await supabase
      .from('healthwellness')
      .select('secondary_wellness_niche')
      .not('secondary_wellness_niche', 'is', null)
      .limit(10);
    
    console.log('🏷️  Sample secondary wellness niches:');
    nichesData?.forEach(creator => {
      console.log(`   - ${creator.secondary_wellness_niche}`);
    });
    
    console.log('🎉 Healthwellness migration completed successfully!');
    console.log('   The platform should now show health/wellness niches instead of crypto/finance niches.');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
