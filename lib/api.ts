export interface VolumeInfo {
  level: number
  maximum: number
  muted: boolean
}

export interface RemoteSnapshot {
  host: string
  state: "idle" | "connecting" | "pairing" | "ready" | "error"
  powered: boolean | null
  volume: VolumeInfo | null
  currentApp: string | null
  error: string | null
  hasCert: boolean
  submitted?: boolean
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? res.statusText
    throw new Error(msg)
  }
  return data as T
}

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? res.statusText
    throw new Error(msg)
  }
  return data as T
}