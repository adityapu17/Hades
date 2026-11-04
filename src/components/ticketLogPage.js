// ===== Ticket Log: tab Search dari quickreporthelper (Ticketing), tanpa login ulang =====
// Hades mengirim Firebase ID token milik user yang sedang login; quickreporthelper memverifikasinya
// (tanda tangan Google + profil aktif di Firestore Hades). Tidak ada password/cookie QRH yang dipakai.
import { auth } from '../utils/firebase.js';

const QRH = 'https://quickreporthelper.pages.dev';
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DATE_ROWS = [['open', 'Date Open'], ['onProgress', 'On Progress'], ['pending', 'Pending'], ['resolved', 'Resolved'], ['reopen', 'Reopen'], ['lastUpdate', 'Last Update'], ['closed', 'Closed']];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (n) => Number(n || 0).toLocaleString('id-ID');
function fmtDt(ms, mode) {
  if (ms === null || ms === undefined) return '—';
  const d = new Date(ms), pad = (n) => String(n).padStart(2, '0');
  if (mode === 'plain') return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

async function api(qs) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesi login habis, silakan login ulang.');
  const token = await user.getIdToken();
  const res = await fetch(QRH + '/api/ticketing/search' + qs, { headers: { Authorization: 'Bearer ' + token } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || ('status ' + res.status));
  return j;
}

let sSeq = 0, sItems = [], sActive = null, sResp = null, sQ = '';
const sFilter = { year: '', month: '', detail: '' };

export function renderTicketLog() {
  return `
    <div id="tlRoot">
      <div class="section-title">🎫 Ticket Log</div>
      <div class="tl-card">
        <div class="tl-label">Cari tiket</div>
        <div style="display:flex;gap:8px">
          <input type="text" id="tl-input" class="tl-input" placeholder="Ketik ID tiket, subject, atau isi remarks (mengandung kata)..." autocomplete="off" enterkeyhint="search"/>
          <button type="button" class="btn btn-primary" id="tl-search-btn" style="white-space:nowrap">🔍 Cari</button>
        </div>
        <div class="tl-hint">Minimal 2 karakter. Tekan Enter atau klik Cari untuk mencari. Data diambil dari database tiket Quick Report Helper (hanya baca).</div>
      </div>
      <div id="tl-out"></div>
    </div>`;
}

export function initTicketLog() {
  sItems = []; sActive = null; sResp = null; sQ = '';
  sFilter.year = sFilter.month = sFilter.detail = '';
  const input = $('tl-input');
  // Sengaja TIDAK ada listener 'input': mengetik tidak memicu request/pencarian apa pun.
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); doSearch(); } });
  $('tl-search-btn').addEventListener('click', doSearch);
  input.focus();
}

async function doSearch() {
  const q = $('tl-input').value.trim();
  const out = $('tl-out');
  if (q.length < 2) { sItems = []; sActive = null; out.innerHTML = ''; return; }
  const seq = ++sSeq;
  out.innerHTML = '<div class="tl-card tl-empty">Mencari...</div>';
  try {
    const j = await api('?q=' + encodeURIComponent(q));
    if (seq !== sSeq) return;
    sItems = j.items; sActive = null; sResp = j; sQ = q;
    sFilter.year = sFilter.month = sFilter.detail = '';
    renderResult(j);
  } catch (e) {
    if (seq !== sSeq) return;
    out.innerHTML = '<div class="tl-card tl-empty">Gagal mencari: ' + esc(e.message) + '</div>';
  }
}

function renderResult(j) {
  const out = $('tl-out');
  if (!j.items.length && !j.total) { out.innerHTML = '<div class="tl-card tl-empty">Tidak ada tiket yang cocok dengan "' + esc(j.q) + '".</div>'; return; }
  const f = j.facets;
  const opt = (v, label) => '<option value="' + esc(v) + '">' + esc(label) + '</option>';
  out.innerHTML =
    '<div class="tl-filters">' +
    '<label>Tahun<select id="tl-f-year">' + opt('', 'Semua tahun') + f.years.map(y => opt(y, y)).join('') + '</select></label>' +
    '<label>Bulan<select id="tl-f-month">' + opt('', 'Semua bulan') + MONTHS_ID.map((m, i) => opt(i, m)).join('') + '</select></label>' +
    '<label>Detail Sub Category<select id="tl-f-detail">' + opt('', 'Semua detail') + f.details.map(d => opt(d, d)).join('') + (f.noDetail ? opt('__none__', '(Tanpa detail)') : '') + '</select></label>' +
    '<button type="button" class="btn btn-ghost btn-sm" id="tl-f-reset">Reset filter</button></div>' +
    '<div class="tl-hint" id="tl-note" style="margin:0 0 10px"></div>' +
    '<div class="tl-layout"><div class="tl-card tl-list" id="tl-list"></div><div id="tl-detail"><div class="tl-card tl-empty">Klik salah satu tiket untuk melihat detailnya.</div></div></div>';
  $('tl-f-year').onchange = (e) => { sFilter.year = e.target.value; applyFilter(); };
  $('tl-f-month').onchange = (e) => { sFilter.month = e.target.value; applyFilter(); };
  $('tl-f-detail').onchange = (e) => { sFilter.detail = e.target.value; applyFilter(); };
  $('tl-f-reset').onclick = () => {
    sFilter.year = sFilter.month = sFilter.detail = '';
    ['tl-f-year', 'tl-f-month', 'tl-f-detail'].forEach(id => { $(id).value = ''; });
    applyFilter();
  };
  renderList();
}

// Filter dijalankan di server supaya mencakup semua tiket yang cocok, bukan cuma yang tampil
async function applyFilter() {
  const seq = ++sSeq;
  $('tl-list').innerHTML = '<div class="tl-empty">Memfilter...</div>';
  try {
    const qs = '?q=' + encodeURIComponent(sQ) +
      (sFilter.year !== '' ? '&year=' + encodeURIComponent(sFilter.year) : '') +
      (sFilter.month !== '' ? '&month=' + encodeURIComponent(sFilter.month) : '') +
      (sFilter.detail !== '' ? '&detail=' + encodeURIComponent(sFilter.detail) : '');
    const j = await api(qs);
    if (seq !== sSeq) return;
    sItems = j.items; sResp = j;
    renderList();
  } catch (e) {
    if (seq !== sSeq) return;
    $('tl-list').innerHTML = '<div class="tl-empty">Gagal memfilter: ' + esc(e.message) + '</div>';
  }
}

function renderList() {
  const j = sResp;
  const filtered = sFilter.year !== '' || sFilter.month !== '' || sFilter.detail !== '';
  let note = filtered ? nf(j.matched) + ' dari ' + nf(j.total) + ' tiket sesuai filter.' : nf(j.total) + ' tiket ditemukan.';
  if (j.matched > j.shown) note += ' Menampilkan ' + nf(j.shown) + ' terbaru — tambah filter atau persempit kata kunci untuk melihat sisanya.';
  if (j.capped) note += ' Kata kunci terlalu umum: hanya ' + nf(j.scanCap) + ' tiket terbaru yang dipindai.';
  $('tl-note').textContent = note;
  const box = $('tl-list');
  if (!sItems.length) { box.innerHTML = '<div class="tl-empty">Tidak ada tiket yang sesuai filter.</div>'; return; }
  box.innerHTML = sItems.map((r, i) =>
    '<button type="button" class="tl-item' + (r.rowId === sActive ? ' on' : '') + '" data-i="' + i + '">' +
    '<div class="tl-id">' + esc(r.id) + '</div>' +
    '<div class="tl-sub" title="' + esc(r.subject) + '">' + esc(r.subject || '(tanpa subject)') + '</div>' +
    '<div class="tl-meta"><span>' + esc(r.status || '—') + '</span><span>' + esc(r.severity || '—') + '</span>' +
    '<span>' + esc(r.subCategory || '—') + (r.detailSubCategory ? ' › ' + esc(r.detailSubCategory) : '') + '</span>' +
    '<span>' + fmtDt(r.openTs, r.openMode) + '</span></div></button>').join('');
  box.querySelectorAll('.tl-item').forEach(b => b.addEventListener('click', () => openDetail(+b.dataset.i)));
}

async function openDetail(i) {
  const r = sItems[i]; if (!r) return;
  sActive = r.rowId;
  document.querySelectorAll('.tl-item').forEach(b => b.classList.toggle('on', +b.dataset.i === i));
  const box = $('tl-detail');
  box.innerHTML = '<div class="tl-card tl-empty">Memuat detail...</div>';
  try {
    const d = await api('?id=' + encodeURIComponent(r.rowId));
    if (sActive !== r.rowId) return;
    box.innerHTML = detailHtml(d);
  } catch (e) {
    if (sActive !== r.rowId) return;
    box.innerHTML = '<div class="tl-card tl-empty">Gagal memuat detail: ' + esc(e.message) + '</div>';
  }
}

// Remarks dari export sering kehilangan baris baru (label menempel ke kata sebelumnya: "...MeteraiSubjek :").
// Dirapikan hanya saat ditampilkan; data asli di database tidak diubah.
function fmtRemarks(t){
  let s = String(t == null ? '' : t).replace(/\r\n?/g, '\n');
  s = s.replace(/[ \t]*(Kategori|Subjek|Tipe Tiket|Pelapor|Perusahaan|Keterangan|Other Information|Email Account Used)([ \t]*:)/g, '\n$1$2');
  const i = s.indexOf('Other Information');
  if (i >= 0) {
    const head = s.slice(0, i), tail = s.slice(i)
      .replace(/[ \t]+([A-E])\.[ \t]+(?=[A-Z])/g, '\n$1. ')
      .replace(/[ \t]*_{5,}[ \t]*/g, '\n_________\n');
    s = head + tail;
  }
  return s.replace(/\n[ \t]*\n+/g, '\n').trim();
}

function kv(k, v, hdr) {
  const val = (v === '' || v == null) ? '<span class="tl-muted">—' + (hdr === null ? ' (kolom belum terdeteksi)' : '') + '</span>' : esc(v);
  return '<div class="tl-k">' + k + '</div><div class="tl-v">' + val + '</div>';
}

function detailHtml(d) {
  const tl = DATE_ROWS.map(([k, label]) => {
    const x = d.dates[k];
    const has = x.ts !== null && x.ts !== undefined;
    return '<li class="' + (has ? 'has' : 'none') + '"><span class="tl-tk">' + label + '</span> — ' + (has ? fmtDt(x.ts, x.mode) : '—') + '</li>';
  }).join('');
  const block = (title, f, fmt) => '<div class="tl-sec">' + title + '</div>' + (f.value ? '<div class="tl-text">' + esc(fmt ? fmt(f.value) : f.value) + '</div>' : '<div class="tl-muted">—</div>');
  return '<div class="tl-card"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px">' +
    '<h3 style="margin:0;font-size:16px">Tiket ' + esc(d.id) + '</h3>' +
    (d.escalated ? '<span class="tl-badge">Escalated</span>' : '') +
    (d.period ? '<span class="tl-muted">Periode ' + esc(d.period) + '</span>' : '') + '</div>' +
    '<div class="tl-kv">' + kv('Subject', d.subject.value, d.subject.header) + kv('Status', d.status.value, d.status.header) +
    kv('Severity', d.severity.value, d.severity.header) + kv('Sub Category', d.subCategory) + kv('Detail Sub Category', d.detailSubCategory) +
    kv('Unit', d.unit.value, d.unit.header) + kv('Dibuat / Dibuka oleh', d.createdBy.value, d.createdBy.header) + '</div>' +
    '<div class="tl-sec">Riwayat tanggal</div><ul class="tl-tline">' + tl + '</ul>' +
    block('Remarks', d.remarks, fmtRemarks) + block('Feedback', d.feedback) +
    '<details style="margin-top:18px"><summary class="tl-muted" style="cursor:pointer">Semua kolom data (' + d.allColumns.length + ')</summary>' +
    '<div style="overflow-x:auto"><table class="tl-table"><tbody>' +
    d.allColumns.map(c => '<tr><td style="width:34%;font-weight:600;color:#718096">' + esc(c[0]) + '</td><td style="word-break:break-word">' + (c[1] === '' ? '<span class="tl-muted">—</span>' : esc(c[1])) + '</td></tr>').join('') +
    '</tbody></table></div></details></div>';
}
