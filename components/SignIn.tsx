import { useState } from 'react';
import { auth } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      router.push('/timeline');
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.message === 'Invalid login credentials') {
        toast.error('Invalid email or password');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-lg bg-[#1a1a1a] text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      <p className="text-center text-gray-400 mb-8">Welcome back to your timeline.</p>
      
      <form onSubmit={handleSignIn}>
        <div className="mb-4">
          <label className="block text-sm mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-[#2a2a2a] border border-gray-700"
            placeholder="you@example.com"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-[#2a2a2a] border border-gray-700"
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
} 