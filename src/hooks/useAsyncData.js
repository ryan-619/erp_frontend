// ====================================================================
// Custom Hook — useAsyncData
//
// Purpose:
// Generic async data fetcher for service calls. Wraps any function
// returning a promise and exposes { data, isLoading, error, refetch }.
//
// Responsibilities:
// - Drives loading / empty / error states for list and detail pages.
// - Unwraps the { success, data, message } envelope returned by services.
// - Guards against state updates after unmount via an `active` flag.
// - Accepts a `deps` array so callers control when refetch occurs.
//
// INTEGRATION: replace with TanStack Query when a query client is added.
// ====================================================================

import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      // api.js response interceptor already unwraps { success, data } → returns data directly.
      setData(result)
    } catch (e) {
      setError(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    const fetcher = fetcherRef.current
    if (fetcher) {
      fetcher()
        .then((result) => {
          if (active) setData(result)
        })
        .catch((e) => {
          if (active) setError(e)
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, isLoading, error, refetch }
}

export default useAsyncData
