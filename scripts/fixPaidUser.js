// Emergency fix for paid user 0ce45e0d-a4ba-4383-8b47-3c46b150370d
// Run with: node scripts/fixPaidUser.js

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

const PAID_USER_ID = '0ce45e0d-a4ba-4383-8b47-3c46b150370d';

async function fixPaidUser() {
  console.log('🚨 EMERGENCY FIX FOR PAID USER');
  console.log('=====================================');
  console.log(`User ID: ${PAID_USER_ID}`);
  console.log('Issue: User paid for Pro plan but stuck on pricing page\n');

  try {
    // 1. Check current state
    console.log('1️⃣ Current user state:');
    const { data: beforeUser, error: beforeError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', PAID_USER_ID)
      .single();

    if (beforeError) {
      console.error('❌ Error fetching user:', beforeError);
      return;
    }

    console.log('Before fix:');
    console.log(`   - subscription_plan: ${beforeUser.subscription_plan}`);
    console.log(`   - subscription_status: ${beforeUser.subscription_status}`);
    console.log(`   - onboarding_completed: ${beforeUser.onboarding_completed}`);
    console.log(`   - stripe_customer_id: ${beforeUser.stripe_customer_id || 'MISSING'}`);
    console.log(`   - stripe_subscription_id: ${beforeUser.stripe_subscription_id || 'MISSING'}`);

    // 2. Apply emergency fix
    console.log('\n2️⃣ Applying emergency fix...');
    
    const { data: fixedUser, error: fixError } = await supabase
      .from('user_preferences')
      .update({
        subscription_plan: 'pro',  // Correct plan they paid for
        subscription_status: 'active',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', PAID_USER_ID)
      .select('*')
      .single();

    if (fixError) {
      console.error('❌ Error fixing user:', fixError);
      return;
    }

    console.log('✅ User fixed successfully!');
    console.log('\nAfter fix:');
    console.log(`   - subscription_plan: ${fixedUser.subscription_plan}`);
    console.log(`   - subscription_status: ${fixedUser.subscription_status}`);
    console.log(`   - onboarding_completed: ${fixedUser.onboarding_completed}`);
    console.log(`   - stripe_customer_id: ${fixedUser.stripe_customer_id || 'STILL MISSING'}`);
    console.log(`   - stripe_subscription_id: ${fixedUser.stripe_subscription_id || 'STILL MISSING'}`);

    // 3. Verify dashboard access
    console.log('\n3️⃣ Dashboard access verification:');
    const hasAccess = fixedUser.onboarding_completed && 
      fixedUser.subscription_plan !== 'free' && 
      fixedUser.subscription_status === 'active';
    
    console.log(`✅ User now has dashboard access: ${hasAccess ? 'YES' : 'NO'}`);

    if (hasAccess) {
      console.log('\n🎉 SUCCESS: User can now access the dashboard!');
      console.log('   - User should refresh their browser');
      console.log('   - They should be automatically redirected to /dashboard/discover');
      console.log('   - Their Pro plan features should be active');
    } else {
      console.log('\n❌ STILL BLOCKED: Additional issues prevent access');
    }

    // 4. Note about missing Stripe IDs
    if (!fixedUser.stripe_customer_id || !fixedUser.stripe_subscription_id) {
      console.log('\n⚠️  WARNING: Stripe IDs still missing');
      console.log('   This means webhooks are not working correctly.');
      console.log('   User has dashboard access but Stripe integration needs investigation.');
      console.log('   Future billing operations may fail.');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Tell user to refresh browser - they should now have dashboard access');
    console.log('2. Debug webhook issues to prevent this happening to other users');
    console.log('3. Check Stripe dashboard for webhook delivery status');
    console.log('4. Investigate checkout session metadata');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix function
fixPaidUser().catch(console.error);
