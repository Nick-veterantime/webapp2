import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { State } from './constants';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Initialize Firebase if not already initialized
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

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
  
  db = getFirestore(app);
  auth = getAuth(app);
}

// Initialize Firebase on the client side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export interface UserData {
  branch: string;
  rankCategory: string;
  rank: string;
  jobCode: string;
  careerGoal: string;
  educationLevel?: string;
  locationPreference: string;
  locationType?: 'CONUS' | 'OCONUS';
  location?: string;
  consideringAreas?: State[];
  locationAdditionalInfo?: string;
  separationDate: string; // Store as ISO string
  createdAt?: string;
}

export async function updateUserData(userData: Partial<UserData>) {
  if (!auth?.currentUser) {
    throw new Error('No user is signed in');
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const now = new Date().toISOString();
    
    // Get existing data first
    const userDoc = await getDoc(userRef);
    const existingData = userDoc.exists() ? userDoc.data() as UserData : null;
    
    // Filter out undefined values
    const cleanedUserData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );

    await setDoc(userRef, {
      ...existingData,
      ...cleanedUserData,
      updatedAt: now,
      // Only set createdAt if this is a new document
      ...(existingData ? {} : { createdAt: now })
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

export async function getUserData(): Promise<UserData | null> {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data() as UserData;
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
} 