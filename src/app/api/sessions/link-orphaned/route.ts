import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const prisma = await getDb();
  const result = await prisma.chatMessage.updateMany({
    where: { sessionId: null },
    data: { sessionId },
  });

  return NextResponse.json({ success: true, linked: result.count });
}
