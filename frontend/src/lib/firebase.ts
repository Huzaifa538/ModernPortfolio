import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'
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
  // Sign in anonymously so Firestore rules (request.auth != null) pass.
  signInAnonymously(auth).catch(() => {
    // Anonymous auth failing just means chat won't connect; the site still works.
  })
} catch {
  // Firebase misconfigured — chat widget will hide itself.
}

export { auth, db }
export const isFirebaseReady = () => !!db
