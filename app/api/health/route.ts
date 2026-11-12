import { createAndroidRemote } from "@kud/androidtv-remote"

export const runtime = "nodejs"

export async function GET() {
  const r = createAndroidRemote("127.0.0.1")
  return Response.json({ ok: true, hasStart: typeof r.start === "function" })
}