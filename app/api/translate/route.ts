import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, source, target } = await req.json();

  if (!text || source === target) {
    return NextResponse.json({ text });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Translation failed" }, { status: res.status });
  }

  const data = await res.json();
  const translated = data?.data?.translations?.[0]?.translatedText;

  return NextResponse.json({ text: translated ?? text });
}
