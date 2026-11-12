import { NextRequest, NextResponse } from "next/server"
import { submitCode, snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { host?: unknown; code?: unknown }
  try {
    body = (await request.json()) as { host?: unknown; code?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const host = typeof body.host === "string" ? body.host.trim() : ""
  const code = typeof body.code === "string" ? body.code.trim() : ""
  if (!host || !code) {
    return NextResponse.json({ error: "host and code are required" }, { status: 400 })
  }
  const normalizedCode = code.trim().toUpperCase()
  if (!/^[0-9A-F]{6}$/.test(normalizedCode)) {
    return NextResponse.json(
      { error: "code must be exactly 6 characters of 0-9 or A-F" },
      { status: 400 },
    )
  }
  const ok = submitCode(host, normalizedCode)
  return NextResponse.json({ ...snapshot(host), submitted: ok })
}