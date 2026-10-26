// ===== User Profile =====
import { db, document, col } from './firebase.js';
import { getDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

export async function loadUserProfile(uid, email) {
  let snap = await getDoc(document('users', uid));
  if (!snap.exists()) {
    const all = await getDocs(col('users'));
    const role = all.empty ? 'admin' : 'member';
    const name = email.split('@')[0];
    await setDoc(document('users', uid), { name, role, initials: name.slice(0, 2).toUpperCase(), email });
    snap = await getDoc(document('users', uid));
  }
  const profile = snap.data();
  return { name: profile.name, role: profile.role, initials: profile.initials, uid, email: profile.email || email };
}