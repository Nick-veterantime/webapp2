'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getUserData, updateUserData, UserData } from '@/lib/firebase-user';

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserData();
        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateUserData = async (newData: UserData) => {
    try {
      await updateUserData(newData);
      setUserData(newData);
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('Failed to update user data. Please try again later.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-auto">
        <div className="min-w-[1200px]">
          <DynamicTimeline 
            userData={userData}
            onUpdateUserData={handleUpdateUserData}
            separationDate={userData?.separationDate ? new Date(userData.separationDate) : undefined}
          />
        </div>
      </div>
    </main>
  );
} 