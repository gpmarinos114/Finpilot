import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const bills = await prisma.bill.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const bill = await prisma.bill.create({
    data: {
      name: data.name,
      amount: parseFloat(data.amount),
      category: data.category,
      frequency: data.frequency,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(bill, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const bill = await prisma.bill.update({
    where: { id: data.id },
    data: {
      name: data.name,
      amount: parseFloat(data.amount),
      category: data.category,
      frequency: data.frequency,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(bill);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.bill.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
