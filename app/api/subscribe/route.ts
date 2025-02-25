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

    // Get user info from request body (sent by client) as a fallback
    let userEmail = null;
    let userId = null;
    
    try {
      const requestBody = await request.json().catch(() => ({}));
      userEmail = requestBody.email;
      userId = requestBody.userId;
      console.log('Got user info from request body:', { 
        hasEmail: !!userEmail, 
        hasUserId: !!userId 
      });
    } catch (error) {
      console.error('Failed to parse request body:', error);
    }

    // Try to get authentication from request
    const authHeader = request.headers.get('Authorization');
    let tokenFromHeader = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenFromHeader = authHeader.substring(7);
      console.log('Found Authorization header with token');
    } else {
      console.log('No valid Authorization header found');
    }

    // Try to get user info from Supabase if we don't have it already
    if (!userEmail || !userId) {
      try {
        console.log('Attempting to get user info from Supabase');
        
        // Get the cookie store for authentication
        let cookieStore;
        try {
          cookieStore = cookies();
          console.log('Cookie store available:', !!cookieStore);
        } catch (cookieError) {
          console.error('Error accessing cookie store:', cookieError);
        }
        
        if (cookieStore || tokenFromHeader) {
          // Create Supabase client with available auth methods
          const supabaseOptions: any = {
            cookies: {
              get(name: string) {
                if (!cookieStore) return null;
                try {
                  return cookieStore.get(name)?.value;
                } catch (err) {
                  return null;
                }
              },
              set(name: string, value: string, options: any) {},
              remove(name: string, options: any) {},
            },
          };
          
          // Add token if available
          if (tokenFromHeader) {
            supabaseOptions.global = {
              headers: { Authorization: `Bearer ${tokenFromHeader}` }
            };
          }
          
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            supabaseOptions
          );
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session?.user) {
            userEmail = session.user.email;
            userId = session.user.id;
            console.log('Got user info from session:', { 
              hasEmail: !!userEmail, 
              hasUserId: !!userId 
            });
          } else if (sessionError) {
            console.error('Session error:', sessionError);
          } else {
            console.warn('No session found in Supabase');
          }
        }
      } catch (authError) {
        console.error('Error getting authentication:', authError);
      }
    }

    // FALLBACK: If we can't get a user ID, generate a temporary one
    // This allows anonymous users to at least reach Stripe where they'll provide their email
    if (!userId) {
      userId = `anon_${Date.now()}`;
      console.log('Using anonymous user ID for Stripe');
    }

    // Create a Stripe Checkout Session
    try {
      console.log('Creating Stripe checkout session...');
      const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
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
        metadata: {
          userId,
        },
      };
      
      // Add customer email if available
      if (userEmail) {
        stripeSessionParams.customer_email = userEmail;
      }
      
      const checkoutSession = await stripe.checkout.sessions.create(stripeSessionParams);

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