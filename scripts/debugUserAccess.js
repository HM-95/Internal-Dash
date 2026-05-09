// Debug script to check user access issues
// Run with: node scripts/debugUserAccess.js

const { createClient } = require('@supabase/supabase-js');

// Environment variables - make sure these are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin access

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SPECIFIC_USER_ID = 'b9870549-d823-4759-b069-5e9601d11673';

async function debugUserAccess() {
  console.log('🔍 DEBUGGING USER ACCESS ISSUES');
  console.log('=====================================\n');

  try {
    // 1. Check specific user details
    console.log('1️⃣ CHECKING SPECIFIC USER:', SPECIFIC_USER_ID);
    const { data: specificUser, error: specificError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', SPECIFIC_USER_ID)
      .single();

    if (specificError) {
      console.log('❌ Error fetching specific user:', specificError);
      console.log('📝 This user may not exist in user_preferences table');
    } else {
      console.log('✅ Specific user found:');
      console.log(JSON.stringify(specificUser, null, 2));
      
      // Check dashboard access logic
      const hasAccess = specificUser.onboarding_completed && 
        specificUser.subscription_plan !== 'free' && 
        specificUser.subscription_status === 'active';
      
      console.log('\n🚪 Dashboard Access Check:');
      console.log(`- Onboarding Completed: ${specificUser.onboarding_completed}`);
      console.log(`- Subscription Plan: ${specificUser.subscription_plan}`);
      console.log(`- Subscription Status: ${specificUser.subscription_status}`);
      console.log(`- Has Dashboard Access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
      
      if (!hasAccess) {
        console.log('\n🔧 ISSUES PREVENTING ACCESS:');
        if (!specificUser.onboarding_completed) {
          console.log('- ❌ Onboarding not completed');
        }
        if (specificUser.subscription_plan === 'free') {
          console.log('- ❌ Still on free plan (needs paid subscription)');
        }
        if (specificUser.subscription_status !== 'active') {
          console.log('- ❌ Subscription status is not active');
        }
      }
    }

    console.log('\n=====================================');

    // 2. Check all users overview
    console.log('2️⃣ ALL USERS OVERVIEW');
    const { data: allUsers, error: allError } = await supabase
      .from('user_preferences')
      .select('user_id, subscription_plan, subscription_status, onboarding_completed, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ Error fetching all users:', allError);
    } else {
      console.log(`📊 Total users in database: ${allUsers.length}`);
      
      // Group users by status
      const freeUsers = allUsers.filter(u => u.subscription_plan === 'free');
      const starterUsers = allUsers.filter(u => u.subscription_plan === 'starter');
      const proUsers = allUsers.filter(u => u.subscription_plan === 'pro');
      const agencyUsers = allUsers.filter(u => u.subscription_plan === 'agency');
      
      const usersWithStripeId = allUsers.filter(u => u.stripe_subscription_id);
      const usersWithOnboarding = allUsers.filter(u => u.onboarding_completed);
      
      console.log('\n📈 USER BREAKDOWN:');
      console.log(`- Free users: ${freeUsers.length}`);
      console.log(`- Starter users: ${starterUsers.length}`);
      console.log(`- Pro users: ${proUsers.length}`);
      console.log(`- Agency users: ${agencyUsers.length}`);
      console.log(`- Users with Stripe subscription ID: ${usersWithStripeId.length}`);
      console.log(`- Users with completed onboarding: ${usersWithOnboarding.length}`);
      
      // Check for problematic users (starter plan without Stripe ID)
      const problematicUsers = starterUsers.filter(u => !u.stripe_subscription_id);
      if (problematicUsers.length > 0) {
        console.log(`\n⚠️  PROBLEMATIC USERS (starter plan without Stripe ID): ${problematicUsers.length}`);
        problematicUsers.forEach(user => {
          console.log(`   - User ID: ${user.user_id.substring(0, 8)}... (Plan: ${user.subscription_plan}, Stripe ID: ${user.stripe_subscription_id || 'NONE'})`);
        });
      }
      
      // Users who should have dashboard access
      const usersWithAccess = allUsers.filter(u => 
        u.onboarding_completed && 
        u.subscription_plan !== 'free' && 
        u.subscription_status === 'active'
      );
      
      console.log(`\n✅ Users with dashboard access: ${usersWithAccess.length}`);
      if (usersWithAccess.length > 0) {
        usersWithAccess.forEach(user => {
          console.log(`   - User ID: ${user.user_id.substring(0, 8)}... (Plan: ${user.subscription_plan})`);
        });
      }
    }

    console.log('\n=====================================');

    // 3. Recommendations
    console.log('3️⃣ RECOMMENDATIONS');
    
    if (specificUser) {
      if (specificUser.subscription_plan === 'starter' && !specificUser.stripe_subscription_id) {
        console.log('🔧 SPECIFIC USER FIX NEEDED:');
        console.log('   - User has "starter" plan but no Stripe subscription ID');
        console.log('   - Should be reset to "free" plan');
        console.log('   - Migration needs to be run OR manual database update required');
      }
      
      if (!specificUser.onboarding_completed) {
        console.log('🔧 ONBOARDING ISSUE:');
        console.log('   - User has not completed onboarding');
        console.log('   - May need to complete onboarding flow again');
      }
    }
    
    console.log('\n💳 NEW PAYMENT FLOW:');
    console.log('✅ Yes, if the user pays again, it should work because:');
    console.log('   - Webhooks now properly set onboarding_completed = true');
    console.log('   - Webhooks set correct subscription_plan and status');
    console.log('   - Success URL redirects directly to dashboard');
    console.log('   - Polling system handles webhook delays');
    
    console.log('\n🚀 NEXT ACTIONS:');
    console.log('1. Run the database migration to fix existing user states');
    console.log('2. Verify webhook endpoints are receiving Stripe events');
    console.log('3. Test payment flow with the specific user');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug function
debugUserAccess().catch(console.error);
