import { NextRequest, NextResponse } from "next/server";
import { captureSnapshot, getSnapshotHistory } from "@/lib/snapshots";

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30");
  const snapshots = await getSnapshotHistory(limit);
  return NextResponse.json(snapshots);
}

export async function POST() {
  const created = await captureSnapshot(true);
  return NextResponse.json({ success: true, created });
}
