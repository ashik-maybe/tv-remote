import { NextRequest, NextResponse } from "next/server"
import { sendKey, RemoteKeyCode, RemoteDirection, snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  let body: { host?: unknown; keyCode?: unknown; key?: unknown; direction?: unknown }
  try {
    body = (await request.json()) as { host?: unknown; keyCode?: unknown; key?: unknown; direction?: unknown }
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }
  const host = typeof body.host === "string" ? body.host.trim() : ""
  if (!host) {
    return NextResponse.json({ error: "host is required" }, { status: 400 })
  }

  // Accept either a numeric keyCode or a named key from RemoteKeyCode.
  let code: number | null = null
  if (typeof body.keyCode === "number") code = body.keyCode
  else if (typeof body.key === "string" && body.key in RemoteKeyCode) {
    code = RemoteKeyCode[body.key as keyof typeof RemoteKeyCode]
  }
  if (code === null) {
    return NextResponse.json({ error: "keyCode or key is required" }, { status: 400 })
  }

  const direction =
    typeof body.direction === "number"
      ? body.direction
      : typeof body.direction === "string" && body.direction in RemoteDirection
        ? RemoteDirection[body.direction as keyof typeof RemoteDirection]
        : undefined

  try {
    sendKey(host, code, direction)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
  return NextResponse.json(snapshot(host))
}