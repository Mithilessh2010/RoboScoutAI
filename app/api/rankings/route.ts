import { NextResponse } from "next/server";
import { rankings } from "@/lib/mock-data";

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const eventCode = params.get("eventCode");
  return NextResponse.json(rankings.filter((row) => !eventCode || row.eventCode === eventCode));
}
