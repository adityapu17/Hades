// ===== User Profile =====
// A Hades account = a Firebase Auth login + a profile doc `users/{uid}` created by an admin ("Kelola User").
// Having only an Auth login is not enough: nobody can register themselves.
import { document } from './firebase.js';
import { getDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

export async function loadUserProfile(uid, email) {
  const snap = await getDoc(document('users', uid));
  if (!snap.exists()) {
    throw Object.assign(new Error('Akun belum terdaftar'), { code: 'hades/not-registered' });
  }
  const profile = snap.data();
  if (profile.disabled) {
    // Deactivated from "Kelola User": refuse the session (auth.js signs out and shows the message)
    throw Object.assign(new Error('Akun dinonaktifkan'), { code: 'hades/disabled' });
  }
  return { name: profile.name, role: profile.role, initials: profile.initials, uid, email: profile.email || email };
}
