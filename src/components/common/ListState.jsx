import EmptyState from '@/components/EmptyState'
import TableSkeleton from '@/components/loaders/TableSkeleton'
import { SearchX } from 'lucide-react'

// Wraps list content with loading / empty / error states.
// `isLoading`, `error`, `isEmpty` drive which state renders.
export function ListState({
  isLoading,
  error,
  isEmpty,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search query.',
  skeleton,
  children,
}) {
  if (isLoading) return skeleton || <TableSkeleton />
  if (error)
    return (
      <EmptyState
        icon={SearchX}
        title="Something went wrong"
        description={error?.message || 'Failed to load data. Please try again.'}
      />
    )
  if (isEmpty)
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  return children
}

export default ListState
