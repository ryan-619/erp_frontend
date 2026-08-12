// useLessonPlan
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps lessonPlanService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { lessonPlanService } from '@/services/lessonPlan.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useLessonPlans ───────────────────────────────────────────────────────────
// Manages lesson plan list state, filtering, stats, and CRUD operations.
export function useLessonPlans() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => lessonPlanService.getLessonPlans(), [])
  const { data: classesData } = useAsyncData(() => lessonPlanService.getClasses(), [])
  const { data: subjectsData } = useAsyncData(() => lessonPlanService.getSubjects(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const classes = classesData || []
  const subjects = subjectsData || []

  // useMemo prevents recalculating filtered lesson plans
  // unless lesson plan list or filters change.
  const filtered = useMemo(() => rows.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (l.lesson_name || '').toLowerCase().includes(q) ||
      (l.topic || '').toLowerCase().includes(q) ||
      (l.class_name || '').toLowerCase().includes(q) ||
      (l.subject_name || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    const matchClass = classFilter === 'all' || l.class_id === classFilter
    const matchSubject = subjectFilter === 'all' || l.subject_id === subjectFilter
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchClass && matchSubject && matchStatus
  }), [rows, search, classFilter, subjectFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    completed: rows.filter((l) => l.status === 'completed').length,
    in_progress: rows.filter((l) => l.status === 'in-progress').length,
    pending: rows.filter((l) => l.status === 'pending').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveLessonPlan = useCallback(async (payload, id) => {
    if (id) {
      await lessonPlanService.updateLessonPlan(id, payload)
      toast({ title: 'Lesson plan updated', description: payload.lesson_name })
    } else {
      await lessonPlanService.createLessonPlan(payload)
      toast({ title: 'Lesson plan added', description: payload.lesson_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteLessonPlan = useCallback(async (id) => {
    await lessonPlanService.deleteLessonPlan(id)
    toast({ title: 'Lesson plan deleted' })
    refetch()
  }, [refetch, toast])

  const copyLesson = useCallback(async (id, payload) => {
    await lessonPlanService.copyLesson(id, payload)
    toast({ title: 'Lesson copied', description: payload.lesson_name })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    classes,
    subjects,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    subjectFilter, setSubjectFilter,
    statusFilter, setStatusFilter,
    saveLessonPlan,
    deleteLessonPlan,
    copyLesson,
  }
}

// ─── useLessonPlanStats ───────────────────────────────────────────────────────
// Fetches aggregate lesson plan stats for dashboard cards.
export function useLessonPlanStats() {
  const { data, isLoading } = useAsyncData(() => lessonPlanService.getStats(), [])
  const stats = data || { total_lessons: 0, completed: 0, in_progress: 0, pending: 0 }
  return { stats, isLoading }
}
