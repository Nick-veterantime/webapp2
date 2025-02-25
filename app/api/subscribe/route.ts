import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
});

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // No-op for read-only cookie store
          },
          remove(name: string, options: any) {
            // No-op for read-only cookie store
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Create a Stripe Checkout Session
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

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error in POST /api/subscribe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 