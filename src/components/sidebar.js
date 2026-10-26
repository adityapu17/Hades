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
      <div class="sidebar-label">Menu</div>
      <button class="sidebar-toggle-btn" onclick="toggleSidebarCollapse()" aria-label="Collapse sidebar">
        <span class="toggle-icon">◀</span>
        <span>Perkecil Sidebar</span>
      </button>
      <div id="navList"></div>
    </div>
    <div class="sidebar-section" id="adminMenuSection" style="display:none">
      <div class="sidebar-label">Admin</div>
      <div class="nav-item" onclick="navigateTo('manage')"><span>⚙️</span> Kelola Artikel</div>
      <div class="nav-item" onclick="navigateTo('menumanager')"><span>🗂️</span> Kelola Menu</div>
      <div class="nav-item" onclick="navigateTo('changelog')"><span>📋</span> Changelog</div>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-version">Hades KB<br>v1.0.0</div>
    </div>
  `;

  buildNav();
  updateAdminMenuVisibility();
}

export function buildNav() {
  const nl = document.getElementById('navList');
  if (!nl) return;
  
  nl.innerHTML = '';
  menus.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'nav-item' + (i === 0 ? ' active' : '');
    div.dataset.menuid = m.id;
    div.innerHTML = `<span>${m.icon}</span> ${m.name}`;
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
  
  // Update toggle button icon
  const toggleBtn = sidebar.querySelector('.sidebar-toggle-btn .toggle-icon');
  const toggleText = sidebar.querySelector('.sidebar-toggle-btn span:last-child');
  if (toggleBtn) toggleBtn.textContent = newState ? '▶' : '◀';
  if (toggleText) toggleText.textContent = newState ? 'Perluas Sidebar' : 'Perkecil Sidebar';
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
  
  // Update toggle button initial state
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = sidebar?.querySelector('.sidebar-toggle-btn .toggle-icon');
  const toggleText = sidebar?.querySelector('.sidebar-toggle-btn span:last-child');
  if (toggleBtn) toggleBtn.textContent = sidebarCollapsed ? '▶' : '◀';
  if (toggleText) toggleText.textContent = sidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar';
}

// Expose globally
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebarCollapse = toggleSidebarCollapse;
window.navigateTo = navigateTo;