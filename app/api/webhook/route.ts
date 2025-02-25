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
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          // Update user's premium status
          const { error } = await supabase
            .from('user_data')
            .update({ is_premium: true })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating premium status:', error);
            return NextResponse.json({ error: 'Failed to update premium status' }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerResponse = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('deleted' in customerResponse) {
          // Handle deleted customer
          break;
        }

        const customer = customerResponse;
        const userId = customer.metadata?.userId;
        
        if (userId) {
          // Remove premium status
          const { error } = await supabase
            .from('user_data')
            .update({ is_premium: false })
            .eq('user_id', userId);

          if (error) {
            console.error('Error removing premium status:', error);
            return NextResponse.json({ error: 'Failed to remove premium status' }, { status: 500 });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
} 