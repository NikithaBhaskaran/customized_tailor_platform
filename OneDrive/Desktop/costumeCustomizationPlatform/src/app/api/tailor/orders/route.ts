import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { serializeQuote } from "@/lib/quote-serialization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TAILOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ tailorId: null }, { tailorId: session.user.id }],
      NOT: {
        currentStatus: "REJECTED_BY_TAILOR",
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      customization: true,
      measurement: true,
      quote: true,
      statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      progressUpdates: {
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          changedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,
    quote: serializeQuote(order.quote),
  }));

  return NextResponse.json({ data: serializedOrders }, { status: 200 });
}
