'use client';

import React, { useState, useEffect } from 'react';
import { Timeline } from '@/components/Timeline';
import { getUserData, updateUserData, UserData } from '@/lib/firebase-user';

export default function TimelinePage() {
  const [userData, setUserData] = useState<UserData | undefined>();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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
    }
  };

  return (
    <main className="min-h-screen bg-[#121212]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 overflow-x-auto">
        <div className="min-w-[1200px]">
          <Timeline 
            userData={userData}
            onUpdateUserData={handleUpdateUserData}
            separationDate={userData?.separationDate ? new Date(userData.separationDate) : undefined}
          />
        </div>
      </div>
    </main>
  );
} 