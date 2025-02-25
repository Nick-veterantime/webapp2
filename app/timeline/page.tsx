'use client';

export const dynamicRendering = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getUserData, updateUserData, UserData } from '@/lib/user-data';
import { auth } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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

  // Handle Stripe redirect status
  useEffect(() => {
    if (isSuccess) {
      toast.success('Thank you for subscribing!', {
        description: 'You now have access to the full 60-month timeline.',
      });
      
      // Refresh user data to get updated premium status
      getUserData().then(data => {
        if (data) {
          setUserData({...data, is_premium: true});
        }
      }).catch(err => {
        console.error('Error refreshing user data after subscription:', err);
      });
      
      // Remove the query parameter using router
      router.replace('/timeline');
    } else if (isCanceled) {
      toast.error('Subscription canceled', {
        description: 'Your subscription was not completed.',
      });
      
      // Make sure loading state is reset on cancel
      setIsLoading(false);
      
      // Remove the query parameter using router
      router.replace('/timeline');
    }
  }, [isSuccess, isCanceled, router]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          router.push('/');
          return;
        }

        // Show verification reminder only once per session and with a longer duration
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
            setError('Failed to load user data. Please try refreshing the page.');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          setError('Authentication error. Please try signing in again.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Set a maximum timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        setIsLoading(false);
        setError('Loading timed out. Please try refreshing the page.');
      }
    }, 10000);

    // Set up auth state listener
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
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
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

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

  // Handle retrying after an error
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    router.refresh();
  };

  if (isLoading && !isSuccess && !isCanceled) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-4 bg-gray-900 text-white">
        <div className="text-red-400 text-center text-lg">{error}</div>
        <div className="flex gap-4">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const defaultVisibleTracks = {
    mindset: true,
    admin: true,
    health: true,
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