import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase';
import { UsageStats, SUBSCRIPTION_LIMITS } from '@/types/userPreferences';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse<{ success: boolean; data?: UsageStats; error?: string }>> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'User preferences not found' },
        { status: 404 }
      );
    }

    // Check if usage needs to be reset (monthly reset)
    const today = new Date();
    const resetDate = new Date(preferences.usage_reset_date);
    
    if (today > resetDate) {
      // Reset usage counters
      const newResetDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      
      await supabase
        .from('user_preferences')
        .update({
          monthly_imports_used: 0,
          monthly_exports_used: 0,
          monthly_ai_searches_used: 0,
          usage_reset_date: newResetDate.toISOString().split('T')[0]
        })
        .eq('user_id', user.id);

      // Update local preferences object
      preferences.monthly_imports_used = 0;
      preferences.monthly_exports_used = 0;
      preferences.monthly_ai_searches_used = 0;
      preferences.usage_reset_date = newResetDate.toISOString().split('T')[0];
    }

    // Get limits for current plan with fallback to free
    const validPlans = ['free', 'starter', 'pro', 'agency'] as const;
    const subscriptionPlan = validPlans.includes(preferences.subscription_plan as any) 
      ? preferences.subscription_plan as 'free' | 'starter' | 'pro' | 'agency'
      : 'free';
    const planLimits = SUBSCRIPTION_LIMITS[subscriptionPlan];

    // Calculate usage percentages
    const calculatePercentage = (used: number, limit: number): number => {
      if (limit === -1) return 0; // unlimited
      return Math.round((used / limit) * 100);
    };

    const usageStats: UsageStats = {
      monthly_imports_used: preferences.monthly_imports_used,
      monthly_exports_used: preferences.monthly_exports_used,
      monthly_ai_searches_used: preferences.monthly_ai_searches_used,
      usage_reset_date: preferences.usage_reset_date,
      limits: {
        imports: planLimits.monthly_imports,
        exports: planLimits.monthly_exports,
        ai_searches: planLimits.monthly_ai_searches
      },
      usage_percentages: {
        imports: calculatePercentage(preferences.monthly_imports_used, planLimits.monthly_imports),
        exports: calculatePercentage(preferences.monthly_exports_used, planLimits.monthly_exports),
        ai_searches: calculatePercentage(preferences.monthly_ai_searches_used, planLimits.monthly_ai_searches)
      }
    };

    return NextResponse.json({
      success: true,
      data: usageStats
    });

  } catch (error) {
    console.error('Error in GET /api/user-preferences/usage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'import', 'export', 'ai_search'

    if (!action || !['import', 'export', 'ai_search'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be one of: import, export, ai_search' },
        { status: 400 }
      );
    }

    // Get current preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching user preferences:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'User preferences not found' },
        { status: 404 }
      );
    }

    // Check if usage needs to be reset
    const today = new Date();
    const resetDate = new Date(preferences.usage_reset_date);
    
    let updateData: any = {};
    
    if (today > resetDate) {
      // Reset all counters
      updateData = {
        monthly_imports_used: action === 'import' ? 1 : 0,
        monthly_exports_used: action === 'export' ? 1 : 0,
        monthly_ai_searches_used: action === 'ai_search' ? 1 : 0,
        usage_reset_date: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0]
      };
    } else {
      // Increment specific counter
      const fieldMap: Record<string, keyof typeof preferences> = {
        'import': 'monthly_imports_used',
        'export': 'monthly_exports_used',
        'ai_search': 'monthly_ai_searches_used'
      };
      
      updateData = {
        [fieldMap[action]]: preferences[fieldMap[action]] + 1
      };
    }

    // Update usage
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating usage:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error in POST /api/user-preferences/usage:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
