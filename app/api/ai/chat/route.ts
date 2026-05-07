import { NextResponse } from "next/server";
import { askOpenRouter } from "@/lib/ai/openrouter";

export async function POST(request: Request) {
  const { message, context } = await request.json();
  const response = await askOpenRouter(message, context);
  return NextResponse.json(response);
}
