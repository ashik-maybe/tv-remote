import { NextRequest, NextResponse } from "next/server"
import { snapshot } from "@/lib/remote-manager"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get("host")?.trim() ?? ""
  if (!host) {
    return NextResponse.json({ error: "host query param is required" }, { status: 400 })
  }
  return NextResponse.json(snapshot(host))
}