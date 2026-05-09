// Quick fix script for specific user b9870549-d823-4759-b069-5e9601d11673
// Run with: node scripts/fixSpecificUser.js

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

const SPECIFIC_USER_ID = 'b9870549-d823-4759-b069-5e9601d11673';

async function fixSpecificUser() {
  console.log('🔧 FIXING SPECIFIC USER:', SPECIFIC_USER_ID);
  console.log('=====================================\n');

  try {
    // 1. Check current state
    console.log('1️⃣ Checking current user state...');
    const { data: currentUser, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', SPECIFIC_USER_ID)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        console.log('📝 User not found in user_preferences table');
        console.log('🔧 Creating new user preferences record...');
        
        const { data: newUser, error: createError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: SPECIFIC_USER_ID,
            subscription_plan: 'free',
            subscription_status: 'active',
            onboarding_completed: false,
            onboarding_steps_completed: false,
            selected_niches: [],
            target_audience_description: null
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user preferences:', createError);
          return;
        }

        console.log('✅ Created new user preferences:', newUser);
        return;
      } else {
        console.error('❌ Error fetching user:', fetchError);
        return;
      }
    }

    console.log('📊 Current user state:');
    console.log(JSON.stringify(currentUser, null, 2));

    // 2. Check if user needs fixing
    const needsFix = currentUser.subscription_plan === 'starter' && !currentUser.stripe_subscription_id;

    if (needsFix) {
      console.log('\n🔧 User needs fixing: has "starter" plan without Stripe subscription');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          subscription_plan: 'free',
          subscription_status: 'active',
          onboarding_completed: false,
          onboarding_steps_completed: false,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', SPECIFIC_USER_ID)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }

      console.log('✅ User fixed successfully:');
      console.log(JSON.stringify(updatedUser, null, 2));
      
      console.log('\n🎯 User can now:');
      console.log('   - Go through onboarding flow again');
      console.log('   - Make a new payment');
      console.log('   - Access dashboard after successful payment');
      
    } else {
      console.log('\n✅ User state looks correct');
      
      const hasAccess = currentUser.onboarding_completed && 
        currentUser.subscription_plan !== 'free' && 
        currentUser.subscription_status === 'active';
      
      if (hasAccess) {
        console.log('🚪 User should have dashboard access');
      } else {
        console.log('🚪 User correctly blocked from dashboard:');
        if (!currentUser.onboarding_completed) {
          console.log('   - Needs to complete onboarding');
        }
        if (currentUser.subscription_plan === 'free') {
          console.log('   - Needs to purchase subscription');
        }
        if (currentUser.subscription_status !== 'active') {
          console.log('   - Subscription status not active');
        }
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix function
fixSpecificUser().catch(console.error);
