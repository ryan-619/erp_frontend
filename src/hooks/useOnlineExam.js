// useOnlineExam
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps onlineExamService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { onlineExamService } from '@/services/onlineExam.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useOnlineExamStats ────────────────────────────────────────────────────────
// Provides dashboard-level aggregate stats for the Online Exam module.
export function useOnlineExamStats() {
  const { data, isLoading } = useAsyncData(() => onlineExamService.getStats(), [])
  const stats = data || {}
  return { stats, isLoading }
}

// ─── useExamCategories ──────────────────────────────────────────────────────────
// Manages exam category list state, filtering, and CRUD operations.
export function useExamCategories() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => onlineExamService.getExamCategories(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered categories
  // unless category list or filters change.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.category_name.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Prevent unnecessary child re-renders.
  const saveCategory = useCallback(async (payload, id) => {
    if (id) {
      await onlineExamService.updateExamCategory(id, payload)
      toast({ title: 'Category updated', description: payload.category_name })
    } else {
      await onlineExamService.createExamCategory(payload)
      toast({ title: 'Category added', description: payload.category_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteCategory = useCallback(async (id) => {
    await onlineExamService.deleteExamCategory(id)
    toast({ title: 'Category deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveCategory,
    deleteCategory,
  }
}

// ─── useOnlineExams ─────────────────────────────────────────────────────────────
// Manages online exam list state, filtering, stats, and CRUD operations.
export function useOnlineExams() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => onlineExamService.getExams(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered exams
  // unless exam list or filters change.
  const filtered = useMemo(() => rows.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.exam_name.toLowerCase().includes(q) ||
      (e.class_name || '').toLowerCase().includes(q) ||
      (e.subject_name || '').toLowerCase().includes(q)
    const matchClass = classFilter === 'all' || e.class_id === classFilter
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchClass && matchStatus
  }), [rows, search, classFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    scheduled: rows.filter((e) => e.status === 'scheduled').length,
    active: rows.filter((e) => e.status === 'active').length,
    completed: rows.filter((e) => e.status === 'completed').length,
  }), [rows])

  const classes = useMemo(() => [...new Set(rows.map((e) => e.class_name))], [rows])

  // Prevent unnecessary child re-renders.
  const saveExam = useCallback(async (payload, id) => {
    if (id) {
      await onlineExamService.updateExam(id, payload)
      toast({ title: 'Exam updated', description: payload.exam_name })
    } else {
      await onlineExamService.createExam(payload)
      toast({ title: 'Exam added', description: payload.exam_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteExam = useCallback(async (id) => {
    await onlineExamService.deleteExam(id)
    toast({ title: 'Exam deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    allExams: rows,
    classes,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    statusFilter, setStatusFilter,
    saveExam,
    deleteExam,
  }
}

// ─── useQuestionBank ────────────────────────────────────────────────────────────
// Manages question bank list state, filtering, stats, and CRUD operations.
export function useQuestionBank() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => onlineExamService.getQuestions(), [])

  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered questions
  // unless question list or filters change.
  const filtered = useMemo(() => rows.filter((q) => {
    const s = search.toLowerCase()
    const matchSearch = !s ||
      q.question.toLowerCase().includes(s) ||
      (q.exam_name || '').toLowerCase().includes(s)
    const matchExam = examFilter === 'all' || q.exam_id === examFilter
    const matchStatus = statusFilter === 'all' || q.status === statusFilter
    return matchSearch && matchExam && matchStatus
  }), [rows, search, examFilter, statusFilter])

  const exams = useMemo(() => [...new Set(rows.map((q) => q.exam_name))], [rows])

  const stats = useMemo(() => {
    const byExam = {}
    rows.forEach((q) => {
      byExam[q.exam_name] = (byExam[q.exam_name] || 0) + 1
    })
    return {
      total: rows.length,
      active: rows.filter((q) => q.status === 'active').length,
      byExam,
    }
  }, [rows])

  // Prevent unnecessary child re-renders.
  const saveQuestion = useCallback(async (payload, id) => {
    if (id) {
      await onlineExamService.updateQuestion(id, payload)
      toast({ title: 'Question updated' })
    } else {
      await onlineExamService.createQuestion(payload)
      toast({ title: 'Question added' })
    }
    refetch()
  }, [refetch, toast])

  const deleteQuestion = useCallback(async (id) => {
    await onlineExamService.deleteQuestion(id)
    toast({ title: 'Question deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    allQuestions: rows,
    exams,
    stats,
    isLoading,
    search, setSearch,
    examFilter, setExamFilter,
    statusFilter, setStatusFilter,
    saveQuestion,
    deleteQuestion,
  }
}

// ─── useStudentAttempts ─────────────────────────────────────────────────────────
// Manages student attempt list state, filtering, and stats.
export function useStudentAttempts() {
  const { data, isLoading } = useAsyncData(() => onlineExamService.getAttempts(), [])

  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')
  const [resultFilter, setResultFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered attempts
  // unless attempt list or filters change.
  const filtered = useMemo(() => rows.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.student_name.toLowerCase().includes(q) ||
      (a.exam_name || '').toLowerCase().includes(q)
    const matchExam = examFilter === 'all' || a.exam_id === examFilter
    const matchResult = resultFilter === 'all' || a.result === resultFilter
    return matchSearch && matchExam && matchResult
  }), [rows, search, examFilter, resultFilter])

  const exams = useMemo(() => [...new Set(rows.map((a) => a.exam_name))], [rows])

  const stats = useMemo(() => {
    const completed = rows.filter((a) => a.status === 'completed')
    const passed = completed.filter((a) => a.result === 'pass').length
    const failed = completed.filter((a) => a.result === 'fail').length
    const avg = completed.length
      ? Math.round(completed.reduce((sum, a) => sum + a.percentage, 0) / completed.length)
      : 0
    return {
      total: rows.length,
      pass: passed,
      fail: failed,
      avg_percentage: avg,
    }
  }, [rows])

  return {
    rows: filtered,
    exams,
    stats,
    isLoading,
    search, setSearch,
    examFilter, setExamFilter,
    resultFilter, setResultFilter,
  }
}

// ─── useExamResults ─────────────────────────────────────────────────────────────
// Result-focused view over completed attempts.
export function useExamResults() {
  const { data, isLoading } = useAsyncData(() => onlineExamService.getResults(), [])

  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered results
  // unless result list or filters change.
  const filtered = useMemo(() => rows.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.student_name.toLowerCase().includes(q) ||
      (a.exam_name || '').toLowerCase().includes(q)
    const matchExam = examFilter === 'all' || a.exam_id === examFilter
    return matchSearch && matchExam
  }), [rows, search, examFilter])

  const exams = useMemo(() => [...new Set(rows.map((a) => a.exam_name))], [rows])

  const stats = useMemo(() => {
    if (!rows.length) return { total: 0, pass_rate: 0, avg_score: 0, top_score: 0 }
    const passed = rows.filter((a) => a.result === 'pass').length
    return {
      total: rows.length,
      pass_rate: Math.round((passed / rows.length) * 100),
      avg_score: Math.round(rows.reduce((sum, a) => sum + a.percentage, 0) / rows.length),
      top_score: Math.max(...rows.map((a) => a.percentage)),
    }
  }, [rows])

  return {
    rows: filtered,
    exams,
    stats,
    isLoading,
    search, setSearch,
    examFilter, setExamFilter,
  }
}
