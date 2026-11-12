"use client"

import { useSyncExternalStore } from "react"

export type ThemeMode = "light" | "dark"

const STORAGE_KEY = "theme"

const THEME_COLORS: Record<ThemeMode, string> = {
  light: "#fbfaf7",
  dark: "#151620",
}

function isMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark"
}

// Light is the default; a legacy "system" value stored by older builds
// simply falls through to light.
let current: ThemeMode = "light"
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isMode(stored)) current = stored
  } catch {
    // storage unavailable (private mode etc.) — stay on light
  }
}

const listeners = new Set<() => void>()

function apply(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(mode)
  root.style.colorScheme = mode

  // viewport can't express a per-mode theme-color, so the store owns it.
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    document.head.appendChild(meta)
  }
  meta.setAttribute("content", THEME_COLORS[mode])
}

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export function setTheme(mode: ThemeMode) {
  current = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // ignore storage failures
  }
  apply(mode)
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "light" as ThemeMode,
  )
}
