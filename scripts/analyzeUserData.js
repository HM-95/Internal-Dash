// Analyze user data to decide: migrate vs delete all
// Run with: node scripts/analyzeUserData.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeUserData() {
  console.log('📊 ANALYZING USER DATA FOR DECISION');
  console.log('=====================================\n');

  try {
    // Get all users
    const { data: allUsers, error } = await supabase
      .from('user_preferences')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📈 TOTAL USERS: ${allUsers.length}\n`);

    // Analyze subscription plans
    const planCounts = {
      free: allUsers.filter(u => u.subscription_plan === 'free').length,
      starter: allUsers.filter(u => u.subscription_plan === 'starter').length,
      pro: allUsers.filter(u => u.subscription_plan === 'pro').length,
      agency: allUsers.filter(u => u.subscription_plan === 'agency').length
    };

    console.log('💳 SUBSCRIPTION PLAN BREAKDOWN:');
    console.log(`   - Free: ${planCounts.free}`);
    console.log(`   - Starter: ${planCounts.starter}`);
    console.log(`   - Pro: ${planCounts.pro}`);
    console.log(`   - Agency: ${planCounts.agency}\n`);

    // Check Stripe data
    const usersWithStripeCustomer = allUsers.filter(u => u.stripe_customer_id).length;
    const usersWithStripeSubscription = allUsers.filter(u => u.stripe_subscription_id).length;

    console.log('🏪 STRIPE DATA:');
    console.log(`   - Users with Stripe Customer ID: ${usersWithStripeCustomer}`);
    console.log(`   - Users with Stripe Subscription ID: ${usersWithStripeSubscription}\n`);

    // Check onboarding data
    const usersWithNiches = allUsers.filter(u => u.selected_niches && u.selected_niches.length > 0).length;
    const usersWithAudience = allUsers.filter(u => u.target_audience_description && u.target_audience_description.trim()).length;
    const usersCompletedOnboarding = allUsers.filter(u => u.onboarding_completed).length;

    console.log('🎯 ONBOARDING DATA:');
    console.log(`   - Users with selected niches: ${usersWithNiches}`);
    console.log(`   - Users with target audience: ${usersWithAudience}`);
    console.log(`   - Users completed onboarding: ${usersCompletedOnboarding}\n`);

    // Identify problematic users
    const problematicUsers = allUsers.filter(u => 
      u.subscription_plan !== 'free' && !u.stripe_subscription_id
    );

    console.log('⚠️  PROBLEMATIC USERS (paid plan without Stripe subscription):');
    console.log(`   - Count: ${problematicUsers.length}`);
    if (problematicUsers.length > 0 && problematicUsers.length <= 10) {
      problematicUsers.forEach(user => {
        console.log(`   - ${user.user_id.substring(0, 8)}... (Plan: ${user.subscription_plan})`);
      });
    }
    console.log('');

    // Users with valuable data
    const usersWithData = allUsers.filter(u => 
      (u.selected_niches && u.selected_niches.length > 0) ||
      (u.target_audience_description && u.target_audience_description.trim()) ||
      (u.stripe_customer_id) ||
      (u.stripe_subscription_id)
    );

    console.log('💎 USERS WITH VALUABLE DATA:');
    console.log(`   - Count: ${usersWithData.length}`);
    console.log(`   - Percentage: ${((usersWithData.length / allUsers.length) * 100).toFixed(1)}%\n`);

    // RECOMMENDATION
    console.log('🎯 RECOMMENDATION:');
    console.log('=====================================');

    if (allUsers.length === 0) {
      console.log('✅ No users to worry about - start fresh!');
    } else if (problematicUsers.length === allUsers.length && usersWithData.length === 0) {
      console.log('🗑️  RECOMMEND: DELETE ALL USERS');
      console.log('   - All users have incorrect subscription plans');
      console.log('   - No valuable data would be lost');
      console.log('   - Clean slate is better than migration');
    } else if (problematicUsers.length === allUsers.length && usersWithData.length > 0) {
      console.log('🔧 RECOMMEND: RUN MIGRATION');
      console.log('   - All users have incorrect subscription plans');
      console.log('   - But some have valuable onboarding data');
      console.log('   - Migration preserves their data');
    } else if (usersWithStripeSubscription > 0) {
      console.log('🔧 RECOMMEND: RUN MIGRATION');
      console.log('   - Some users have legitimate Stripe subscriptions');
      console.log('   - Cannot delete without losing paid customers');
      console.log('   - Migration will fix problematic users only');
    } else {
      console.log('🔧 RECOMMEND: RUN MIGRATION (safer option)');
      console.log('   - Preserves any valuable data');
      console.log('   - Fixes subscription plan issues');
      console.log('   - No risk of losing legitimate users');
    }

    console.log('\n📋 NEXT STEPS:');
    if (problematicUsers.length === allUsers.length && usersWithData.length === 0) {
      console.log('1. Run: node scripts/deleteAllUsers.js');
      console.log('2. Test new user registration flow');
      console.log('3. Test payment flow');
    } else {
      console.log('1. Run: node scripts/runMigration.js');
      console.log('2. Verify problematic users are fixed');
      console.log('3. Test payment flow with existing users');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the analysis
analyzeUserData().catch(console.error);
