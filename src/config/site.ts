// src/config/site.ts

export type SiteConfig = {
  name: string;
  brandTagline: string;

  address: string;
  phoneE164: string;
  phonePretty: string;
  email: string;

  socials: {
    instagram: string;
    whatsapp: string;
  };

  logo: string;
};

export const site = {
  name: "Voltride Electric LLC",
  brandTagline: "Electric mobility + clean power",

  address: "11510 Biscayne Blvd, FL 33181",

  phoneE164: "+17864091226",
  phonePretty: "(786) 409-1226",

  email: "Voltrideelectric1@gmail.com",

  socials: {
    instagram: "#",
    whatsapp: "https://wa.me/17864091226",
  },

  logo: "/IMG/voltride-logo.png",
} as const satisfies SiteConfig;