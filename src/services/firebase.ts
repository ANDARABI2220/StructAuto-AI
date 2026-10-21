/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Firebase Client Initialization & Firestore Service
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, setDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CsmProject } from '../types/csm.ts';

// 1. Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Critical error handling matching FirestoreErrorInfo from skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is limited.');
    }
    return false;
  }
}

// Execute connection test on startup
testConnection();

// 4. Auth helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync profile
    if (result.user) {
      await setDoc(
        doc(db, 'users', result.user.uid),
        {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'کاربر سیستم',
          photoURL: result.user.photoURL || '',
          role: 'structural_engineer',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    return result.user;
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// 5. Data persistence helpers
export async function saveProjectToFirestore(project: CsmProject): Promise<void> {
  if (!auth.currentUser) return;
  const path = `projects/${project.id}`;
  try {
    await setDoc(doc(db, 'projects', project.id), {
      ...project,
      ownerId: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserProjects(): Promise<CsmProject[]> {
  if (!auth.currentUser) return [];
  const path = 'projects';
  try {
    const q = query(collection(db, 'projects'), where('ownerId', '==', auth.currentUser.uid));
    const querySnapshot = await getDocs(q);
    const projects: CsmProject[] = [];
    querySnapshot.forEach((docSnap) => {
      projects.push(docSnap.data() as CsmProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Realtime listener for Firestore projects collection
 */
export function subscribeToUserProjects(
  callback: (projects: CsmProject[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const path = 'projects';
  const q = query(collection(db, 'projects'), where('ownerId', '==', auth.currentUser.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CsmProject[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CsmProject);
      });
      callback(list);
    },
    (error) => {
      console.warn('Realtime subscription fallback error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
