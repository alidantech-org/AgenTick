import { NextResponse } from "next/server";
import { requestLoginOtp } from "@/lib/auth/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const result = await requestLoginOtp(
      typeof body.email === "string" ? body.email : "",
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to send code",
      },
      { status: 400 },
    );
  }
}
