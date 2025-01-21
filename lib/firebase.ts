import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

async function initializeFirebase() {
  if (!getApps().length) {
    try {
      const response = await fetch('/api/firebase-config');
      const firebaseConfig = await response.json();
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  } else {
    app = getApp();
  }
  
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

// Initialize Firebase on the client side
if (typeof window !== 'undefined') {
  initializeFirebase().catch(console.error);
}

export { app, auth, googleProvider, initializeFirebase };