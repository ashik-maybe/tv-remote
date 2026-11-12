import { NextRequest, NextResponse } from "next/server"
import { sendAppLink, snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { host?: unknown; link?: unknown }
  try {
    body = (await request.json()) as { host?: unknown; link?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const host = typeof body.host === "string" ? body.host.trim() : ""
  const link = typeof body.link === "string" ? body.link.trim() : ""
  if (!host || !link) {
    return NextResponse.json({ error: "host and link are required" }, { status: 400 })
  }
  try {
    sendAppLink(host, link)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
  return NextResponse.json(snapshot(host))
}