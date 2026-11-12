import net from "node:net"
import os from "node:os"
import Bonjour from "bonjour-service"

export interface DiscoveredDevice {
  host: string
  name: string | null
  via: "mdns" | "probe" | "both"
}

const MDNS_TIMEOUT_MS = 3000
const PROBE_PORTS = [6467, 6466]
const PROBE_TIMEOUT_MS = 300
const PROBE_CONCURRENCY = 64

function mdnsBrowse(timeoutMs: number): Promise<Map<string, string>> {
  return new Promise((resolve) => {
    const found = new Map<string, string>()
    let done = false

    try {
      const bonjour = new Bonjour()
      const browser = bonjour.find({ type: "_androidtvremote2._tcp" }, (service) => {
        const addresses: string[] = service.addresses ?? []
        const v4 =
          addresses.find((a: string) => /^\d+\.\d+\.\d+\.\d+$/.test(a)) ?? addresses[0]
        if (v4) {
          const name = typeof service.name === "string" ? service.name : ""
          found.set(v4, name)
        }
      })

      const finish = () => {
        if (done) return
        done = true
        try {
          browser?.stop()
        } catch {
          // ignore
        }
        try {
          bonjour.destroy()
        } catch {
          // ignore
        }
        resolve(found)
      }

      setTimeout(finish, timeoutMs)
    } catch {
      resolve(found)
    }
  })
}

function defaultSubnet(): { base: string; hosts: string[] } | null {
  const interfaces = os.networkInterfaces()
  for (const entries of Object.values(interfaces) as (os.NetworkInterfaceInfo[] | undefined)[]) {
    for (const entry of entries ?? []) {
      const family = String(entry.family)
      if (family !== "IPv4" || entry.internal) continue
      const parts = entry.address.split(".")
      if (parts.length !== 4) continue
      const base = `${parts[0]}.${parts[1]}.${parts[2]}.`
      const first = Number(parts[3])
      // /24 assumption — good enough for home networks; covers 254 hosts
      const hosts: string[] = []
      for (let i = 1; i <= 254; i++) {
        if (i === first) continue
        hosts.push(`${base}${i}`)
      }
      return { base, hosts }
    }
  }
  return null
}

function tcpProbe(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const done = (ok: boolean) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(ok)
    }

    socket.setTimeout(timeoutMs)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
    socket.connect(port, host)
  })
}

async function probeSubnet(hosts: string[]): Promise<Set<string>> {
  const open = new Set<string>()
  let index = 0

  async function worker() {
    while (true) {
      const i = index++
      if (i >= hosts.length) return
      const host = hosts[i]
      for (const port of PROBE_PORTS) {
        // eslint-disable-next-line no-await-in-loop
        if (await tcpProbe(host, port, PROBE_TIMEOUT_MS)) {
          open.add(host)
          break
        }
      }
    }
  }

  const workers = Array.from({ length: PROBE_CONCURRENCY }, worker)
  await Promise.all(workers)
  return open
}

export async function discoverDevices(): Promise<DiscoveredDevice[]> {
  const mdnsPromise = mdnsBrowse(MDNS_TIMEOUT_MS)

  const subnet = defaultSubnet()
  const probePromise = subnet ? probeSubnet(subnet.hosts) : Promise.resolve(new Set<string>())

  const [byIp, reachable] = await Promise.all([mdnsPromise, probePromise])

  const map = new Map<string, DiscoveredDevice>()

  for (const [host, name] of byIp) {
    map.set(host, { host, name: name || null, via: reachable.has(host) ? "both" : "mdns" })
  }
  for (const host of reachable) {
    if (!map.has(host)) {
      map.set(host, { host, name: null, via: "probe" })
    }
  }

  return [...map.values()].sort((a, b) => {
    const keyA = (a.name ?? a.host).toLowerCase()
    const keyB = (b.name ?? b.host).toLowerCase()
    return keyA.localeCompare(keyB)
  })
}