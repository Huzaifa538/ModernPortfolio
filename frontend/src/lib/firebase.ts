import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type Auth, type User } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCS__XZ120IBcTSHWepqRy1hQpjS5_WG3c',
  authDomain: 'modern-portfolio-chat.firebaseapp.com',
  projectId: 'modern-portfolio-chat',
  storageBucket: 'modern-portfolio-chat.firebasestorage.app',
  messagingSenderId: '591630997208',
  appId: '1:591630997208:web:94a65c5c56707df1f629ad',
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

try {
  app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch {
  // Firebase misconfigured — chat widget will hide itself.
}

const googleProvider = new GoogleAuthProvider()

/** Sign in with Google popup. Returns the user or throws. */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured')
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  if (auth) await signOut(auth)
}

export { auth, db }
export const isFirebaseReady = () => !!db
