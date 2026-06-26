import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const income = await prisma.income.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(income);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const income = await prisma.income.create({
    data: {
      source: data.source,
      amount: parseFloat(data.amount),
      frequency: data.frequency,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(income, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const income = await prisma.income.update({
    where: { id: data.id },
    data: {
      source: data.source,
      amount: parseFloat(data.amount),
      frequency: data.frequency,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(income);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
