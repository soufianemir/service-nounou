import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await clearSessionCookie();
  // IMPORTANT: for a POST, default redirect status is 307 (keeps method),
  // which would re-POST on "/" and trigger a 405. Use 303 to switch to GET.
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
