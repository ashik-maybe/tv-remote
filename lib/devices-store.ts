"use client"

import { useSyncExternalStore } from "react"

export interface SavedDevice {
  host: string
  name?: string | null
}

const STORAGE_KEY = "tv-remote:devices"
const SERVER_SNAPSHOT: SavedDevice[] = []

let cache: SavedDevice[] | null = null
const listeners = new Set<() => void>()

function parseSaved(raw: string | null): SavedDevice[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed) && parsed.every((p) => typeof p === "string")) {
      return (parsed as string[]).map((host) => ({ host }))
    }
    if (Array.isArray(parsed)) {
      return (parsed as SavedDevice[]).filter((d) => d && typeof d.host === "string")
    }
    return []
  } catch {
    return []
  }
}

function read(): SavedDevice[] {
  if (cache) return cache
  try {
    cache = parseSaved(localStorage.getItem(STORAGE_KEY))
  } catch {
    // storage unavailable (private mode etc.)
    cache = []
  }
  return cache
}

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function setSavedDevices(next: SavedDevice[]) {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore storage failures
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null
      emit()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

// Server snapshot is a stable empty array: SSR and the first client render
// agree on "no saved TVs", then the store picks up localStorage after mount.
export function useSavedDevices(): SavedDevice[] {
  return useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT)
}
