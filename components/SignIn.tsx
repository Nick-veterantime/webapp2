import { useState } from 'react';
import { auth, googleProvider, initializeFirebase } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initializeFirebase();
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/timeline');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await initializeFirebase();
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        router.push('/timeline');
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error(error.message || 'Failed to sign in with Google');
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <span>or continue with</span>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded font-medium hover:bg-gray-100 transition-colors"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Sign in with Google
      </button>
    </div>
  );
} 