const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSubscriptionStatuses() {
  console.log('🔍 Checking current subscription statuses in database...');
  
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
    console.log('📊 Querying user_preferences table...');
    
    // Get all unique subscription statuses and their counts
    const { data: statusCounts, error: countError } = await supabase
      .from('user_preferences')
      .select('subscription_status')
      .not('subscription_status', 'is', null);
    
    if (countError) {
      console.error('❌ Error querying subscription statuses:', countError);
      return;
    }
    
    // Count occurrences of each status
    const statusMap = {};
    statusCounts.forEach(row => {
      const status = row.subscription_status;
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    console.log('\n📋 Current subscription statuses in database:');
    console.log('==========================================');
    
    Object.entries(statusMap).forEach(([status, count]) => {
      const isValid = ['free', 'active', 'cancelled', 'past_due', 'trialing'].includes(status);
      const icon = isValid ? '✅' : '❌';
      console.log(`${icon} ${status}: ${count} users`);
    });
    
    // Check for invalid statuses
    const invalidStatuses = Object.keys(statusMap).filter(
      status => !['free', 'active', 'cancelled', 'past_due', 'trialing'].includes(status)
    );
    
    if (invalidStatuses.length > 0) {
      console.log('\n⚠️  INVALID STATUSES FOUND:');
      console.log('==========================');
      invalidStatuses.forEach(status => {
        console.log(`❌ ${status}: ${statusMap[status]} users`);
      });
      console.log('\n💡 These will be automatically fixed to "free" during migration');
    } else {
      console.log('\n✅ All subscription statuses are valid!');
    }
    
    // Check for null values
    const { data: nullCount, error: nullError } = await supabase
      .from('user_preferences')
      .select('id')
      .is('subscription_status', null);
    
    if (nullError) {
      console.error('❌ Error checking null statuses:', nullError);
      return;
    }
    
    if (nullCount && nullCount.length > 0) {
      console.log(`\n⚠️  Found ${nullCount.length} users with NULL subscription_status`);
      console.log('💡 These will be automatically set to "free" during migration');
    }
    
    console.log('\n🚀 Ready to run migration!');
    
  } catch (error) {
    console.error('❌ Error checking subscription statuses:', error);
  }
}

// Run the check
checkSubscriptionStatuses();
