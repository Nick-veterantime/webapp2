'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getUserData, updateUserData, UserData } from '@/lib/user-data';
import { auth } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Dynamically import Timeline with no SSR
const DynamicTimeline = dynamic(() => import('@/components/Timeline').then(mod => ({ default: mod.Timeline })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function TimelinePage() {
  const [userData, setUserData] = useState<UserData | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (isSuccess) {
      toast.success('Thank you for subscribing!', {
        description: 'You now have access to the full 60-month timeline.',
      });
      // Remove the query parameter using router
      router.replace('/timeline');
    } else if (isCanceled) {
      toast.error('Subscription canceled', {
        description: 'Your subscription was not completed.',
      });
      // Remove the query parameter using router
      router.replace('/timeline');
    }
  }, [isSuccess, isCanceled, router]);

  useEffect(() => {
    let mounted = true;

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
          }
        } catch (error) {
          console.error('Error fetching user data after sign in:', error);
        }
      }
    });

    return () => {
      mounted = false;
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

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-red-400 text-center">{error}</div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </button>
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