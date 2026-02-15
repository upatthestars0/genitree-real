import { NextRequest, NextResponse } from "next/server";

// Free-tier friendly: gemini-2.5-flash-lite has the most free quota (~1000 req/day)
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured. Missing GOOGLE_API_KEY." },
      { status: 503 }
    );
  }

  let body: { message?: string; messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  const history = Array.isArray(body.messages) ? body.messages : [];

  if (!message) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 }
    );
  }

  const contents = history
    .filter((m) => m.role && m.content)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  try {
    const res = await fetch(
      `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      let errMessage = "AI service error. Try again later.";
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string } };
        const msg = errJson?.error?.message ?? errText?.slice(0, 200);
        if (msg) errMessage = msg;
      } catch {
        if (errText) errMessage = errText.slice(0, 200);
      }
      return NextResponse.json(
        { error: errMessage },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!text) {
      return NextResponse.json(
        { error: "No response from the model." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network or server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
