import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { serializePaymentAmount, serializeQuote } from "@/lib/quote-serialization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: session.user.id,
      quote: { isNot: null },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      quote: true,
      tailor: { select: { id: true, name: true, email: true } },
      payment: true,
    },
  });

  const serializedOrders = orders.map((order) => ({
    ...order,
    quote: serializeQuote(order.quote),
    payment: serializePaymentAmount(order.payment),
  }));

  return NextResponse.json({ data: serializedOrders }, { status: 200 });
}
