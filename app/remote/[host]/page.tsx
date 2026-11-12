"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Power, Tv, Volume2, VolumeX, Volume1, Play, Pause, SkipBack, SkipForward, Home, Menu, CornerUpLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
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

function buzz(ms = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms)
    }
  } catch {
    // haptics are best-effort
  }
}

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
  const [pairDismissed, setPairDismissed] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeInputRef = useRef<HTMLInputElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await getJson<RemoteSnapshot>(
        `/api/pair/status?host=${encodeURIComponent(host)}`,
      )
      setSnap(s)
      if (s.state !== "pairing") setPairDismissed(false)
    } catch (e) {
      toast.error("Couldn't reach the TV", {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }, [host])

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        const s = await postJson<RemoteSnapshot>("/api/pair/start", { host })
        if (!cancelled) setSnap(s)
      } catch (e) {
        if (!cancelled)
          toast.error("Couldn't reach the TV", {
            description: e instanceof Error ? e.message : String(e),
          })
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

  const reconnect = useCallback(async () => {
    setPairDismissed(false)
    setManualOpen(false)
    try {
      const s = await postJson<RemoteSnapshot>("/api/pair/start", { host })
      setSnap(s)
    } catch (e) {
      toast.error("Couldn't reach the TV", {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }, [host])

  const sendKey = async (key: string) => {
    if (key === "KEYCODE_DPAD_CENTER") buzz(10)
    try {
      await postJson("/api/remote/key", { host, key })
      await refresh()
    } catch (e) {
      toast.error("Command failed", {
        description: e instanceof Error ? e.message : String(e),
        action: { label: "Retry", onClick: () => void sendKey(key) },
      })
    }
  }

  const sendPower = async () => {
    buzz(10)
    try {
      await postJson("/api/remote/power", { host })
      await refresh()
    } catch (e) {
      toast.error("Power command failed", {
        description: e instanceof Error ? e.message : String(e),
        action: { label: "Retry", onClick: () => void sendPower() },
      })
    }
  }

  const submitPairCode = async () => {
    const finalCode = code.trim()
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
      setManualOpen(false)
      setPairDismissed(false)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
      setCode("")
      codeInputRef.current?.focus()
      toast.error("Pairing code rejected", {
        description: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const sendTextNow = async () => {
    if (!text.trim()) return
    buzz(6)
    try {
      await postJson("/api/remote/text", { host, text })
      setText("")
      await refresh()
    } catch (e) {
      toast.error("Couldn't send text", {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const launchApp = async (link: string) => {
    buzz(6)
    try {
      await postJson("/api/remote/app", { host, link })
      await refresh()
    } catch (e) {
      toast.error("Couldn't launch app", {
        description: e instanceof Error ? e.message : String(e),
      })
    }
  }

  const state = snap?.state ?? "connecting"
  const isReady = state === "ready"
  const isPairing = state === "pairing"
  const showPairDialog = (isPairing && !pairDismissed) || manualOpen

  useEffect(() => {
    if (!showPairDialog) return
    const timer = setTimeout(() => codeInputRef.current?.focus(), 80)
    return () => clearTimeout(timer)
  }, [showPairDialog])
  const statusLabel =
    state === "ready" ? "Connected" : state === "pairing" ? "Awaiting code" : state === "error" ? "Error" : "Connecting"
  const statusDot =
    state === "ready" ? "bg-emerald-400" : state === "pairing" ? "bg-amber-400" : state === "error" ? "bg-red-400" : "bg-zinc-400"

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 p-4 sm:max-w-lg">
      <header className="flex items-center gap-2 pt-1">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={() => router.push("/")}>
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mono text-sm tabular-nums">{host}</span>
          <span className="text-[11px] text-muted-foreground">Android TV</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <span className={`size-1.5 rounded-full ${statusDot}`} aria-hidden="true" />
          {statusLabel}
        </span>
        <ThemeToggle />
      </header>

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Tv className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium tabular-nums">
                {snap?.currentApp ? snap.currentApp.split(".").pop() : "—"}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {snap?.volume
                  ? `Vol ${snap.volume.level}/${snap.volume.maximum}${snap.volume.muted ? " · muted" : ""}`
                  : "Volume unknown"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={sendPower}
            disabled={!isReady}
            aria-label="Toggle power"
          >
            <Power className="size-5" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>

      {state === "error" && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive">Couldn&apos;t reach the TV</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Check the TV is on and on the same Wi-Fi network, then try again — or, if
              the TV is showing a code, enter it.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" onClick={reconnect}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setManualOpen(true)
                setPairDismissed(false)
              }}
            >
              Enter code
            </Button>
          </div>
        </div>
      )}

      {isPairing && pairDismissed && !manualOpen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm">
            <span className="font-medium">TV is ready to pair.</span>{" "}
            <span className="text-muted-foreground">It&apos;s showing a 6-digit code.</span>
          </p>
          <Button size="sm" onClick={() => setManualOpen(true)}>
            Enter code
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="grid grid-cols-3 gap-2">
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_HOME")} disabled={!isReady} aria-label="Home">
            <Home className="size-6" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_DPAD_UP")} disabled={!isReady} aria-label="D-pad up">
            <ChevronUp className="size-7" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_BACK")} disabled={!isReady} aria-label="Back">
            <CornerUpLeft className="size-6" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_DPAD_LEFT")} disabled={!isReady} aria-label="D-pad left">
            <ChevronLeft className="size-7" aria-hidden="true" />
          </Button>
          <Button className="h-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/80" onClick={() => sendKey("KEYCODE_DPAD_CENTER")} disabled={!isReady} aria-label="OK">
            <span className="text-base font-bold">OK</span>
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_DPAD_RIGHT")} disabled={!isReady} aria-label="D-pad right">
            <ChevronRight className="size-7" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_MENU")} disabled={!isReady} aria-label="Menu">
            <Menu className="size-6" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_DPAD_DOWN")} disabled={!isReady} aria-label="D-pad down">
            <ChevronDown className="size-7" aria-hidden="true" />
          </Button>
          <Button className="h-14" variant="secondary" onClick={() => sendKey("KEYCODE_MEDIA_PLAY_PAUSE")} disabled={!isReady} aria-label="Play or pause">
            <span className="flex items-center gap-0.5">
              <Play className="size-5" aria-hidden="true" />
              <Pause className="size-5" aria-hidden="true" />
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" className="h-14" onClick={() => sendKey("KEYCODE_MEDIA_PREVIOUS")} disabled={!isReady} aria-label="Previous">
          <SkipBack className="size-5" aria-hidden="true" />
        </Button>
        <Button variant="outline" className="h-14" onClick={() => sendKey("KEYCODE_MEDIA_NEXT")} disabled={!isReady} aria-label="Next">
          <SkipForward className="size-5" aria-hidden="true" />
        </Button>
        <Button variant="outline" className="h-14" onClick={() => sendKey("KEYCODE_VOLUME_DOWN")} disabled={!isReady} aria-label="Volume down">
          <Volume1 className="size-5" aria-hidden="true" />
        </Button>
        <Button variant="outline" className="h-14" onClick={() => sendKey("KEYCODE_VOLUME_UP")} disabled={!isReady} aria-label="Volume up">
          <Volume2 className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <Button variant="outline" className="h-12 w-full" onClick={() => sendKey("KEYCODE_VOLUME_MUTE")} disabled={!isReady}>
        <VolumeX className="size-5" aria-hidden="true" />
        Mute
      </Button>

      <div className="flex gap-2">
        <Input
          placeholder="Type on TV…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendTextNow()}
          disabled={!isReady}
          className="h-12"
          aria-label="Text to type on TV"
        />
        <Button className="h-12" onClick={sendTextNow} disabled={!isReady || !text.trim()}>
          Send
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {APP_SHORTCUTS.map((a) => (
          <Button
            key={a.label}
            variant="secondary"
            className="h-12 text-xs"
            onClick={() => launchApp(a.link)}
            disabled={!isReady}
          >
            {a.label}
          </Button>
        ))}
      </div>

      <Dialog
        open={showPairDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPairDismissed(true)
            setManualOpen(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pair with your TV</DialogTitle>
            <DialogDescription>
              Your TV is showing a 6-digit code on screen. Type it below, then choose
              Pair TV — or press Enter.
            </DialogDescription>
          </DialogHeader>
          <Input
            ref={codeInputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void submitPairCode()
              }
            }}
            className="h-16 text-center font-mono text-3xl tracking-[0.4em] tabular-nums"
            aria-label="6-digit pairing code"
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setPairDismissed(true)
                setManualOpen(false)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitPairCode()}
              disabled={code.length !== 6 || submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Pairing…" : "Pair TV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}