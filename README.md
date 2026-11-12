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
- Pairing is one-time: the TV shows a 6-character code (0-9, sometimes A-F), you type it in the web
  UI, and the issued certificate is persisted to `data/remotes.json`
  (gitignored). Reconnects reuse the stored cert — no PIN.
- Live state (power, volume, foreground app) is pushed from the TV and
  exposed via `GET /api/pair/status?host=` which the UI polls.
- Device list is stored in `localStorage`. TVs are found automatically by
  scanning the LAN (see below) — no IP typing required for most setups.
- Themes: follows your OS theme by default; tap the theme button (top
  right) to cycle System → Day → Night.

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

Open the app in a browser on the LAN and tap **Scan network** — the
server browses mDNS (`_androidtvremote2._tcp`) and probes the subnet for
ports `6467`/`6466`, then lists what it found. Tap **Add** to pair. If
the scan finds nothing, you can enter the TV's IP manually from the home
page (Settings → Network → IP address on the TV).

## Keyboard control

The remote page is fully keyboard-operable while the TV is connected
(keys are paused while you type in a field, and while the pairing dialog
is open):

| Key | Action | Key | Action |
|---|---|---|---|
| `←` `↑` `↓` `→` | D-pad | `+` / `−` | Volume up / down |
| `Enter` | OK | `M` | Mute |
| `Backspace` / `Esc` | Back | `[` / `]` | Previous / Next |
| `Space` / `K` | Play · Pause | `P` | Power |
| `H` | Home | `1`–`4` | YouTube, Netflix, Prime Video, Disney+ |
| `C` | Menu | `D` | Toggle theme |

Hover any button on the remote screen to see its key. The keyboard icon
in the header toggles an on-screen shortcut card.

## Remote screen

- **Responsive layout** — phones get the stacked thumb-zone layout
  (volume at the bottom, near your thumb); tablets and large screens
  switch to a two-column grid (keypad left, media transport / volume /
  text / apps right) with larger, ≥64 px targets.
- **Media transport** — grouped Rewind · Previous · Play/Pause ·
  Next · Fast Forward row.
- **Haptics** — a short vibration on every key press (best-effort;
  silently no-ops on devices without the Vibration API).
- **Press feedback** — every button visually depresses on tap.
- **App launcher** — letter-monogram tiles (YouTube, Netflix, Prime
  Video, Disney+, Spotify, Twitch, Hulu, Max); the first four are
  bound to hotkeys `1`–`4`.
- **Device switcher** — the header menu lists your saved TVs for
  one-tap switching without returning home.
- **Accessibility** — visible focus rings, labels on every control,
  and `prefers-reduced-motion` is honoured.

Pairing: when the TV shows its 6-character code (0-9 or A-F), type it and press **Enter** or
the **Pair TV** button. If the connection fails first, the page still
offers an **Enter code** button so the code field is always reachable.

## How discovery works

`GET /api/discover` performs two things concurrently:

1. **mDNS browse** for `_androidtvremote2._tcp` (3s) — finds TVs that
   advertise the Android TV Remote service and reports their friendly
   name. Certified Android TVs / Google TVs advertise this.
2. **Subnet TCP probe** of the server's own IPv4 /24 (254 hosts, ~300ms
   timeout, 64 concurrent connections) — tries `:6467` then `:6466`.
   Finds devices running the service even without mDNS, including
   devices whose mDNS never gets through (router filtering, AP isolation
   between bands, etc.), though it cannot learn their names.

Results are unioned and de-duplicated by IP; each device reports
`via: "mdns" | "probe" | "both"`. The scan runs only when you press the
button. IPv6 and multi-subnet setups are not handled; phone, server, and
TV must share one IPv4 LAN.

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
| `/api/pair/code` | POST | `{host, code}` | submit 6-character code (0-9 A-F) |
| `/api/remote/key` | POST | `{host, keyCode \| key, direction?}` | send key / named `RemoteKeyCode` |
| `/api/remote/power` | POST | `{host}` | toggle power |
| `/api/remote/text` | POST | `{host, text}` | IME text injection |
| `/api/remote/app` | POST | `{host, link}` | launch app deep link |
| `/api/remote/state` | GET | `?host=` | state snapshot |
| `/api/health` | GET | — | smoke check |
| `/api/discover` | GET | — | list TVs found on the LAN (mDNS + port probe) |

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

ADB fallback for uncertified boxes, SSE/WebSocket push (currently 1.5s
polling), PWA/HTTPS, multi-user auth, IPv6/multi-subnet discovery.
