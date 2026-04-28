import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const measurementSchema = z.object({
  chest: z.number().positive(),
  waist: z.number().positive(),
  hip: z.number().positive(),
  shoulder: z.number().positive(),
  sleeveLength: z.number().positive(),
  height: z.number().positive(),
  referenceImage: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.customerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = measurementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid measurement payload." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const measurement = await tx.measurement.upsert({
        where: { orderId },
        update: {
          chest: data.chest,
          waist: data.waist,
          hip: data.hip,
          shoulder: data.shoulder,
          sleeveLength: data.sleeveLength,
          height: data.height,
          referenceImage: data.referenceImage,
        },
        create: {
          orderId,
          chest: data.chest,
          waist: data.waist,
          hip: data.hip,
          shoulder: data.shoulder,
          sleeveLength: data.sleeveLength,
          height: data.height,
          referenceImage: data.referenceImage,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { currentStatus: "MEASUREMENTS_ADDED" },
      });

      await tx.orderStatus.create({
        data: {
          orderId,
          status: "MEASUREMENTS_ADDED",
          changedByUserId: session.user.id,
          note: "Customer submitted measurements.",
        },
      });

      return measurement;
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save measurements." },
      { status: 500 },
    );
  }
}
