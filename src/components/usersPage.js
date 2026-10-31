// ===== "Kelola User" page (admin only) =====
import { listUsers, createUser, updateUser, setUserDisabled, sendReset, friendlyError } from '../utils/users.js';
import { openModal, closeModal, showToast } from './ui.js';

let cache = null;        // last loaded users (null = not loaded yet)
let loadError = null;
let editingUid = null;   // null = creating a new user

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const me = () => window.currentUser;
const isAdmin = () => me()?.role === 'admin';
const activeAdmins = () => (cache || []).filter(u => u.role === 'admin' && !u.disabled);

export function renderUsersPage() {
  if (!isAdmin()) return '<div class="empty">Hanya admin yang dapat mengelola user.</div>';
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div class="section-title" style="margin:0">👥 Kelola User</div>
      <button class="btn btn-primary" onclick="openUserEditor()">+ User Baru</button>
    </div>
    <div style="font-size:12px;color:#718096;margin-bottom:14px">
      User yang dinonaktifkan tidak bisa login, tapi akunnya tetap ada di Firebase dan bisa diaktifkan lagi.
    </div>
    <div id="userList">${renderUserList()}</div>
  `;
}

function renderUserList() {
  if (loadError) return `<div class="empty">Gagal memuat user: ${esc(loadError)}</div>`;
  if (!cache) return '<div class="empty">Memuat...</div>';
  if (!cache.length) return '<div class="empty">Belum ada user</div>';

  const active = cache.filter(u => !u.disabled);
  const inactive = cache.filter(u => u.disabled);
  return active.map(userRow).join('') +
    (inactive.length
      ? `<div class="section-title" style="margin-top:22px">Nonaktif</div>` + inactive.map(userRow).join('')
      : '');
}

function userRow(u) {
  const self = u.uid === me()?.uid;
  const role = u.role === 'admin' ? 'Admin' : 'Member';
  const badge = `<span class="badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}" style="display:inline-block">${role}</span>`;
  const uid = esc(u.uid);
  const buttons = u.disabled
    ? `<button class="btn btn-ghost btn-sm" onclick="toggleUserDisabled('${uid}', false)">Aktifkan</button>`
    : `<button class="btn btn-ghost btn-sm" onclick="openUserEditor('${uid}')">Edit</button>
       <button class="btn btn-ghost btn-sm" onclick="resetUserPassword('${uid}')">Reset Password</button>
       ${self ? '' : `<button class="btn btn-sm" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7" onclick="toggleUserDisabled('${uid}', true)">Nonaktifkan</button>`}`;
  return `
    <div class="article-card" style="cursor:default${u.disabled ? ';opacity:.65' : ''}">
      <div style="min-width:0">
        <div class="article-title">${esc(u.name)}${self ? ' <span style="font-size:11px;color:#a0aec0;font-weight:400">(Anda)</span>' : ''}</div>
        <div class="article-meta">${esc(u.email)} · ${badge}</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">${buttons}</div>
    </div>`;
}

function paintList() {
  const el = document.getElementById('userList');
  if (el) el.innerHTML = renderUserList();
}

export async function refreshUsers() {
  if (!isAdmin()) return;
  try {
    cache = await listUsers();
    loadError = null;
  } catch (e) {
    console.error('[Hades] Gagal memuat daftar user:', e);
    loadError = friendlyError(e);
  }
  paintList();
}

// ----- editor modal -----
function setEditorError(msg) {
  const el = document.getElementById('userEditorError');
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
}

export function openUserEditor(uid) {
  const u = uid ? (cache || []).find(x => x.uid === uid) : null;
  if (uid && !u) return;
  editingUid = u ? u.uid : null;
  const self = !!u && u.uid === me()?.uid;

  document.getElementById('userEditorTitle').textContent = u ? 'Edit User' : 'User Baru';
  document.getElementById('userName').value = u ? u.name : '';
  const email = document.getElementById('userEmail');
  email.value = u ? u.email : '';
  email.disabled = !!u; // the email is the Firebase login id, it can't be changed from here
  document.getElementById('userPassGroup').style.display = u ? 'none' : 'block';
  document.getElementById('userPass').value = '';
  const role = document.getElementById('userRole');
  role.value = u ? (u.role === 'admin' ? 'admin' : 'member') : 'member';
  role.disabled = self; // nobody demotes themselves (avoids locking the team out of admin)
  document.getElementById('userRoleHint').style.display = self ? 'block' : 'none';
  setEditorError('');
  openModal('userEditorModal');
}

export function generateUserPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  document.getElementById('userPass').value = Array.from(bytes, b => chars[b % chars.length]).join('');
}

export async function saveUser() {
  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim().toLowerCase();
  const password = document.getElementById('userPass').value;
  const role = document.getElementById('userRole').value === 'admin' ? 'admin' : 'member';

  if (!name) return setEditorError('Nama wajib diisi.');
  if (!editingUid) {
    if (!email) return setEditorError('Email wajib diisi.');
    if (password.length < 6) return setEditorError('Password minimal 6 karakter.');
  } else {
    const current = cache.find(u => u.uid === editingUid);
    if (current?.role === 'admin' && role !== 'admin' && activeAdmins().length <= 1) {
      return setEditorError('Harus ada minimal satu admin aktif.');
    }
  }

  const btn = document.getElementById('saveUserBtn');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  setEditorError('');
  try {
    if (editingUid) await updateUser(editingUid, { name, role });
    else await createUser({ name, email, password, role });
    closeModal('userEditorModal');
    showToast(editingUid ? 'User diperbarui ✓' : 'User ditambahkan ✓');
    await refreshUsers();
  } catch (e) {
    console.error('[Hades] Gagal menyimpan user:', e);
    setEditorError(friendlyError(e));
  } finally {
    btn.disabled = false; btn.textContent = 'Simpan';
  }
}

// ----- row actions -----
export async function toggleUserDisabled(uid, disable) {
  const u = (cache || []).find(x => x.uid === uid);
  if (!u) return;
  if (disable) {
    if (uid === me()?.uid) return showToast('Anda tidak bisa menonaktifkan akun sendiri');
    if (u.role === 'admin' && activeAdmins().length <= 1) return showToast('Harus ada minimal satu admin aktif');
    if (!confirm(`Nonaktifkan ${u.name}? User ini tidak akan bisa login lagi sampai diaktifkan kembali.`)) return;
  }
  try {
    await setUserDisabled(uid, disable);
    showToast(disable ? 'User dinonaktifkan ✓' : 'User diaktifkan ✓');
    await refreshUsers();
  } catch (e) {
    console.error('[Hades] Gagal mengubah status user:', e);
    alert('Gagal: ' + friendlyError(e));
  }
}

export async function resetUserPassword(uid) {
  const u = (cache || []).find(x => x.uid === uid);
  if (!u) return;
  if (!confirm(`Kirim email reset password ke ${u.email}?`)) return;
  try {
    await sendReset(u.email);
    showToast('Email reset password terkirim ✓');
  } catch (e) {
    console.error('[Hades] Gagal kirim reset password:', e);
    alert('Gagal: ' + friendlyError(e));
  }
}

// Expose for inline onclick handlers
window.openUserEditor = openUserEditor;
window.saveUser = saveUser;
window.generateUserPassword = generateUserPassword;
window.toggleUserDisabled = toggleUserDisabled;
window.resetUserPassword = resetUserPassword;
