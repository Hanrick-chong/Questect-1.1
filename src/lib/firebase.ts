import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, getDocs, collection, query, where, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.setCustomParameters({
  'display': 'popup'
});

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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
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
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function applyInvitationCode(code: string, userId: string) {
  try {
    // Check if user already has active pilot access
    const userDoc = await getDocFromServer(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (isTeacherPilotActive(userData)) {
        throw new Error('pilot_error_already_active');
      }
    }

    const q = query(collection(db, 'invitation_codes'), where('code', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('pilot_error_invalid');
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data();

    if (codeData.status === 'disabled') {
      throw new Error('pilot_error_disabled');
    }

    if (codeData.status === 'inactive' || (codeData.isSingleUse && codeData.usedAt)) {
      throw new Error('pilot_error_used');
    }

    if (codeData.expiresAt) {
      const expiresAt = new Date(codeData.expiresAt);
      if (new Date() > expiresAt) {
        throw new Error('pilot_error_expired');
      }
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (codeData.durationDays || 30));

    // Update User Profile
    await updateDoc(doc(db, 'users', userId), {
      teacherPilotAccess: true,
      teacherPilotStartDate: startDate.toISOString(),
      teacherPilotEndDate: endDate.toISOString(),
      teacherPilotDailyLimit: codeData.dailyLimit || 20,
      teacherPilotDailyUsage: 0,
      teacherPilotLastUsageDate: startDate.toISOString().split('T')[0],
      teacherPilotUnlockedFeatures: codeData.unlockedFeatures || ['premium_dashboard']
    });

    // Mark code as used if single use
    if (codeData.isSingleUse) {
      await updateDoc(doc(db, 'invitation_codes', codeDoc.id), {
        status: 'inactive',
        usedAt: serverTimestamp(),
        assignedToUser: userId
      });
    }

    return { success: true, endDate };
  } catch (error) {
    console.error('Error applying invitation code:', error);
    throw error;
  }
}

export function isTeacherPilotActive(userProfile: any) {
  if (!userProfile?.teacherPilotAccess) return false;
  
  const endDate = new Date(userProfile.teacherPilotEndDate);
  const now = new Date();
  
  return now <= endDate;
}

export async function incrementPilotUsage(userId: string, userProfile: any) {
  if (!isTeacherPilotActive(userProfile)) return;

  const today = new Date().toISOString().split('T')[0];
  const lastUsageDate = userProfile.teacherPilotLastUsageDate;

  if (lastUsageDate !== today) {
    // Reset for new day
    await updateDoc(doc(db, 'users', userId), {
      teacherPilotDailyUsage: 1,
      teacherPilotLastUsageDate: today
    });
  } else {
    // Increment
    await updateDoc(doc(db, 'users', userId), {
      teacherPilotDailyUsage: increment(1)
    });
  }
}

async function testConnection() {
  try {
    // Attempt to fetch a non-existent doc to test connection
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Other errors are expected since the doc doesn't exist or permissions might deny it
  }
}

testConnection();
