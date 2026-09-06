// src/data/products.ts

export type ProductCategory =
  | "scooters"
  | "ebikes"
  | "audio";

export type ProductCondition =
  | "Nueva"
  | "Usada";

export type Product = {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  image: string;
  condition: ProductCondition;
  category: ProductCategory;
  engine?: string;
  featured?: boolean;
  description?: string;
  features?: string[];
  mileage?: number;
  gallery?: string[];
};

const storeGallery = [
  "/IMG/store-front.jpeg",
  "/IMG/store-inside.jpeg",
  "/IMG/tienda-fisica-voltride.jpeg",
];

export const products: Product[] = [
  {
    id: 5,
    name: "Electric Scooter City",
    brand: "EBABS",
    model: "City 500W",
    year: 2025,
    price: 1500,
    image:
      "/IMG/Scooter-electrico(1).jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,

    description:
      "Urban electric scooter designed for everyday mobility in Miami, with zero emissions and low maintenance.",

    features: [
      "Electric motor",
      "Lightweight and agile",
      "High-capacity battery",
    ],

    gallery: [
      "/IMG/Scooter-electrico(1).jpeg",
      "/IMG/Scooter-electrico (2).jpeg",
      "/IMG/Scooter-electrico (3).jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 8,
    name: "Electric Scooter 2025",
    brand: "Master Sonic",
    model: "Urban Pro",
    year: 2025,
    price: 1850,
    image:
      "/IMG/ELECTRIC SCOOTER.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,

    description:
      "A robust electric scooter with extended range, ideal for daily use and longer city rides.",

    features: [
      "Electric motor",
      "Comfort suspension",
      "Extended range",
    ],

    gallery: [
      "/IMG/ELECTRIC SCOOTER.jpeg",
      "/IMG/scooter-azul.jpeg",
      "/IMG/scooter-azul-oscuro.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 12,
    name: "Electric Scooter Urban",
    brand: "EBABS",
    model: "Scooter Urban 2025",
    year: 2025,
    price: 1000,
    image:
      "/IMG/electricBike3.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",

    description:
      "Compact and lightweight electric scooter designed for city riding, easy handling, and convenient storage.",

    features: [
      "Electric motor",
      "Compact design",
      "Removable battery",
    ],

    gallery: [
      "/IMG/electricBike3.jpeg",
      "/IMG/electricBike.jpeg",
      "/IMG/electricBike2.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 18,
    name: "Scooter Movelito",
    brand: "Movelito",
    model: "Scooter Movelito 2025",
    year: 2025,
    price: 1850,
    image:
      "/IMG/scooter-azul.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,

    description:
      "Modern and comfortable electric scooter designed for practical everyday transportation.",

    features: [
      "Electric motor",
      "Lightweight and agile",
      "High-capacity battery",
    ],

    gallery: [
      "/IMG/scooter-azul.jpeg",
      "/IMG/scooter-azul-oscuro.jpeg",
      "/IMG/scooter-rojo.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 20,
    name: "Scooter Eléctrico Hiboy",
    brand: "Hiboy",
    model: "Hiboy 2025",
    year: 2025,
    price: 500,
    image:
      "/IMG/scooter-electrico-hiboy.jpg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",

    description:
      "An affordable entry into electric mobility, ideal for short trips and everyday city transportation.",

    features: [
      "Electric motor",
      "Foldable design",
      "Regenerative braking",
    ],

    gallery: [
      "/IMG/scooter-electrico-hiboy.jpg",
      "/IMG/scooter-cebas.webp",
      ...storeGallery,
    ],
  },

  {
    id: 25,
    name: "E-bike XP4",
    brand: "E-Bike",
    model: "XP4",
    year: 2025,
    price: 2500,
    image:
      "/IMG/e-bike-xp4-2500.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",
    featured: true,

    description:
      "Urban-style e-bike built for comfortable and practical everyday mobility.",

    features: [
      "Electric motor",
      "High-capacity battery",
      "Compact design",
    ],

    gallery: [
      "/IMG/e-bike-xp4-2500.jpeg",
      "/IMG/bici-electric-negra.jpeg",
      "/IMG/e-bike-rambo-2850.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 26,
    name: "E-bike Rambo",
    brand: "E-Bike",
    model: "Rambo",
    year: 2025,
    price: 2850,
    image:
      "/IMG/e-bike-rambo-2850.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",

    description:
      "Heavy-duty e-bike with wide tires and a robust frame designed for stability and comfortable riding.",

    features: [
      "Electric motor",
      "Comfort suspension",
      "Extended range",
    ],

    gallery: [
      "/IMG/e-bike-rambo-2850.jpeg",
      "/IMG/e-bike-xp4-2500.jpeg",
      "/IMG/e-bike-super73-3500.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 27,
    name: "E-bike Super 73",
    brand: "E-Bike",
    model: "Super 73",
    year: 2025,
    price: 3500,
    image:
      "/IMG/e-bike-super73-3500.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",
    featured: true,

    description:
      "Scrambler-style e-bike combining strong performance, comfort, and a distinctive urban design.",

    features: [
      "High-power electric motor",
      "High-capacity battery",
      "Heavy-duty design",
    ],

    gallery: [
      "/IMG/e-bike-super73-3500.jpeg",
      "/IMG/e-bike-rambo-2850.jpeg",
      "/IMG/bici-electric-negra.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 21,
    name: "JBL Charge 4",
    brand: "JBL",
    model: "Charge 4",
    year: 2025,
    price: 150,
    image:
      "/IMG/jbl-charge-4.jpeg",
    condition: "Nueva",
    category: "audio",
    featured: true,

    description:
      "JBL Charge 4 portable speaker with long battery life and powerful sound for indoor and outdoor use.",

    features: [
      "Bluetooth",
      "Water resistant",
      "Rechargeable battery",
    ],

    gallery: [
      "/IMG/jbl-charge-4.jpeg",
      "/IMG/jbl-go-4.jpeg",
      "/IMG/jbl-flip-6.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 22,
    name: "JBL GO 4",
    brand: "JBL",
    model: "GO 4",
    year: 2025,
    price: 50,
    image:
      "/IMG/jbl-go-4.jpeg",
    condition: "Nueva",
    category: "audio",

    description:
      "Ultra-compact portable speaker designed for everyday use and easy transportation.",

    features: [
      "Bluetooth",
      "Compact size",
      "Up to 8 hours of battery life",
    ],

    gallery: [
      "/IMG/jbl-go-4.jpeg",
      "/IMG/jbl-flip-6.jpeg",
      "/IMG/jbl-charge-4.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 23,
    name: "JBL Party Box",
    brand: "JBL",
    model: "Party Box",
    year: 2025,
    price: 800,
    image:
      "/IMG/jbl-party-box.jpeg",
    condition: "Nueva",
    category: "audio",
    featured: true,

    description:
      "JBL Party Box with powerful sound and LED lighting, designed for parties, events, and larger spaces.",

    features: [
      "High-power audio",
      "LED lighting",
      "Microphone inputs",
    ],

    gallery: [
      "/IMG/jbl-party-box.jpeg",
      "/IMG/jbl-charge-4.jpeg",
      "/IMG/jbl-flip-6.jpeg",
      ...storeGallery,
    ],
  },

  {
    id: 24,
    name: "JBL Flip 6",
    brand: "JBL",
    model: "Flip 6",
    year: 2025,
    price: 200,
    image:
      "/IMG/jbl-flip-6.jpeg",
    condition: "Nueva",
    category: "audio",

    description:
      "Portable JBL Flip 6 speaker with balanced sound, water resistance, and an easy-to-carry design.",

    features: [
      "Bluetooth",
      "Water resistant",
      "Portable design",
    ],

    gallery: [
      "/IMG/jbl-flip-6.jpeg",
      "/IMG/jbl-go-4.jpeg",
      "/IMG/jbl-charge-4.jpeg",
      ...storeGallery,
    ],
  },
];