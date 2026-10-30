// ===== State Management =====
export let menus = [];
export let articles = [];
export let currentUser = null;
export let appShown = false;

export let editingArticleId = null;
export let editingMenuId = null;
export let deletingId = null;
export let deleteType = null;
export let pendingImgData = null;
export let activeImgTab = 'upload';
export let prevView = 'home';
export let currentCatMenu = null;
export let sidebarCollapsed = false;

export let unsubArticles = null;
export let unsubMenus = null;

// Several components read these through window.* (inline onclick handlers, modals.js, sidebar.js),
// so every setter keeps the window copy in sync with the module copy.
window.menus = menus;
window.articles = articles;
window.currentUser = currentUser;

export function setMenus(val) { menus = val; window.menus = val; }
export function setArticles(val) { articles = val; window.articles = val; }
export function setCurrentUser(val) { currentUser = val; window.currentUser = val; }
export function setAppShown(val) { appShown = val; }
export function setEditingArticleId(val) { editingArticleId = val; }
export function setEditingMenuId(val) { editingMenuId = val; }
export function setDeletingId(val) { deletingId = val; }
export function setDeleteType(val) { deleteType = val; }
export function setPendingImgData(val) { pendingImgData = val; }
export function setActiveImgTab(val) { activeImgTab = val; }
export function setPrevView(val) { prevView = val; }
export function setCurrentCatMenu(val) { currentCatMenu = val; }
export function setSidebarCollapsed(val) { sidebarCollapsed = val; }
export function setUnsubArticles(val) { unsubArticles = val; }
export function setUnsubMenus(val) { unsubMenus = val; }

// Default data
export const DEFAULT_MENUS = [
  { id: 'beranda', name: 'Beranda', icon: '🏠', system: true, order: 0 },
  { id: 'prosedur', name: 'Prosedur', icon: '📋', order: 1 },
  { id: 'knowledge', name: 'Knowledge', icon: '📚', order: 2 },
  { id: 'jadwal', name: 'Jadwal', icon: '🗓️', order: 3 },
  { id: 'tools', name: 'Tools', icon: '🔧', order: 4 },
  { id: 'performansi', name: 'Performansi', icon: '📊', order: 5 },
  { id: 'faq', name: 'FAQ', icon: '❓', order: 6 }
];

export const DEFAULT_ARTICLES = [
  {
    title: 'SOP Penanganan Tiket Masuk - Voice',
    cat: 'prosedur',
    author: 'Admin Helpdesk',
    date: '25 Jun 2025',
    order: 1,
    body: `### Tujuan\nMemastikan setiap tiket dari kanal Voice ditangani sesuai standar layanan PERURI.\n\n### Langkah Penanganan\n- Terima panggilan dalam 3 ring pertama\n- Sapa pelanggan dengan kalimat baku\n- Catat nomor tiket di sistem CRM\n- Eskalasi ke L2 jika tidak selesai dalam 10 menit\n\n[!] Selalu pastikan tiket tercatat sebelum mengakhiri panggilan.`
  },
  {
    title: 'FAQ: Reset Password Portal PERURI',
    cat: 'faq',
    author: 'Admin Helpdesk',
    date: '10 Jun 2025',
    order: 2,
    body: `### Pertanyaan\nBagaimana cara reset password portal PERURI?\n\n### Jawaban\n- Klik "Lupa Password" di halaman login\n- Masukkan email terdaftar → cek inbox\n- Klik link reset (berlaku 15 menit)\n- Buat password baru min. 8 karakter\n\n[!] Jika email tidak ditemukan, hubungi admin.`
  }
];

export const EMBED_HINTS = {
  'docs.google.com/spreadsheets': '💡 Sheets: File → Publikasikan ke web → HTML → salin link.',
  'docs.google.com/forms': '💡 Forms: Kirim → ikon embed → salin src URL.',
  'docs.google.com/presentation': '💡 Slides: File → Publikasikan ke web → Embed → salin src.',
  'docs.google.com/document': '💡 Docs: File → Publikasikan ke web → salin link.'
};

export const PANELS = ['panelImg', 'panelLink', 'panelEmbed', 'panelFile'];
export const TBBTN = { panelImg: 'tbImg', panelLink: 'tbLink', panelEmbed: 'tbEmbed', panelFile: 'tbFile' };
export const OFFICE_EXT = ['xls', 'xlsx', 'doc', 'docx'];