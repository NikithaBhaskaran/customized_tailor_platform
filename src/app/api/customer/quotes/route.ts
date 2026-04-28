import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { serializePaymentAmount, serializeQuote } from "@/lib/quote-serialization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
      quote: order.quote
        ? {
            ...serializeQuote(order.quote),
            amount: Number(order.quote.amount),
          }
        : null,
      payment: serializePaymentAmount(order.payment),
    }));

    return NextResponse.json({ data: serializedOrders }, { status: 200 });
  } catch (error) {
    console.error("Customer quotes load error:", error);
    return NextResponse.json(
      {
        error: "Could not load quotes.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
