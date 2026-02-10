import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY environment variable. Please check your .env file.");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Check if emulators are already connected
  // This is a bit of a hack to avoid re-connecting on hot reloads
  const anyAuth = auth as any;
  if (!anyAuth._isEmulator) {
    try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch (e) {
        console.warn("Error connecting to Firebase emulators. This is normal if they are not running.");
    }
  }
}

const signOut = () => firebaseSignOut(auth);

export { 
  auth, 
  db, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};
