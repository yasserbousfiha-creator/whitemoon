"use client";

import { createContext, useContext } from "react";
import type { Branch } from "./content";

// The branch a page is for: /khamseen, /shahar, /wisam set it; the home page (branch picker) leaves it null.
const BranchContext = createContext<Branch["id"] | null>(null);

export const BranchProvider = BranchContext.Provider;

export function useBranch() {
  return useContext(BranchContext);
}

export { inBranch } from "./branches";
