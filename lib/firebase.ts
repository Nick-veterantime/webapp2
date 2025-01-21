import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

let app;
let auth;
let googleProvider;

async function initializeFirebase() {
  if (!getApps().length) {
    try {
      const response = await fetch('/api/firebase-config');
      const firebaseConfig = await response.json();
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  } else {
    app = getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }
}

// Initialize Firebase on the client side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export { auth, googleProvider };