import { costumes as fallbackCostumes } from "@/data/costumes";
import type { CostumeItem } from "@/data/costumes";
import { listCostumes } from "@/features/costumes/costume.service";

const gradientByCategory: Record<string, string> = {
  Wedding: "from-amber-200 via-orange-300 to-rose-300",
  Traditional: "from-emerald-200 via-teal-300 to-cyan-300",
  "Party Wear": "from-violet-200 via-indigo-300 to-blue-300",
  Cultural: "from-red-200 via-orange-300 to-amber-300",
  Kids: "from-sky-200 via-cyan-300 to-lime-300",
};

const priceByCategory: Record<string, string> = {
  Wedding: "$180 - $420",
  Traditional: "$90 - $220",
  "Party Wear": "$120 - $300",
  Cultural: "$140 - $320",
  Kids: "$60 - $160",
};

const knownCategories = new Set([
  "Wedding",
  "Traditional",
  "Party Wear",
  "Cultural",
  "Kids",
]);

function mapToCardItem(costume: {
  id: string;
  name: string;
  category: string | null;
}): CostumeItem {
  const category = knownCategories.has(costume.category ?? "")
    ? (costume.category as CostumeItem["category"])
    : "Traditional";
  return {
    id: costume.id,
    name: costume.name,
    category,
    priceRange: priceByCategory[category] ?? "Custom Quote",
    imageLabel: category,
    imageGradient:
      gradientByCategory[category] ?? "from-zinc-200 via-zinc-300 to-zinc-400",
  };
}

export async function getCatalogCostumes(): Promise<CostumeItem[]> {
  try {
    const dbCostumes = await listCostumes();
    if (!dbCostumes.length) {
      return fallbackCostumes;
    }
    return dbCostumes.map((costume) =>
      mapToCardItem({
        id: costume.id,
        name: costume.name,
        category: costume.category ?? null,
      }),
    );
  } catch {
    return fallbackCostumes;
  }
}

export async function getCatalogCategories(): Promise<string[]> {
  const costumes = await getCatalogCostumes();
  return Array.from(new Set(costumes.map((costume) => costume.category)));
}
