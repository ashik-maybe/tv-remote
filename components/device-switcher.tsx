"use client"

import { useRouter } from "next/navigation"
import { MdCheck, MdKeyboardArrowDown, MdWifiTethering, MdTv } from "react-icons/md"

import { useSavedDevices } from "@/lib/devices-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch TV"
        title="Switch TV"
        className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MdTv className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="max-w-[8.5rem] truncate text-[13px] font-medium sm:max-w-[12rem]">
            {currentName}
          </span>
          <span className="max-w-[8.5rem] truncate font-mono text-[10px] tabular-nums text-muted-foreground sm:max-w-[12rem]">
            {host}
          </span>
        </span>
        <MdKeyboardArrowDown
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your TVs</DropdownMenuLabel>
          {saved.length === 0 ? (
            <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
              <span className="font-mono text-xs tabular-nums">{host}</span>
              <span className="text-[10px] text-muted-foreground">Not saved yet</span>
            </DropdownMenuItem>
          ) : (
            saved.map((device) => {
              const isCurrent = device.host === host
              return (
                <DropdownMenuItem
                  key={device.host}
                  onClick={() => router.push(`/remote/${encodeURIComponent(device.host)}`)}
                  className={cn(
                    "gap-2.5 py-2",
                    isCurrent && "bg-accent/50",
                  )}
                >
                  <MdTv className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-medium">
                      {device.name ?? "Android TV"}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {device.host}
                    </span>
                  </span>
                  {isCurrent && (
                    <MdCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/")}>
          <MdWifiTethering className="size-4 text-muted-foreground" aria-hidden="true" />
          Scan for another TV…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
