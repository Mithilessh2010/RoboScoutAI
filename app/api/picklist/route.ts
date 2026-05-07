import { NextResponse } from "next/server";
import { picklists } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(picklists);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `pick-${Date.now()}`, ...body }, { status: 201 });
}
