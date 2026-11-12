import { NextResponse } from "next/server"
import { discoverDevices } from "@/lib/discovery"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const devices = await discoverDevices()
    return NextResponse.json({ devices })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), devices: [] },
      { status: 500 },
    )
  }
}