export type RemoteConnectionState = "idle" | "connecting" | "pairing" | "ready" | "error"

export interface VolumeInfo {
  level: number
  maximum: number
  muted: boolean
}

export interface RemoteSnapshot {
  host: string
  state: RemoteConnectionState
  powered: boolean | null
  volume: VolumeInfo | null
  currentApp: string | null
  error: string | null
  hasCert: boolean
}

export interface StoredCert {
  key: string
  cert: string
}

export type StoredCerts = Record<string, StoredCert>