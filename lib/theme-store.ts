"use client"

import { useSyncExternalStore } from "react"

export type ThemeMode = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

const STORAGE_KEY = "theme"
const MODES: readonly string[] = ["system", "light", "dark"]

function isMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && MODES.includes(value)
}

let current: ThemeMode = "system"
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isMode(stored)) current = stored
  } catch {
    // storage unavailable (private mode etc.) — stay on system
  }
}

const listeners = new Set<() => void>()

function systemResolved(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function apply(mode: ThemeMode) {
  const resolved = mode === "system" ? systemResolved() : mode
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
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
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const onChange = () => {
    if (current === "system") {
      apply("system")
      emit()
    }
  }
  media.addEventListener("change", onChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener("change", onChange)
  }
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "system" as ThemeMode,
  )
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribe,
    () => (current === "system" ? systemResolved() : current),
    () => "light" as ResolvedTheme,
  )
}
