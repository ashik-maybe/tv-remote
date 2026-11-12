import type { Viewport } from "next"
import { Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'})

export const metadata = {
  title: "TV Remote",
  description: "Find and control your Android TV / Google TV on your home network.",
}

export const viewport: Viewport = {
  themeColor: [
    // Follow the same tokens as globals.css (--background).
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#12141a" },
  ],
}

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Runs at HTML parse time, before hydration and before first paint, so the
// correct class is already on <html> — no flash of the wrong theme.
// Raw <script> inside a *server* component ships as literal HTML (same
// pattern as the JSON-LD guide); a script in a *client* component would
// never execute on the client. Mirrors lib/theme-store.ts.
const themeInit = `(function(){try{var mode=localStorage.getItem("theme");if(mode!=="light"&&mode!=="dark"&&mode!=="system")mode="system";var resolved=mode==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):mode;var root=document.documentElement;root.classList.remove("light","dark");root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <ThemeProvider>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
