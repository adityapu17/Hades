// ===== Changelog page: hasil sync Git + edit manual admin (disimpan di Firestore) =====
import { saveChangelogEntry, resetChangelogEntry } from '../utils/data.js';
import { loadMerged } from '../utils/changelog.js';
import { showToast, openModal, closeModal } from './ui.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TYPES = ['feat', 'fix', 'refactor', 'docs', 'chore'];

let entries = new Map(); // version -> entry yang sedang tampil

function entryHtml(c, isAdmin) {
  const dateStr = new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const typeClass = TYPES.includes(c.type) ? c.type : 'chore';
  const adminBtns = isAdmin ? `
    <span style="margin-left:auto;display:flex;gap:5px">
      <button class="btn btn-ghost btn-sm" onclick="editChangelog('${esc(c.version)}')">Edit</button>
      ${c.edited ? `<button class="btn btn-sm" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7" onclick="resetChangelog('${esc(c.version)}')">Kembalikan ke Git</button>` : ''}
    </span>` : '';
  const note = isAdmin && c.edited && c.missing?.length
    ? `<div style="margin-top:8px;font-size:12px;color:#92400e;background:#fef3c7;padding:6px 10px;border-radius:8px">⚠ ${c.missing.length} commit baru dari Git belum ada di versi ini (klik Edit → "Gabungkan commit baru").</div>` : '';
  return `
    <div class="changelog-entry">
      <div class="changelog-entry-header">
        <span class="changelog-version">v${esc(c.label)}</span>
        <span class="changelog-date">${dateStr}</span>
        <span class="changelog-type ${typeClass}">${typeClass}</span>
        ${c.edited ? '<span style="font-size:11px;color:#718096">✎ diedit admin</span>' : ''}
        ${adminBtns}
      </div>
      <div class="changelog-entry-body"><ul>${(c.changes || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${note}</div>
    </div>`;
}

export async function renderChangelog() {
  const list = await loadMerged(true);
  entries = new Map(list.map(e => [e.version, e]));
  const isAdmin = window.currentUser?.role === 'admin';
  return `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin-bottom:8px">📋 Changelog</h1>
      <p style="color:#718096;font-size:13px">Riwayat perubahan Hades KB — disinkronkan dari Git history${isAdmin ? '. Versi yang kamu edit tidak akan ditimpa sync berikutnya.' : ''}</p>
    </div>
    <div class="changelog-list">${list.map(c => entryHtml(c, isAdmin)).join('')}</div>`;
}

function ensureModal() {
  if (document.getElementById('changelogEditorModal')) return;
  const el = document.createElement('div');
  el.className = 'modal-overlay';
  el.id = 'changelogEditorModal';
  el.innerHTML = `
    <div class="modal" style="max-width:560px">
      <div class="modal-header">
        <div class="modal-title" id="clTitle">Edit Changelog</div>
        <button class="modal-close" onclick="closeModal('changelogEditorModal')">✕</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:10px">
          <div class="form-group" style="flex:1"><label class="form-label">Tanggal</label><input type="date" id="clDate" class="form-input"/></div>
          <div class="form-group" style="flex:1"><label class="form-label">Tipe</label>
            <select id="clType" class="form-input">${TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select></div>
        </div>
        <div class="form-group"><label class="form-label">Isi perubahan (satu baris = satu poin)</label>
          <textarea id="clChanges" class="form-input" rows="10"></textarea></div>
        <button class="btn btn-ghost btn-sm" id="clMerge" type="button" onclick="mergeChangelogGit()" style="display:none">+ Gabungkan commit baru dari Git</button>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal('changelogEditorModal')">Batal</button>
        <button class="btn btn-primary" onclick="saveChangelog()">Simpan</button>
      </div>
    </div>`;
  document.body.appendChild(el);
}

let editingVersion = null;

window.editChangelog = (version) => {
  const e = entries.get(version);
  if (!e) return;
  ensureModal();
  editingVersion = version;
  document.getElementById('clTitle').textContent = 'Edit v' + e.label;
  document.getElementById('clDate').value = String(e.date).slice(0, 10);
  document.getElementById('clType').value = TYPES.includes(e.type) ? e.type : 'chore';
  document.getElementById('clChanges').value = (e.changes || []).join('\n');
  document.getElementById('clMerge').style.display = e.edited && e.missing?.length ? '' : 'none';
  openModal('changelogEditorModal');
};

window.mergeChangelogGit = () => {
  const e = entries.get(editingVersion);
  if (!e?.missing?.length) return;
  const ta = document.getElementById('clChanges');
  ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + e.missing.join('\n');
  document.getElementById('clMerge').style.display = 'none';
};

window.saveChangelog = async () => {
  const changes = document.getElementById('clChanges').value.split('\n').map(s => s.trim()).filter(Boolean);
  const date = document.getElementById('clDate').value;
  if (!date || !changes.length) { alert('Tanggal dan minimal satu poin perubahan wajib diisi.'); return; }
  try {
    await saveChangelogEntry({ version: editingVersion, date, type: document.getElementById('clType').value, changes });
    closeModal('changelogEditorModal');
    showToast('Changelog disimpan ✓');
    location.reload();
  } catch (e) { alert('Gagal menyimpan: ' + e.message); }
};

window.resetChangelog = async (version) => {
  if (!confirm(`Kembalikan v${entries.get(version)?.label || version} ke hasil sync Git? Edit manual akan hilang.`)) return;
  try {
    await resetChangelogEntry(version);
    showToast('Dikembalikan ke versi Git ✓');
    location.reload();
  } catch (e) { alert('Gagal: ' + e.message); }
};
