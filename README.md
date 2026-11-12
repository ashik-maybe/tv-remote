# TV Remote

An Android TV / Google TV network remote that runs in the browser.
Built with Next.js 16 + Bun + shadcn — the phone or laptop only serves the UI;
a Node-backed route handler talks to the TV using Google's official
**Android TV Remote v2** protocol (the same protocol the Play Store
"Android TV Remote" apps use).

## How it works

- The TV ships the **Android TV Remote Service** built in (ports `6466` for
  control, `6467` for pairing). Nothing to install on the TV — it must run
  Android TV / Google TV (certified or Google-services-enabled).
- The Next.js server holds one long-lived mutual-TLS connection per TV
  (`@kud/androidtv-remote`). Browsers can't open raw TLS sockets, so the
  control plane lives in Route Handlers (`runtime = "nodejs"`).
- Pairing is one-time: the TV shows a 6-digit PIN, you type it in the web
  UI, and the issued certificate is persisted to `data/remotes.json`
  (gitignored). Reconnects reuse the stored cert — no PIN.
- Live state (power, volume, foreground app) is pushed from the TV and
  exposed via `GET /api/pair/status?host=` which the UI polls.
- Device list is stored in `localStorage`; add TVs by IP, no mDNS yet.

## Requirements

- [Bun](https://bun.sh) ≥ 1.4
- A TV on the same LAN. Both devices on the same subnet; router must not
  use client/AP isolation; VPN off on both.
- Certified Android TV / Google TV (e.g. Play-Store-supported TVs) will
  work out of the box. Cheap/no-name boxes without Google services will
  **not** — use the official "Android TV Remote" phone app to test: if it
  can't pair, this app can't either (the ADB fallback is not implemented
  yet).

## Setup

```bash
bun install
bun pm trust protobufjs   # required once: protobufjs postinstall is blocked by default on Bun
bun run dev               # http://localhost:3000
```

Open the app in a browser on the LAN, add the TV's IP
(Settings → Network → IP address on the TV), tap **Open**, and enter the
6-digit code shown on the TV when prompted.

## Production

```bash
bun run build
bun run start   # serves on 0.0.0.0:3000
```

Run on any LAN host (PC, Raspberry Pi, NAS). Deploy to Vercel/serverless
**won't work** — the protocol needs a long-lived TLS socket.

For "add to home screen" on Android, the page must be served over HTTPS
(secure context); plain `http://<lan-ip>:3000` still works in a tab.

## API

| Route | Method | Body / query | Action |
|---|---|---|---|
| `/api/pair/start` | POST | `{host}` | connect / start pairing |
| `/api/pair/status` | GET | `?host=` | state + power + volume + currentApp |
| `/api/pair/code` | POST | `{host, code}` | submit 6-digit PIN |
| `/api/remote/key` | POST | `{host, keyCode \| key, direction?}` | send key / named `RemoteKeyCode` |
| `/api/remote/power` | POST | `{host}` | toggle power |
| `/api/remote/text` | POST | `{host, text}` | IME text injection |
| `/api/remote/app` | POST | `{host, link}` | launch app deep link |
| `/api/remote/state` | GET | `?host=` | state snapshot |
| `/api/health` | GET | — | smoke check |

## Scripts

| Command | Action |
|---|---|
| `bun run dev` | dev server (Turbopack) |
| `bun run build` | production build |
| `bun run start` | serve production build |
| `bun run lint` | eslint |
| `bun run typecheck` | tsc --noEmit |

## Security notes

- Anyone on your LAN who can reach the server can control your TV. Put a
  reverse proxy with an auth passcode in front if the network is untrusted.
- `data/remotes.json` contains TV credentials — keep it private; it is
  gitignored.

## Not implemented yet

ADB fallback for uncertified boxes, mDNS discovery, SSE/WebSocket push,
PWA/HTTPS, multi-user auth.
