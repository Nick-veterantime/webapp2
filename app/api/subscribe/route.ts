import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Pre-initialize Stripe outside the request handler for better performance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Set to edge runtime for faster performance
export const runtime = 'edge';

export async function POST(request: Request) {
  // Validate all required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Stripe secret key' },
      { status: 500 }
    );
  }

  // Check for price ID - this is likely the issue
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error('Missing Stripe price ID environment variable');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Stripe price ID' },
      { status: 500 }
    );
  }

  try {
    // Parse request body - this is faster than creating server clients and checking auth
    const requestData = await request.json();
    
    // Get the return URL from the request or use a default
    const returnUrl = requestData.returnUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://veterantime.app';
    
    // Minimal metadata for tracking
    const metadata: Record<string, string> = {
      timestamp: new Date().toISOString(),
    };

    // Only add user info to metadata if available, keeping it minimal
    if (requestData.email) metadata.email = requestData.email;
    if (requestData.userId) metadata.userId = requestData.userId;

    // Add debug info to help identify issues
    console.log(`Creating Stripe checkout session with price ID: ${priceId}`);

    try {
      // Create Stripe checkout session with minimal configuration
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
        metadata
      });

      // Fast return of just the URL rather than extra metadata
      return NextResponse.json({ url: session.url });
    } catch (stripeError: any) {
      // Detailed error logging for Stripe-specific errors
      console.error('Stripe API error:', stripeError.message);
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Server error in subscribe API:', error.message);
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 