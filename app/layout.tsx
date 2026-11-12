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

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Runs at HTML parse time, before hydration and before first paint, so the
// correct class is already on <html> — no flash of the wrong theme.
// Raw <script> inside a *server* component ships as literal HTML (same
// pattern as the JSON-LD guide); a script in a *client* component would
// never execute on the client. Mirrors lib/theme-store.ts: light default,
// "dark" only when stored; no prefers-color-scheme involvement.
const themeInit = `(function(){try{var dark=localStorage.getItem("theme")==="dark";var root=document.documentElement;root.classList.remove("light","dark");root.classList.add(dark?"dark":"light");root.style.colorScheme=dark?"dark":"light";var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement("meta");meta.name="theme-color";document.head.appendChild(meta)}meta.content=dark?"#151620":"#fbfaf7";}catch(e){}})();`

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
