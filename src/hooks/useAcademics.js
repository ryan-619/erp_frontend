// ====================================================================
// Custom Hook
//
// Purpose:
// Contains business logic for this module.
//
// Responsibilities:
// - Search
// - Filter
// - Sorting
// - CRUD orchestration
//
// Keeps page components focused on UI.
// ====================================================================

import { useMemo, useState, useCallback } from 'react'
import { academicsService } from '@/services/academics.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useClasses ────────────────────────────────────────────────────────────────
// Manages academic classes list, filtering, stats, and CRUD operations.
export function useClasses() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.classes(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered classes
  // unless class list or filters change.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = (r.class_name || "")
          .toLowerCase()
          .includes(q)
        const matchStatus = status === 'all' || r.status === status
        return matchSearch && matchStatus
      }),
    [rows, search, status],
  )
const stats = {
  total: rows.length,
}

  const saveClass = useCallback(
    async (payload, id) => {
      if (id) {
        await academicsService.updateClass(id, {
          class_name: payload.class_name,
        })
        toast({ title: 'Class updated', description: payload.class_name })
      } else {
        await academicsService.createClass({
          class_name: payload.class_name,
        })
        toast({ title: 'Class added', description: payload.class_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteClass = useCallback(
    async (id) => {
      try {
        await academicsService.deleteClass(id)
        toast({ title: 'Class deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting class', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  const bulkDelete = useCallback(
    async (ids) => {
      await academicsService.bulkDelete(ids)
      toast({ title: 'Classes deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allClasses: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    saveClass,
    deleteClass,
    bulkDelete,
  }
}

// ─── useSections ───────────────────────────────────────────────────────────────
// Manages academic sections list, filtering, and CRUD operations.
export function useSections() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.sections(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.section_name || '').toLowerCase().includes(q) || (r.class_name || '').toLowerCase().includes(q)
        return matchSearch
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
    }),
    [rows],
  )

  const saveSection = useCallback(
    async (payload, id) => {
      const data = {
        class_id: payload.class_id,
        section_name: payload.section_name,
      }
      if (id) {
        await academicsService.updateSection(id, data)
        toast({ title: 'Section updated', description: payload.section_name })
      } else {
        await academicsService.createSection(data)
        toast({ title: 'Section added', description: payload.section_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteSection = useCallback(
    async (id) => {
      try {
        await academicsService.deleteSection(id)
        toast({ title: 'Section deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting section', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allSections: rows,
    stats,
    isLoading,
    search, setSearch,
    saveSection,
    deleteSection,
  }
}

// ─── useSubjects ────────────────────────────────────────────────────────────────
// Manages subjects list, filtering, stats, and CRUD operations.
export function useSubjects() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.subjects(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.subject_name || '').toLowerCase().includes(q) || (r.subject_code || '').toLowerCase().includes(q)
        return matchSearch
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
    }),
    [rows],
  )

  const saveSubject = useCallback(
    async (payload, id) => {
      const data = {
        subject_name: payload.subject_name,
        subject_code: payload.subject_code,
      }
      if (id) {
        await academicsService.updateSubject(id, data)
        toast({ title: 'Subject updated', description: payload.subject_name })
      } else {
        await academicsService.createSubject(data)
        toast({ title: 'Subject added', description: payload.subject_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteSubject = useCallback(
    async (id) => {
      try {
        await academicsService.deleteSubject(id)
        toast({ title: 'Subject deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting subject', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  const bulkDelete = useCallback(
    async (ids) => {
      await Promise.all(ids.map(id => academicsService.deleteSubject(id)))
      toast({ title: 'Subjects deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allSubjects: rows,
    stats,
    isLoading,
    search, setSearch,
    saveSubject,
    deleteSubject,
    bulkDelete,
  }
}

// ─── useSubjectGroups ──────────────────────────────────────────────────────────
// Manages subject groups list, filtering, and CRUD operations.
export function useSubjectGroups() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.subjectGroups(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        return !q || (r.group_name || '').toLowerCase().includes(q) || (r.group_code || '').toLowerCase().includes(q)
      }),
    [rows, search],
  )

  const saveSubjectGroup = useCallback(
    async (payload, id) => {
      const data = {
        group_name: payload.group_name,
        group_code: payload.group_code,
      }
      if (id) {
        await academicsService.updateSubjectGroup(id, data)
        toast({ title: 'Subject group updated', description: payload.group_name })
      } else {
        await academicsService.createSubjectGroup(data)
        toast({ title: 'Subject group added', description: payload.group_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteSubjectGroup = useCallback(
    async (id) => {
      try {
        await academicsService.deleteSubjectGroup(id)
        toast({ title: 'Subject group deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting subject group', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allSubjectGroups: rows,
    stats,
    isLoading,
    search, setSearch,
    saveSubjectGroup,
    deleteSubjectGroup,
  }
}

// ─── useClassTeachers ──────────────────────────────────────────────────────────
// Manages class teachers list, filtering, and CRUD operations.
export function useClassTeachers() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.classTeachers(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.teacher_name || '').toLowerCase().includes(q) || (r.class_name || '').toLowerCase().includes(q)
        return matchSearch
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
    }),
    [rows],
  )

  const saveClassTeacher = useCallback(
    async (payload, id) => {
      const data = {
        teacher_id: payload.teacher_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
      }
      if (id) {
        await academicsService.updateClassTeacher(id, data)
        toast({ title: 'Class teacher updated' })
      } else {
        await academicsService.createClassTeacher(data)
        toast({ title: 'Class teacher assigned' })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteClassTeacher = useCallback(
    async (id) => {
      try {
        await academicsService.deleteClassTeacher(id)
        toast({ title: 'Class teacher removed' })
        refetch()
      } catch (error) {
        toast({ title: 'Error removing class teacher', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allClassTeachers: rows,
    stats,
    isLoading,
    search, setSearch,
    saveClassTeacher,
    deleteClassTeacher,
  }
}

// ─── useClassTimetable ──────────────────────────────────────────────────────────
// Manages class timetable entries and CRUD operations.
export function useClassTimetable() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.classTimetable(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.class_name || '').toLowerCase().includes(q) || (r.subject_name || '').toLowerCase().includes(q) || (r.teacher_name || '').toLowerCase().includes(q)
        return matchSearch
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
    }),
    [rows],
  )

  const saveTimetable = useCallback(
    async (payload, id) => {
      const data = {
        class_id: payload.class_id,
        section_id: payload.section_id,
        subject_id: payload.subject_id,
        teacher_id: payload.teacher_id,
        day: payload.day,
        period: payload.period,
        start_time: payload.start_time,
        end_time: payload.end_time,
      }
      if (id) {
        await academicsService.updateClassTimetable(id, data)
        toast({ title: 'Timetable updated', description: payload.day })
      } else {
        await academicsService.createClassTimetable(data)
        toast({ title: 'Timetable entry added', description: payload.day })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteTimetable = useCallback(
    async (id) => {
      try {
        await academicsService.deleteClassTimetable(id)
        toast({ title: 'Timetable entry deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting timetable entry', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveTimetable,
    deleteTimetable,
  }
}

// ─── useTeacherTimetable ────────────────────────────────────────────────────────
// Manages teacher timetable for a given teacher ID (read-only).
export function useTeacherTimetable(teacherId) {
  const { data, isLoading } = useAsyncData(
    () => academicsService.teacherTimetable(teacherId),
    [teacherId],
  )

  const rows = data || []

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  return {
    rows,
    stats,
    isLoading,
  }
}

// ─── usePromotions ────────────────────────────────────────────────────────
// Manages student promotions list, filtering, and CRUD operations.
export function usePromotions() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => academicsService.promotedStudents(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.from_class || '').toLowerCase().includes(q) || (r.to_class || '').toLowerCase().includes(q) || (r.session || '').toLowerCase().includes(q)
        return matchSearch
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
    }),
    [rows],
  )

  const savePromotion = useCallback(
    async (payload, id) => {
      const data = {
        student_id: payload.student_id,
        from_class: payload.from_class,
        to_class: payload.to_class,
        session: payload.session,
      }
      if (id) {
        await academicsService.updatePromotion(id, data)
        toast({ title: 'Promotion updated', description: payload.student_id })
      } else {
        await academicsService.promoteStudents(data)
        toast({ title: 'Student promoted', description: payload.student_id })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deletePromotion = useCallback(
    async (id) => {
      try {
        await academicsService.deletePromotion(id)
        toast({ title: 'Promotion deleted' })
        refetch()
      } catch (error) {
        toast({ title: 'Error deleting promotion', description: error.message, variant: 'destructive' })
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    savePromotion,
    deletePromotion,
  }
}
