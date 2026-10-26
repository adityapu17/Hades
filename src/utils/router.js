// ===== Client-side Router (Hash-based) =====
import { renderPage } from '../components/pageRenderer.js';

const routes = {
  '': 'home',
  'home': 'home',
  'article': 'article',
  'category': 'category',
  'manage': 'manage',
  'menumanager': 'menumanager',
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
  const { name, params, path } = getRoute();
  const page = routes[name] || 'home';
  renderPage(page, params);
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