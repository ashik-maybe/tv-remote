"use client"

import { MdKeyboard } from "react-icons/md"

import { setKeyHintsEnabled, useKeyHintsEnabled } from "@/lib/hint-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Toggles the corner kbd chips on the remote screen. Desktop-only — it
 * controls nothing on touch devices, so it isn't rendered there.
 * State persists in localStorage ("key-hints", default off).
 */
export function KeyHintToggle() {
  const enabled = useKeyHintsEnabled()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setKeyHintsEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Keyboard hints: on" : "Keyboard hints: off"}
      title={enabled ? "Hide key hints" : "Show key hints"}
      className={cn(
        "hidden shrink-0 gap-1.5 text-muted-foreground hover:text-foreground [@media(hover:hover)_and_(pointer:fine)]:inline-flex",
        enabled && "bg-accent text-accent-foreground hover:text-accent-foreground",
      )}
    >
      <MdKeyboard className="size-4" aria-hidden="true" />
      <span className="text-xs font-medium">Hints</span>
    </Button>
  )
}
