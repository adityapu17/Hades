import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Same Firebase project as Hades KB (keep in sync with ../src/utils/firebase.js).
// A web config is public by design; who can read/write what is enforced by firestore.rules (repo root).
const firebaseConfig = {
  apiKey: "AIzaSyBhRmISrUcDukByg4TtrhHGwBlTnxAA2tI",
  authDomain: "peruri-helpdesk-kb.firebaseapp.com",
  projectId: "peruri-helpdesk-kb",
  storageBucket: "peruri-helpdesk-kb.firebasestorage.app",
  messagingSenderId: "91175065196",
  appId: "1:91175065196:web:ed68b1126587199f6d2a49"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
