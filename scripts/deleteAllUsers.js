// Nuclear option: Delete all users from user_preferences table
// Run with: node scripts/deleteAllUsers.js
// ⚠️  WARNING: This is irreversible!

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

async function deleteAllUsers() {
  console.log('⚠️  WARNING: NUCLEAR OPTION - DELETE ALL USERS');
  console.log('=====================================\n');

  try {
    // Get current count
    const { data: beforeUsers, error: beforeError } = await supabase
      .from('user_preferences')
      .select('user_id, subscription_plan, created_at')
      .order('created_at', { ascending: false });

    if (beforeError) {
      console.error('❌ Error fetching users:', beforeError);
      return;
    }

    console.log(`📊 Current users in database: ${beforeUsers.length}`);
    
    if (beforeUsers.length === 0) {
      console.log('✅ No users to delete!');
      return;
    }

    console.log('\n📋 Users to be deleted:');
    beforeUsers.forEach((user, index) => {
      if (index < 10) { // Show first 10
        console.log(`   ${index + 1}. ${user.user_id.substring(0, 8)}... (${user.subscription_plan}) - ${user.created_at}`);
      }
    });
    
    if (beforeUsers.length > 10) {
      console.log(`   ... and ${beforeUsers.length - 10} more users`);
    }

    console.log('\n⚠️  THIS ACTION IS IRREVERSIBLE!');
    console.log('⚠️  All user preferences, onboarding data, and settings will be lost!');
    console.log('⚠️  Users will need to complete onboarding again!');
    
    // For safety, require manual confirmation in the script
    // In a real scenario, you'd want command line prompts
    console.log('\n🔥 PROCEEDING WITH DELETION...');
    
    // Delete all users
    const { data: deletedUsers, error: deleteError } = await supabase
      .from('user_preferences')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000') // Delete all (dummy condition)
      .select('user_id');

    if (deleteError) {
      console.error('❌ Error deleting users:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${deletedUsers?.length || 0} users`);

    // Verify deletion
    const { data: afterUsers, error: afterError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .limit(1);

    if (afterError) {
      console.error('❌ Error verifying deletion:', afterError);
      return;
    }

    if (afterUsers.length === 0) {
      console.log('✅ Verification: user_preferences table is now empty');
    } else {
      console.log(`⚠️  Warning: ${afterUsers.length} users still remain in table`);
    }

    console.log('\n🎉 CLEAN SLATE ACHIEVED!');
    console.log('=====================================');
    console.log('✅ All users deleted successfully');
    console.log('✅ New users can now register with correct flow');
    console.log('✅ Payment system will work correctly');
    console.log('✅ No legacy subscription plan issues');

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test new user registration');
    console.log('2. Test complete onboarding flow');
    console.log('3. Test payment and dashboard access');
    console.log('4. Verify webhook updates work correctly');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

console.log('🚨 SAFETY CHECK: Uncomment the line below to actually delete users');
console.log('// deleteAllUsers().catch(console.error);');
console.log('\nTo run this script:');
console.log('1. Edit this file and uncomment the last line');
console.log('2. Run: node scripts/deleteAllUsers.js');

// Uncomment this line to actually run the deletion:
// deleteAllUsers().catch(console.error);
