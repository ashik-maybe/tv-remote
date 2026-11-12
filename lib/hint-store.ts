"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "key-hints"

// Off by default; only ever shown on hover-capable, fine-pointer devices.
let current = false
if (typeof window !== "undefined") {
  try {
    current = localStorage.getItem(STORAGE_KEY) === "on"
  } catch {
    // storage unavailable (private mode etc.) — stay off
  }
}

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setKeyHintsEnabled(enabled: boolean) {
  current = enabled
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  } catch {
    // ignore storage failures
  }
  for (const listener of listeners) {
    listener()
  }
}

export function useKeyHintsEnabled(): boolean {
  // Server snapshot matches the off-by-default so SSR never renders chips.
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => false,
  )
}
