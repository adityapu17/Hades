// ===== Authentication =====
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { loadUserProfile } from './user.js';
import { seedIfEmpty, startListeners } from './data.js';
import { setCurrentUser, setAppShown } from './state.js';
import { setLoading } from '../components/ui.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderTopbar } from '../components/topbar.js';
import { renderAll } from '../components/pageRenderer.js';

let authResolved = false;

function show(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}

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

// Swap the "Memuat sesi…" / login screen for the real app
function enterApp(profile) {
  renderTopbar(profile);
  renderSidebar();
  show('authLoading', 'none');
  show('loginPage', 'none');
  show('appShell', 'block');
  setAppShown(true);
  renderAll(); // renders whatever the current #hash points to (defaults to home)
}

// Auth state observer
export function initAuth() {
  // Fallback: if Firebase never answers, show the login form instead of spinning forever
  setTimeout(() => {
    if (!authResolved) {
      console.warn('[Hades] Cek sesi Firebase timeout >4s, fallback ke form login.');
      showLoginPage();
    }
  }, 4000);

  onAuthStateChanged(auth, async (fbUser) => {
    authResolved = true;

    if (!fbUser) {
      showLoginPage();
      return;
    }

    try {
      setLoading(40);
      const profile = await loadUserProfile(fbUser.uid, fbUser.email);
      setCurrentUser(profile);
      enterApp(profile);
      setLoading(60);
      await seedIfEmpty();
      setLoading(80);
      // Avoid stacking listeners if this callback fires more than once
      if (window.unsubArticles) window.unsubArticles();
      if (window.unsubMenus) window.unsubMenus();
      startListeners();
    } catch (e) {
      console.error('[Hades] Gagal load profil/data setelah restore sesi:', e);
      await fbSignOut(auth);
      setCurrentUser(null);
      setAppShown(false);
      setLoading(0);
      showLoginPage();
      if (e.code === 'hades/disabled') {
        const err = document.getElementById('loginError');
        if (err) { err.textContent = 'Akun ini sudah dinonaktifkan. Hubungi admin.'; err.style.display = 'block'; }
      }
    }
  }, (err) => {
    console.error('[Hades] onAuthStateChanged error:', err);
    showLoginPage();
  });
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  if (!loginPage) {
    // Secondary pages (/pages/*.html) have no login form; the root page does.
    window.location.replace('/');
    return;
  }

  show('authLoading', 'none');
  show('loginPage', 'flex');
  show('appShell', 'none');
  show('adminMenuSection', 'none');

  ['loginUser', 'loginPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.textContent = 'Masuk'; btn.disabled = false; }
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
