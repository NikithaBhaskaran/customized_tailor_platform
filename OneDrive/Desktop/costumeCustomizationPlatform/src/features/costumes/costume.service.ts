import { prisma } from "@/lib/prisma";

export type CreateCostumeInput = {
  name: string;
  category?: string;
  description?: string;
};

export async function listCostumes() {
  return prisma.costume.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createCostume(input: CreateCostumeInput) {
  return prisma.costume.create({
    data: {
      name: input.name,
      category: input.category,
      description: input.description,
    },
  });
}
