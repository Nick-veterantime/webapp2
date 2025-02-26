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
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    console.log('Webhook event received:', { type: event.type, id: event.id });

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
        console.log('Checkout session completed:', session.id);
        
        try {
          // Get customer email and user ID from session metadata
          const userId = session.metadata?.userId;
          const email = session.customer_email || session.metadata?.email;
          
          if (!userId && !email) {
            console.error('No user ID or email in session metadata:', session.id);
            return new Response('Missing user identification', { status: 400 });
          }
          
          console.log('Processing premium upgrade for user:', { userId, email });
          
          // First try to find user by ID
          let userData;
          
          if (userId) {
            const { data, error } = await supabase
              .from('user_data')
              .select('*')
              .eq('user_id', userId)
              .single();
              
            if (error) {
              console.error('Error finding user by ID:', error);
            } else {
              userData = data;
            }
          }
          
          // If not found by ID, try by email
          if (!userData && email) {
            // This requires extra query to get the user ID from auth.users
            const { data: userRecord, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('email', email)
              .single();
              
            if (userError) {
              console.error('Error finding user by email:', userError);
            } else if (userRecord) {
              // Now get user data with this ID
              const { data, error } = await supabase
                .from('user_data')
                .select('*')
                .eq('user_id', userRecord.id)
                .single();
                
              if (error) {
                console.error('Error finding user data by user ID from email lookup:', error);
              } else {
                userData = data;
              }
            }
          }
          
          if (!userData) {
            console.error('Could not find user data for webhook:', { userId, email });
            // Continue anyway, we might create a record below
          }
          
          // Prepare the subscription data
          const subscriptionData = {
            is_premium: true,
            stripe_customer_id: session.customer as string,
            subscription_status: 'active',
            subscription_period_start: new Date().toISOString(),
            subscription_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          };
          
          let result;
          
          if (userData) {
            // Update existing user data
            result = await supabase
              .from('user_data')
              .update(subscriptionData)
              .eq('user_id', userData.user_id)
              .select();
              
            console.log('Updated user premium status:', result);
          } else if (userId) {
            // Create new user data entry if we at least have the user ID
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
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select();
              
            console.log('Created new user data with premium status:', result);
          } else {
            console.error('Could not update user data - no user ID available');
          }
        } catch (error) {
          console.error('Error handling checkout session completed:', error);
          return new Response('Webhook processing failed', { status: 500 });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get current period end as timestamp
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const status = subscription.status;
        
        // Find the customer in our database
        const { data: userData, error: userDataError } = await supabase
          .from('user_data')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userDataError || !userData) {
          console.error('Error finding user with customer ID:', customerId);
          break;
        }
        
        // Update subscription details
        const { error: updateError } = await supabase
          .from('user_data')
          .update({
            subscription_status: status,
            subscription_period_start: currentPeriodStart,
            subscription_period_end: currentPeriodEnd,
            is_premium: status === 'active' || status === 'trialing'
          })
          .eq('stripe_customer_id', customerId);
          
        if (updateError) {
          console.error('Error updating subscription details:', updateError);
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