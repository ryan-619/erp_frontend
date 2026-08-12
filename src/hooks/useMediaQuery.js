// ====================================================================
// Custom Hook — useMediaQuery
//
// Purpose:
// Tracks a CSS media query and returns a boolean for whether it matches.
// Enables responsive behavior in JS (e.g. auto-collapsing the sidebar
// below the `lg` breakpoint).
//
// Responsibilities:
// - Reads the initial match synchronously to avoid layout flash.
// - Subscribes to matchMedia `change` events and cleans up on unmount.
//
// Used by: AppLayout (sidebar collapse), chart responsiveness.
// ====================================================================

import { useEffect, useState } from 'react'

// Track a CSS media query, e.g. useMediaQuery('(min-width: 1024px)').
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

export default useMediaQuery
