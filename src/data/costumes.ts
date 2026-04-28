export type CostumeCategory =
  | "Wedding"
  | "Traditional"
  | "Party Wear"
  | "Cultural"
  | "Kids";

export type CostumeItem = {
  id: string;
  name: string;
  category: CostumeCategory;
  priceRange: string;
  imageLabel: string;
  imageGradient: string;
};

export const categories: CostumeCategory[] = [
  "Wedding",
  "Traditional",
  "Party Wear",
  "Cultural",
  "Kids",
];

export const costumes: CostumeItem[] = [
  {
    id: "1",
    name: "Royal Sherwani",
    category: "Wedding",
    priceRange: "$180 - $350",
    imageLabel: "Royal Silk",
    imageGradient: "from-amber-200 via-orange-300 to-rose-300",
  },
  {
    id: "2",
    name: "Classic Lehenga",
    category: "Wedding",
    priceRange: "$220 - $420",
    imageLabel: "Thread Work",
    imageGradient: "from-fuchsia-200 via-pink-300 to-rose-300",
  },
  {
    id: "3",
    name: "Handloom Kurta Set",
    category: "Traditional",
    priceRange: "$90 - $180",
    imageLabel: "Handcrafted",
    imageGradient: "from-emerald-200 via-teal-300 to-cyan-300",
  },
  {
    id: "4",
    name: "Velvet Indo-Western",
    category: "Party Wear",
    priceRange: "$140 - $280",
    imageLabel: "Modern Cut",
    imageGradient: "from-violet-200 via-indigo-300 to-blue-300",
  },
  {
    id: "5",
    name: "Kathak Performance Set",
    category: "Cultural",
    priceRange: "$160 - $310",
    imageLabel: "Stage Ready",
    imageGradient: "from-red-200 via-orange-300 to-amber-300",
  },
  {
    id: "6",
    name: "Kids Festive Combo",
    category: "Kids",
    priceRange: "$60 - $140",
    imageLabel: "Comfort Fit",
    imageGradient: "from-sky-200 via-cyan-300 to-lime-300",
  },
];
