// Anonymous site statistics (/admin → "الإحصائيات"): a visit, a branch page opened, a booking button or a WhatsApp
// link clicked. The visitor is a random id kept in the browser, so one person counts once; nothing personal is sent.
export const TRACK_TYPES = ["visit", "branch", "book_click", "whatsapp"] as const;
export type TrackType = (typeof TRACK_TYPES)[number];

const VISITOR_KEY = "wm:visitor";

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // storage blocked: counted, just not recognized next time
  }
}

// The branch page the visitor is on (/khamseen…), or null on the home page.
function pageBranch() {
  const first = location.pathname.split("/")[1];
  return ["khamseen", "shahar", "wisam"].includes(first) ? first : null;
}

export function track(type: TrackType) {
  try {
    const body = JSON.stringify({ type, branch: pageBranch(), visitor: visitorId() });
    // sendBeacon survives leaving the page (a WhatsApp link opening the app).
    if (!navigator.sendBeacon?.("/api/track", body)) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

// Once per browser session for this key (a visit, or a branch page), so reloading doesn't count again.
export function trackOnce(type: TrackType, key: string) {
  try {
    const k = `wm:tracked:${key}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {}
  track(type);
}
