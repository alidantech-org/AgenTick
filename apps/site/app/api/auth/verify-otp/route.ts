import { NextResponse } from "next/server";
import { verifyLoginOtp } from "@/lib/auth/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; otp?: unknown };
    await verifyLoginOtp(
      typeof body.email === "string" ? body.email : "",
      typeof body.otp === "string" ? body.otp : "",
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to sign in",
      },
      { status: 400 },
    );
  }
}
