'use client';

export const dynamicRendering = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getUserData, updateUserData, UserData } from '@/lib/user-data';
import { auth } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { TimelineBarData } from '@/components/TimelineBar';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Timeline } from '@/components/Timeline';

// Extended UserData interface to include id and email
interface ExtendedUserData extends UserData {
  id?: string;
  email?: string;
}

// Loading component to use during suspense
const Loading = () => (
  <div className="w-full h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

// Dynamically import Timeline with no SSR
const DynamicTimeline = dynamic(() => import('@/components/Timeline').then(mod => ({ default: mod.Timeline })), {
  ssr: false,
  loading: Loading
});

// Component that uses useSearchParams internally
function TimelinePageContent() {
  const [userData, setUserData] = useState<ExtendedUserData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  // Function to refresh user data from the server
  const refreshUserData = async (): Promise<ExtendedUserData | undefined> => {
    try {
      const { data: { session }, error: sessionError } = await auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session || !session.user) {
        console.error('No authenticated user found when refreshing user data');
        return undefined;
      }
      
      const data = await getUserData();
      if (data) {
        // Add id and email from session
        const extendedData: ExtendedUserData = {
          ...data,
          id: session.user.id,
          email: session.user.email
        };
        setUserData(extendedData);
        return extendedData;
      }
      return undefined;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return undefined;
    }
  };
  
  // Function to update premium status
  const updatePremiumStatus = (isPremium: boolean) => {
    if (!userData) return;
    
    const updatedUserData = {
      ...userData,
      is_premium: isPremium
    };
    
    setUserData(updatedUserData);
    updateUserData(updatedUserData).catch(err => {
      console.error('Error updating user data:', err);
    });
  };

  // Handle Stripe redirect status
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    
    // Check if we were in a Stripe checkout flow
    const wasInCheckout = sessionStorage.getItem('stripe_checkout_in_progress');
    
    // If coming back from Stripe but no parameters, treat as cancellation
    if (wasInCheckout && !success && !canceled) {
      toast.info('Payment process was interrupted', { duration: 3000 });
      // Clear our checkout flag
      sessionStorage.removeItem('stripe_checkout_in_progress');
      // Dismiss any lingering loading toasts
      toast.dismiss('premium-activation');
      toast.dismiss('checkout');
      return;
    }
    
    // Handle Stripe redirect status
    if (success && sessionId) {
      // Clear the checkout flag
      sessionStorage.removeItem('stripe_checkout_in_progress');
      
      // Immediately show success message without loading state
      const successToastId = toast.success('Thank you for upgrading to Premium!', {
        duration: 3000
      });
      
      // Immediately update premium status in UI
      updatePremiumStatus(true);
      
      // Clear URL parameters without refreshing page
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
      
      // Make sure user data is available before making the API call
      if (userData?.id) {
        // Call the activation endpoint as a background operation
        fetch('/api/premium/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: userData.id, 
            email: userData.email,
            sessionId
          })
        })
        .then(res => {
          if (!res.ok) {
            console.error('Failed to activate premium:', res.status);
            return res.json().then(data => {
              console.error('Error details:', data);
            });
          }
          return res.json();
        })
        .then(data => {
          console.log('Premium activation complete:', data);
        })
        .catch((err) => {
          console.error('Error during premium activation:', err);
        });
      } else {
        // Wait for user data to be available and then activate premium
        const checkForUserData = setInterval(async () => {
          try {
            const userDataResult = await getUserData();
            const { data: { session } } = await auth.getSession();
            
            if (userDataResult && session?.user) {
              clearInterval(checkForUserData);
              
              fetch('/api/premium/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  userId: session.user.id, 
                  email: session.user.email,
                  sessionId
                })
              })
              .then(res => {
                if (!res.ok) {
                  console.error('Failed to activate premium:', res.status);
                  return res.json().then(data => {
                    console.error('Error details:', data);
                  });
                }
                return res.json();
              })
              .then(data => {
                console.log('Premium activation complete:', data);
              })
              .catch((err) => {
                console.error('Error during premium activation:', err);
              });
            }
          } catch (err) {
            console.error('Error getting user data:', err);
          }
        }, 1000);
        
        // Stop checking after 30 seconds to prevent infinite loop
        setTimeout(() => {
          clearInterval(checkForUserData);
          console.warn('Timed out waiting for user data to activate premium');
        }, 30000);
      }
    }
    
    // Handle canceled state
    if (canceled) {
      // Clear the checkout flag
      sessionStorage.removeItem('stripe_checkout_in_progress');
      
      // Show error message
      toast.error('Premium subscription was canceled');
      
      // Clear URL parameters without refreshing page
      const url = new URL(window.location.href);
      url.searchParams.delete('canceled');
      window.history.replaceState({}, '', url.toString());
    }
  }, [userData]);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Skip auth check if coming back from subscription flow
        if (isSuccess || isCanceled) {
          if (mounted) setIsLoading(false);
          return;
        }
        
        const { data: { session }, error: sessionError } = await auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          router.push('/');
          return;
        }

        // Show verification reminder only once per session
        if (!session.user.email_confirmed_at) {
          toast.message(
            'Please verify your email',
            {
              description: 'Check your inbox for a verification link',
              duration: 5000,
              id: 'verify-email', // Prevent duplicate verification reminders
            }
          );
        }

        // Fetch user data if authenticated
        try {
          const data = await getUserData();
          if (mounted) {
            if (data) {
              setUserData(data);
            } else {
              // If no user data exists yet, create default data silently
              const defaultData: UserData = {
                branch: '',
                rankCategory: '',
                rank: '',
                jobCode: '',
                locationPreference: '',
                careerGoal: '',
                separationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
              };
              await updateUserData(defaultData, { silent: true });
              setUserData(defaultData);
            }
            setIsInitialLoad(false);
            setIsLoading(false);
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          if (error.message?.includes('JWT expired')) {
            // Handle expired session
            await auth.signOut();
            router.push('/');
            return;
          }
          if (mounted) {
            // Don't show error UI, just try to continue
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          // Don't show error UI, just continue loading the page
          setIsLoading(false);
        }
      }
    };

    // Run auth check but with a small delay to ensure redirect params are processed first
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 100);

    // Set up auth state listener
    const { data: { subscription } } = auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else if (event === 'SIGNED_IN' && session) {
        // Refresh user data when signed in
        try {
          const data = await getUserData();
          if (mounted && data) {
            setUserData(data);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching user data after sign in:', error);
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router, isSuccess, isCanceled]);

  const handleUpdateUserData = async (newData: UserData) => {
    try {
      // Skip update if data hasn't changed
      if (JSON.stringify(newData) === JSON.stringify(userData)) {
        return;
      }

      await updateUserData(newData);
      setUserData(newData);
      
      // Only show toast notification if it's not the initial load and if there are actual changes
      if (!isInitialLoad && JSON.stringify(newData) !== JSON.stringify(userData)) {
        toast.success('Timeline preferences updated', {
          id: 'preferences-update', // Prevent duplicate toasts
          duration: 2000 // Shorter duration
        });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      if (!isInitialLoad) {
        toast.error('Failed to update timeline preferences', {
          id: 'preferences-error' // Prevent duplicate error toasts
        });
      }
    }
  };

  // If there's a subscription redirect, show the timeline right away
  if (isSuccess || isCanceled) {
    const defaultVisibleTracks = {
      mindset: true,
      admin: true,
      medical: true,
      job: true,
      misc: true
    };
    
    return (
      <div className="absolute inset-0">
        <DynamicTimeline 
          visibleTracks={defaultVisibleTracks}
          separationDate={userData?.separationDate ? new Date(userData.separationDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
          userData={userData}
          onUpdateUserData={handleUpdateUserData}
          isPremium={userData?.is_premium || isSuccess || false}
        />
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  const defaultVisibleTracks = {
    mindset: true,
    admin: true,
    medical: true,
    job: true,
    misc: true
  };

  return (
    <div className="absolute inset-0">
      <DynamicTimeline 
        visibleTracks={defaultVisibleTracks}
        separationDate={userData?.separationDate ? new Date(userData.separationDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
        userData={userData}
        onUpdateUserData={handleUpdateUserData}
        isPremium={userData?.is_premium || false}
      />
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function TimelinePage() {
  return (
    <Suspense fallback={<Loading />}>
      <TimelinePageContent />
    </Suspense>
  );
} 