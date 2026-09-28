"use client";

import { useSyncExternalStore } from "react";
import type { Branch, ServiceContent } from "./content";

// The visitor's "account" on this browser, mirroring the mobile app: saved after their first booking, it pre-fills
// later bookings and lists their appointments. Each booking keeps the token returned by /api/booking, which
// /api/booking/status accepts to read back the clinic's status and note.
const KEY = "wm-account-v1";

export type BookingStatus = "new" | "contacted" | "confirmed" | "cancelled";

export interface AccountBooking {
  token: string;
  service: ServiceContent["icon"];
  branch: Branch["id"];
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM, Riyadh time
  doctor?: string | null;
  sentAt: string; // ISO timestamp
  status?: BookingStatus;
  notes?: string | null;
}

export interface Account {
  name: string;
  phone: string;
  email: string;
  bookings: AccountBooking[];
}

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cached: Account | null = null;

function read(): Account | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode): behave as signed out.
  }
  // useSyncExternalStore needs a stable snapshot, so only re-parse when the stored text changes.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

function write(account: Account | null) {
  try {
    if (account) localStorage.setItem(KEY, JSON.stringify(account));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing persists, the page still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Null during prerender and until the browser has read storage.
export function useAccount() {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function recordBooking(details: Omit<Account, "bookings">, booking: Omit<AccountBooking, "sentAt">) {
  const current = read();
  write({ ...details, bookings: [{ ...booking, sentAt: new Date().toISOString() }, ...(current?.bookings ?? [])] });
}

export function signOut() {
  write(null);
}

// Pulls the latest status and clinic note; bookings the server no longer has (deleted by the clinic) are dropped.
export async function refreshStatuses() {
  const account = read();
  const tokens = account?.bookings.map((b) => b.token).slice(0, 50) ?? [];
  if (!account || tokens.length === 0) return;
  try {
    const res = await fetch("/api/booking/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens }),
    });
    if (!res.ok) return;
    const { bookings } = (await res.json()) as {
      bookings: { token: string; status: BookingStatus; notes: string | null; date: string | null; time: string | null }[];
    };
    const byToken = new Map(bookings.map((b) => [b.token, b]));
    const asked = new Set(tokens);
    write({
      ...account,
      bookings: account.bookings
        .filter((b) => !asked.has(b.token) || byToken.has(b.token))
        .map((b) => {
          const latest = byToken.get(b.token);
          return latest
            ? { ...b, status: latest.status, notes: latest.notes, slotDate: latest.date ?? b.slotDate, slotTime: latest.time ?? b.slotTime }
            : b;
        }),
    });
  } catch {
    // Offline: keep the last known statuses.
  }
}

// Appointment start as an instant (slots are Riyadh wall-clock, UTC+3).
export function appointmentTime(b: AccountBooking) {
  const [y, m, d] = b.slotDate.split("-").map(Number);
  const [h, min] = b.slotTime.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h - 3, min);
}

// Upcoming: not cancelled and still ahead, soonest first. Everything else is past, latest first.
export function splitBookings(bookings: AccountBooking[]) {
  const now = Date.now();
  const isUpcoming = (b: AccountBooking) => b.status !== "cancelled" && appointmentTime(b) > now;
  return {
    upcoming: bookings.filter(isUpcoming).sort((a, b) => appointmentTime(a) - appointmentTime(b)),
    past: bookings.filter((b) => !isUpcoming(b)).sort((a, b) => appointmentTime(b) - appointmentTime(a)),
  };
}
