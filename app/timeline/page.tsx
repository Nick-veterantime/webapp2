'use client';

export const dynamicRendering = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getUserData, updateUserData, UserData } from '@/lib/user-data';
import { auth } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { TimelineBarData } from '@/components/TimelineBar';
import { VisibleTracks } from '@/types/timeline';
import { Session } from 'next-auth';
import { createClient } from '@/lib/utils/supabase/client';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Timeline } from '@/components/Timeline';

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
  const [userData, setUserData] = useState<UserData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  // Handle Stripe redirect status immediately
  useEffect(() => {
    if (isSuccess || isCanceled) {
      // Immediately set loading to false to avoid showing loading spinner
      setIsLoading(false);
      
      // Show appropriate toast notification
      if (isSuccess) {
        toast.success('Thank you for subscribing!', {
          description: 'You now have access to the full 60-month timeline.',
        });
        
        // Refresh user data in the background and update premium status
        const updatePremiumStatus = async () => {
          try {
            // First check if user is authenticated
            const { data: { session }, error: sessionError } = await auth.getSession();
            if (sessionError) throw sessionError;
            
            if (!session || !session.user) {
              console.error('No authenticated user found when updating premium status');
              return;
            }
            
            // Get the user's email
            const userEmail = session.user.email;
            const userId = session.user.id;
            
            // Get current user data
            const data = await getUserData();
            if (data) {
              // Create updated user data with premium flag set to true
              const updatedUserData = {
                ...data,
                is_premium: true,
                // Set current date as start date if there isn't one already
                subscription_period_start: data.subscription_period_start || new Date().toISOString(),
                // Set default subscription end date (1 year from now) if there isn't one already
                subscription_period_end: data.subscription_period_end || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              };
              
              // Update the user data in the database
              await updateUserData(updatedUserData);
              console.log('Premium status updated in database for user:', userId);
              
              // Update local state
              setUserData(updatedUserData);
            }
          } catch (err) {
            console.error('Error updating premium status in database:', err);
          }
        };
        
        updatePremiumStatus();
      } else if (isCanceled) {
        toast.error('Subscription canceled', {
          description: 'Your subscription was not completed.',
        });
      }
      
      // Remove the query parameter using router
      router.replace('/timeline');
    }
  }, [isSuccess, isCanceled, router]);

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