"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Power, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { postJson, getJson } from "@/lib/api"
import type { RemoteSnapshot } from "@/lib/api"

const APP_SHORTCUTS: { label: string; link: string }[] = [
  { label: "YouTube", link: "https://www.youtube.com" },
  { label: "Netflix", link: "https://www.netflix.com" },
  { label: "Prime Video", link: "https://www.primevideo.com" },
  { label: "Disney+", link: "https://www.disneyplus.com" },
]

export default function RemotePage() {
  const params = useParams<{ host: string }>()
  const host = decodeURIComponent(params.host)
  const router = useRouter()

  const [snap, setSnap] = useState<RemoteSnapshot | null>(null)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await getJson<RemoteSnapshot>(
        `/api/pair/status?host=${encodeURIComponent(host)}`,
      )
      setSnap(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [host])

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        const s = await postJson<RemoteSnapshot>("/api/pair/start", { host })
        if (!cancelled) setSnap(s)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      }
    }
    start()
    pollRef.current = setInterval(() => {
      refresh()
    }, 1500)
    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [host, refresh])

  const sendKey = async (key: string) => {
    try {
      await postJson("/api/remote/key", { host, key })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const sendPower = async () => {
    try {
      await postJson("/api/remote/power", { host })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const submitPairCode = async (value?: string) => {
    const finalCode = (value ?? code).trim()
    if (finalCode.length !== 6) return
    setSubmitting(true)
    setError(null)
    try {
      const s = await postJson<RemoteSnapshot>("/api/pair/code", {
        host,
        code: finalCode,
      })
      setSnap(s)
      setCode("")
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  const sendTextNow = async () => {
    if (!text.trim()) return
    try {
      await postJson("/api/remote/text", { host, text })
      setText("")
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const launchApp = async (link: string) => {
    try {
      await postJson("/api/remote/app", { host, link })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const state = snap?.state ?? "connecting"
  const isReady = state === "ready"
  const isPairing = state === "pairing"

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mono text-sm">{host}</span>
          <span className="text-xs text-muted-foreground">Android TV remote</span>
        </div>
        <Badge variant={isReady ? "default" : state === "error" ? "destructive" : "secondary"}>
          {state}
        </Badge>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Tv className="size-5 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{snap?.currentApp ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                {snap?.volume
                  ? `Vol ${snap.volume.level}/${snap.volume.maximum}${snap.volume.muted ? " (muted)" : ""}`
                  : "volume unknown"}
              </div>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={sendPower} disabled={!isReady}>
            <Power className="size-5" />
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => sendKey("KEYCODE_DPAD_UP")}
          disabled={!isReady}
        >
          Up
        </Button>
        <div />
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => launchApp("https://www.youtube.com")}
          disabled={!isReady}
        >
          Apps
        </Button>
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => sendKey("KEYCODE_DPAD_LEFT")}
          disabled={!isReady}
        >
          Left
        </Button>
        <Button
          className="h-16 rounded-full"
          onClick={() => sendKey("KEYCODE_DPAD_CENTER")}
          disabled={!isReady}
        >
          OK
        </Button>
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => sendKey("KEYCODE_DPAD_RIGHT")}
          disabled={!isReady}
        >
          Right
        </Button>
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => sendKey("KEYCODE_DPAD_DOWN")}
          disabled={!isReady}
        >
          Down
        </Button>
        <div />
        <Button
          className="h-16"
          variant="secondary"
          onClick={() => sendKey("KEYCODE_BACK")}
          disabled={!isReady}
        >
          Back
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_HOME")}
          disabled={!isReady}
        >
          Home
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_MENU")}
          disabled={!isReady}
        >
          Menu
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_VOLUME_DOWN")}
          disabled={!isReady}
        >
          Vol -
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_VOLUME_MUTE")}
          disabled={!isReady}
        >
          Mute
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_VOLUME_UP")}
          disabled={!isReady}
        >
          Vol +
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_MEDIA_PREVIOUS")}
          disabled={!isReady}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_MEDIA_PLAY_PAUSE")}
          disabled={!isReady}
        >
          Play/Pause
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => sendKey("KEYCODE_MEDIA_NEXT")}
          disabled={!isReady}
        >
          Next
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type text on TV..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendTextNow()}
          disabled={!isReady}
        />
        <Button onClick={sendTextNow} disabled={!isReady || !text.trim()}>
          Send
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {APP_SHORTCUTS.map((a) => (
          <Button
            key={a.label}
            variant="secondary"
            size="sm"
            onClick={() => launchApp(a.link)}
            disabled={!isReady}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <Dialog open={isPairing} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pair with TV</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code shown on your TV screen.
            </DialogDescription>
          </DialogHeader>
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 6)
              setCode(next)
              if (next.length === 6) submitPairCode(next)
            }}
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button onClick={() => submitPairCode()} disabled={code.length !== 6 || submitting}>
              {submitting ? "Submitting..." : "Pair"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}