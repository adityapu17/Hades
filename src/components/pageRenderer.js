// ===== Page Renderer =====
import { menus, articles, currentUser, EMBED_HINTS } from '../utils/state.js';
import { tagClass, tagLabel, catIcon, articleCard, renderBody, showToast, setLoading } from './ui.js';
import { navigateTo } from './sidebar.js';
import { openNewArticle, editArticle, openMenuEditor, editMenu, askDelete, openProfileModal } from './modals.js';

// Make functions available globally
window.openArticle = openArticle;
window.clickCat = clickCat;
window.doSearch = doSearch;
window.renderManage = renderManage;
window.renderMenuManager = renderMenuManager;
window.openNewArticle = openNewArticle;
window.editArticle = editArticle;
window.openMenuEditor = openMenuEditor;
window.editMenu = editMenu;
window.askDelete = askDelete;
window.openProfileModal = openProfileModal;
window.insertSyntax = (pre, suf) => insertAtCursor(document.getElementById('artBody'), pre, suf || '');
window.setEmbedSize = (w, h) => { 
  const wEl = document.getElementById('embedW'); 
  const hEl = document.getElementById('embedH'); 
  if (wEl) wEl.value = w; 
  if (hEl) hEl.value = h; 
};
window.dragStart = dragStart;
window.dragOver = dragOver;
window.dropMenu = dropMenu;

let dragSrcIdx = null;

export async function renderPage(page, params) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  // Update active nav
  updateActiveNav(page, params);

  switch (page) {
    case 'home':
      main.innerHTML = renderHome();
      initHome();
      break;
    case 'article':
      main.innerHTML = renderArticle(params);
      break;
    case 'category':
      main.innerHTML = renderCategory(params);
      break;
    case 'manage':
      main.innerHTML = renderManagePage();
      break;
    case 'menumanager':
      main.innerHTML = renderMenuManagerPage();
      break;
    case 'changelog':
      main.innerHTML = await renderChangelog();
      break;
    case 'profile':
      main.innerHTML = renderProfile();
      break;
    case 'login':
      showLoginPage();
      break;
    default:
      main.innerHTML = renderHome();
      initHome();
  }
}

function updateActiveNav(page, params) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (page === 'home') {
    document.querySelector('[data-menuid="beranda"]')?.classList.add('active');
  } else if (page === 'category' || page === 'article') {
    const urlParams = new URLSearchParams(params);
    const menuId = urlParams.get('id');
    if (menuId) {
      document.querySelector(`[data-menuid="${menuId}"]`)?.classList.add('active');
    }
  } else if (page === 'manage') {
    document.querySelector('[onclick="navigateTo(\'manage\')"]')?.classList.add('active');
  } else if (page === 'menumanager') {
    document.querySelector('[onclick="navigateTo(\'menumanager\')"]')?.classList.add('active');
  } else if (page === 'changelog') {
    document.querySelector('[onclick="navigateTo(\'changelog\')"]')?.classList.add('active');
  }
}

function renderHome() {
  if (!menus.length) return '<div class="empty">Memuat...</div>';
  
  const nonSys = menus.filter(m => !m.system);
  const stats = [
    { n: articles.length, l: 'Total Artikel' },
    ...nonSys.slice(0, 3).map(m => ({ n: articles.filter(a => a.cat === m.id).length, l: m.name }))
  ];

  return `
    <div style="margin-bottom:18px">
      <div style="font-size:19px;font-weight:700;margin-bottom:4px">Selamat datang 👋</div>
      <div style="font-size:13px;color:#718096">Cari SOP, panduan, atau dokumentasi tim Helpdesk PERURI</div>
    </div>
    <div class="search-wrap"><span style="color:#a0aec0">🔍</span><input type="text" placeholder="Cari artikel..." id="searchInput"/></div>
    <div id="searchResults" style="display:none;margin-bottom:18px"></div>
    <div class="stats-row" id="statsRow">${stats.map(r => `<div class="stat-card"><div class="stat-num">${r.n}</div><div class="stat-label">${r.l}</div></div>`).join('')}</div>
    <div class="section-title">Kategori</div>
    <div class="grid-2" id="catGrid">${nonSys.map(m => `
      <div class="cat-card" onclick="clickCat('${m.id}')">
        <div class="cat-icon">${m.icon}</div><div class="cat-title">${m.name}</div>
        <div class="cat-count">${articles.filter(a => a.cat === m.id).length} artikel</div>
      </div>`).join('')}</div>
    <div class="section-title">Artikel Terbaru</div>
    <div class="article-list" id="recentList">${renderRecentList()}</div>
  `;
}

function renderRecentList() {
  const sorted = [...articles].sort((a, b) => (b.order || 0) - (a.order || 0)).slice(0, 5);
  return sorted.length ? sorted.map(a => articleCard(a, true, menus)).join('') : '<div class="empty">Belum ada artikel</div>';
}

function initHome() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => doSearch(e.target.value));
  }
}

function renderArticle(params) {
  const urlParams = new URLSearchParams(params);
  const id = urlParams.get('id');
  const a = articles.find(x => x.id === id);
  
  if (!a) {
    return `<div class="article-view-box"><div class="empty">Artikel tidak ditemukan</div></div>`;
  }

  const cat = menus.find(m => m.id === a.cat);
  
  return `
    <div class="article-view-header">
      <button class="back-btn" onclick="goBack()">← Kembali</button>
      <div id="articleBreadcrumb" style="font-size:12px;color:#a0aec0">${cat ? cat.icon + ' ' + cat.name + ' › ' + a.title : ''}</div>
    </div>
    <div class="article-view-box">
      <div style="margin-bottom:6px"><span class="tag ${tagClass(a.cat, menus)}">${tagLabel(a.cat, menus)}</span></div>
      <div style="font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:12px">${a.title}</div>
      <div class="meta-row"><span>🕐 ${a.date}</span><span>✍️ ${a.author}</span></div>
      <div class="article-content">${renderBody(a.body)}</div>
    </div>
  `;
}

function renderCategory(params) {
  const urlParams = new URLSearchParams(params);
  const menuId = urlParams.get('id');
  const m = menus.find(x => x.id === menuId);
  
  if (!m) {
    return `<div class="empty">Menu tidak ditemukan</div>`;
  }

  const list = articles.filter(a => a.cat === m.id);
  
  return `
    <div class="section-title" id="catViewTitle">${m.icon} ${m.name}</div>
    <div class="article-list" id="catViewList">${list.length ? list.map(a => articleCard(a, false, menus)).join('') : '<div class="empty">Belum ada artikel di menu ini</div>'}</div>
  `;
}

function renderManagePage() {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div class="section-title" style="margin:0">⚙️ Kelola Artikel</div>
      <button class="btn btn-primary" onclick="openNewArticle()">+ Artikel Baru</button>
    </div>
    <div class="article-list" id="list-manage">${renderManageList()}</div>
  `;
}

function renderManageList() {
  return articles.length ? articles.map(a => `
    <div class="article-card">
      <div style="min-width:0">
        <div class="article-title">${catIcon(a.cat, menus)} ${a.title}</div>
        <div class="article-meta">${a.date} · <span class="tag ${tagClass(a.cat, menus)}">${tagLabel(a.cat, menus)}</span></div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button class="btn btn-ghost btn-sm" onclick="editArticle('${a.id}')">Edit</button>
        <button class="btn btn-sm" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7" onclick="askDelete('${a.id}','article')">Hapus</button>
      </div>
    </div>`).join('') : '<div class="empty">Belum ada artikel</div>';
}

function renderMenuManagerPage() {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">
      <div class="section-title" style="margin:0">🗂️ Kelola Menu</div>
      <button class="btn btn-primary" onclick="openMenuEditor()">+ Menu Baru</button>
    </div>
    <div style="font-size:12px;color:#718096;margin-bottom:14px">Drag untuk mengubah urutan.</div>
    <div id="menuManagerList">${renderMenuManagerList()}</div>
  `;
}

function renderMenuManagerList() {
  return menus.map((m, i) => `
    <div class="menu-item-row" draggable="true" data-idx="${i}" ondragstart="dragStart(event,${i})" ondragover="dragOver(event)" ondrop="dropMenu(event,${i})">
      <span class="drag-handle">⠿</span>
      <span style="font-size:18px;width:24px;text-align:center">${m.icon}</span>
      <span style="flex:1;font-size:13px;font-weight:500">${m.name}</span>
      ${m.system ? '<span style="font-size:11px;color:#a0aec0;padding:2px 7px;background:#f7fafc;border-radius:8px">sistem</span>' : `
      <div style="display:flex;gap:5px">
        <button class="btn btn-ghost btn-sm" onclick="editMenu('${m.id}')">Edit</button>
        <button class="btn btn-sm" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7" onclick="askDelete('${m.id}','menu')">Hapus</button>
      </div>`}
    </div>`).join('');
}

async function renderChangelog() {
  // Fetch changelog from generated JSON file
  let commits = [];
  try {
    const response = await fetch('/changelog.json');
    if (response.ok) {
      commits = await response.json();
    }
  } catch (e) {
    console.warn('Could not fetch changelog from JSON, using fallback');
  }

  // Fallback to static changelog if fetch fails
  if (commits.length === 0) {
    commits = getFallbackChangelog();
  }

  return `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin-bottom:8px">📋 Changelog</h1>
      <p style="color:#718096;font-size:13px">Riwayat perubahan Hades KB — disinkronkan dari Git history</p>
    </div>
    <div class="changelog-list">
      ${commits.map(c => renderChangelogEntry(c)).join('')}
    </div>
  `;
}

function getFallbackChangelog() {
  return [
    {
      version: 'v1.0.0',
      date: '2025-01-15',
      type: 'feat',
      changes: [
        'Initial release of Hades KB',
        'Multi-page architecture with hash-based routing',
        'Expandable/collapsible sidebar with persistent state',
        'Article management (CRUD) with rich editor',
        'Menu management with drag-and-drop reordering',
        'Firebase Firestore real-time sync',
        'Image, file, embed, and link insertion',
        'User authentication with role-based access',
        'Changelog page synced with Git history'
      ]
    }
  ];
}

function renderChangelogEntry(commit) {
  const typeClass = commit.type || 'feat';
  const dateStr = new Date(commit.date).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  return `
    <div class="changelog-entry">
      <div class="changelog-entry-header">
        <span class="changelog-version">${commit.version}</span>
        <span class="changelog-date">${dateStr}</span>
        <span class="changelog-type ${typeClass}">${typeClass}</span>
      </div>
      <div class="changelog-entry-body">
        <ul>
          ${commit.changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function renderProfile() {
  const user = currentUser || window.currentUser;
  if (!user) return '<div class="empty">Silakan login terlebih dahulu</div>';
  
  return `
    <div style="max-width:500px;margin:0 auto;text-align:center;padding:40px 20px">
      <div class="profile-avatar-lg" style="background:#1a365d;margin:0 auto 20px;font-size:28px">${user.initials}</div>
      <h2 style="font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:8px">${user.name}</h2>
      <p style="color:#718096;margin-bottom:16px">${user.email}</p>
      <span class="badge-role ${user.role === 'admin' ? 'badge-admin' : 'badge-member'}">${user.role === 'admin' ? 'Admin' : 'Member'}</span>
      <div style="margin-top:32px;padding:20px;background:#f7fafc;border-radius:12px;text-align:left">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;color:#1a1a2e">Informasi Akun</h3>
        <div style="font-size:13px;color:#4a5568;line-height:2">
          <div><strong>UID:</strong> ${user.uid}</div>
          <div><strong>Role:</strong> ${user.role}</div>
          <div><strong>Initials:</strong> ${user.initials}</div>
        </div>
      </div>
    </div>
  `;
}

function showLoginPage() {
  const loginPage = document.getElementById('loginPage');
  const appShell = document.getElementById('appShell');
  if (loginPage) loginPage.style.display = 'flex';
  if (appShell) appShell.style.display = 'none';
}

// Search
function doSearch(q) {
  const res = document.getElementById('searchResults');
  if (!res) return;
  if (!q.trim()) { res.style.display = 'none'; return; }
  const found = articles.filter(a => a.title.toLowerCase().includes(q.toLowerCase()) || a.body.toLowerCase().includes(q.toLowerCase()));
  res.style.display = 'block';
  res.innerHTML = `<div style="font-size:13px;color:#718096;margin-bottom:8px">Hasil: <b>${found.length}</b> artikel</div>` + (found.length ? found.map(a => articleCard(a, true, menus)).join('') : '<div class="empty">Tidak ditemukan</div>');
}

function clickCat(catId) {
  const m = menus.find(x => x.id === catId);
  const el = document.querySelector(`[data-menuid="${catId}"]`);
  if (m && el) {
    navigateTo(`category?id=${catId}`);
  }
}

function openArticle(id) {
  navigateTo(`article?id=${id}`);
}

function goBack() {
  window.history.back();
}

// Drag and drop for menu manager
function dragStart(e, i) {
  dragSrcIdx = i;
  e.dataTransfer.effectAllowed = 'move';
}

function dragOver(e) {
  e.preventDefault();
}

async function dropMenu(e, targetIdx) {
  e.preventDefault();
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  const { menus } = await import('../utils/state.js');
  const reordered = [...menus];
  const moved = reordered.splice(dragSrcIdx, 1)[0];
  reordered.splice(targetIdx, 0, moved);
  
  const { reorderMenus } = await import('../utils/data.js');
  await reorderMenus(reordered);
  dragSrcIdx = null;
  showToast('Urutan menu disimpan ✓');
}

export function renderAll() {
  // This is called from data listeners - re-render current page
  const { name, params } = getCurrentRoute();
  renderPage(name, params);
}

function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '';
  const [path, ...paramParts] = hash.split('?');
  const [routeName] = path.split('/');
  return { name: routeName || 'home', params: paramParts.join('?') };
}