import { NextResponse } from "next/server";
import { streamLinks } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(streamLinks);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `stream-${Date.now()}`, ...body }, { status: 201 });
}
