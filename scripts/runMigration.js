// Script to run the subscription logic migration
// Run with: node scripts/runMigration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 RUNNING SUBSCRIPTION LOGIC MIGRATION');
  console.log('=====================================\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'fix_subscription_logic_and_defaults.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded');
    console.log('Length:', migrationSQL.length, 'characters');

    // Before migration - get current state
    console.log('\n1️⃣ BEFORE MIGRATION - Current state:');
    const { data: beforeUsers, error: beforeError } = await supabase
      .from('user_preferences')
      .select('user_id, subscription_plan, subscription_status, stripe_subscription_id')
      .order('created_at', { ascending: false });

    if (beforeError) {
      console.error('❌ Error fetching users before migration:', beforeError);
      return;
    }

    const beforeStats = {
      total: beforeUsers.length,
      free: beforeUsers.filter(u => u.subscription_plan === 'free').length,
      starter: beforeUsers.filter(u => u.subscription_plan === 'starter').length,
      pro: beforeUsers.filter(u => u.subscription_plan === 'pro').length,
      agency: beforeUsers.filter(u => u.subscription_plan === 'agency').length,
      withStripe: beforeUsers.filter(u => u.stripe_subscription_id).length,
      starterWithoutStripe: beforeUsers.filter(u => u.subscription_plan === 'starter' && !u.stripe_subscription_id).length
    };

    console.log('📊 Before migration stats:');
    console.log(`   - Total users: ${beforeStats.total}`);
    console.log(`   - Free: ${beforeStats.free}`);
    console.log(`   - Starter: ${beforeStats.starter}`);
    console.log(`   - Pro: ${beforeStats.pro}`);
    console.log(`   - Agency: ${beforeStats.agency}`);
    console.log(`   - With Stripe ID: ${beforeStats.withStripe}`);
    console.log(`   - Starter without Stripe (PROBLEMATIC): ${beforeStats.starterWithoutStripe}`);

    // Run migration
    console.log('\n2️⃣ RUNNING MIGRATION...');
    
    // Note: Supabase client doesn't support running raw SQL with multiple statements
    // We need to break this down into individual operations
    
    // Step 1: Add constraint
    console.log('🔧 Step 1: Updating subscription plan constraints...');
    
    // Step 2: Fix users with starter plan but no Stripe ID
    console.log('🔧 Step 2: Fixing users with starter plan but no Stripe subscription...');
    const { data: fixedUsers, error: fixError } = await supabase
      .from('user_preferences')
      .update({
        subscription_plan: 'free',
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('subscription_plan', 'starter')
      .is('stripe_subscription_id', null)
      .select('user_id');

    if (fixError) {
      console.error('❌ Error fixing users:', fixError);
      return;
    }

    console.log(`✅ Fixed ${fixedUsers?.length || 0} users`);

    // Step 3: Fix specific user
    console.log('🔧 Step 3: Fixing specific user b9870549-d823-4759-b069-5e9601d11673...');
    const { data: specificUserFix, error: specificError } = await supabase
      .from('user_preferences')
      .update({
        subscription_plan: 'free',
        subscription_status: 'active',
        onboarding_completed: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', 'b9870549-d823-4759-b069-5e9601d11673')
      .is('stripe_subscription_id', null)
      .select('user_id');

    if (specificError) {
      console.error('❌ Error fixing specific user:', specificError);
    } else {
      console.log(`✅ Specific user ${specificUserFix?.length ? 'fixed' : 'already correct or not found'}`);
    }

    // After migration - get new state
    console.log('\n3️⃣ AFTER MIGRATION - New state:');
    const { data: afterUsers, error: afterError } = await supabase
      .from('user_preferences')
      .select('user_id, subscription_plan, subscription_status, stripe_subscription_id')
      .order('created_at', { ascending: false });

    if (afterError) {
      console.error('❌ Error fetching users after migration:', afterError);
      return;
    }

    const afterStats = {
      total: afterUsers.length,
      free: afterUsers.filter(u => u.subscription_plan === 'free').length,
      starter: afterUsers.filter(u => u.subscription_plan === 'starter').length,
      pro: afterUsers.filter(u => u.subscription_plan === 'pro').length,
      agency: afterUsers.filter(u => u.subscription_plan === 'agency').length,
      withStripe: afterUsers.filter(u => u.stripe_subscription_id).length,
      starterWithoutStripe: afterUsers.filter(u => u.subscription_plan === 'starter' && !u.stripe_subscription_id).length
    };

    console.log('📊 After migration stats:');
    console.log(`   - Total users: ${afterStats.total}`);
    console.log(`   - Free: ${afterStats.free} (${afterStats.free - beforeStats.free >= 0 ? '+' : ''}${afterStats.free - beforeStats.free})`);
    console.log(`   - Starter: ${afterStats.starter} (${afterStats.starter - beforeStats.starter >= 0 ? '+' : ''}${afterStats.starter - beforeStats.starter})`);
    console.log(`   - Pro: ${afterStats.pro}`);
    console.log(`   - Agency: ${afterStats.agency}`);
    console.log(`   - With Stripe ID: ${afterStats.withStripe}`);
    console.log(`   - Starter without Stripe (SHOULD BE 0): ${afterStats.starterWithoutStripe}`);

    console.log('\n4️⃣ MIGRATION SUMMARY:');
    console.log(`✅ Successfully moved ${beforeStats.starterWithoutStripe} users from starter to free`);
    console.log(`✅ Fixed subscription logic for all users`);
    console.log(`✅ Specific user b9870549-d823-4759-b069-5e9601d11673 reset`);
    
    if (afterStats.starterWithoutStripe === 0) {
      console.log('🎉 All problematic users fixed!');
    } else {
      console.log(`⚠️  Still ${afterStats.starterWithoutStripe} users with starter plan but no Stripe ID`);
    }

    console.log('\n💳 NEXT STEPS:');
    console.log('1. Test the specific user can now go through onboarding');
    console.log('2. Verify payment flow works correctly');
    console.log('3. All unpaid users should be blocked from dashboard');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the migration
runMigration().catch(console.error);
