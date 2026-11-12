/**
 * Keyboard shortcut chip pinned to the top-right corner of a control.
 * Shown only on devices with hover + a fine pointer (desktop keyboards);
 * invisible on touch — couch users see nothing extra.
 */
export function KeyHint({ label }: { label: string }) {
  return (
    <kbd
      aria-hidden="true"
      className="pointer-events-none absolute right-1.5 top-1 hidden h-4 min-w-4 select-none items-center justify-center rounded border border-border/70 bg-background/80 px-1 font-mono text-[9px] leading-none text-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:inline-flex"
    >
      {label}
    </kbd>
  )
}
