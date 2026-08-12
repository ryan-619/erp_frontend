// ====================================================================
// Custom Hook — useGlobalSearch
//
// Purpose:
// Provides live, debounced search across all ERP routes defined in the
// sidebar configuration. Returns matching pages with highlighted text,
// keyboard navigation state, and navigation helpers.
//
// Searches only application routes — never API data or table records.
// ====================================================================

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sidebarItems } from '@/config/sidebar'

// Flatten sidebar items into a searchable list of { title, path, section }.
function buildSearchIndex() {
  const index = []
  for (const item of sidebarItems) {
    if (item.path) {
      index.push({ title: item.title, path: item.path, section: item.title })
    }
    if (item.children) {
      for (const child of item.children) {
        index.push({ title: child.title, path: child.path, section: item.title })
      }
    }
  }
  return index
}

const SEARCH_INDEX = buildSearchIndex()

// Debounce helper — delays invoking fn until input settles.
function debounce(fn, delay = 200) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function useGlobalSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)

  // Debounce the query update so typing doesn't filter on every keystroke.
  const debouncedSetQuery = useMemo(() => debounce(setDebouncedQuery, 200), [])

  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setActiveIndex(0)
    setIsOpen(true)
    debouncedSetQuery(value)
  }, [debouncedSetQuery])

  // Filter the search index by the debounced query.
  const results = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim()
    if (!q) return []
    return SEARCH_INDEX.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q) ||
      item.path.toLowerCase().includes(q),
    ).slice(0, 10)
  }, [debouncedQuery])

  // Reset active index when results change.
  useEffect(() => {
    setActiveIndex(0)
  }, [results])

  const selectResult = useCallback((item) => {
    navigate(item.path)
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }, [navigate])

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape.
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) {
        selectResult(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }, [isOpen, results, activeIndex, selectResult])

  const open = useCallback(() => {
    setIsOpen(true)
    inputRef.current?.focus()
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    query,
    results,
    activeIndex,
    isOpen,
    inputRef,
    handleQueryChange,
    handleKeyDown,
    selectResult,
    open,
    close,
    setActiveIndex,
  }
}

export default useGlobalSearch
