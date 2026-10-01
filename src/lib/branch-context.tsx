"use client";

import { createContext, useContext } from "react";
import type { Branch } from "./content";

// The branch a page is for: /khamseen, /shahar, /wisam set it; the home page (branch picker) leaves it null.
const BranchContext = createContext<Branch["id"] | null>(null);

export const BranchProvider = BranchContext.Provider;

export function useBranch() {
  return useContext(BranchContext);
}

export const BRANCH_IDS: Branch["id"][] = ["khamseen", "shahar", "wisam"];

export function isBranchId(value: string): value is Branch["id"] {
  return (BRANCH_IDS as string[]).includes(value);
}

// Whether something tied to a branch (a doctor, a device…) belongs on the current page. The home page shows all.
export function inBranch(current: Branch["id"] | null, itemBranch: Branch["id"] | undefined) {
  return current === null || itemBranch === current;
}
