// ===== Authentication =====
import { auth } from './firebase.js';
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { loadUserProfile } from './user.js';
import { seedIfEmpty, startListeners } from './data.js';
import { setCurrentUser, setAppShown } from './state.js';
import { setLoading } from '../components/ui.js';
import { renderSidebar } from '../components/sidebar.js';
import { renderTopbar } from '../components/topbar.js';
import { renderAll } from '../components/pageRenderer.js';

let authResolved = false;

// 'pending' = restoring session, 'in' = signed in with a Hades profile, 'out' = show login (read by router.js)
window.authState = 'pending';

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
  setMsg('loginInfo', '');
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
  window.authState = 'in';
  // Fresh login (or opening the bare URL / #login) always lands on #home; a refresh keeps the current page
  const h = window.location.hash.slice(1);
  if (h === '' || h === 'login') window.history.replaceState(null, '', '#home');
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
      const reason = {
        'hades/disabled': 'Akun ini sudah dinonaktifkan. Hubungi admin.',
        'hades/not-registered': 'Akun ini belum terdaftar di Hades. Hubungi admin untuk dibuatkan akun.'
      }[e.code];
      if (reason) setMsg('loginError', reason);
    }
  }, (err) => {
    console.error('[Hades] onAuthStateChanged error:', err);
    showLoginPage();
  });
}

function setMsg(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.style.display = text ? 'block' : 'none';
}

// ----- Forgot password (sign-up is NOT offered here: accounts are created by an admin in "Kelola User") -----
export function showForgot() {
  setMsg('loginError', ''); setMsg('loginInfo', '');
  show('loginForm', 'none');
  show('forgotForm', 'block');
  const email = document.getElementById('forgotEmail');
  if (email) { email.value = document.getElementById('loginUser')?.value?.trim() || ''; email.focus(); }
}

export function hideForgot() {
  setMsg('loginError', ''); setMsg('loginInfo', '');
  show('forgotForm', 'none');
  show('loginForm', 'block');
}

export async function doReset() {
  const email = document.getElementById('forgotEmail')?.value?.trim().toLowerCase();
  const btn = document.getElementById('forgotBtn');
  setMsg('loginError', ''); setMsg('loginInfo', '');
  if (!email) return setMsg('loginError', 'Email wajib diisi.');

  if (btn) { btn.textContent = 'Mengirim...'; btn.disabled = true; }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e) {
    const known = {
      'auth/invalid-email': 'Format email tidak valid.',
      'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
      'auth/network-request-failed': 'Koneksi bermasalah, coba lagi.'
    }[e.code];
    if (known) {
      setMsg('loginError', known);
      if (btn) { btn.textContent = 'Kirim Link Reset'; btn.disabled = false; }
      return;
    }
    // Any other error (e.g. unknown email) gets the same reply, so this form can't be used to probe which emails exist
  }
  setMsg('loginInfo', 'Jika email terdaftar, link untuk membuat password baru sudah dikirim. Cek inbox atau folder spam.');
  if (btn) { btn.textContent = 'Kirim Link Reset'; btn.disabled = false; }
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  if (!loginPage) {
    // Secondary pages (/pages/*.html) have no login form; the root page does.
    window.location.replace('/');
    return;
  }

  window.authState = 'out';
  if (window.location.hash !== '#login') window.history.replaceState(null, '', '#login');
  hideForgot();

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
window.showForgot = showForgot;
window.hideForgot = hideForgot;
window.doReset = doReset;

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const loginPage = document.getElementById('loginPage');
    if (loginPage && loginPage.style.display !== 'none') {
      const forgotOpen = document.getElementById('forgotForm')?.style.display === 'block';
      forgotOpen ? doReset() : doLogin();
    }
  }
});
