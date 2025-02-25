import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  // Check for Stripe API key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia', // Use the version expected by the linter
    });

    // Parse request body
    const requestData = await request.json();
    
    // Get the return URL from the request or use a default
    const returnUrl = requestData.returnUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://veterantime.app';
    
    // Optional metadata for tracking
    const metadata: Record<string, string> = {
      timestamp: new Date().toISOString(),
      source: requestData.source || 'webapp'
    };

    // Add user info to metadata if available
    if (requestData.email) metadata.email = requestData.email;
    if (requestData.userId) metadata.userId = requestData.userId;

    // Create Stripe checkout session with minimal configuration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata
    });

    // Return the checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 