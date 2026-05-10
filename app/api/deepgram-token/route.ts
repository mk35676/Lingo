import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey || apiKey.startsWith("your-")) {
    return NextResponse.json(
      { error: "Deepgram API key not configured" },
      { status: 500 }
    );
  }

  // Served from the server so the key is never in the JS bundle
  return NextResponse.json({ key: apiKey });
}
