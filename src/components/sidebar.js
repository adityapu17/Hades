// ===== Sidebar Component =====
import { menus, DEFAULT_MENUS, sidebarCollapsed, setSidebarCollapsed } from '../utils/state.js';
import { tagClass, tagLabel, catIcon, articleCard } from './ui.js';

let sidebarInitialized = false;

export function renderSidebar() {
  const sidebarContent = document.getElementById('sidebarContent');
  if (!sidebarContent) return;

  const nonSys = menus.filter(m => !m.system);
  
  sidebarContent.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-head">
        <div class="sidebar-label">Menu</div>
        <button class="sidebar-toggle-btn" id="sidebarToggleBtn" type="button" onclick="toggleSidebarCollapse()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>
      <div id="navList"></div>
    </div>
    <div class="sidebar-section" id="adminMenuSection" style="display:none">
      <div class="sidebar-label">Admin</div>
      <div class="nav-item" title="Kelola Artikel" onclick="navigateTo('manage')"><span>⚙️</span><span class="nav-label">Kelola Artikel</span></div>
      <div class="nav-item" title="Kelola Menu" onclick="navigateTo('menumanager')"><span>🗂️</span><span class="nav-label">Kelola Menu</span></div>
      <div class="nav-item" title="Changelog" onclick="navigateTo('changelog')"><span>📋</span><span class="nav-label">Changelog</span></div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-version">Hades KB<br>v1.0.0</div>
    </div>
  `;

  buildNav();
  updateAdminMenuVisibility();
  syncToggleButton();
}

// The toggle is an arrow-only button: CSS rotates the arrow when collapsed, this keeps the tooltip/label in sync
function syncToggleButton() {
  const btn = document.getElementById('sidebarToggleBtn');
  if (!btn) return;
  const label = sidebarCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar';
  btn.title = label;
  btn.setAttribute('aria-label', label);
}

export function buildNav() {
  const nl = document.getElementById('navList');
  if (!nl) return;
  
  nl.innerHTML = '';
  menus.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'nav-item' + (i === 0 ? ' active' : '');
    div.dataset.menuid = m.id;
    div.title = m.name; // tooltip, useful when the sidebar is collapsed to icons only
    div.innerHTML = `<span>${m.icon}</span><span class="nav-label">${m.name}</span>`;
    div.onclick = () => { closeSidebar(); handleMenuClick(m, div); };
    nl.appendChild(div);
  });

  // Update category select in editor modal if open
  const sel = document.getElementById('artCat');
  if (sel) {
    sel.innerHTML = menus.filter(m => !m.system).map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join('');
  }
}

function handleMenuClick(m, el) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  
  if (m.id === 'beranda') {
    navigateTo('home');
  } else {
    navigateTo(`category?id=${m.id}`);
  }
}

export function navigateTo(path) {
  window.location.hash = path;
}

function updateAdminMenuVisibility() {
  const adminMenuSection = document.getElementById('adminMenuSection');
  const currentUser = window.currentUser;
  if (adminMenuSection && currentUser?.role === 'admin') {
    adminMenuSection.style.display = 'block';
  } else if (adminMenuSection) {
    adminMenuSection.style.display = 'none';
  }
}

export function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  }
}

export function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

export function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  const newState = !sidebarCollapsed;
  setSidebarCollapsed(newState);
  sidebar.classList.toggle('collapsed', newState);
  
  // Save preference
  localStorage.setItem('sidebarCollapsed', newState);

  syncToggleButton();
}

export function initSidebar() {
  if (sidebarInitialized) return;
  sidebarInitialized = true;
  
  // Restore collapsed state
  const saved = localStorage.getItem('sidebarCollapsed');
  if (saved === 'true') {
    setSidebarCollapsed(true);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }
  // The toggle button itself is created later by renderSidebar(), which calls syncToggleButton()
}

// Expose globally
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.navigateTo = navigateTo;