import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhRmISrUcDukByg4TtrhHGwBlTnxAA2tI",
  authDomain: "peruri-helpdesk-kb.firebaseapp.com",
  projectId: "peruri-helpdesk-kb",
  storageBucket: "peruri-helpdesk-kb.firebasestorage.app",
  messagingSenderId: "91175065196",
  appId: "1:91175065196:web:ed68b1126587199f6d2a49"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore helpers
export const col = (name) => collection(db, name);
export const document = (colName, id) => doc(db, colName, id);
export const qOrdered = (colName, field = 'order') => query(collection(db, colName), orderBy(field));