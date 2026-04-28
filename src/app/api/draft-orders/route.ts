import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const createDraftSchema = z.object({
  fabric: z.string().min(1),
  color: z.string().min(1),
  sleeveStyle: z.string().min(1),
  neckStyle: z.string().min(1),
  length: z.string().min(1),
  embroidery: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.draftOrder.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: drafts }, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createDraftSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid draft payload." },
        { status: 400 },
      );
    }

    const draft = await prisma.draftOrder.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ data: draft }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save draft order." },
      { status: 500 },
    );
  }
}
