// Fase 3: Local Save System (JSON lokal, offline-first)
// Menggunakan localStorage agar berfungsi tanpa internet. Fallback ke JSON file jika needed.

const KEY = 'mathrpg_save_v1';

export function saveGame(player) {
  try {
    const data = JSON.stringify({ player, savedAt: Date.now() });
    localStorage.setItem(KEY, data);
    return true;
  } catch(e) { console.error('Save failed', e); return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.player || null;
  } catch(e) { return null; }
}

export function hasSave() { return !!localStorage.getItem(KEY); }

export function deleteSave() { localStorage.removeItem(KEY); }

export function exportJSON(player) {
  return JSON.stringify({ player, exportedAt: new Date().toISOString() }, null, 2);
}
