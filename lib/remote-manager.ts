import fs from "node:fs"
import path from "node:path"
import {
  createAndroidRemote,
  type AndroidRemote,
  type Certificate,
} from "@kud/androidtv-remote"

import type {
  RemoteConnectionState,
  RemoteSnapshot,
  StoredCert,
  StoredCerts,
  VolumeInfo,
} from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const CERTS_FILE = path.join(DATA_DIR, "remotes.json")

interface ManagedRemote {
  host: string
  remote: AndroidRemote
  state: RemoteConnectionState
  powered: boolean | null
  volume: VolumeInfo | null
  currentApp: string | null
  error: string | null
  hasCert: boolean
  pairingPromise: Promise<boolean> | null
}

interface Store {
  instances: Map<string, ManagedRemote>
  certs: StoredCerts
}

const globalStore = globalThis as unknown as { __tvRemoteStore?: Store }
if (!globalStore.__tvRemoteStore) {
  globalStore.__tvRemoteStore = { instances: new Map(), certs: loadCertsFromDisk() }
}
const store: Store = globalStore.__tvRemoteStore

function loadCertsFromDisk(): StoredCerts {
  try {
    if (!fs.existsSync(CERTS_FILE)) return {}
    const raw = fs.readFileSync(CERTS_FILE, "utf8")
    const parsed = JSON.parse(raw) as StoredCerts
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function persistCerts(): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(CERTS_FILE, JSON.stringify(store.certs, null, 2), "utf8")
  } catch (err) {
    console.error("tv-remote: failed to persist certs", err)
  }
}

function createManaged(host: string): ManagedRemote {
  const stored = store.certs[host]
  const managed: ManagedRemote = {
    host,
    remote: createAndroidRemote(host, stored ? { cert: stored } : undefined),
    state: "idle",
    powered: null,
    volume: null,
    currentApp: null,
    error: null,
    hasCert: Boolean(stored),
    pairingPromise: null,
  }

  managed.remote.on("ready", () => {
    managed.state = "ready"
    managed.error = null
    try {
      const cert = managed.remote.getCertificate() as Certificate
      if (cert?.key && cert?.cert) {
        store.certs[host] = { key: cert.key, cert: cert.cert }
        managed.hasCert = true
        persistCerts()
      }
    } catch {
      // certificate may already be persisted; ignore
    }
  })

  managed.remote.on("secret", () => {
    managed.state = "pairing"
  })

  managed.remote.on("powered", (powered) => {
    managed.powered = powered
  })

  managed.remote.on("volume", (vol) => {
    managed.volume = { level: vol.level, maximum: vol.maximum, muted: vol.muted }
  })

  managed.remote.on("current_app", (app) => {
    managed.currentApp = app
  })

  managed.remote.on("unpaired", () => {
    managed.state = "error"
    managed.error = "TV revoked pairing. Re-pair required."
    delete store.certs[host]
    managed.hasCert = false
    persistCerts()
  })

  managed.remote.on("error", (err) => {
    managed.state = "error"
    managed.error = err?.message ?? String(err)
  })

  store.instances.set(host, managed)
  return managed
}

export function getManaged(host: string): ManagedRemote {
  return store.instances.get(host) ?? createManaged(host)
}

export function startPairing(host: string): ManagedRemote {
  const managed = getManaged(host)
  if (managed.pairingPromise) return managed
  managed.state = "connecting"
  managed.error = null
  managed.pairingPromise = managed.remote
    .start()
    .then((ok) => {
      if (!ok && managed.state !== "ready") {
        managed.state = "error"
        managed.error = "Pairing did not complete."
      }
      return ok
    })
    .catch((err: unknown) => {
      managed.state = "error"
      managed.error = err instanceof Error ? err.message : String(err)
      return false
    })
    .finally(() => {
      managed.pairingPromise = null
    })
  return managed
}

export function submitCode(host: string, code: string): boolean {
  const managed = getManaged(host)
  return managed.remote.sendCode(code)
}

export function sendKey(host: string, keyCode: number, direction?: number): void {
  getManaged(host).remote.sendKey(keyCode, direction)
}

export function sendPower(host: string): void {
  getManaged(host).remote.sendPower()
}

export function sendText(host: string, text: string): void {
  getManaged(host).remote.sendText(text)
}

export function sendAppLink(host: string, link: string): void {
  getManaged(host).remote.sendAppLink(link)
}

export function stopHost(host: string): void {
  const managed = store.instances.get(host)
  if (!managed) return
  try {
    managed.remote.stop()
  } catch {
    // ignore
  }
  store.instances.delete(host)
}

export function snapshot(host: string): RemoteSnapshot {
  const managed = store.instances.get(host)
  if (!managed) {
    return {
      host,
      state: store.certs[host] ? "idle" : "idle",
      powered: null,
      volume: null,
      currentApp: null,
      error: null,
      hasCert: Boolean(store.certs[host]),
    }
  }
  return {
    host,
    state: managed.state,
    powered: managed.powered,
    volume: managed.volume,
    currentApp: managed.currentApp,
    error: managed.error,
    hasCert: managed.hasCert,
  }
}

export { RemoteKeyCode, RemoteDirection } from "@kud/androidtv-remote"