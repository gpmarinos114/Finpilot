import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const savings = await prisma.savingsGoal.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(savings);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const savings = await prisma.savingsGoal.create({
    data: {
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount),
      targetDate: data.targetDate || null,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(savings, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const savings = await prisma.savingsGoal.update({
    where: { id: data.id },
    data: {
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount),
      targetDate: data.targetDate || null,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(savings);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.savingsGoal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
