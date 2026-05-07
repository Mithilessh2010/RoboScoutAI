import { NextResponse } from "next/server";
import { seasons } from "@/lib/mock-data";

export function GET() {
  return NextResponse.json(seasons);
}
