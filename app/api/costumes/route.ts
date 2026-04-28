import { NextResponse } from "next/server";
import { createCostume, listCostumes } from "@/features/costumes/costume.service";

export async function GET() {
  try {
    const costumes = await listCostumes();
    return NextResponse.json({ data: costumes }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch costumes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      category?: string;
      description?: string;
    };

    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name is required and must be at least 2 characters." },
        { status: 400 },
      );
    }

    const costume = await createCostume({
      name: body.name.trim(),
      category: body.category?.trim() || undefined,
      description: body.description?.trim() || undefined,
    });

    return NextResponse.json({ data: costume }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body or server error." },
      { status: 500 },
    );
  }
}
