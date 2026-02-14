//src/data/products.ts
export type ProductCategory = "scooters" | "ebikes" | "audio";

export type Product = {
  id: number;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  image: string;
  condition: "Nueva" | "Usada";
  category: ProductCategory;

  engine?: string;
  featured?: boolean;
  description?: string;
  features?: string[];
  mileage?: number;
  gallery?: string[];
};

export const products: Product[] = [
  // --- SCOOTERS ---
  {
    id: 5,
    name: "Electric Scooter City",
    brand: "EBABS",
    model: "City 500W",
    year: 2025,
    price: 1500,
    image: "/IMG/Scooter-electrico(1).jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,
    description:
      "Scooter eléctrico urbano, perfecto para moverte por Miami con cero emisiones y bajo mantenimiento.",
    features: ["Motor eléctrico", "Ligero y ágil", "Batería de alta capacidad"],
  },
  {
    id: 8,
    name: "Electric Scooter 2025",
    brand: "Master Sonic",
    model: "Urban Pro",
    year: 2025,
    price: 1850,
    image: "/IMG/ELECTRIC SCOOTER.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,
    description:
      "Scooter eléctrico robusto con gran autonomía, ideal para uso diario y recorridos más largos.",
    features: ["Motor eléctrico", "Suspensión confortable", "Autonomía extendida"],
  },
  {
    id: 12,
    name: "Electric Scooter Urban",
    brand: "EBABS",
    model: "Scooter Urban 2025",
    year: 2025,
    price: 1000,
    image: "/IMG/electricBike3.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    description:
      "Modelo compacto y ligero, pensado para la ciudad. Fácil de manejar y de guardar.",
    features: ["Motor eléctrico", "Diseño compacto", "Batería removible"],
  },
  {
    id: 18,
    name: "Scooter Movelito",
    brand: "Movelito",
    model: "Scooter Movelito 2025",
    year: 2025,
    price: 1850,
    image: "/IMG/scooter-azul.jpeg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    featured: true,
    description:
      "Scooter eléctrico con diseño moderno y cómodo, ideal para el día a día.",
    features: ["Motor eléctrico", "Ligero y ágil", "Batería de alta capacidad"],
  },
  {
    id: 20,
    name: "Scooter Eléctrico Hiboy",
    brand: "Hiboy",
    model: "Hiboy 2025",
    year: 2025,
    price: 500,
    image: "/IMG/scooter-electrico-hiboy.jpg",
    condition: "Nueva",
    category: "scooters",
    engine: "Electric",
    description:
      "Opción accesible para comenzar en la movilidad eléctrica, perfecta para trayectos cortos.",
    features: ["Motor eléctrico", "Plegable", "Freno regenerativo"],
  },

  // --- E-BIKES ---
  {
    id: 25,
    name: "E-bike XP4",
    brand: "E-Bike",
    model: "XP4",
    year: 2025,
    price: 2500,
    image: "/IMG/e-bike-xp4-2500.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",
    featured: true,
    description: "E-bike estilo urbano, ideal para movilidad diaria.",
    features: ["Motor eléctrico", "Batería de alta capacidad", "Diseño compacto"],
  },
  {
    id: 26,
    name: "E-bike Rambo",
    brand: "E-Bike",
    model: "Rambo",
    year: 2025,
    price: 2850,
    image: "/IMG/e-bike-rambo-2850.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",
    description: "E-bike con ruedas anchas y estructura robusta.",
    features: ["Motor eléctrico", "Suspensión confortable", "Autonomía extendida"],
  },
  {
    id: 27,
    name: "E-bike Super 73",
    brand: "E-Bike",
    model: "Super 73",
    year: 2025,
    price: 3500,
    image: "/IMG/e-bike-super73-3500.jpeg",
    condition: "Nueva",
    category: "ebikes",
    engine: "Electric",
    featured: true,
    description: "E-bike estilo scrambler, potente y cómoda.",
    features: ["Motor eléctrico de alta potencia", "Batería de alta capacidad", "Diseño robusto"],
  },

  // --- JBL / AUDIO ---
  {
    id: 21,
    name: "JBL Charge 4",
    brand: "JBL",
    model: "Charge 4",
    year: 2025,
    price: 150,
    image: "/IMG/jbl-charge-4.jpeg",
    condition: "Nueva",
    category: "audio",
    featured: true,
    description:
      "Parlante JBL Charge 4 con batería de larga duración y sonido potente para interior y exterior.",
    features: ["Bluetooth", "Resistente al agua", "Batería recargable"],
  },
  {
    id: 22,
    name: "JBL GO 4",
    brand: "JBL",
    model: "GO 4",
    year: 2025,
    price: 50,
    image: "/IMG/jbl-go-4.jpeg",
    condition: "Nueva",
    category: "audio",
    description: "Parlante ultra compacto para llevar en el bolsillo. Ideal para uso diario.",
    features: ["Bluetooth", "Tamaño compacto", "Hasta 8h de batería"],
  },
  {
    id: 23,
    name: "JBL Party Box",
    brand: "JBL",
    model: "Party Box",
    year: 2025,
    price: 800,
    image: "/IMG/jbl-party-box.jpeg",
    condition: "Nueva",
    category: "audio",
    featured: true,
    description:
      "JBL Party Box con luces LED y sonido de alta potencia, perfecto para eventos y fiestas.",
    features: ["Alta potencia", "Luces LED", "Entradas para micrófono"],
  },
  {
    id: 24,
    name: "JBL Flip 6",
    brand: "JBL",
    model: "Flip 6",
    year: 2025,
    price: 200,
    image: "/IMG/jbl-flip-6.jpeg",
    condition: "Nueva",
    category: "audio",
    description:
      "Parlante JBL Flip 6 resistente al agua, con sonido equilibrado y fácil de transportar.",
    features: ["Bluetooth", "Resistente al agua", "Diseño portátil"],
  },
];
