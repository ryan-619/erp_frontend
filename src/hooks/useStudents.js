import { useCallback, useMemo, useState } from 'react'
import { studentService } from '@/services/student.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { fullName } from '@/utils/format'

const listValue = (data) => (Array.isArray(data) ? data : data?.data || [])
const displayName = (student) => fullName(student?.name || {
  first: student?.first_name,
  last: student?.last_name,
}) || 'Unnamed student'

export function useStudents() {
  const { toast } = useToast()
  const { data, isLoading, error, refetch } = useAsyncData(
    () => studentService.list({ page: 1, limit: 100 }),
    [],
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  const allStudents = listValue(data)
  const classOptions = useMemo(() => [
    { value: 'all', label: 'All classes' },
    ...Array.from(new Set(allStudents.map((student) => student.class_name).filter(Boolean)))
      .map((item) => ({ value: item, label: item })),
  ], [allStudents])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allStudents.filter((student) => {
      const matchesSearch = !query || [
        displayName(student),
        student.email,
        student.mobile,
        student.roll_number,
        student.class_name,
        student.guardian?.name,
      ].some((field) => String(field || '').toLowerCase().includes(query))
      const matchesStatus = status === 'all' || student.status === status
      const matchesClass = classFilter === 'all' || student.class_name === classFilter
      return matchesSearch && matchesStatus && matchesClass
    })
  }, [allStudents, classFilter, search, status])

  const stats = useMemo(() => ({
    total: allStudents.length,
    active: allStudents.filter((student) => student.status === 'active').length,
    inactive: allStudents.filter((student) => student.status === 'inactive').length,
    disabled: allStudents.filter((student) => student.status === 'disabled').length,
  }), [allStudents])

  const saveStudent = useCallback(async (payload, id) => {
    if (id) {
      await studentService.update(id, payload)
      toast({ title: 'Student updated', description: `${displayName(payload)} was updated.` })
    } else {
      await studentService.create(payload)
      toast({ title: 'Student created', description: `${displayName(payload)} was enrolled.` })
    }
    await refetch()
  }, [refetch, toast])

  const deleteStudent = useCallback(async (id, student) => {
    await studentService.remove(id)
    toast({ title: 'Student deleted', description: `${displayName(student)} was removed.` })
    await refetch()
  }, [refetch, toast])

  const bulkDelete = useCallback(async (selected) => {
    await studentService.bulkDelete(selected.map((student) => student._id))
    toast({ title: 'Students deleted', description: `${selected.length} student record(s) were removed.` })
    await refetch()
  }, [refetch, toast])

  return {
    rows,
    allStudents,
    classOptions,
    stats,
    isLoading,
    error,
    search, setSearch,
    status, setStatus,
    classFilter, setClassFilter,
    saveStudent,
    deleteStudent,
    bulkDelete,
    refetch,
  }
}

export function useAdmissions() {
  const { toast } = useToast()
  const { data, isLoading, error, refetch } = useAsyncData(
    () => studentService.admissions({ page: 1, limit: 100 }),
    [],
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const allAdmissions = listValue(data)
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allAdmissions.filter((admission) => {
      const name = fullName(admission.name)
      return (!query || [name, admission.email, admission.mobile, admission.class_name, admission.guardian?.name]
        .some((field) => String(field || '').toLowerCase().includes(query))) &&
        (status === 'all' || admission.status === status)
    })
  }, [allAdmissions, search, status])
  const stats = useMemo(() => ({
    total: allAdmissions.length,
    pending: allAdmissions.filter((item) => item.status === 'pending').length,
    approved: allAdmissions.filter((item) => item.status === 'approved').length,
    rejected: allAdmissions.filter((item) => item.status === 'rejected').length,
  }), [allAdmissions])

  const saveAdmission = useCallback(async (payload, id) => {
    if (id) await studentService.updateAdmission(id, payload)
    else await studentService.createAdmission(payload)
    toast({ title: id ? 'Admission updated' : 'Admission submitted' })
    await refetch()
  }, [refetch, toast])

  const deleteAdmission = useCallback(async (id) => {
    await studentService.deleteAdmission(id)
    toast({ title: 'Admission deleted' })
    await refetch()
  }, [refetch, toast])

  return {
    rows, allAdmissions, stats, isLoading, error,
    search, setSearch, status, setStatus,
    saveAdmission, deleteAdmission, refetch,
  }
}

export function useStudentCategories() {
  const result = useAsyncData(() => studentService.categories({ page: 1, limit: 100 }), [])
  return { ...result, rows: listValue(result.data), allCategories: listValue(result.data) }
}

export function useStudentHouses() {
  const result = useAsyncData(() => studentService.houses({ page: 1, limit: 100 }), [])
  return { ...result, rows: listValue(result.data), allHouses: listValue(result.data) }
}

export function useDisableReasons() {
  const { toast } = useToast()
  const result = useAsyncData(() => studentService.disableReasons({ page: 1, limit: 100 }), [])
  const [search, setSearch] = useState('')
  const allReasons = listValue(result.data)
  const rows = allReasons.filter((item) => !search.trim() || String(item.reason || '').toLowerCase().includes(search.trim().toLowerCase()))
  const saveReason = useCallback(async (payload, id) => {
    if (id) await studentService.updateDisableReason(id, payload)
    else await studentService.createDisableReason(payload)
    toast({ title: id ? 'Disable reason updated' : 'Disable reason created' })
    await result.refetch()
  }, [result.refetch, toast])
  const deleteReason = useCallback(async (id) => {
    await studentService.deleteDisableReason(id)
    toast({ title: 'Disable reason deleted' })
    await result.refetch()
  }, [result.refetch, toast])
  return { ...result, rows, allReasons, search, setSearch, saveReason, deleteReason }
}

export function useMultiClassStudents() {
  const { toast } = useToast()
  const result = useAsyncData(() => studentService.multiClassStudents({ page: 1, limit: 100 }), [])
  const allAssignments = listValue(result.data)
  const [search, setSearch] = useState('')
  const rows = allAssignments.filter((item) => !search.trim() || [item.student_id, item.class_id]
    .some((field) => String(field || '').toLowerCase().includes(search.trim().toLowerCase())))
  const saveAssignment = useCallback(async (payload, id) => {
    if (id) await studentService.updateMultiClassStudent(id, payload)
    else await studentService.createMultiClassStudent(payload)
    toast({ title: id ? 'Assignment updated' : 'Assignment created' })
    await result.refetch()
  }, [result.refetch, toast])
  const removeAssignment = useCallback(async (id) => {
    await studentService.deleteMultiClassStudent(id)
    toast({ title: 'Assignment deleted' })
    await result.refetch()
  }, [result.refetch, toast])
  return { ...result, rows, allAssignments, search, setSearch, saveAssignment, removeAssignment }
}

export function useBulkDelete() {
  const { toast } = useToast()
  const result = useAsyncData(() => studentService.list({ page: 1, limit: 100 }), [])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const allStudents = listValue(result.data)
  const rows = allStudents.filter((student) => !search.trim() || [displayName(student), student.roll_number, student.email]
    .some((field) => String(field || '').toLowerCase().includes(search.trim().toLowerCase())))
  const toggleSelection = useCallback((student) => setSelected((current) => current.some((item) => item._id === student._id)
    ? current.filter((item) => item._id !== student._id)
    : [...current, student]), [])
  const selectAll = useCallback(() => setSelected(rows), [rows])
  const clearSelection = useCallback(() => setSelected([]), [])
  const deleteSelected = useCallback(async () => {
    if (!selected.length) return
    await studentService.bulkDelete(selected.map((student) => student._id))
    toast({ title: 'Students deleted', description: `${selected.length} record(s) were removed.` })
    setSelected([])
    await result.refetch()
  }, [result.refetch, selected, toast])
  return {
    ...result,
    rows,
    allStudents,
    search, setSearch,
    selected,
    toggleSelection, selectAll, clearSelection, deleteSelected,
  }
}

