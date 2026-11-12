import { NextRequest, NextResponse } from "next/server"
import { sendText, snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { host?: unknown; text?: unknown }
  try {
    body = (await request.json()) as { host?: unknown; text?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const host = typeof body.host === "string" ? body.host.trim() : ""
  const text = typeof body.text === "string" ? body.text : ""
  if (!host) {
    return NextResponse.json({ error: "host is required" }, { status: 400 })
  }
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }
  try {
    sendText(host, text)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
  return NextResponse.json(snapshot(host))
}