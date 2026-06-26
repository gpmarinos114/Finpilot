import { NextRequest, NextResponse } from "next/server";
import { listMemoryFiles, readMemoryFile, writeMemory, seedMemoryFromFs } from "@/lib/memory";

export async function GET(req: NextRequest) {
  await seedMemoryFromFs();
  const filepath = req.nextUrl.searchParams.get("path");
  if (filepath) {
    const content = await readMemoryFile(filepath);
    return NextResponse.json({ content });
  }
  const files = await listMemoryFiles();
  return NextResponse.json(files);
}

export async function PUT(req: NextRequest) {
  const { path: filepath, content } = await req.json();
  if (!filepath || content === undefined) {
    return NextResponse.json({ error: "path and content required" }, { status: 400 });
  }
  await writeMemory(filepath, content);
  return NextResponse.json({ success: true });
}
