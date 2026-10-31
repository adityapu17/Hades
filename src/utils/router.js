// ===== Client-side Router (Hash-based) =====
import { renderPage } from '../components/pageRenderer.js';

const routes = {
  '': 'home',
  'home': 'home',
  'article': 'article',
  'category': 'category',
  'manage': 'manage',
  'menumanager': 'menumanager',
  'users': 'users',
  'changelog': 'changelog',
  'profile': 'profile',
  'login': 'login'
};

export function getRoute() {
  const hash = window.location.hash.slice(1) || '';
  const [path, ...params] = hash.split('?');
  const [routeName, ...rest] = path.split('/');
  return { name: routeName || 'home', params: params.join('?'), path: path };
}

export function navigate(to, replace = false) {
  const url = `#${to}`;
  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
  handleRouteChange();
}

export function handleRouteChange() {
  // Session still being restored: don't touch the URL yet (auth.js renders the right page when it knows)
  if (window.authState === 'pending') return;

  const { name, params } = getRoute();

  // Not signed in: every URL leads to the login page
  if (!window.currentUser) {
    if (name !== 'login') window.history.replaceState(null, '', '#login');
    return;
  }

  // Signed in: the login URL makes no sense, go to the default page
  if (name === 'login') {
    window.history.replaceState(null, '', '#home');
    renderPage('home', '');
    return;
  }

  renderPage(routes[name] || 'home', params);
}

// Listen for hash changes
window.addEventListener('hashchange', handleRouteChange);

// Initial load
document.addEventListener('DOMContentLoaded', handleRouteChange);

// Helper functions for navigation
export function goHome() {
  navigate('home', true);
  window.scrollTo(0, 0);
}

export function goToArticle(id) {
  navigate(`article?id=${id}`);
}

export function goToCategory(menuId) {
  navigate(`category?id=${menuId}`);
}

export function goBack() {
  window.history.back();
}