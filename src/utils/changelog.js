// ===== Changelog: sumber data bersama (halaman Changelog + versi di sidebar) =====
// Entry = hasil sync Git (public/changelog.json) yang ditimpa edit admin di Firestore (kalau ada).
// `version` = kunci internal (mis. "v2026.09", juga id dokumen Firestore) -- JANGAN diubah supaya edit admin tidak hilang.
// `label`   = versi yang ditampilkan: 1.N.0, N = urutan bulan (terlama = 1.1.0). 4 bulan => 1.4.0, bulan baru => 1.5.0, dst.
import { loadChangelogOverrides } from './data.js';

const hashesOf = (lines) => new Set((lines || []).flatMap(l => (String(l).match(/\[([0-9a-f]{7,})\]\s*$/) || []).slice(1)));

function getFallbackChangelog() {
  return [{
    version: 'v2025.01', date: '2025-01-15', type: 'feat',
    changes: ['Initial release of Hades KB', 'Changelog page synced with Git history']
  }];
}

export function semverLabel(index) { return `1.${index}.0`; }

let cache = null;

export async function loadMerged(force = false) {
  if (cache && !force) return cache;
  let base = [];
  try {
    const r = await fetch('/changelog.json');
    if (r.ok) base = await r.json();
  } catch (e) { console.warn('Could not fetch changelog from JSON'); }
  if (!base.length) base = getFallbackChangelog();

  const ov = await loadChangelogOverrides();
  const merged = base.map(e => {
    const o = ov[e.version];
    if (!o) return { ...e, edited: false };
    const have = hashesOf(o.changes);
    const missing = (e.changes || []).filter(l => { const h = [...hashesOf([l])][0]; return h && !have.has(h); });
    return { version: e.version, date: o.date, type: o.type, changes: o.changes, edited: true, editedBy: o.editedBy, gitChanges: e.changes, missing };
  });
  Object.keys(ov).forEach(v => {
    if (!base.some(e => e.version === v)) merged.push({ ...ov[v], version: v, edited: true, gitChanges: [], missing: [] });
  });

  // Penomoran 1.N.0 mengikuti urutan kunci bulan (bukan tanggal yang bisa diedit admin)
  [...merged].sort((a, b) => String(a.version).localeCompare(String(b.version)))
    .forEach((e, i) => { e.label = semverLabel(i + 1); });

  // Tampil terbaru di atas
  cache = merged.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return cache;
}

// Versi terbaru (= jumlah entry changelog), mis. "1.4.0"
export async function getAppVersion() {
  const list = await loadMerged();
  return semverLabel(list.length);
}
