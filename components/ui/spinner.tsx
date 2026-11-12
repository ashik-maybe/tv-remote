import { cn } from "cn"
import { MdSync } from "react-icons/md"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <MdSync data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
