import type { Branch } from "./content";

// Plain (server-safe) branch helpers; branch-context.tsx is client-only, so server pages import from here.
export const BRANCH_IDS: Branch["id"][] = ["khamseen", "shahar", "wisam"];

export function isBranchId(value: string): value is Branch["id"] {
  return (BRANCH_IDS as string[]).includes(value);
}

// Whether something tied to a branch (a doctor, a device…) belongs on the current page. The home page shows all.
export function inBranch(current: Branch["id"] | null, itemBranch: Branch["id"] | undefined) {
  return current === null || itemBranch === current;
}
