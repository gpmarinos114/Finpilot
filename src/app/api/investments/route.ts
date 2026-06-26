import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const investments = await prisma.investment.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(investments);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const investment = await prisma.investment.create({
    data: {
      name: data.name,
      type: data.type,
      ticker: data.ticker || null,
      shares: data.shares ? parseFloat(data.shares) : null,
      costBasis: data.costBasis ? parseFloat(data.costBasis) : null,
      currentValue: parseFloat(data.currentValue),
      notes: data.notes || null,
    },
  });
  return NextResponse.json(investment, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const investment = await prisma.investment.update({
    where: { id: data.id },
    data: {
      name: data.name,
      type: data.type,
      ticker: data.ticker || null,
      shares: data.shares ? parseFloat(data.shares) : null,
      costBasis: data.costBasis ? parseFloat(data.costBasis) : null,
      currentValue: parseFloat(data.currentValue),
      notes: data.notes || null,
    },
  });
  return NextResponse.json(investment);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
