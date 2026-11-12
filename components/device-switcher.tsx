"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronDown, Radar, Tv } from "lucide-react"
import { Menu } from "@base-ui/react/menu"

import { useSavedDevices } from "@/lib/devices-store"
import { cn } from "@/lib/utils"

interface DeviceSwitcherProps {
  /** Host of the TV currently being controlled. */
  host: string
}

/**
 * Quick-switch menu between saved TVs. Lives in the remote page header so
 * switching rooms never means going back to the home screen.
 */
export function DeviceSwitcher({ host }: DeviceSwitcherProps) {
  const router = useRouter()
  const saved = useSavedDevices()
  const current = saved.find((d) => d.host === host)
  const currentName = current?.name ?? "Android TV"

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Switch TV"
        title="Switch TV"
        className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Tv className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="max-w-[8.5rem] truncate text-[13px] font-medium sm:max-w-[12rem]">
            {currentName}
          </span>
          <span className="max-w-[8.5rem] truncate font-mono text-[10px] tabular-nums text-muted-foreground sm:max-w-[12rem]">
            {host}
          </span>
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={8} className="z-50">
          <Menu.Popup
            className="w-64 origin-[var(--transform-origin)] rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl outline-none transition-[transform,opacity] duration-150 ease-out data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
          >
            <Menu.Group>
              <Menu.GroupLabel className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your TVs
              </Menu.GroupLabel>
              {saved.length === 0 ? (
                <Menu.Item
                  className="flex cursor-default flex-col rounded-xl px-2.5 py-2 outline-none data-[highlighted]:bg-accent"
                  aria-disabled
                >
                  <span className="font-mono text-xs tabular-nums">{host}</span>
                  <span className="text-[10px] text-muted-foreground">Not saved yet</span>
                </Menu.Item>
              ) : (
                saved.map((device) => {
                  const isCurrent = device.host === host
                  return (
                    <Menu.Item
                      key={device.host}
                      onClick={() => router.push(`/remote/${encodeURIComponent(device.host)}`)}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 outline-none transition-colors data-[highlighted]:bg-accent",
                        isCurrent && "bg-accent/50",
                      )}
                    >
                      <Tv className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-xs font-medium">
                          {device.name ?? "Android TV"}
                        </span>
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {device.host}
                        </span>
                      </span>
                      {isCurrent && (
                        <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      )}
                    </Menu.Item>
                  )
                })
              )}
            </Menu.Group>
            <Menu.Separator className="mx-2 my-1 h-px bg-border" />
            <Menu.Item
              onClick={() => router.push("/")}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium outline-none transition-colors data-[highlighted]:bg-accent"
            >
              <Radar className="size-4 text-muted-foreground" aria-hidden="true" />
              Scan for another TV…
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
