"use client";

import { createContext, useContext } from "react";
import type { ServiceContent, TeamMember } from "./content";
import type { Doctor } from "./doctors";
import { useLocale } from "./locale-context";

// The visible doctors, read from the database on the server (HomePage) and handed to the page's client components.
const DoctorsContext = createContext<Doctor[]>([]);

export const DoctorsProvider = DoctorsContext.Provider;

export function useDoctors() {
  return useContext(DoctorsContext);
}

export function useDoctor(id: string | null | undefined) {
  const doctors = useDoctors();
  return id ? (doctors.find((d) => d.id === id) ?? null) : null;
}

// A doctor as a team card, in the page's language.
export const teamMember = (d: Doctor, isArabic: boolean): TeamMember => ({
  id: d.id,
  name: isArabic ? d.nameAr : d.nameEn,
  role: isArabic ? d.roleAr : d.roleEn,
  photo: d.photo ?? undefined,
  portrait: d.portrait ?? undefined,
  branch: d.branch,
  cases: d.cases,
});

// A department's doctors as team cards.
export function useTeam(service: ServiceContent["icon"]): TeamMember[] {
  const doctors = useDoctors();
  const { isArabic } = useLocale();
  return doctors.filter((d) => d.service === service).map((d) => teamMember(d, isArabic));
}
