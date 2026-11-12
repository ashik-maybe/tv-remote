"use client"

import { useKeyHintsEnabled } from "@/lib/hint-store"

/**
 * Keyboard shortcut chip pinned to the top-right corner of a control.
 * Hidden by default; enable with the keyboard toggle in the remote page
 * header. Even then it only renders on devices with hover + a fine pointer
 * (desktop keyboards) — touch users never see it. aria-hidden, never
 * interactive.
 */
export function KeyHint({ label }: { label: string }) {
  const enabled = useKeyHintsEnabled()

  if (!enabled) {
    return null
  }

  return (
    <kbd
      aria-hidden="true"
      className="pointer-events-none absolute right-1.5 top-1 hidden h-4 min-w-4 select-none items-center justify-center rounded border border-border/70 bg-background/80 px-1 font-mono text-[9px] leading-none text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:inline-flex"
    >
      {label}
    </kbd>
  )
}
