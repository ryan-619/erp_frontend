import { useMemo, useState, useCallback } from 'react'
import { alumniService } from '@/services/alumni.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ==========================================================
// Helpers
// ==========================================================

const getResponseData = (response) => {
  // Axios response
  if (response?.data?.data) {
    return response.data.data
  }

  // Axios response where data itself is the array
  if (Array.isArray(response?.data)) {
    return response.data
  }

  // Already-normalized array
  if (Array.isArray(response)) {
    return response
  }

  return []
}

// ==========================================================
// useAlumni
// ==========================================================

export function useAlumni() {
  const { toast } = useToast()

  const {
    data: alumniResponse,
    isLoading,
    refetch,
  } = useAsyncData(
    () => alumniService.getAlumni(),
    []
  )

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')

  const rows = useMemo(
    () => getResponseData(alumniResponse),
    [alumniResponse]
  )

  // ==========================================================
  // Filter Alumni
  // ==========================================================

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((alumni) => {
      const name = alumni.name || ''
      const email = alumni.email || ''
      const currentPosition = alumni.current_position || ''
      const company = alumni.company || ''

      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        currentPosition.toLowerCase().includes(q) ||
        company.toLowerCase().includes(q)

      const matchYear =
        yearFilter === 'all' ||
        String(alumni.batch_year ?? '') === String(yearFilter)

      return matchSearch && matchYear
    })
  }, [rows, search, yearFilter])

  // ==========================================================
  // Available Batch Years
  // ==========================================================

  const years = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((alumni) => alumni.batch_year)
          .filter(
            (year) =>
              year !== undefined &&
              year !== null &&
              year !== ''
          )
      ),
    ].sort((a, b) => Number(b) - Number(a))
  }, [rows])

  // ==========================================================
  // Statistics
  // ==========================================================

  const stats = useMemo(() => {
    const total = rows.length

    const companies = new Set(
      rows
        .map((alumni) => alumni.company)
        .filter(Boolean)
    ).size

    const batches = new Set(
      rows
        .map((alumni) => alumni.batch_year)
        .filter(Boolean)
    ).size

    return {
      total,
      companies,
      batches,
    }
  }, [rows])

  // ==========================================================
  // Create / Update Alumni
  // ==========================================================

  const saveAlumni = useCallback(
    async (payload, id) => {
      try {
        if (id) {
          await alumniService.updateAlumni(id, payload)

          toast({
            title: 'Alumni updated',
            description: payload.name || 'Alumni record updated successfully',
          })
        } else {
          await alumniService.createAlumni(payload)

          toast({
            title: 'Alumni added',
            description: payload.name || 'Alumni added successfully',
          })
        }

        await refetch()
      } catch (error) {
        console.error('Failed to save alumni:', error)

        toast({
          title: 'Operation failed',
          description:
            error?.response?.data?.message ||
            'Unable to save alumni record',
          variant: 'destructive',
        })

        throw error
      }
    },
    [refetch, toast]
  )

  // ==========================================================
  // Delete Alumni
  // ==========================================================

  const deleteAlumni = useCallback(
    async (id) => {
      try {
        await alumniService.deleteAlumni(id)

        toast({
          title: 'Alumni deleted',
          description: 'Alumni record deleted successfully',
        })

        await refetch()
      } catch (error) {
        console.error('Failed to delete alumni:', error)

        toast({
          title: 'Delete failed',
          description:
            error?.response?.data?.message ||
            'Unable to delete alumni record',
          variant: 'destructive',
        })

        throw error
      }
    },
    [refetch, toast]
  )

  return {
    rows: filtered,
    stats,
    isLoading,

    search,
    setSearch,

    yearFilter,
    setYearFilter,

    years,

    saveAlumni,
    deleteAlumni,

    refetch,
  }
}

// ==========================================================
// useAlumniEvents
// ==========================================================

export function useAlumniEvents() {
  const { toast } = useToast()

  const {
    data: eventsResponse,
    isLoading,
    refetch,
  } = useAsyncData(
    () => alumniService.getEvents(),
    []
  )

  const [search, setSearch] = useState('')

  const rows = useMemo(
    () => getResponseData(eventsResponse),
    [eventsResponse]
  )

  // ==========================================================
  // Filter Events
  // ==========================================================

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((event) => {
      const eventTitle = event.event_title || ''
      const venue = event.venue || ''
      const description = event.description || ''

      return (
        !q ||
        eventTitle.toLowerCase().includes(q) ||
        venue.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  // ==========================================================
  // Event Statistics
  // ==========================================================

  const stats = useMemo(() => {
    const total = rows.length

    const upcoming = rows.filter((event) => {
      if (!event.date) return false

      const eventDate = new Date(event.date)

      return !Number.isNaN(eventDate.getTime()) &&
        eventDate >= new Date()
    }).length

    return {
      total,
      upcoming,
    }
  }, [rows])

  // ==========================================================
  // Create / Update Event
  // ==========================================================

  const saveEvent = useCallback(
    async (payload, id) => {
      try {
        if (id) {
          await alumniService.updateEvent(id, payload)

          toast({
            title: 'Event updated',
            description:
              payload.event_title ||
              'Event updated successfully',
          })
        } else {
          await alumniService.createEvent(payload)

          toast({
            title: 'Event added',
            description:
              payload.event_title ||
              'Event added successfully',
          })
        }

        await refetch()
      } catch (error) {
        console.error('Failed to save event:', error)

        toast({
          title: 'Operation failed',
          description:
            error?.response?.data?.message ||
            'Unable to save event',
          variant: 'destructive',
        })

        throw error
      }
    },
    [refetch, toast]
  )

  // ==========================================================
  // Delete Event
  // ==========================================================

  const deleteEvent = useCallback(
    async (id) => {
      try {
        await alumniService.deleteEvent(id)

        toast({
          title: 'Event deleted',
          description: 'Event deleted successfully',
        })

        await refetch()
      } catch (error) {
        console.error('Failed to delete event:', error)

        toast({
          title: 'Delete failed',
          description:
            error?.response?.data?.message ||
            'Unable to delete event',
          variant: 'destructive',
        })

        throw error
      }
    },
    [refetch, toast]
  )

  return {
    rows: filtered,
    stats,
    isLoading,

    search,
    setSearch,

    saveEvent,
    deleteEvent,

    refetch,
  }
}