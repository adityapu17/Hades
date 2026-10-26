// ===== Authentication =====
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { loadUserProfile } from './user.js';
import { seedIfEmpty, startListeners } from './data.js';
import { setCurrentUser, setAppShown } from './state.js';
import { showToast, setLoading } from '../components/ui.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderTopbar } from '../components/topbar.js';

let authResolved = false;

// Login form handler
export async function doLogin() {
  const u = document.getElementById('loginUser')?.value?.trim();
  const p = document.getElementById('loginPass')?.value;
  const err = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  if (!u || !p) {
    if (err) { err.textContent = 'Email dan password wajib diisi.'; err.style.display = 'block'; }
    return;
  }

  if (btn) { btn.textContent = 'Memuat...'; btn.disabled = true; }
  if (err) { err.style.display = 'none'; }
  setLoading(20);

  try {
    await signInWithEmailAndPassword(auth, u, p);
    // Rest handled by onAuthStateChanged
  } catch (e) {
    let msg = 'Gagal login.';
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(e.code)) {
      msg = 'Email atau password salah.';
    }
    if (err) { err.textContent = msg; err.style.display = 'block'; }
    if (btn) { btn.textContent = 'Masuk'; btn.disabled = false; }
    setLoading(0);
  }
}

// Logout handler
export function doLogout() {
  if (window.unsubArticles) window.unsubArticles();
  if (window.unsubMenus) window.unsubMenus();
  fbSignOut(auth);
  setCurrentUser(null);
  setAppShown(false);
  showLoginPage();
}

// Auth state observer
export function initAuth() {
  // Timeout fallback
  setTimeout(() => {
    if (!authResolved) {
      console.warn('[Hades] Cek sesi Firebase timeout >4s, fallback ke form login.');
      const authLoading = document.getElementById('authLoading');
      const loginPage = document.getElementById('loginPage');
      if (authLoading) authLoading.style.display = 'none';
      if (loginPage) loginPage.style.display = 'flex';
    }
  }, 4000);

  onAuthStateChanged(auth, async (fbUser) => {
    authResolved = true;
    const authLoading = document.getElementById('authLoading');
    if (authLoading) authLoading.style.display = 'none';

    if (fbUser) {
      try {
        setLoading(40);
        const profile = await loadUserProfile(fbUser.uid, fbUser.email);
        setCurrentUser(profile);
        setLoading(60);
        await seedIfEmpty();
        setLoading(80);
        startListeners();
      } catch (e) {
        console.error('[Hades] Gagal load profil/data setelah restore sesi:', e);
        await fbSignOut(auth);
        setCurrentUser(null);
        setLoading(0);
        showLoginPage();
      }
    } else {
      showLoginPage();
    }
  }, (err) => {
    console.error('[Hades] onAuthStateChanged error:', err);
    const authLoading = document.getElementById('authLoading');
    const loginPage = document.getElementById('loginPage');
    if (authLoading) authLoading.style.display = 'none';
    if (loginPage) loginPage.style.display = 'flex';
  });
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  const appShell = document.getElementById('appShell');
  if (loginPage) loginPage.style.display = 'flex';
  if (appShell) appShell.style.display = 'none';
  ['loginUser', 'loginPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const adminMenuSection = document.getElementById('adminMenuSection');
  if (adminMenuSection) adminMenuSection.style.display = 'none';
}

export function onAuthReady(callback) {
  if (authResolved && auth.currentUser) {
    callback();
  } else {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        callback();
      }
    });
  }
}

// Expose globally for inline handlers
window.doLogin = doLogin;
window.doLogout = doLogout;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginPage = document.getElementById('loginPage');
    if (loginPage && loginPage.style.display !== 'none') {
      doLogin();
    }
  }
});