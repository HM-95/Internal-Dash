import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get the user session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    redirect('/');
  }
  
  if (!session?.user) {
    console.log('No session found, redirecting to login');
    redirect('/');
  }
  
  // Check if user has completed onboarding and has a valid subscription
  console.log('Checking user preferences for user:', session.user.id);
  
  // Try a simpler query first to check if the table exists
  let preferences: any = null;
  let prefError: any = null;
  
  try {
    // First, try to get basic user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user preferences:', error);
      prefError = error;
    } else {
      preferences = data;
    }
  } catch (err) {
    console.error('Exception during user preferences query:', err);
    prefError = err;
  }
  
  if (prefError) {
    console.error('Error details:', {
      message: prefError.message,
      details: prefError.details,
      hint: prefError.hint,
      code: prefError.code
    });
    
    // If it's a 406 error or table doesn't exist, try to create user preferences
    if (prefError.code === '406' || 
        prefError.message?.includes('relation "user_preferences" does not exist') ||
        prefError.message?.includes('No rows returned')) {
      
      console.log('Attempting to create user preferences for user:', session.user.id);
      
      try {
        // Try to insert default user preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: session.user.id,
            onboarding_completed: false,
            subscription_plan: 'free',
            subscription_status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Failed to create user preferences:', insertError);
          // If we can't create preferences, redirect to onboarding
          redirect('/onboarding');
        } else {
          preferences = newPrefs;
          console.log('Created default user preferences');
        }
      } catch (insertErr) {
        console.error('Exception during user preferences creation:', insertErr);
        redirect('/onboarding');
      }
    } else {
      // For other errors, redirect to login
      redirect('/');
    }
  }
  
  if (!preferences?.onboarding_completed) {
    console.log('User has not completed onboarding, redirecting');
    redirect('/onboarding');
  }
  
  // Check if user has a paid subscription (not free plan) OR is in trial
  // Allow access for active, trialing, and past_due (grace period) subscriptions
  const allowedStatuses = ['active', 'trialing', 'past_due']
  if (preferences.subscription_plan === 'free' || 
      !allowedStatuses.includes(preferences.subscription_status)) {
    console.log('User does not have an active paid subscription or trial, redirecting to onboarding');
    console.log('Current status:', preferences.subscription_status, 'Plan:', preferences.subscription_plan);
    redirect('/onboarding');
  }
  
  console.log('Dashboard layout - User authenticated and onboarded:', {
    userId: session.user.id,
    userEmail: session.user.email,
    hasSession: !!session,
    onboardingCompleted: preferences.onboarding_completed
  });
  
  return (
    <DashboardLayoutClient 
      user={session.user}
      children={children}
    />
  );
} 