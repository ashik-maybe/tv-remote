"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tv, Plus, ArrowRight } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [host, setHost] = useState("")
  const [devices, setDevices] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem("tv-remote:devices")
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })

  const persist = (next: string[]) => {
    setDevices(next)
    try {
      localStorage.setItem("tv-remote:devices", JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const addDevice = () => {
    const h = host.trim()
    if (!h) return
    if (!devices.includes(h)) persist([h, ...devices])
    setHost("")
    router.push(`/remote/${encodeURIComponent(h)}`)
  }

  const removeDevice = (h: string) => {
    persist(devices.filter((d) => d !== h))
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Tv className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">TV Remote</h1>
          <p className="text-sm text-muted-foreground">
            Control an Android TV / Google TV on your local network.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a TV</CardTitle>
          <CardDescription>
            Enter the TV&apos;s IP address (Settings → Network → IP). Pairing
            happens on first connect.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="host">IP address</Label>
            <Input
              id="host"
              placeholder="192.168.1.42"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDevice()}
              inputMode="url"
              autoComplete="off"
            />
          </div>
          <Button onClick={addDevice} className="sm:w-auto">
            <Plus className="size-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Your TVs</h2>
        {devices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <Tv className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No TVs yet. Add one above to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d}>
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <Tv className="size-5 text-muted-foreground" />
                      <span className="font-mono text-sm">{d}</span>
                      <Badge variant="secondary">Android TV</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDevice(d)}
                        aria-label={`Remove ${d}`}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/remote/${encodeURIComponent(d)}`)}
                      >
                        Open
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}