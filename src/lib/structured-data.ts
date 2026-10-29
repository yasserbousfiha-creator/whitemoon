import { BRANCH_IDS } from "./branches";
import { arContent, branchContacts, type Branch } from "./content";

// What Google reads about the clinic (schema.org JSON-LD): the group, and each branch as a clinic with its address,
// phone, hours and specialties — for search results and Maps. No star rating here: Google ignores ratings a business
// publishes about itself. Hours = the booking hours (lib/slots.ts: daily 9 AM – 10 PM).

const SITE = "https://whitemoonclinic.com";

const SPECIALTY: Record<string, string> = {
  dentistry: "Dentistry",
  derma: "Dermatology",
  laser: "Dermatology",
  gynecology: "Obstetric",
  pediatrics: "Pediatric",
  general: "PrimaryCare",
};

function clinic(id: Branch["id"]) {
  const b = arContent.branches.find((x) => x.id === id)!;
  const c = { ...arContent, ...branchContacts[id] };
  const services = arContent.services.filter((s) => !s.branches || s.branches.includes(id));
  return {
    "@type": ["MedicalClinic", "Dentist"],
    "@id": `${SITE}/${id}#clinic`,
    name: `مجمع وايت مون الطبي — ${b.name}`,
    alternateName: `White Moon Medical Complex — ${id}`,
    url: `${SITE}/${id}`,
    image: `${SITE}/og/${id}.jpg`,
    logo: `${SITE}/images/logo.png`,
    telephone: c.phone,
    hasMap: b.mapUrl,
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "الطائف", addressRegion: "منطقة مكة المكرمة", addressCountry: "SA" },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    medicalSpecialty: [...new Set(services.map((s) => SPECIALTY[s.icon]).filter(Boolean))],
    availableService: services.map((s) => ({ "@type": "MedicalProcedure", name: s.title })),
    sameAs: [c.instagramUrl, c.tiktokUrl, c.snapchatUrl].filter(Boolean),
    parentOrganization: { "@id": `${SITE}/#org` },
  };
}

function organization() {
  return {
    "@type": "MedicalOrganization",
    "@id": `${SITE}/#org`,
    name: "مجمع وايت مون الطبي",
    alternateName: "White Moon Medical Complex",
    url: SITE,
    logo: `${SITE}/images/logo.png`,
    image: `${SITE}/og/home.jpg`,
    telephone: arContent.phone,
    sameAs: [arContent.instagramUrl, arContent.tiktokUrl, arContent.snapchatUrl],
    department: BRANCH_IDS.map((id) => ({ "@id": `${SITE}/${id}#clinic` })),
  };
}

/** The JSON-LD for a page: the home page lists the group and its three branches; a branch page, that branch. */
export function structuredData(branch: Branch["id"] | null) {
  const graph = branch ? [organization(), clinic(branch)] : [organization(), ...BRANCH_IDS.map(clinic)];
  // "<" escaped so nothing in the content can close the <script>.
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}
