import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Pre-initialize Stripe outside the request handler for better performance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Set to edge runtime for faster performance
export const runtime = 'edge';

// The product ID you provided
const PRODUCT_ID = 'prod_RpRs6B7R7Xp39n';

export async function POST(request: Request) {
  // Validate Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Stripe secret key' },
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

    // Try to get price ID from environment, or from product's default_price
    let priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || process.env.STRIPE_PRICE_ID;
    
    // If no price ID is configured, fetch the default price from the product
    if (!priceId) {
      console.log(`No price ID configured, fetching default price for product ${PRODUCT_ID}`);
      
      try {
        // Fetch the product from Stripe
        const product = await stripe.products.retrieve(PRODUCT_ID);
        
        // Check if the product has a default price
        if (product.default_price) {
          priceId = typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id;
          
          console.log(`Using default price ID from product: ${priceId}`);
        } else {
          // If no default price, try to get the first price associated with the product
          const prices = await stripe.prices.list({ product: PRODUCT_ID, limit: 1, active: true });
          
          if (prices.data.length > 0) {
            priceId = prices.data[0].id;
            console.log(`Using first available price ID for product: ${priceId}`);
          } else {
            throw new Error('No prices found for this product');
          }
        }
      } catch (productError: any) {
        console.error('Error fetching product or prices:', productError.message);
        return NextResponse.json(
          { error: `Failed to get pricing information: ${productError.message}` },
          { status: 500 }
        );
      }
    }
    
    // Final check to ensure we have a price ID
    if (!priceId) {
      console.error('Could not determine a price ID for checkout');
      return NextResponse.json(
        { error: 'Server configuration error: Could not determine product price' },
        { status: 500 }
      );
    }

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