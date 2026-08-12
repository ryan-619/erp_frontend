// useHomework
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps homeworkService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { homeworkService } from '@/services/homework.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useHomeworks ──────────────────────────────────────────────────────────────
// Manages homework list state, filtering, stats, and CRUD operations.
export function useHomeworks() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => homeworkService.getHomeworks(), [])
  const { data: classesData } = useAsyncData(() => homeworkService.getClasses(), [])
  const { data: subjectsData } = useAsyncData(() => homeworkService.getSubjects(), [])
  const { data: teachersData } = useAsyncData(() => homeworkService.getTeachers(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const classes = classesData || []
  const subjects = subjectsData || []
  const teachers = teachersData || []

  // useMemo prevents recalculating filtered homework
  // unless homework list or filters change.
  const filtered = useMemo(() => rows.filter((h) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (h.description || '').toLowerCase().includes(q) ||
      (h.class_name || '').toLowerCase().includes(q) ||
      (h.subject_name || '').toLowerCase().includes(q) ||
      (h.teacher_name || '').toLowerCase().includes(q)
    const matchClass = classFilter === 'all' || h.class_id === classFilter
    const matchSubject = subjectFilter === 'all' || h.subject_id === subjectFilter
    const matchStatus = statusFilter === 'all' || h.status === statusFilter
    return matchSearch && matchClass && matchSubject && matchStatus
  }), [rows, search, classFilter, subjectFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((h) => h.status === 'active').length,
    inactive: rows.filter((h) => h.status === 'inactive').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveHomework = useCallback(async (payload, id) => {
    if (id) {
      await homeworkService.updateHomework(id, payload)
      toast({ title: 'Homework updated', description: payload.description })
    } else {
      await homeworkService.createHomework(payload)
      toast({ title: 'Homework added', description: payload.description })
    }
    refetch()
  }, [refetch, toast])

  const deleteHomework = useCallback(async (id) => {
    await homeworkService.deleteHomework(id)
    toast({ title: 'Homework deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    classes,
    subjects,
    teachers,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    subjectFilter, setSubjectFilter,
    statusFilter, setStatusFilter,
    saveHomework,
    deleteHomework,
  }
}

// ─── useDailyAssignments ──────────────────────────────────────────────────────
// Manages daily assignment list state, filtering, stats, and CRUD operations.
export function useDailyAssignments() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => homeworkService.getDailyAssignments(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered assignments
  // unless assignment list or filters change.
  const filtered = useMemo(() => rows.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (a.student_name || '').toLowerCase().includes(q) ||
      (a.teacher_name || '').toLowerCase().includes(q) ||
      (a.task || '').toLowerCase().includes(q) ||
      (a.class_name || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((a) => a.status === 'pending').length,
    completed: rows.filter((a) => a.status === 'completed').length,
    overdue: rows.filter((a) => a.status === 'overdue').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveAssignment = useCallback(async (payload, id) => {
    if (id) {
      await homeworkService.updateDailyAssignment(id, payload)
      toast({ title: 'Assignment updated', description: payload.task })
    } else {
      await homeworkService.createDailyAssignment(payload)
      toast({ title: 'Assignment added', description: payload.task })
    }
    refetch()
  }, [refetch, toast])

  const deleteAssignment = useCallback(async (id) => {
    await homeworkService.deleteDailyAssignment(id)
    toast({ title: 'Assignment deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveAssignment,
    deleteAssignment,
  }
}
