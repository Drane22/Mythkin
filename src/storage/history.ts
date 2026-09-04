// Local-only history. Nothing leaves the device.
// Structured so a future "bestiary" (favourites) can live alongside it.
const KEY = "mnmg:history:v1";
const MAX = 12;

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch { return []; }
}

export function pushHistory(name: string): string[] {
  const n = name.trim();
  if (!n) return loadHistory();
  const list = [n, ...loadHistory().filter((x) => x.toLowerCase() !== n.toLowerCase())].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore quota */ }
  return list;
}

export function clearHistory() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
