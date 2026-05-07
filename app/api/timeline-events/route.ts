import { NextResponse } from "next/server";
import { timelineEvents } from "@/lib/mock-data";

export function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("videoId");
  return NextResponse.json(timelineEvents.filter((event) => !videoId || event.videoId === videoId));
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `tl-${Date.now()}`, ...body }, { status: 201 });
}
