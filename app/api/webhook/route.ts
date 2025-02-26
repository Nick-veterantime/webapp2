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
        const customerEmail = session.customer_email;
        const customerId = session.customer as string;
        
        console.log('Checkout completed webhook received:', {
          userId,
          customerEmail,
          metadata: session.metadata
        });

        // First try with userId from metadata
        if (userId) {
          console.log('Updating premium status for user ID:', userId);
          
          // Update user's premium status with subscription details
          const { error } = await supabase
            .from('user_data')
            .update({ 
              is_premium: true,
              stripe_customer_id: customerId,
              subscription_status: 'active',
              subscription_period_start: new Date().toISOString(),
              subscription_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
            })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating premium status:', error);
            return NextResponse.json({ error: 'Failed to update premium status' }, { status: 500 });
          }
          
          console.log('Successfully updated premium status for user ID:', userId);
        } 
        // Try using customer email as fallback
        else if (customerEmail) {
          console.log('Looking up user by email:', customerEmail);
          
          // Try first with the auth.users table
          const { data: authUser, error: authUserError } = await supabase
            .from('users')
            .select('id')
            .eq('email', customerEmail)
            .single();
            
          if (!authUserError && authUser?.id) {
            console.log('Found user in auth.users table:', authUser.id);
            
            const { error } = await supabase
              .from('user_data')
              .update({ 
                is_premium: true,
                stripe_customer_id: customerId,
                subscription_status: 'active',
                subscription_period_start: new Date().toISOString(),
                subscription_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
              })
              .eq('user_id', authUser.id);

            if (error) {
              console.error('Error updating premium status by email:', error);
            } else {
              console.log('Successfully updated premium status for user:', authUser.id);
            }
          } else {
            console.log('User not found in users table, trying auth table');
            
            // Try directly in the auth.users table
            const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
            
            if (!authError && authData) {
              const matchingUser = authData.users.find(user => 
                user.email?.toLowerCase() === customerEmail.toLowerCase()
              );
              
              if (matchingUser) {
                console.log('Found user in auth admin API:', matchingUser.id);
                
                const { error } = await supabase
                  .from('user_data')
                  .update({ 
                    is_premium: true,
                    stripe_customer_id: customerId,
                    subscription_status: 'active',
                    subscription_period_start: new Date().toISOString(),
                    subscription_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
                  })
                  .eq('user_id', matchingUser.id);

                if (error) {
                  console.error('Error updating premium status by auth lookup:', error);
                } else {
                  console.log('Successfully updated premium status for user:', matchingUser.id);
                }
              } else {
                console.error('Could not find user by email:', customerEmail);
              }
            } else {
              console.error('Error listing users:', authError);
            }
          }
        } else {
          console.error('No user identifier in session metadata or customer email');
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