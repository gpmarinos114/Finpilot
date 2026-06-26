import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prisma = await getDb();
  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const prisma = await getDb();
  const { name, messages } = await req.json();
  const session = await prisma.chatSession.create({
    data: { name: name || `Session ${new Date().toLocaleString()}` },
  });

  if (messages && messages.length > 0) {
    await prisma.chatMessage.createMany({
      data: messages.map((m: { role: string; content: string; toolName?: string }) => ({
        role: m.role,
        content: m.content,
        toolName: m.toolName || null,
        sessionId: session.id,
      })),
    });
  }

  return NextResponse.json(session, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const prisma = await getDb();
  const { id, name, messages } = await req.json();

  if (name) {
    await prisma.chatSession.update({
      where: { id },
      data: { name },
    });
  }

  if (messages) {
    await prisma.chatMessage.deleteMany({ where: { sessionId: id } });
    await prisma.chatMessage.createMany({
      data: messages.map((m: { role: string; content: string; toolName?: string }) => ({
        role: m.role,
        content: m.content,
        toolName: m.toolName || null,
        sessionId: id,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const prisma = await getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.chatMessage.deleteMany({ where: { sessionId: id } });
  await prisma.chatSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
