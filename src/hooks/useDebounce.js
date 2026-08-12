// ====================================================================
// Custom Hook — useDebounce
//
// Purpose:
// Delays a fast-changing value (e.g. a search input) until input settles.
// Returns the latest value after `delay` ms of inactivity.
//
// Responsibilities:
// - Prevents an API call on every keystroke.
// - Cleans up the pending timer on unmount or value change.
//
// Used by: every list page's search field to throttle filter requests.
// ====================================================================

import { useCallback, useEffect, useState } from 'react'

// Debounce a fast-changing value (e.g. search input).
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default useDebounce
