const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const raw = process.env.INTERNAL_USERS_SEED?.trim();
if (!raw) {
  console.error(
    'Set INTERNAL_USERS_SEED to a JSON array, e.g. [{"username":"admin","password":"your-secure-password","access_group":"code_access"}]'
  );
  process.exit(1);
}

let users;
try {
  users = JSON.parse(raw);
} catch {
  console.error('INTERNAL_USERS_SEED must be valid JSON');
  process.exit(1);
}

if (!Array.isArray(users) || users.length === 0) {
  console.error('INTERNAL_USERS_SEED must be a non-empty JSON array');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupInternalUsers() {
  console.log('Setting up internal users from INTERNAL_USERS_SEED...');

  try {
    for (const user of users) {
      if (!user.username || !user.password || !user.access_group) {
        console.error('Skipping invalid entry (need username, password, access_group)');
        continue;
      }

      console.log(`Processing user: ${user.username}`);

      const passwordHash = await bcrypt.hash(user.password, 12);

      const { error } = await supabase.from('internal_users').upsert(
        {
          username: user.username,
          password_hash: passwordHash,
          access_group: user.access_group,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'username' }
      );

      if (error) {
        console.error(`Error setting up user ${user.username}:`, error);
      } else {
        console.log(`✓ User ${user.username} setup successfully`);
      }
    }

    console.log('Done.');
  } catch (error) {
    console.error('Error setting up internal users:', error);
    process.exit(1);
  }
}

setupInternalUsers();
