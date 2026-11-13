# TV Remote

A browser-based network remote for Android TV / Google TV. The machine
serving this app keeps one long-lived mutual-TLS connection per TV and
speaks Google's official **Android TV Remote v2** protocol — the same
protocol Play-Store "Android TV Remote" apps use. No apps on the TV, no
cloud accounts, nothing outside your LAN.

Built with Next.js 16 (Node runtime), Bun, and shadcn/ui.

## Quick start

Requirements: [Bun](https://bun.sh) ≥ 1.4, and a TV on the same Wi-Fi/LAN
(both devices on one IPv4 subnet; router client isolation off; VPN off).

```bash
bun install
bun run dev            # http://localhost:3000
```

Open the app from another device on the LAN, tap **Scan network**, then
**Add** on your TV and type the 6-character code shown on the TV screen.
Done — you're on the remote page.

> `protobufjs` (a dependency of the remote protocol library) ships a
> postinstall hook. It is pre-approved here via `trustedDependencies` in
> `package.json`; if your Bun still warns about it, run `bun pm trust protobufjs` once.

If the scan finds nothing, expand **Can't find it? Enter the IP address**
on the home page (IP is on the TV at Settings → Network → IP address).

## What you get

- **Full remote** — D-pad with OK, Back · Home · Menu · Mute nav band,
  power, media transport (rewind · previous · play/pause · next · fast
  forward), and a two-key volume rocker.
- **Type on TV** — an inline text bar inside the remote surface (under the
  nav band) that injects keystrokes into whatever field the TV has focused.
  Enter sends (the mobile keyboard's action key reads Go), or tap the
  circular chevron send button. A circular backspace button sends DEL —
  tap repeatedly or hold to burst-delete, which works even on text the
  TV already had.
- **Saved TVs** — the home page lists your TVs, scanned TVs can be added in
  one tap, saved rows can be **renamed in place** (Enter saves, Escape
  cancels), and the remote page has a header switcher to jump between TVs.
- **Keyboard-first** — the whole remote is keyboard-operable, with optional
  desktop-only shortcut chips (off by default; **Hints** toggle in the
  header).
- **Day & Night** — Day (light) is the default; the toggle is in the
  header. Remembered on this device.
- **Responsive** — phones get a stacked thumb-zone layout; from `lg` up the
  surface becomes a two-pane grid sized to fit desktop windows without
  scrolling. Targets are ≥64 px throughout.
- **Everything local** — pairing certs live in `data/remotes.json` (gitignored),
  device names and preferences in browser `localStorage`. No telemetry, no
  accounts, no cloud.

## Pairing

Pairing is one-time per TV and per server:

1. The server connects to the TV (`/api/pair/start`). If the TV isn't
   paired yet it starts pairing and the TV shows a 6-character code
   (0–9 and A–F).
2. Type the code in the web UI (or press **Pair TV**). The TV issues a
   certificate, persisted to `data/remotes.json`.
3. Reconnects reuse the stored certificate — no code again.

If the connection fails, the page still offers an **Enter code** button so
the code field is always reachable. If a TV was factory-reset, delete
`data/remotes.json` and pair again. Live state (power, volume, foreground
app) is pushed by the TV and exposed via `GET /api/pair/status?host=`,
which the UI polls every ~1.5 s.

## How discovery works

`GET /api/discover` runs two things concurrently:

1. **mDNS browse** for `_androidtvremote2._tcp` (3 s) — finds TVs that
   advertise the service and reports their friendly name. Certified
   Android TV / Google TV devices advertise this.
2. **Subnet TCP probe** of the server's own IPv4 /24 (254 hosts, ~300 ms
   timeout, 64 concurrent) — tries `6467` (pairing) then `6466` (control).
   Finds devices even when mDNS is filtered, though it can't learn names.

Results are unioned and de-duplicated by IP; each entry reports
`via: "mdns" | "probe" | "both"`. The scan runs only when you press the
button. IPv6 and multi-subnet setups aren't handled; phone, server, and TV
must share one IPv4 LAN.

Uncertified boxes (no Google services) will **not** work — test with the
official "Android TV Remote" phone app: if it can't pair, this app can't
either (the ADB fallback is not implemented yet).

## Keyboard control

Active on the remote page while the TV is connected (keys are paused while
you type in a field, and while a dialog is open):

| Key | Action | Key | Action |
|---|---|---|---|
| `←` `↑` `↓` `→` | D-pad | `+` / `−` | Volume up / down |
| `Enter` | OK | `M` | Mute |
| `Backspace` / `Esc` | Back | `[` / `]` | Previous / Next |
| `Space` / `K` | Play · Pause | `P` | Power |
| `H` | Home | `C` | Menu |

The **Hints** toggle pins a chip to each button showing its shortcut.
Chips render only on desktops (hover + fine pointer), are off by default,
and are remembered on this device.

## Using the remote screen

- **Icon & label rules** — remote keys are icon-only with accessible
  labels; stateful toggles (Day/Night, Hints) are icon + current-state
  word; everything else is text-first. Universal glyphs (back arrow, ✕)
  are the only icon-only exceptions.
- **Mute** — the nav band's crossed-speaker key sends `MUTE`; the TV's
  reported mute state appears as text in the volume strip
  (`Vol x/y · muted`). The key itself is deliberately static.
- **Haptics** — a short vibration on key presses where the Vibration API
  exists (mobile only).
- **Press feedback** — every key visually depresses on tap.
- **Status badge** — shows only while pairing / connecting / error; a
  healthy connection shows nothing.

## API

All routes are Node-runtime (`runtime = "nodejs"`); they hold raw TLS, so
deployment on serverless/edge platforms won't work.

| Route | Method | Body / query | Action |
|---|---|---|---|
| `/api/health` | GET | — | smoke check |
| `/api/discover` | GET | — | TVs found on the LAN |
| `/api/pair/start` | POST | `{host}` | connect / start pairing |
| `/api/pair/status` | GET | `?host=` | state + power + volume + currentApp |
| `/api/pair/code` | POST | `{host, code}` | submit 6-character code (0-9 A-F) |
| `/api/remote/key` | POST | `{host, keyCode \| key, direction?}` | send key |
| `/api/remote/power` | POST | `{host}` | toggle power |
| `/api/remote/state` | GET | `?host=` | state snapshot |
| `/api/remote/text` | POST | `{host, text}` | text injection (IME) |

## Production

```bash
bun run build
bun run start      # serves on 0.0.0.0:3000
```

Run it on any LAN host (PC, Raspberry Pi, NAS). Anyone on the LAN who can
reach the server controls your TV — put a reverse proxy with an auth
passcode in front if the network is untrusted. For "add to home screen" on
Android, the page must be served over HTTPS (secure context); plain
`http://<lan-ip>:3000` still works in a tab.

## Development

| Command | Action |
|---|---|
| `bun run dev` | dev server (Turbopack) |
| `bun run build` | production build |
| `bun run start` | serve production build |
| `bun run lint` | eslint |
| `bun run typecheck` | tsc --noEmit |
| `bun run format` | prettier --write |

Gates before a commit: `bun run lint && bun run typecheck && bun run build`.
Commits use `type(scope): subject` (≤ 72 chars, imperative) — e.g.
`feat(home): rename saved TVs in place`.

Architecture notes: browsers can't open raw TLS sockets, so all protocol
work happens server-side in route handlers against a singleton connection
manager (`lib/remote-manager.ts`). Remote keys are plain keystrokes into
the TV; there is no app-launch or voice support — the protocol exposes no
playback state, so play/pause stays a dual-glyph.

## Security & privacy

- Anyone on your LAN who can reach the server can control your TV.
- `data/remotes.json` holds each TV's mTLS certificate pair — keep it
  private; the `/data/` directory is gitignored.
- Device list (host, name), theme, dim/hint preferences live in the
  browser's `localStorage` and never leave it.
- No telemetry, analytics, or outbound requests beyond discovery (LAN) and
  the TV connection itself.

## Not implemented yet

ADB fallback for uncertified boxes, server-push state (SSE/WebSocket
instead of 1.5 s polling), PWA + HTTPS guide, multi-user auth, IPv6 / multi-subnet
discovery, voice input.

## License

MIT — see [LICENSE](LICENSE).
