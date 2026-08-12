import { cn } from '@/lib/utils'

// Skeleton block with shimmer.
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/60 animate-shimmer',
        className,
      )}
    />
  )
}

export default Skeleton
