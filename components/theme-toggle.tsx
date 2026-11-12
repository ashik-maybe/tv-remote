"use client"

import { MdDarkMode, MdLightMode } from "react-icons/md"
import { setTheme, useThemeMode } from "@/lib/theme-store"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const theme = useThemeMode()
  const isDark = theme === "dark"
  const label = isDark ? "Night" : "Day"

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-pressed={isDark}
      aria-label={`Theme: ${label}. Tap to switch.`}
      title={`Theme: ${label}`}
      className="relative shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
    >
      {isDark ? (
        <MdDarkMode className="size-4" aria-hidden="true" />
      ) : (
        <MdLightMode className="size-4" aria-hidden="true" />
      )}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  )
}
