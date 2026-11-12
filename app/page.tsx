"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { MdTv, MdWifiTethering, MdKeyboardArrowDown, MdKeyboardArrowRight, MdAdd, MdDelete, MdWifi } from "react-icons/md"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getJson } from "@/lib/api"
import { useSavedDevices, setSavedDevices, type SavedDevice } from "@/lib/devices-store"

export interface DiscoveredDevice {
  host: string
  name: string | null
  via: "mdns" | "probe" | "both"
}

export default function Home() {
  const router = useRouter()
  const [manualHost, setManualHost] = useState("")
  const [manualOpen, setManualOpen] = useState(false)
  const saved = useSavedDevices()
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredDevice[]>([])
  const [scanError, setScanError] = useState<string | null>(null)

  const persist = useCallback((next: SavedDevice[]) => {
    setSavedDevices(next)
  }, [])

  const addAndOpen = useCallback(
    (host: string, name?: string | null) => {
      const h = host.trim()
      if (!h) return
      persist([{ host: h, name: name ?? undefined }, ...saved.filter((d) => d.host !== h)])
      router.push(`/remote/${encodeURIComponent(h)}`)
    },
    [persist, router, saved],
  )

  const remove = useCallback(
    (host: string) => persist(saved.filter((d) => d.host !== host)),
    [persist, saved],
  )

  const scan = useCallback(async () => {
    setIsScanning(true)
    setScanError(null)
    setHasScanned(true)
    try {
      const data = await getJson<{ devices: DiscoveredDevice[] }>("/api/discover")
      setDiscovered(data.devices ?? [])
    } catch (e) {
      setDiscovered([])
      setScanError(e instanceof Error ? e.message : String(e))
      toast.error("Scan failed", {
        description: "Make sure this device is on the same Wi-Fi network as your TV.",
      })
    } finally {
      setIsScanning(false)
    }
  }, [])

  const savedSet = new Set(saved.map((d) => d.host))
  const newFindings = discovered.filter((d) => !savedSet.has(d.host))

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-5 p-4 pb-10 sm:max-w-xl">
      <header className="flex items-center gap-3 pt-2">
        <div className="flex size-11 items-center justify-center rounded-xl bg-card ring-1 ring-border">
          <MdTv className="size-6 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-tight">TV Remote</h1>
          <p className="text-xs text-muted-foreground">Same Wi-Fi network required</p>
        </div>
        <ThemeToggle />
      </header>

      <Card role="region" aria-label="Find your TV">
        <CardContent>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MdWifi className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-medium leading-snug">Find your TV</h2>
            <p className="text-sm text-muted-foreground">
              Scan your home network and we&apos;ll list the TVs we can reach.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-4 h-14 w-full text-base font-semibold"
          onClick={scan}
          disabled={isScanning}
        >
          <MdWifiTethering className={`size-5 ${isScanning ? "animate-spin" : ""}`} aria-hidden="true" />
          {isScanning ? "Scanning your network…" : "Scan network"}
        </Button>

        <div className="mt-4 space-y-2" aria-busy={isScanning} aria-live="polite">
          {isScanning &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}

          {!isScanning && hasScanned && (
            <>
              {newFindings.length > 0 ? (
                <ul className="space-y-2">
                  {newFindings.map((d) => (
                    <li key={d.host}>
                      <Card size="sm" className="bg-background/40 py-0 ring-border">
                        <CardContent className="flex items-center justify-between gap-3 p-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <MdTv className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {d.name ?? "Android TV"}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">{d.host}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => addAndOpen(d.host, d.name)}>
                            <MdAdd className="size-4" />
                            Add
                          </Button>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <Card className="border-dashed border-border bg-transparent py-4 ring-0">
                  <CardContent className="p-0 text-center">
                    <p className="text-sm font-medium">
                      {scanError ? "Couldn't scan the network" : "No TVs found"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {scanError ??
                        "Make sure the TV is on and on the same Wi-Fi/subnet, and try again."}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={scan}>
                      Try again
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <Collapsible open={manualOpen} onOpenChange={setManualOpen} className="mt-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Can&apos;t find it? Enter the IP address
            {manualOpen ? (
              <MdKeyboardArrowDown className="size-4" aria-hidden="true" />
            ) : (
              <MdKeyboardArrowRight className="size-4" aria-hidden="true" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex items-end gap-2 px-2 pb-1 pt-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="manual-host" className="text-xs text-muted-foreground">
                  TV IP address
                </Label>
                <Input
                  id="manual-host"
                  placeholder="192.168.1.42"
                  value={manualHost}
                  onChange={(e) => setManualHost(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAndOpen(manualHost)}
                  inputMode="url"
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
              <Button onClick={() => addAndOpen(manualHost)} disabled={!manualHost.trim()}>
                Add
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
        </CardContent>
      </Card>

      {saved.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your TVs
          </h2>
          <ul className="space-y-2">
            {saved.map((d) => (
              <li key={d.host}>
                <Card size="sm" className="py-0 ring-border">
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MdTv className="size-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.name ?? "Android TV"}</p>
                        <p className="font-mono text-xs text-muted-foreground">{d.host}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${d.host}`}
                        onClick={() => remove(d.host)}
                      >
                        <MdDelete className="size-4" aria-hidden="true" />
                      </Button>
                      <Button onClick={() => router.push(`/remote/${encodeURIComponent(d.host)}`)}>
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-auto px-1 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        Works on Android TV &amp; Google TV. The TV shows a 6-character code (digits, sometimes letters A-F) on first pair.
        <br />
        Theme follows your system by default — tap the theme button up top to change it.
      </p>
    </main>
  )
}