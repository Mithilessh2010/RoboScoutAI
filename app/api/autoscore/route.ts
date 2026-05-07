import { NextResponse } from "next/server";
import { autoscoreJobs, autoscoreSuggestions } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json({ jobs: autoscoreJobs, suggestions: autoscoreSuggestions });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ id: `auto-${Date.now()}`, status: "uploaded", confidence: 0, ...body }, { status: 201 });
}
