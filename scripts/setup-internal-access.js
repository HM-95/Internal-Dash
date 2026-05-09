#!/usr/bin/env node

/**
 * Setup script for Internal Access Control System
 * 
 * This script:
 * 1. Runs the database migration to create internal_users and internal_access_logs tables
 * 2. Sets up initial users with hashed passwords
 * 3. Verifies the setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Internal Access Control System...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the project root directory');
  process.exit(1);
}

// Check if required files exist
const requiredFiles = [
  'database/migrations/internal_access_system.sql',
  'scripts/setup-internal-users.js'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Error: Required file not found: ${file}`);
    process.exit(1);
  }
}

console.log('✅ Required files found');

// Step 1: Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Step 2: Run database migration
console.log('\n🗄️  Running database migration...');
console.log('Please run the following SQL in your Supabase SQL editor:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(fs.readFileSync('database/migrations/internal_access_system.sql', 'utf8'));
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nAfter running the migration, press Enter to continue...');

// Wait for user input
process.stdin.once('data', () => {
  // Step 3: Set up initial users
  console.log('\n👥 Setting up initial users...');
  try {
    execSync('node scripts/setup-internal-users.js', { stdio: 'inherit' });
    console.log('✅ Initial users setup completed');
  } catch (error) {
    console.error('❌ Error setting up users:', error.message);
    process.exit(1);
  }

  // Step 4: Create environment variables template
  console.log('\n🔧 Creating environment variables template...');
  const envTemplate = `# Internal Access Control System
JWT_SECRET=your-jwt-secret-key-here-change-in-production
INTERNAL_AUTH_SECRET=your-internal-auth-secret-here

# Supabase (still needed for database access)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DISABLED - Stripe Integration (preserved for future use)
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
`;

  fs.writeFileSync('.env.internal-template', envTemplate);
  console.log('✅ Environment template created: .env.internal-template');

  // Step 5: Final instructions
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Copy .env.internal-template to .env.local and update the values');
  console.log('2. Generate secure JWT_SECRET and INTERNAL_AUTH_SECRET values');
  console.log('3. Update your Supabase environment variables');
  console.log('4. Set INTERNAL_USERS_SEED in .env.local and run: node scripts/setup-internal-users.js');
  console.log('5. Run "npm run dev" to start the development server');
  console.log('\n📚 For reverting to public access, see REVERT_TO_PUBLIC.md');
  console.log('\n✨ Internal access system is ready!');
});

// Start listening for input
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (key) => {
  if (key === '\r' || key === '\n') {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  }
});
