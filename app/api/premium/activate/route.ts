import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Manually activate premium for a user
export async function POST(req: NextRequest) {
  try {
    // Get the user ID from the request body
    const { userId, email } = await req.json();
    
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<any>({ cookies });
    
    // Get the authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the requested user
    // Or check if the user has admin rights in a real application
    if (userId && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Find the user
    let userRecord;
    
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error('Error finding user by ID:', userError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      userRecord = userData;
    } else if (email) {
      // Try to find by email as fallback
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userError) {
        console.error('Error finding user by email:', userError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      userRecord = userData;
    }
    
    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update the user's premium status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_premium: true,
        subscription_period_end: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year from now
        ).toISOString(),
      })
      .eq('id', userRecord.id);
      
    if (updateError) {
      console.error('Error updating premium status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update premium status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Premium status activated successfully',
      userId: userRecord.id,
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