import { NextResponse } from "next/server";
import { videoUploads } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(videoUploads);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `video-${Date.now()}`, ...body }, { status: 201 });
}
