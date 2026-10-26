// ===== Main App Entry Point =====
import { initAuth } from './utils/auth.js';
import { renderTopbar } from './components/topbar.js';
import { renderSidebar, initSidebar } from './components/sidebar.js';
import { renderModals } from './components/modals.js';
import { renderPage } from './components/pageRenderer.js';
import { setCurrentUser, setAppShown, menus, articles } from './utils/state.js';

// Initialize app
async function initApp() {
  // Render static components
  renderModals();
  
  // Initialize auth (this will trigger appShown when ready)
  initAuth();
  
  // Initialize sidebar collapse state
  initSidebar();
  
  // Wait for auth to complete and user to be set
  const checkAuth = setInterval(() => {
    const user = window.currentUser;
    if (user) {
      clearInterval(checkAuth);
      renderTopbar(user);
      renderSidebar();
      
      // Show app shell
      const appShell = document.getElementById('appShell');
      const loginPage = document.getElementById('loginPage');
      const authLoading = document.getElementById('authLoading');
      
      if (authLoading) authLoading.style.display = 'none';
      if (loginPage) loginPage.style.display = 'none';
      if (appShell) appShell.style.display = 'block';
      
      setAppShown(true);
      
      // Render initial page
      renderPage('home', '');
    }
  }, 100);
  
  // Also listen for auth state changes to update UI
  const originalSetCurrentUser = window.setCurrentUser;
  window.setCurrentUser = (user) => {
    if (originalSetCurrentUser) originalSetCurrentUser(user);
    if (user) {
      renderTopbar(user);
      renderSidebar();
    }
  };
}

// Global navigation functions
window.navigateTo = (path) => {
  window.location.hash = path;
};

window.goHome = () => {
  window.location.hash = 'home';
  window.scrollTo(0, 0);
};

window.goBack = () => {
  window.history.back();
};

// Handle hash changes
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.slice(1) || '';
  const [path, ...params] = hash.split('?');
  const [page] = path.split('/');
  renderPage(page || 'home', params.join('?'));
});

// Initial render
document.addEventListener('DOMContentLoaded', initApp);

// Expose state globally for other modules
window.menus = menus;
window.articles = articles;
window.currentUser = null;

// Override setCurrentUser from state.js
import { setCurrentUser as stateSetCurrentUser } from './utils/state.js';
const originalSetCurrentUser = stateSetCurrentUser;
window.setCurrentUser = (user) => {
  originalSetCurrentUser(user);
  window.currentUser = user;
};