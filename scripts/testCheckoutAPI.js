// Test the checkout session API to debug the error
// Run with: node scripts/testCheckoutAPI.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function testCheckoutAPI() {
  console.log('🧪 TESTING CHECKOUT SESSION API');
  console.log('=====================================\n');

  try {
    // Test the API endpoint directly
    console.log('1️⃣ Testing API endpoint...');
    
    const testPayload = {
      planId: 'starter',
      billingCycle: 'monthly'
    };
    
    console.log('Test payload:', testPayload);
    
    // Make the same request that the frontend makes
    const response = await fetch('http://localhost:3000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:');
      console.log('Status:', response.status);
      console.log('Error text:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Error JSON:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('Error is not valid JSON');
      }
    } else {
      const result = await response.json();
      console.log('✅ API Success Response:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

console.log('🚨 Make sure your Next.js dev server is running on localhost:3000');
console.log('Run: npm run dev');
console.log('Then run this script\n');

// testCheckoutAPI().catch(console.error);
