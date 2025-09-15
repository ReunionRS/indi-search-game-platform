// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase';

export type UserType = 'developer' | 'company';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: UserType;
  createdAt: any;
  updatedAt: any;
  // Developer fields
  bio?: string;
  website?: string;
  location?: string;
  skills?: string[];
  // Company fields
  companyName?: string;
  contactPerson?: string;
  companyWebsite?: string;
  verified?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, userType: UserType, additionalData?: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (userType: UserType) => Promise<void>;
  loginWithGithub: (userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function createUserProfile(user: User, userType: UserType, additionalData: any = {}) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = serverTimestamp();

      const profileData: Partial<UserProfile> = {
        uid: user.uid,
        displayName: displayName || '',
        email: email || '',
        photoURL: photoURL || '',
        userType,
        createdAt,
        updatedAt: createdAt,
        ...additionalData
      };

      await setDoc(userRef, profileData);
      return profileData as UserProfile;
    }

    return userSnap.data() as UserProfile;
  }

  async function fetchUserProfile(uid: string) {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      setUserProfile(userSnap.data() as UserProfile);
    }
  }

  async function signup(email: string, password: string, userType: UserType, additionalData: any = {}) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (additionalData.displayName) {
      await updateProfile(user, { displayName: additionalData.displayName });
    }

    await createUserProfile(user, userType, additionalData);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle(userType: UserType) {
    const { user } = await signInWithPopup(auth, googleProvider);
    await createUserProfile(user, userType);
  }

  async function loginWithGithub(userType: UserType) {
    const { user } = await signInWithPopup(auth, githubProvider);
    await createUserProfile(user, userType);
  }

  async function logout() {
    setUserProfile(null);
    await signOut(auth);
  }

  async function updateUserProfile(data: Partial<UserProfile>) {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(userRef, updateData);
    
    // Update local state
    if (userProfile) {
      setUserProfile({ ...userProfile, ...updateData });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    loginWithGithub,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}