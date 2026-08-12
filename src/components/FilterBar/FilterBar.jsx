// ====================================================================
// Reusable Component — FilterBar
//
// Used by: All list pages.
// Purpose: Horizontal toolbar layout for search + filter controls.
//          Provides consistent responsive spacing (stacks on mobile,
//          row on desktop) without dictating what filters live inside.
// ====================================================================

import { cn } from '@/lib/utils'

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
