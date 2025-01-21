import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBFpIiZnsFhHzorwiw-RmBWQW1472qhFVs",
  authDomain: "timeline-a7cf3.firebaseapp.com",
  projectId: "timeline-a7cf3",
  storageBucket: "timeline-a7cf3.firebasestorage.app",
  messagingSenderId: "961559368832",
  appId: "1:961559368832:web:5708eff48874e4c76f8265"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider }; 