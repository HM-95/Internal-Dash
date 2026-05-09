const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runTrialMigration() {
  console.log('🚀 Starting trial fields migration...');
  
  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env file');
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📊 Reading migration file...');
    
    // Read the migration file
    const fs = require('fs');
    const migrationPath = './database/migrations/add_trial_fields_to_user_preferences.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded successfully');
    
    console.log('🔧 Executing migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 New columns added:');
    console.log('   - trial_start_date (timestamp with time zone)');
    console.log('   - trial_end_date (timestamp with time zone)');
    console.log('   - subscription_status updated to include "trialing"');
    console.log('\n🎉 Your database is now ready for 7-day free trials!');
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  }
}

// Run the migration
runTrialMigration();
