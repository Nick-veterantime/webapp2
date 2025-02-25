import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// More robust error handling for missing environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey || 'dummy_key_for_error_handling', {
  apiVersion: '2025-02-24.acacia'
});

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Log request headers for debugging (excluding sensitive data)
    const headers = Object.fromEntries(
      Array.from(request.headers.entries())
        .filter(([key]) => !key.toLowerCase().includes('authorization'))
        .filter(([key]) => !key.toLowerCase().includes('cookie'))
    );
    console.log('Request headers:', headers);

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is missing');
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    // Make sure site URL is defined
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('NEXT_PUBLIC_SITE_URL is missing');
      return NextResponse.json({ error: 'Site URL is not configured' }, { status: 500 });
    }

    // Check for Authorization header first
    const authHeader = request.headers.get('Authorization');
    let tokenFromHeader: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenFromHeader = authHeader.substring(7);
      console.log('Found Authorization header with token');
    } else {
      console.log('No valid Authorization header found');
    }

    // Get the cookie store for authentication
    let cookieStore;
    try {
      cookieStore = cookies();
      if (cookieStore) {
        console.log('Cookie store is available');
      }
    } catch (cookieError) {
      console.error('Error accessing cookie store:', cookieError);
    }
    
    if (!cookieStore && !tokenFromHeader) {
      console.error('Neither cookie store nor auth header available');
      return NextResponse.json({ 
        error: 'Authentication system unavailable. Please try signing in again.' 
      }, { status: 401 });
    }
    
    // Log Supabase configuration values (omitting actual values for security)
    console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key available:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Create Supabase client with proper cookie handling
    const supabaseOptions = {
      cookies: {
        get(name: string) {
          if (!cookieStore) return null;
          try {
            return cookieStore.get(name)?.value;
          } catch (err) {
            console.error(`Error getting cookie ${name}:`, err);
            return null;
          }
        },
        set(name: string, value: string, options: any) {
          // No-op for read-only cookie store in API routes
        },
        remove(name: string, options: any) {
          // No-op for read-only cookie store in API routes
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {}
      }
    };
    
    // If we have a token from header, add it
    if (tokenFromHeader) {
      supabaseOptions.cookies.getToken = () => Promise.resolve(tokenFromHeader);
      supabaseOptions.global.headers = { 
        Authorization: `Bearer ${tokenFromHeader}` 
      };
    }
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseOptions
    );
    
    // Verify authentication
    console.log('Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ 
        error: `Authentication error: ${sessionError.message}` 
      }, { status: 401 });
    }
    
    if (!session) {
      console.error('No active session found');
      return NextResponse.json({ error: 'Not authenticated. Please sign in again.' }, { status: 401 });
    }

    console.log('Session found, user ID:', session.user?.id?.substring(0, 8));

    // Extra verification that user ID exists
    if (!session.user || !session.user.id) {
      console.error('Invalid user data in session');
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Create a Stripe Checkout Session
    try {
      console.log('Creating Stripe checkout session...');
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_1QvmylADchHZkH6DD15DQuNk', // Use the specific price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/timeline?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/timeline?canceled=true`,
        customer_email: session.user.email,
        metadata: {
          userId: session.user.id,
        },
      });

      if (!checkoutSession.url) {
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
      }

      console.log('Checkout session created successfully');
      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json({ 
        error: `Stripe error: ${stripeError.message || 'Unknown Stripe error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST /api/subscribe:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
} 