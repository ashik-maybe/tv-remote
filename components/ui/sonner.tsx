"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { MdCheckCircle, MdInfo, MdWarning, MdErrorOutline, MdSync } from "react-icons/md"

import { useThemeMode } from "@/lib/theme-store"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useThemeMode()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <MdCheckCircle className="size-4" />
        ),
        info: (
          <MdInfo className="size-4" />
        ),
        warning: (
          <MdWarning className="size-4" />
        ),
        error: (
          <MdErrorOutline className="size-4" />
        ),
        loading: (
          <MdSync className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
