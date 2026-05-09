const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define users and their passwords
const users = [
  {
    username: 'hari_m',
    password: 'Havendev%2026',
    access_group: 'code_access'
  },
  {
    username: 'odin_l',
    password: 'Havendev%2026',
    access_group: 'code_access'
  },
  {
    username: 'avik_r',
    password: 'Havendev%2026',
    access_group: 'code_access'
  },
  {
    username: 'member_haven',
    password: 'Team@haven.2026',
    access_group: 'non_code_access'
  }
];

async function setupInternalUsers() {
  console.log('Setting up internal users...');

  try {
    // Hash passwords and insert users
    for (const user of users) {
      console.log(`Processing user: ${user.username}`);
      
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(user.password, saltRounds);

      const { data, error } = await supabase
        .from('internal_users')
        .upsert({
          username: user.username,
          password_hash: passwordHash,
          access_group: user.access_group,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'username'
        });

      if (error) {
        console.error(`Error setting up user ${user.username}:`, error);
      } else {
        console.log(`✓ User ${user.username} setup successfully`);
      }
    }

    console.log('All users setup completed!');
  } catch (error) {
    console.error('Error setting up internal users:', error);
    process.exit(1);
  }
}

// Run the setup
setupInternalUsers();
