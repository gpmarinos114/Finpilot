import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const cards = await prisma.creditCard.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const card = await prisma.creditCard.create({
    data: {
      name: data.name,
      balance: parseFloat(data.balance),
      limit: parseFloat(data.limit),
      apr: parseFloat(data.apr),
      minPayment: parseFloat(data.minPayment),
      notes: data.notes || null,
    },
  });
  return NextResponse.json(card, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const card = await prisma.creditCard.update({
    where: { id: data.id },
    data: {
      name: data.name,
      balance: parseFloat(data.balance),
      limit: parseFloat(data.limit),
      apr: parseFloat(data.apr),
      minPayment: parseFloat(data.minPayment),
      notes: data.notes || null,
    },
  });
  return NextResponse.json(card);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.creditCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
