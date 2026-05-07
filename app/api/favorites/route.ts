import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json([{ teamNumber: 8644 }, { teamNumber: 9889 }, { teamNumber: 11047 }]);
}
