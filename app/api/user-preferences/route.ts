import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase';
import { 
  CreateUserPreferencesRequest, 
  UpdateUserPreferencesRequest,
  UserPreferencesResponse,
  UserPreferences,
  DEFAULT_USER_PREFERENCES 
} from '@/types/userPreferences';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse<UserPreferencesResponse>> {
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

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return default preferences
    if (!preferences) {
      const defaultPreferences: UserPreferences = {
        id: '', // Will be generated when actually created
        user_id: user.id,
        ...DEFAULT_USER_PREFERENCES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        data: defaultPreferences
      });
    }

    return NextResponse.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error in GET /api/user-preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<UserPreferencesResponse>> {
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

    const body: CreateUserPreferencesRequest = await request.json();
    
    // Validate required fields
    if (!body.selected_niches || !body.target_audience_description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: selected_niches and target_audience_description' },
        { status: 400 }
      );
    }

    // Check if user preferences already exist
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const preferencesData = {
      user_id: user.id,
      selected_niches: body.selected_niches,
      target_audience_description: body.target_audience_description,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    };

    let result;

    if (existingPreferences) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update user preferences' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert([preferencesData])
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create user preferences' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error in POST /api/user-preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<UserPreferencesResponse>> {
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

    const body: UpdateUserPreferencesRequest = await request.json();
    
    // Check if user preferences exist
    const { data: existingPreferences, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    if (!existingPreferences) {
      return NextResponse.json(
        { success: false, error: 'User preferences not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    // Update preferences
    const updateData = {
      ...(body.selected_niches !== undefined && { selected_niches: body.selected_niches }),
      ...(body.target_audience_description !== undefined && { target_audience_description: body.target_audience_description })
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in PUT /api/user-preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
