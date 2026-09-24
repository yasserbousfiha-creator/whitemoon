// Demo store: entries live in this browser's localStorage. Replace these functions with API calls
// backed by a real database once payments are live.
const KEY = "wm-contest-v1";
export const CONTEST_EVENT = "wm-contest-update";

export interface ContestEntry {
  id: number;
  name: string;
  phone: string;
  month: string;
}

export interface ContestWinner {
  name: string;
  phone: string;
}

interface Store {
  entries: ContestEntry[];
  winners: Record<string, ContestWinner>;
}

export function currentMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function daysLeftInMonth(d = new Date()) {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return last - d.getDate() + 1;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 7 ? `${digits.slice(0, 3)}***${digits.slice(-4)}` : "***";
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return { entries: [], winners: {} };
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {}
  window.dispatchEvent(new Event(CONTEST_EVENT));
}

export function getState() {
  const month = currentMonth();
  const store = read();
  return { entries: store.entries.filter((e) => e.month === month), winner: store.winners[month] ?? null };
}

export function addEntry(name: string, phone: string): number {
  const store = read();
  const month = currentMonth();
  const id = store.entries.filter((e) => e.month === month).length + 1;
  store.entries.push({ id, name, phone, month });
  write(store);
  return id;
}

export function drawWinner(): ContestWinner | null {
  const store = read();
  const month = currentMonth();
  const pool = store.entries.filter((e) => e.month === month);
  if (pool.length === 0) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const winner = { name: pick.name, phone: maskPhone(pick.phone) };
  store.winners[month] = winner;
  write(store);
  return winner;
}
