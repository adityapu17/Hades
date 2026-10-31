// ===== Modals Component =====
import { PANELS, TBBTN, EMBED_HINTS } from '../utils/state.js';
import { insertAtCursor, openModal, closeModal } from './ui.js';
import { saveArticle as saveArticleData, saveMenu as saveMenuData } from '../utils/data.js';
import { showToast } from './ui.js';

let pendingImgData = null;
let activeImgTab = 'upload';
let pendingFileData = null;
let pendingFileExt = null;
let editingArticleId = null;
let editingMenuId = null;
let deletingId = null;
let deleteType = null;
const OFFICE_EXT = ['xls', 'xlsx', 'doc', 'docx'];

export function renderModals() {
  const container = document.getElementById('modalsContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- EDITOR MODAL -->
    <div class="modal-overlay" id="editorModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title" id="editorTitle">Artikel Baru</div>
          <button class="modal-close" onclick="closeModal('editorModal')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Judul Artikel</label><input id="artTitle" class="form-input" placeholder="Judul artikel..."/></div>
          <div class="form-group"><label class="form-label">Kategori</label><select id="artCat" class="form-select"></select></div>
          <div id="panelImg" class="insert-panel">
            <div class="insert-panel-title">🖼️ Sisipkan Gambar</div>
            <div class="tab-row">
              <button class="tab-btn active" id="tabUpload" onclick="switchImgTab('upload')">📁 Upload</button>
              <button class="tab-btn" id="tabUrl" onclick="switchImgTab('url')">🔗 URL</button>
            </div>
            <div id="imgTabUpload">
              <div class="upload-area"><input type="file" accept="image/*" onchange="handleImgUpload(this)"/>
                <div class="upload-area-label">📂 Klik atau drag foto<br><span style="font-size:11px;color:#a0aec0">JPG/PNG/GIF/WebP maks. 5MB</span></div>
              </div>
              <div class="img-preview-box" id="uploadPreviewBox"><img id="uploadPreviewImg"/><button class="clear-img" onclick="clearUpload()">✕</button></div>
            </div>
            <div id="imgTabUrl" style="display:none">
              <input id="imgUrlInput" class="form-input" placeholder="https://..." oninput="previewImgUrl(this.value)"/>
              <div class="img-preview-box" id="urlPreviewBox"><img id="urlPreviewImg"/><button class="clear-img" onclick="clearUrl()">✕</button></div>
            </div>
            <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="closePanel('panelImg')">Batal</button>
              <button class="btn btn-primary btn-sm" onclick="insertImg()">Sisipkan</button>
            </div>
          </div>
          <div id="panelLink" class="insert-panel">
            <div class="insert-panel-title">📎 Link Download</div>
            <div class="form-group"><label class="form-label">Nama File</label><input id="dlLabel" class="form-input" placeholder="contoh: Form Eskalasi.xlsx"/></div>
            <div class="form-group"><label class="form-label">URL File</label><input id="dlUrl" class="form-input" placeholder="https://drive.google.com/..."/></div>
            <div style="display:flex;justify-content:flex-end;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="closePanel('panelLink')">Batal</button>
              <button class="btn btn-primary btn-sm" onclick="insertLink()">Sisipkan</button>
            </div>
          </div>
          <div id="panelEmbed" class="insert-panel">
            <div class="insert-panel-title">🔗 Embed</div>
            <div class="form-group"><label class="form-label">Label</label><input id="embedLabel" class="form-input" placeholder="contoh: Jadwal Juli 2025"/></div>
            <div class="form-group"><label class="form-label">URL Embed</label><input id="embedUrl" class="form-input" placeholder="https://docs.google.com/.../pubhtml"/>
              <div id="embedUrlHint" style="font-size:11px;color:#718096;margin-top:5px;padding:6px 10px;background:#f7fafc;border-radius:6px;display:none"></div>
            </div>
            <div class="form-group"><label class="form-label">Ukuran</label>
              <div class="embed-size-row">
                <div><div style="font-size:11px;color:#718096;margin-bottom:4px">Lebar</div><input id="embedW" class="form-input" value="100%"/></div>
                <div><div style="font-size:11px;color:#718096;margin-bottom:4px">Tinggi (px)</div><input id="embedH" class="form-input" value="600"/></div>
                <div><div style="font-size:11px;color:#718096;margin-bottom:4px">Scrollbar</div>
                  <select id="embedScroll" class="form-select"><option value="auto">Auto</option><option value="yes">Tampil</option><option value="no">Sembunyikan</option></select>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                <span style="font-size:11px;color:#718096;line-height:26px">Preset:</span>
                <button class="tb-btn" onclick="setEmbedSize('100%','320')">Kecil</button>
                <button class="tb-btn" onclick="setEmbedSize('100%','480')">Sedang</button>
                <button class="tb-btn" onclick="setEmbedSize('100%','640')">Besar</button>
                <button class="tb-btn" onclick="setEmbedSize('100%','900')">Full</button>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="closePanel('panelEmbed')">Batal</button>
              <button class="btn btn-primary btn-sm" onclick="insertEmbed()">Sisipkan</button>
            </div>
          </div>
          <div id="panelFile" class="insert-panel">
            <div class="insert-panel-title">📄 Upload File (PDF/Excel/Word)</div>
            <div class="upload-area"><input type="file" id="fileUploadInput" accept=".pdf,.xls,.xlsx,.doc,.docx" onchange="handleFileUpload(this)"/>
              <div class="upload-area-label">📂 Klik atau drag file<br><span style="font-size:11px;color:#a0aec0">PDF/XLS/XLSX/DOC/DOCX maks. 500KB</span></div>
            </div>
            <div id="fileUploadPreview" style="display:none;margin-top:8px;padding:9px 12px;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;display:none;align-items:center;justify-content:space-between;gap:8px">
              <span id="fileUploadName" style="color:#2d3748"></span>
              <button class="clear-img" style="position:static" onclick="clearFileUpload()">✕</button>
            </div>
            <div class="form-group" style="margin-top:8px"><label class="form-label">Label / Nama File</label><input id="fileLabel" class="form-input" placeholder="contoh: SOP Eskalasi Q3.pdf"/></div>
            <div id="filePdfHint" style="display:none;font-size:11px;color:#718096;margin-top:2px;padding:6px 10px;background:#f7fafc;border-radius:6px">💡 PDF akan tampil langsung (preview) + tombol download.</div>
            <div id="fileDocHint" style="display:none;font-size:11px;color:#718096;margin-top:2px;padding:6px 10px;background:#f7fafc;border-radius:6px">💡 Excel/Word tidak bisa di-preview, hanya muncul sebagai tombol download.</div>
            <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="closePanel('panelFile')">Batal</button>
              <button class="btn btn-primary btn-sm" onclick="insertFile()">Sisipkan</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Isi Artikel</label>
            <div class="toolbar">
              <button class="tb-btn" onclick="insertSyntax('### ','')">H</button>
              <button class="tb-btn" onclick="insertSyntax('- ','')">• Bullet</button>
              <button class="tb-btn" onclick="insertSyntax('[!] ','')">ℹ️ Catatan</button>
              <button class="tb-btn" id="tbImg" onclick="togglePanel('panelImg')">🖼️ Gambar</button>
              <button class="tb-btn" id="tbLink" onclick="togglePanel('panelLink')">📎 Download</button>
              <button class="tb-btn" id="tbEmbed" onclick="togglePanel('panelEmbed')">🔗 Embed</button>
              <button class="tb-btn" id="tbFile" onclick="togglePanel('panelFile')">📄 Upload File</button>
            </div>
            <textarea id="artBody" class="form-input has-toolbar" placeholder="Tulis isi artikel..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('editorModal')">Batal</button>
          <button class="btn btn-primary" id="saveArticleBtn" onclick="saveArticle()">Simpan Artikel</button>
        </div>
      </div>
    </div>

    <!-- MENU EDITOR -->
    <div class="modal-overlay" id="menuEditorModal">
      <div class="modal" style="max-width:420px">
        <div class="modal-header">
          <div class="modal-title" id="menuEditorTitle">Menu Baru</div>
          <button class="modal-close" onclick="closeModal('menuEditorModal')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">Nama Menu</label><input id="menuName" class="form-input" placeholder="contoh: Prosedur"/></div>
          <div class="form-group"><label class="form-label">Icon (emoji)</label><input id="menuIcon" class="form-input" placeholder="📄" maxlength="4" style="font-size:20px;width:70px"/></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('menuEditorModal')">Batal</button>
          <button class="btn btn-primary" id="saveMenuBtn" onclick="saveMenu()">Simpan Menu</button>
        </div>
      </div>
    </div>

    <!-- PROFILE -->
    <div class="modal-overlay" id="profileModal">
      <div class="modal" style="max-width:360px">
        <div class="modal-header"><div class="modal-title">Profil Saya</div><button class="modal-close" onclick="closeModal('profileModal')">✕</button></div>
        <div class="modal-body" style="text-align:center;padding-top:24px">
          <div class="profile-avatar-lg" id="profileAvatar" style="background:#1a365d"></div>
          <div style="font-size:16px;font-weight:700;color:#1a1a2e;margin-bottom:4px" id="profileName"></div>
          <div style="font-size:12.5px;color:#718096;margin-bottom:12px" id="profileEmail"></div>
          <span class="badge-role" id="profileRoleBadge"></span>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('profileModal')">Tutup</button>
        </div>
      </div>
    </div>

    <!-- DELETE -->
    <div class="modal-overlay" id="deleteModal">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><div class="modal-title" id="deleteModalTitle">Konfirmasi Hapus</div><button class="modal-close" onclick="closeModal('deleteModal')">✕</button></div>
        <div class="modal-body" style="font-size:13px;color:#4a5568" id="deleteModalBody"></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal('deleteModal')">Batal</button>
          <button class="btn btn-danger" onclick="confirmDelete()">Hapus</button>
        </div>
      </div>
    </div>
  `;

  // Setup embed URL hint listener
  const embedUrlInput = document.getElementById('embedUrl');
  if (embedUrlInput) {
    embedUrlInput.addEventListener('input', function() {
      const hint = Object.entries(EMBED_HINTS).find(([k]) => this.value.includes(k));
      const el = document.getElementById('embedUrlHint');
      if (hint) { el.textContent = hint[1]; el.style.display = 'block'; }
      else el.style.display = 'none';
    });
  }

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('open');
  }));
}

// Panel management
export function togglePanel(id) {
  const panel = document.getElementById(id);
  const btn = document.getElementById(TBBTN[id]);
  if (!panel || !btn) return;
  
  const open = panel.classList.contains('show');
  PANELS.forEach(p => {
    const pEl = document.getElementById(p);
    const bEl = document.getElementById(TBBTN[p]);
    if (pEl) pEl.classList.remove('show');
    if (bEl) bEl.classList.remove('active-tb');
  });
  if (!open) {
    panel.classList.add('show');
    btn.classList.add('active-tb');
  }
}

export function closePanel(id) {
  const panel = document.getElementById(id);
  const btn = document.getElementById(TBBTN[id]);
  if (panel) panel.classList.remove('show');
  if (btn) btn.classList.remove('active-tb');
}

// Image handling
export function switchImgTab(tab) {
  activeImgTab = tab;
  const uploadTab = document.getElementById('imgTabUpload');
  const urlTab = document.getElementById('imgTabUrl');
  const tabUploadBtn = document.getElementById('tabUpload');
  const tabUrlBtn = document.getElementById('tabUrl');
  
  if (uploadTab) uploadTab.style.display = tab === 'upload' ? 'block' : 'none';
  if (urlTab) urlTab.style.display = tab === 'url' ? 'block' : 'none';
  if (tabUploadBtn) tabUploadBtn.className = 'tab-btn' + (tab === 'upload' ? ' active' : '');
  if (tabUrlBtn) tabUrlBtn.className = 'tab-btn' + (tab === 'url' ? ' active' : '');
  pendingImgData = null;
}

export function handleImgUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Maks. 5MB.'); input.value = ''; return; }
  const r = new FileReader();
  r.onload = e => {
    pendingImgData = e.target.result;
    const previewImg = document.getElementById('uploadPreviewImg');
    const previewBox = document.getElementById('uploadPreviewBox');
    if (previewImg) previewImg.src = pendingImgData;
    if (previewBox) previewBox.style.display = 'block';
  };
  r.readAsDataURL(file);
}

export function clearUpload() {
  pendingImgData = null;
  const previewBox = document.getElementById('uploadPreviewBox');
  if (previewBox) previewBox.style.display = 'none';
}

export function previewImgUrl(url) {
  if (url.startsWith('http')) {
    pendingImgData = url;
    const previewImg = document.getElementById('urlPreviewImg');
    const previewBox = document.getElementById('urlPreviewBox');
    if (previewImg) previewImg.src = url;
    if (previewBox) previewBox.style.display = 'block';
  } else {
    const previewBox = document.getElementById('urlPreviewBox');
    if (previewBox) previewBox.style.display = 'none';
    pendingImgData = null;
  }
}

export function clearUrl() {
  pendingImgData = null;
  const previewBox = document.getElementById('urlPreviewBox');
  const input = document.getElementById('imgUrlInput');
  if (previewBox) previewBox.style.display = 'none';
  if (input) input.value = '';
}

export function insertImg() {
  if (!pendingImgData) { alert('Pilih atau paste URL gambar dulu.'); return; }
  insertAtCursor(document.getElementById('artBody'), `[img:${pendingImgData}]`);
  clearUpload();
  clearUrl();
  closePanel('panelImg');
}

// File upload
export function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', ...OFFICE_EXT].includes(ext)) {
    alert('Tipe file tidak didukung. Pakai PDF/XLS/XLSX/DOC/DOCX.');
    input.value = '';
    return;
  }
  if (file.size > 500 * 1024) {
    alert('Maks. 500KB karena disimpan langsung di database (Spark plan, belum pakai Storage terpisah).');
    input.value = '';
    return;
  }
  const r = new FileReader();
  r.onload = e => {
    pendingFileData = e.target.result;
    pendingFileExt = ext;
    const nameEl = document.getElementById('fileUploadName');
    const preview = document.getElementById('fileUploadPreview');
    const labelInput = document.getElementById('fileLabel');
    const pdfHint = document.getElementById('filePdfHint');
    const docHint = document.getElementById('fileDocHint');
    
    if (nameEl) nameEl.textContent = '✓ ' + file.name + ' (' + (file.size / 1024).toFixed(0) + 'KB)';
    if (preview) preview.style.display = 'flex';
    if (labelInput && !labelInput.value.trim()) labelInput.value = file.name;
    if (pdfHint) pdfHint.style.display = ext === 'pdf' ? 'block' : 'none';
    if (docHint) docHint.style.display = OFFICE_EXT.includes(ext) ? 'block' : 'none';
  };
  r.readAsDataURL(file);
}

export function clearFileUpload() {
  pendingFileData = null;
  pendingFileExt = null;
  const preview = document.getElementById('fileUploadPreview');
  const input = document.getElementById('fileUploadInput');
  const pdfHint = document.getElementById('filePdfHint');
  const docHint = document.getElementById('fileDocHint');
  if (preview) preview.style.display = 'none';
  if (input) input.value = '';
  if (pdfHint) pdfHint.style.display = 'none';
  if (docHint) docHint.style.display = 'none';
}

export function insertFile() {
  if (!pendingFileData) { alert('Pilih file dulu.'); return; }
  const label = document.getElementById('fileLabel').value.trim() || 'File';
  if (pendingFileExt === 'pdf') {
    insertAtCursor(document.getElementById('artBody'), `[pdf:${label}|${pendingFileData}|550]`);
  } else {
    insertAtCursor(document.getElementById('artBody'), `[dl:${label}|${pendingFileData}]`);
  }
  clearFileUpload();
  const labelInput = document.getElementById('fileLabel');
  if (labelInput) labelInput.value = '';
  closePanel('panelFile');
}

// Link & Embed
export function insertLink() {
  const label = document.getElementById('dlLabel').value.trim();
  const url = document.getElementById('dlUrl').value.trim();
  if (!label || !url) { alert('Nama file dan URL wajib diisi.'); return; }
  insertAtCursor(document.getElementById('artBody'), `[dl:${label}|${url}]`);
  document.getElementById('dlLabel').value = '';
  document.getElementById('dlUrl').value = '';
  closePanel('panelLink');
}

export function setEmbedSize(w, h) {
  const wEl = document.getElementById('embedW');
  const hEl = document.getElementById('embedH');
  if (wEl) wEl.value = w;
  if (hEl) hEl.value = h;
}

export function insertEmbed() {
  const url = document.getElementById('embedUrl').value.trim();
  const label = document.getElementById('embedLabel').value.trim() || 'Embed';
  const w = document.getElementById('embedW').value || '100%';
  const h = document.getElementById('embedH').value || '600';
  const scroll = document.getElementById('embedScroll').value;
  if (!url) { alert('URL wajib diisi.'); return; }
  insertAtCursor(document.getElementById('artBody'), `[embed:${label}|${url}|${w}|${h}|${scroll}]`);
  ['embedLabel', 'embedUrl'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const wEl = document.getElementById('embedW');
  const hEl = document.getElementById('embedH');
  if (wEl) wEl.value = '100%';
  if (hEl) hEl.value = '600';
  closePanel('panelEmbed');
}

// Article Editor
export function openNewArticle() {
  editingArticleId = null;
  const titleEl = document.getElementById('editorTitle');
  if (titleEl) titleEl.textContent = 'Artikel Baru';
  ['artTitle', 'artBody'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const sel = document.getElementById('artCat');
  if (sel && window.menus?.filter(m => !m.system).length) {
    const firstMenu = window.menus.find(m => !m.system);
    if (firstMenu) sel.value = firstMenu.id;
  }
  PANELS.forEach(p => closePanel(p));
  pendingImgData = null;
  clearFileUpload();
  const labelInput = document.getElementById('fileLabel');
  if (labelInput) labelInput.value = '';
  openModal('editorModal');
}

export function editArticle(id) {
  const articles = window.articles || [];
  const a = articles.find(x => x.id === id);
  if (!a) return;
  editingArticleId = id;
  const titleEl = document.getElementById('editorTitle');
  if (titleEl) titleEl.textContent = 'Edit Artikel';
  const artTitle = document.getElementById('artTitle');
  const artCat = document.getElementById('artCat');
  const artBody = document.getElementById('artBody');
  if (artTitle) artTitle.value = a.title;
  if (artCat) artCat.value = a.cat;
  if (artBody) artBody.value = a.body;
  PANELS.forEach(p => closePanel(p));
  pendingImgData = null;
  clearFileUpload();
  const labelInput = document.getElementById('fileLabel');
  if (labelInput) labelInput.value = '';
  openModal('editorModal');
}

export async function saveArticle() {
  const title = document.getElementById('artTitle')?.value?.trim();
  const cat = document.getElementById('artCat')?.value;
  const body = document.getElementById('artBody')?.value?.trim();
  if (!title || !body) { alert('Judul dan isi wajib diisi.'); return; }
  const btn = document.getElementById('saveArticleBtn');
  if (btn) { btn.textContent = 'Menyimpan...'; btn.disabled = true; }
  try {
    await saveArticleData({ title, cat, body, editingId: editingArticleId });
    closeModal('editorModal');
    showToast('Artikel disimpan ✓');
  } catch (e) { alert('Gagal menyimpan: ' + e.message); }
  if (btn) { btn.textContent = 'Simpan Artikel'; btn.disabled = false; }
}

// Menu Editor
export function openMenuEditor() {
  editingMenuId = null;
  const titleEl = document.getElementById('menuEditorTitle');
  if (titleEl) titleEl.textContent = 'Menu Baru';
  const nameEl = document.getElementById('menuName');
  const iconEl = document.getElementById('menuIcon');
  if (nameEl) nameEl.value = '';
  if (iconEl) iconEl.value = '📁';
  openModal('menuEditorModal');
}

export function editMenu(id) {
  const menus = window.menus || [];
  const m = menus.find(x => x.id === id);
  if (!m) return;
  editingMenuId = id;
  const titleEl = document.getElementById('menuEditorTitle');
  if (titleEl) titleEl.textContent = 'Edit Menu';
  const nameEl = document.getElementById('menuName');
  const iconEl = document.getElementById('menuIcon');
  if (nameEl) nameEl.value = m.name;
  if (iconEl) iconEl.value = m.icon;
  openModal('menuEditorModal');
}

export async function saveMenu() {
  const name = document.getElementById('menuName')?.value?.trim();
  const icon = document.getElementById('menuIcon')?.value?.trim() || '📁';
  if (!name) { alert('Nama menu wajib diisi.'); return; }
  const btn = document.getElementById('saveMenuBtn');
  if (btn) { btn.textContent = 'Menyimpan...'; btn.disabled = true; }
  try {
    await saveMenuData({ name, icon, editingId: editingMenuId });
    closeModal('menuEditorModal');
    showToast('Menu disimpan ✓');
  } catch (e) { alert('Gagal: ' + e.message); }
  if (btn) { btn.textContent = 'Simpan Menu'; btn.disabled = false; }
}

// Delete
export function askDelete(id, type) {
  // System menus (e.g. Beranda) can be edited but never deleted
  if (type === 'menu' && (window.menus || []).find(m => m.id === id)?.system) return;
  deletingId = id;
  deleteType = type;
  const titleEl = document.getElementById('deleteModalTitle');
  const bodyEl = document.getElementById('deleteModalBody');
  if (titleEl) titleEl.textContent = type === 'menu' ? 'Hapus Menu?' : 'Hapus Artikel?';
  if (bodyEl) bodyEl.textContent = type === 'menu' ? 'Menu ini akan dihapus. Artikel terkait tidak ikut terhapus.' : 'Artikel ini akan dihapus permanen.';
  openModal('deleteModal');
}

export async function confirmDelete() {
  try {
    if (deleteType === 'article') {
      const { deleteArticle } = await import('../utils/data.js');
      await deleteArticle(deletingId);
    } else {
      const { deleteMenu } = await import('../utils/data.js');
      await deleteMenu(deletingId);
    }
    closeModal('deleteModal');
    showToast('Dihapus ✓');
  } catch (e) { alert('Gagal hapus: ' + e.message); }
}

// Profile
export function openProfileModal() {
  const currentUser = window.currentUser;
  if (!currentUser) return;
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.remove('open');
  const avatar = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  const roleBadge = document.getElementById('profileRoleBadge');
  if (avatar) avatar.textContent = currentUser.initials;
  if (nameEl) nameEl.textContent = currentUser.name;
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (roleBadge) {
    roleBadge.textContent = currentUser.role === 'admin' ? 'Admin' : 'Member';
    roleBadge.className = 'badge-role ' + (currentUser.role === 'admin' ? 'badge-admin' : 'badge-member');
  }
  openModal('profileModal');
}

// Syntax insertion
export function insertSyntax(pre, suf) {
  insertAtCursor(document.getElementById('artBody'), pre, suf || '');
}

// Expose globally
window.closeModal = closeModal;
window.openModal = openModal;
window.togglePanel = togglePanel;
window.closePanel = closePanel;
window.switchImgTab = switchImgTab;
window.handleImgUpload = handleImgUpload;
window.clearUpload = clearUpload;
window.previewImgUrl = previewImgUrl;
window.clearUrl = clearUrl;
window.insertImg = insertImg;
window.handleFileUpload = handleFileUpload;
window.clearFileUpload = clearFileUpload;
window.insertFile = insertFile;
window.insertLink = insertLink;
window.setEmbedSize = setEmbedSize;
window.insertEmbed = insertEmbed;
window.openNewArticle = openNewArticle;
window.editArticle = editArticle;
window.saveArticle = saveArticle;
window.openMenuEditor = openMenuEditor;
window.editMenu = editMenu;
window.saveMenu = saveMenu;
window.askDelete = askDelete;
window.confirmDelete = confirmDelete;
window.openProfileModal = openProfileModal;
window.insertSyntax = insertSyntax;