import { NextRequest, NextResponse } from "next/server"
import { startPairing, snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { host?: unknown }
  try {
    body = (await request.json()) as { host?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const host = typeof body.host === "string" ? body.host.trim() : ""
  if (!host) {
    return NextResponse.json({ error: "host is required" }, { status: 400 })
  }
  startPairing(host)
  return NextResponse.json(snapshot(host))
}