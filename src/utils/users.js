// ===== User management (admin) =====
// Profiles live in Firestore `users/{uid}` ({ name, role, initials, email, disabled? }).
//
// Browser limits worth knowing:
//  - Creating an Auth account from the client signs the creator in as the new user, so we create it on a
//    short-lived secondary Firebase app instead; the admin session on the main app stays untouched.
//  - A client can't delete OTHER people's Auth accounts (needs the Admin SDK). "Delete" is therefore
//    `disabled: true` on the profile: that user is refused at login (see user.js) and can be re-enabled.
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getDoc, getDocs, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { auth, col, document as docRef, firebaseConfig } from './firebase.js';

const initialsOf = (name) => name.replace(/\s+/g, '').slice(0, 2).toUpperCase() || '??';

export async function listUsers() {
  const snap = await getDocs(col('users'));
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

export async function createUser({ name, email, password, role }) {
  const secondary = initializeApp(firebaseConfig, 'user-admin-' + Date.now());
  let uid;
  let linkedExisting = false;
  try {
    const secondaryAuth = getAuth(secondary);
    try {
      uid = (await createUserWithEmailAndPassword(secondaryAuth, email, password)).user.uid;
    } catch (e) {
      if (e.code !== 'auth/email-already-in-use') throw e;
      // The login may already exist (e.g. created by hand in the Firebase Console) without a Hades profile.
      // If the password given is that account's current one, link it instead of failing.
      try {
        uid = (await signInWithEmailAndPassword(secondaryAuth, email, password)).user.uid;
        linkedExisting = true;
      } catch { throw e; }
    }
    await signOut(secondaryAuth);
  } finally {
    await deleteApp(secondary);
  }
  if (linkedExisting && (await getDoc(docRef('users', uid))).exists()) {
    throw Object.assign(new Error('User ini sudah terdaftar di Hades. Cek daftar user (mungkin berstatus nonaktif).'), { code: 'hades/already-registered' });
  }
  // Written with the admin's own session (main app), so Firestore rules see the admin.
  await setDoc(docRef('users', uid), { name, role, initials: initialsOf(name), email });
  return uid;
}

export async function updateUser(uid, { name, role }) {
  await updateDoc(docRef('users', uid), { name, role, initials: initialsOf(name) });
}

export async function setUserDisabled(uid, disabled) {
  await updateDoc(docRef('users', uid), { disabled });
}

export async function sendReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export function friendlyError(e) {
  const map = {
    'auth/email-already-in-use': 'Email sudah ada di Firebase. Kalau ini akun lama yang belum punya profil Hades, isi dengan password akun itu yang sekarang agar dihubungkan. Kalau user pernah dinonaktifkan, aktifkan lagi dari daftar.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter).',
    'auth/operation-not-allowed': 'Pendaftaran Email/Password dimatikan di Firebase Console (Authentication → Sign-in method).',
    'auth/network-request-failed': 'Koneksi bermasalah, coba lagi.',
    'permission-denied': 'Ditolak oleh Firestore Rules. Pastikan admin boleh membaca/menulis koleksi "users".'
  };
  return map[e?.code] || (e?.message || 'Terjadi kesalahan.');
}
