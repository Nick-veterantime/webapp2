import React, { useState } from 'react';
import { auth } from '@/lib/supabase';
import { updateUserData } from '@/lib/user-data';
import { State } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthFormProps {
  onComplete: () => void;
  userData: {
    branch: string;
    rankCategory: string;
    rank: string;
    jobCode: string;
    locationPreference: string;
    locationType?: 'CONUS' | 'OCONUS';
    location?: string;
    consideringAreas?: State[];
    locationAdditionalInfo?: string;
    careerGoal: string;
    educationLevel?: string;
    separationDate: string;
  };
}

export const AuthForm: React.FC<AuthFormProps> = ({ onComplete, userData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/timeline`,
          data: {
            email: email,
          }
        }
      });
      
      if (error) {
        if (error.message.includes('39 seconds')) {
          toast.error('Please wait a moment and try again');
          return;
        }
        throw error;
      }

      if (data.session) {
        await handleSuccess(data.session);
        
        if (!data.user?.email_confirmed_at) {
          toast.success('Please verify your email when you get a chance', {
            duration: 6000,
          });
        }
      } else if (data.user) {
        // If we have a user but no session, try to sign in
        const { data: signInData, error: signInError } = await auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) throw signInError;
        
        if (signInData.session) {
          await handleSuccess(signInData.session);
        }
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message.includes('User already registered')) {
        // If user exists, try to sign in instead
        try {
          const { data: signInData, error: signInError } = await auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            toast.error('Invalid email or password. Please try again.');
          } else if (signInData.session) {
            await handleSuccess(signInData.session);
          }
        } catch (signInError: any) {
          toast.error('Invalid email or password. Please try again.');
        }
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async (session: any) => {
    try {
      if (!session) {
        throw new Error('No session available');
      }

      // Save the user data to Supabase
      await updateUserData({
        ...userData,
        branch: userData.branch,
        rankCategory: userData.rankCategory,
        rank: userData.rank,
        jobCode: userData.jobCode,
        locationPreference: userData.locationPreference,
        locationType: userData.locationType,
        location: userData.location,
        consideringAreas: userData.consideringAreas,
        locationAdditionalInfo: userData.locationAdditionalInfo,
        careerGoal: userData.careerGoal,
        educationLevel: userData.educationLevel,
        separationDate: userData.separationDate
      });
      
      onComplete();
      router.push('/timeline');
    } catch (error) {
      console.error('Error saving user data:', error);
      toast.error('Failed to save your preferences');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleEmailSignUp}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full bg-gray-800/80 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300">
            Create Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="mt-1 w-full bg-gray-800/80 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded-lg p-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};