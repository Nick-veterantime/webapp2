import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Manually activate premium for a user
export async function POST(req: NextRequest) {
  try {
    // Get the user ID from the request body
    const { userId, email, sessionId } = await req.json();
    
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }
    
    console.log('Attempting to activate premium for:', { userId, email, sessionId });
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<any>({ cookies });
    
    // Get the authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    // Find the user
    let userRecord;
    
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('user_data')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (userError) {
        console.error('Error finding user data by ID:', userError);
        
        // If not found, we'll create a new record
        if (userError.code === 'PGRST116') { // No data found
          console.log('No user data found, will create new record');
        } else {
          return NextResponse.json(
            { error: 'Failed to retrieve user data' },
            { status: 500 }
          );
        }
      } else {
        userRecord = userData;
      }
    } else if (email && session) {
      // Try to find by email through auth
      try {
        // First get user id from auth
        let userId = session.user.id;
        
        // Then get user data
        const { data: userData, error: userError } = await supabase
          .from('user_data')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (userError) {
          console.error('Error finding user data by user ID from email lookup:', userError);
          
          // If not found, we'll create a new record
          if (userError.code === 'PGRST116') { // No data found
            console.log('No user data found, will create new record');
          } else {
            return NextResponse.json(
              { error: 'Failed to retrieve user data' },
              { status: 500 }
            );
          }
        } else {
          userRecord = userData;
        }
      } catch (err) {
        console.error('Error in email lookup process:', err);
      }
    }
    
    // Prepare the subscription data
    const subscriptionData = {
      is_premium: true,
      stripe_customer_id: sessionId ? `session_${sessionId.substring(0, 8)}` : undefined,
      subscription_status: 'active',
      subscription_period_start: new Date().toISOString(),
      subscription_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (userRecord) {
      // Update existing user data
      console.log('Updating existing user data for user:', userRecord.user_id);
      result = await supabase
        .from('user_data')
        .update(subscriptionData)
        .eq('user_id', userRecord.user_id)
        .select();
    } else if (userId) {
      // Create new user data entry
      console.log('Creating new user data with premium status for userId:', userId);
      result = await supabase
        .from('user_data')
        .insert({
          user_id: userId,
          ...subscriptionData,
          // Default required fields to empty strings
          branch: '',
          rank_category: '',
          rank: '',
          job_code: '',
          location_preference: '',
          career_goal: '',
          separation_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select();
    } else if (session) {
      // Create new user data entry with session user
      const userId = session.user.id;
      console.log('Creating new user data with premium status for session user:', userId);
      result = await supabase
        .from('user_data')
        .insert({
          user_id: userId,
          ...subscriptionData,
          // Default required fields to empty strings
          branch: '',
          rank_category: '',
          rank: '',
          job_code: '',
          location_preference: '',
          career_goal: '',
          separation_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select();
    } else {
      console.error('Could not determine user ID for premium activation');
      return NextResponse.json(
        { error: 'User identification failed' },
        { status: 400 }
      );
    }
    
    if (result.error) {
      console.error('Error updating/creating user data:', result.error);
      return NextResponse.json(
        { error: 'Failed to update premium status' },
        { status: 500 }
      );
    }
    
    console.log('Premium status activated successfully');
    return NextResponse.json({
      message: 'Premium status activated successfully',
      userId: userRecord?.user_id || userId || (session ? session.user.id : null),
      isPremium: true,
    });
  } catch (error) {
    console.error('Error activating premium status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 