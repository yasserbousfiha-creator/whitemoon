import type { Branch, ServiceContent } from "./content";

// Plain (server-safe) branch helpers; branch-context.tsx is client-only, so server pages import from here.
export const BRANCH_IDS: Branch["id"][] = ["khamseen", "shahar", "wisam"];

export function isBranchId(value: string): value is Branch["id"] {
  return (BRANCH_IDS as string[]).includes(value);
}

// Whether something tied to a branch (a doctor, a device…) belongs on the current page. The home page shows all.
export function inBranch(current: Branch["id"] | null, itemBranch: Branch["id"] | undefined) {
  return current === null || itemBranch === current;
}

// Whether a department is offered on the current page (or at the branch picked in the booking form).
export function offeredIn(current: Branch["id"] | null, service: Pick<ServiceContent, "branches">) {
  return current === null || !service.branches || service.branches.includes(current);
}

// A department's list lines on a branch's page: its own extra lines added (the home page shows every branch's).
export function itemsIn(current: Branch["id"] | null, service: Pick<ServiceContent, "items" | "branchItems">) {
  const extra = current === null ? Object.values(service.branchItems ?? {}).flat() : (service.branchItems?.[current] ?? []);
  return [...service.items, ...extra];
}
