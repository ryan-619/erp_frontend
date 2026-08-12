import { cn } from '@/lib/utils'

// Row of filter controls + search, used above tables/cards.
export function FilterBar({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default FilterBar
