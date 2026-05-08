import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomName = searchParams.get("room");
  const participantName = searchParams.get("username");

  if (!roomName || !participantName) {
    return NextResponse.json(
      { error: "Missing room or username parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret || apiKey.startsWith("your-") || apiSecret.startsWith("your-")) {
    return NextResponse.json(
      { error: "LiveKit API keys not configured — update .env.local" },
      { status: 500 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: "1h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token });
}
