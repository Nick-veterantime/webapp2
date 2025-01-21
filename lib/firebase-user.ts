import { auth } from './firebase';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { State } from './constants';

const db = getFirestore();

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
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is signed in');
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();
    
    // Get existing data first
    const userDoc = await getDoc(userRef);
    const existingData = userDoc.exists() ? userDoc.data() as UserData : null;
    
    await setDoc(userRef, {
      ...existingData,
      ...userData,
      updatedAt: now,
      // Only set createdAt if this is a new document
      ...(existingData ? {} : { createdAt: now })
    }, { merge: true });
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

export async function getUserData(): Promise<UserData | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
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