// ===== Main App Entry Point =====
import './utils/router.js'; // hash routing (registers the hashchange listener)
import { initAuth } from './utils/auth.js';
import { renderModals } from './components/modals.js';
import { initSidebar } from './components/sidebar.js';

// Initialize app. The UI itself is shown by auth.js once a session is confirmed.
function initApp() {
  renderModals();
  initSidebar();
  initAuth();
}

// Global navigation helpers (used by inline onclick handlers)
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
