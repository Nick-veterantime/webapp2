import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use a dummy test key for development if no key is provided
// (This is just for local development and won't work for actual charges)
const DUMMY_TEST_KEY = 'sk_test_dummy_key_for_development_only';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || (process.env.NODE_ENV === 'development' ? DUMMY_TEST_KEY : '');

// Pre-initialize Stripe outside the request handler for better performance
let stripe: Stripe | null = null;
try {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
} catch (error) {
  // Don't crash the app if Stripe init fails (could be missing key in dev)
  console.warn('Stripe initialization failed, will use mock responses in development');
}

// Set to edge runtime for faster performance
export const runtime = 'edge';

// The product ID you provided
const PRODUCT_ID = 'prod_RpRs6B7R7Xp39n';

export async function POST(request: Request) {
  // For development environment, always return a successful mock response if no key
  if (process.env.NODE_ENV === 'development' && (!stripeSecretKey || stripeSecretKey === DUMMY_TEST_KEY)) {
    return NextResponse.json({ 
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?success=true&session_id=dev_session_123&mock=true`,
      development: true
    });
  }

  // Validate Stripe initialization
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe service is not available' },
      { status: 503 }
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

    // Try to get price ID from environment, or from product's default_price
    let priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID;
    
    // If no price ID is configured, fetch the default price from the product
    if (!priceId) {
      try {
        // Fetch the product from Stripe
        const product = await stripe.products.retrieve(PRODUCT_ID);
        
        // Check if the product has a default price
        if (product.default_price) {
          priceId = typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id;
        } else {
          // If no default price, try to get the first price associated with the product
          const prices = await stripe.prices.list({ product: PRODUCT_ID, limit: 1, active: true });
          
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
          } else {
            throw new Error('No prices found for this product');
          }
        }
      } catch (productError: any) {
        return NextResponse.json(
          { error: `Failed to get pricing information` },
          { status: 500 }
        );
      }
    }
    
    // Final check to ensure we have a price ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'Could not determine product price' },
        { status: 500 }
      );
    }

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
      // Simplified error response
      return NextResponse.json(
        { error: `Payment service error` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process subscription request' },
      { status: 500 }
    );
  }
} 