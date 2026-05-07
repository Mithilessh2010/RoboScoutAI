import { NextResponse } from "next/server";
import { scoutingReports } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(scoutingReports);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `mock-${Date.now()}`, ...body, saved: true }, { status: 201 });
}
