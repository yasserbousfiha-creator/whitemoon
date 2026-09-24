"use client";

import { createContext, useContext, useState } from "react";
import { ServiceContent } from "./content";

interface ServicesUIValue {
  expandedIcon: ServiceContent["icon"] | null;
  setExpandedIcon: (icon: ServiceContent["icon"] | null) => void;
}

const ServicesUIContext = createContext<ServicesUIValue | null>(null);

export function ServicesUIProvider({ children }: { children: React.ReactNode }) {
  const [expandedIcon, setExpandedIcon] = useState<ServiceContent["icon"] | null>(null);
  return <ServicesUIContext.Provider value={{ expandedIcon, setExpandedIcon }}>{children}</ServicesUIContext.Provider>;
}

export function useServicesUI(): ServicesUIValue {
  const ctx = useContext(ServicesUIContext);
  if (!ctx) throw new Error("useServicesUI must be used within a ServicesUIProvider");
  return ctx;
}
