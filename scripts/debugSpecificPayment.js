// Debug specific payment failure for user 0ce45e0d-a4ba-4383-8b47-3c46b150370d
// Run with: node scripts/debugSpecificPayment.js

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

async function debugSpecificPayment() {
  console.log('🔍 DEBUGGING SPECIFIC PAYMENT FAILURE');
  console.log('=====================================');
  console.log(`User ID: ${PAID_USER_ID}`);
  console.log('Expected: Pro plan, dashboard access');
  console.log('Actual: Starter plan, stuck on pricing\n');

  try {
    // 1. Check current user state
    console.log('1️⃣ CURRENT USER STATE:');
    const { data: user, error: userError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', PAID_USER_ID)
      .single();

    if (userError) {
      console.log('❌ Error fetching user:', userError);
      return;
    }

    console.log('📊 User data:');
    console.log(JSON.stringify(user, null, 2));

    // 2. Analyze the problems
    console.log('\n2️⃣ PROBLEM ANALYSIS:');
    
    const issues = [];
    
    if (user.subscription_plan !== 'pro') {
      issues.push(`❌ Wrong plan: Got "${user.subscription_plan}", expected "pro"`);
    }
    
    if (!user.stripe_customer_id) {
      issues.push('❌ Missing stripe_customer_id (checkout session issue)');
    }
    
    if (!user.stripe_subscription_id) {
      issues.push('❌ Missing stripe_subscription_id (webhook issue)');
    }
    
    if (!user.onboarding_completed) {
      issues.push('❌ onboarding_completed still false (webhook issue)');
    }
    
    if (user.subscription_status !== 'active') {
      issues.push(`❌ Wrong status: Got "${user.subscription_status}", expected "active"`);
    }

    console.log(`Found ${issues.length} issues:`);
    issues.forEach(issue => console.log(`   ${issue}`));

    // 3. Check dashboard access logic
    console.log('\n3️⃣ DASHBOARD ACCESS CHECK:');
    const hasAccess = user.onboarding_completed && 
      user.subscription_plan !== 'free' && 
      user.subscription_status === 'active';
    
    console.log(`Should have dashboard access: ${hasAccess ? '✅ YES' : '❌ NO'}`);
    
    if (!hasAccess) {
      console.log('🚪 Access denied because:');
      if (!user.onboarding_completed) {
        console.log('   - onboarding_completed is false');
      }
      if (user.subscription_plan === 'free') {
        console.log('   - subscription_plan is still "free"');
      }
      if (user.subscription_status !== 'active') {
        console.log('   - subscription_status is not "active"');
      }
    }

    // 4. Root cause analysis
    console.log('\n4️⃣ ROOT CAUSE ANALYSIS:');
    
    if (!user.stripe_customer_id && !user.stripe_subscription_id) {
      console.log('🔍 PRIMARY ISSUE: Complete Stripe integration failure');
      console.log('   This suggests:');
      console.log('   - Checkout session creation failed to store customer ID');
      console.log('   - Webhook never fired or completely failed');
      console.log('   - User may have completed payment but system never recorded it');
    } else if (!user.stripe_customer_id) {
      console.log('🔍 PRIMARY ISSUE: Checkout session creation failed');
      console.log('   - Stripe customer was created but not stored in database');
    } else if (!user.stripe_subscription_id) {
      console.log('🔍 PRIMARY ISSUE: Webhook processing failed');
      console.log('   - Customer ID stored but subscription ID missing');
      console.log('   - Webhook may not be firing or has errors');
    } else {
      console.log('🔍 PRIMARY ISSUE: Data corruption in webhook');
      console.log('   - Stripe IDs present but wrong subscription plan');
      console.log('   - Webhook fired but processed wrong metadata');
    }

    // 5. Immediate fix for this user
    console.log('\n5️⃣ IMMEDIATE FIX NEEDED:');
    console.log('This user has paid and should have dashboard access.');
    console.log('Recommended actions:');
    console.log('1. Manually fix this user\'s database record');
    console.log('2. Investigate webhook logs in Stripe dashboard');
    console.log('3. Check checkout session metadata');
    console.log('4. Fix the root cause before more users pay');

    // 6. Generate fix script for this user
    console.log('\n6️⃣ MANUAL FIX FOR THIS USER:');
    console.log('Run this to give the user immediate access:');
    console.log('');
    console.log('```javascript');
    console.log('await supabase');
    console.log('  .from("user_preferences")');
    console.log('  .update({');
    console.log('    subscription_plan: "pro",');
    console.log('    subscription_status: "active",');
    console.log('    onboarding_completed: true,');
    console.log('    onboarding_completed_at: new Date().toISOString(),');
    console.log('    updated_at: new Date().toISOString()');
    console.log('  })');
    console.log(`  .eq("user_id", "${PAID_USER_ID}");`);
    console.log('```');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the debug function
debugSpecificPayment().catch(console.error);
