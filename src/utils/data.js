// ===== Data Layer (Firestore) =====
import { db, col, document, qOrdered } from './firebase.js';
import { getDocs, addDoc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import { menus, articles, DEFAULT_MENUS, DEFAULT_ARTICLES, setMenus, setArticles, setUnsubMenus, setUnsubArticles } from './state.js';
import { renderAll } from '../components/pageRenderer.js';
import { buildNav } from '../components/sidebar.js';
import { showToast, setLoading } from '../components/ui.js';

// Seed default data if empty
export async function seedIfEmpty() {
  const snap = await getDocs(col('menus'));
  if (snap.empty) {
    for (const m of DEFAULT_MENUS) await setDoc(document('menus', m.id), m);
    for (const a of DEFAULT_ARTICLES) await addDoc(col('articles'), a);
  }
}

// Start real-time listeners
export function startListeners() {
  const unsubMenus = onSnapshot(qOrdered('menus'), (snap) => {
    const newMenus = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    setMenus(newMenus);
    buildNav();
    renderAll();
    setLoading(90);
  });

  const unsubArticles = onSnapshot(qOrdered('articles'), (snap) => {
    const newArticles = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    setArticles(newArticles);
    renderAll();
    setLoading(100);
    setTimeout(() => { setLoading(0); }, 400);
  });

  setUnsubMenus(unsubMenus);
  setUnsubArticles(unsubArticles);

  // Expose globally for logout
  window.unsubArticles = unsubArticles;
  window.unsubMenus = unsubMenus;
}

// Article operations
export async function saveArticle(data) {
  const { title, cat, body, editingId } = data;
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const d = new Date();
  const dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();

  if (editingId) {
    const a = articles.find(x => x.id === editingId);
    await setDoc(document('articles', editingId), { ...a, title, cat, body, date: dateStr });
  } else {
    const maxOrder = articles.reduce((m, a) => Math.max(m, a.order || 0), 0);
    const currentUser = window.currentUser;
    await addDoc(col('articles'), { title, cat, author: currentUser?.name || 'Admin', date: dateStr, body, order: maxOrder + 1 });
  }
}

export async function deleteArticle(id) {
  await deleteDoc(document('articles', id));
}

export async function deleteMenu(id) {
  await deleteDoc(document('menus', id));
}

export async function saveMenu(data) {
  const { name, icon, editingId } = data;
  if (editingId) {
    const m = menus.find(x => x.id === editingId);
    await setDoc(document('menus', editingId), { ...m, name, icon });
  } else {
    const id = 'menu_' + Date.now();
    await setDoc(document('menus', id), { id, name, icon, order: menus.length });
  }
}

export async function reorderMenus(newOrder) {
  for (let i = 0; i < newOrder.length; i++) {
    await setDoc(document('menus', newOrder[i].id), { ...newOrder[i], order: i });
  }
}