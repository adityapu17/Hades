// ===== Topbar Component =====
import { closeSidebar } from './sidebar.js';

export function renderTopbar(currentUser) {
  const container = document.getElementById('topbarContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-left">
        <button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>
        <div class="logo" onclick="navigateTo('home')"><div class="logo-badge">🔱 HD</div><span>Hades</span></div>
      </div>
      <div style="position:relative">
        <div class="user-badge" onclick="toggleUserMenu(event)">
          <div class="user-avatar" id="topAvatar" style="background:#1a365d">${currentUser?.initials || 'AD'}</div>
          <span id="topName" class="user-name-text">${currentUser?.name || 'Admin'}</span>
          <span id="topRoleBadge" class="badge-role ${currentUser?.role === 'admin' ? 'badge-admin' : 'badge-member'}">${currentUser?.role === 'admin' ? 'Admin' : 'Member'}</span>
          <span style="color:#a0aec0;font-size:11px;margin-left:2px">▾</span>
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-item" onclick="openProfileModal()"><span>👤</span> Profil Saya</div>
          <div class="user-dropdown-divider"></div>
          <div class="user-dropdown-item" onclick="doLogout()"><span>↩</span> Keluar</div>
        </div>
      </div>
    </div>
  `;
}

export function toggleUserMenu(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

document.addEventListener('click', () => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.classList.remove('open');
});

// Expose globally
window.toggleUserMenu = toggleUserMenu;
// window.openProfileModal is exposed by components/modals.js (it is not defined in this file)