import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      geminiConfigured: isGeminiConfigured(),
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
