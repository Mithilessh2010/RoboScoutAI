import { NextResponse } from "next/server";
import { getFtcEventsBaseUrl, hasFtcEventsCredentials } from "@/lib/ftc-events/client";

export async function GET() {
  return NextResponse.json({
    configured: hasFtcEventsCredentials(),
    baseUrl: getFtcEventsBaseUrl(),
    usernameConfigured: Boolean(process.env.FTC_EVENTS_USERNAME),
    tokenConfigured: Boolean(process.env.FTC_EVENTS_AUTH_KEY),
  });
}
