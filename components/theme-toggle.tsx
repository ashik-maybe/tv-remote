"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const order = ["system", "light", "dark"] as const
type Mode = (typeof order)[number]

const meta: Record<Mode, { label: string; Icon: typeof Monitor }> = {
  system: { label: "System", Icon: Monitor },
  light: { label: "Day", Icon: Sun },
  dark: { label: "Night", Icon: Moon },
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const current: Mode = mounted && (order as readonly string[]).includes(theme ?? "")
    ? (theme as Mode)
    : "system"
  const { label, Icon } = meta[current]

  const cycle = () => {
    const next = order[(order.indexOf(current) + 1) % order.length]
    setTheme(next)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      aria-label={`Theme: ${label}. Tap to switch.`}
      title={`Theme: ${label}`}
      className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="text-xs font-medium">{mounted ? label : "Theme"}</span>
    </Button>
  )
}