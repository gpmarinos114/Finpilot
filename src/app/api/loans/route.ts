import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const loans = await prisma.loan.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const loan = await prisma.loan.create({
    data: {
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance),
      interestRate: parseFloat(data.interestRate),
      monthlyPayment: parseFloat(data.monthlyPayment),
      termMonths: data.termMonths ? parseInt(data.termMonths) : null,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(loan, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const data = await req.json();
  const loan = await prisma.loan.update({
    where: { id: data.id },
    data: {
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance),
      interestRate: parseFloat(data.interestRate),
      monthlyPayment: parseFloat(data.monthlyPayment),
      termMonths: data.termMonths ? parseInt(data.termMonths) : null,
      notes: data.notes || null,
    },
  });
  return NextResponse.json(loan);
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
