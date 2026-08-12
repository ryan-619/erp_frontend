// useCertificate
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps certificateService calls and provides memoized
// filtering, statistics, and CRUD handlers so pages stay UI-only.
//
// Backend model field names (do NOT invent fields):
//   studentCertificateSchema: { certificate_name, template, header, body_text }
//   generateCertificateSchema: { student_id (ObjectId), certificate_id (ObjectId), generated_date (Date), issued_by (String) }
//   studentIdCardDesignSchema: { template_config (Mixed/Object), layout (String), fields_to_show ([String]) }
//   generateIdCardSchema: { student_id (ObjectId), design_id (ObjectId), generated_date (Date) }
//   staffIdCardDesignSchema: { template_config (Mixed/Object), layout (String), fields_to_show ([String]) }
//   generateStaffIdCardSchema: { staff_id (ObjectId), design_id (ObjectId), generated_date (Date) }
// All models have mongoose timestamps: createdAt, updatedAt, _id.
// There is NO status, student_name, admission_no, certificate_type,
// card_name, staff_name, staff_id (as string), class_name field on these models.

import { useMemo, useState, useCallback } from 'react'
import { certificateService } from '@/services/certificate.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useCertificateStats ────────────────────────────────────────────────────────
// Provides dashboard-level stats for the Certificate module.
// Derives counts from all 6 lists fetched in parallel (no getStats endpoint).
export function useCertificateStats() {
  const { data: studentCerts } = useAsyncData(() => certificateService.getStudentCertificates(), [])
  const { data: genCerts } = useAsyncData(() => certificateService.getGeneratedCertificates(), [])
  const { data: studentIdCards } = useAsyncData(() => certificateService.getStudentIdCards(), [])
  const { data: genStudentIdCards } = useAsyncData(() => certificateService.getGeneratedStudentIdCards(), [])
  const { data: staffIdCards } = useAsyncData(() => certificateService.getStaffIdCards(), [])
  const { data: genStaffIdCards } = useAsyncData(() => certificateService.getGeneratedStaffIdCards(), [])

  const isLoading = !studentCerts && !genCerts // simplified

  const stats = useMemo(() => ({
    total_student_certificates: studentCerts?.length || 0,
    total_generated_certificates: genCerts?.length || 0,
    total_student_id_cards: studentIdCards?.length || 0,
    total_generated_student_id_cards: genStudentIdCards?.length || 0,
    total_staff_id_cards: staffIdCards?.length || 0,
    total_generated_staff_id_cards: genStaffIdCards?.length || 0,
  }), [studentCerts, genCerts, studentIdCards, genStudentIdCards, staffIdCards, genStaffIdCards])

  return { stats, isLoading }
}

// ─── useStudentCertificates ──────────────────────────────────────────────────────
// Manages student certificate list state, filtering, stats, and CRUD.
// Fields: certificate_name, template, header, body_text
export function useStudentCertificates() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getStudentCertificates(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered certificates
  // unless certificate list or search changes.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.certificate_name || '').toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveStudentCertificate = useCallback(async (payload, id) => {
    if (id) {
      await certificateService.updateStudentCertificate(id, payload)
      toast({ title: 'Certificate updated', description: payload.certificate_name })
    } else {
      await certificateService.createStudentCertificate(payload)
      toast({ title: 'Certificate added', description: payload.certificate_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteStudentCertificate = useCallback(async (id) => {
    await certificateService.deleteStudentCertificate(id)
    toast({ title: 'Certificate deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveStudentCertificate,
    deleteStudentCertificate,
  }
}

// ─── useGeneratedCertificates ────────────────────────────────────────────────────
// Manages generated certificate list state, filtering, create, and delete.
// Fields: student_id (ObjectId), certificate_id (ObjectId), generated_date (Date), issued_by (String)
export function useGeneratedCertificates() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getGeneratedCertificates(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered generated certificates
  // unless list or search changes. Filters by issued_by and generated_date.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.issued_by || '').toLowerCase().includes(q) ||
      (c.generated_date || '').toString().toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const createGeneratedCertificate = useCallback(async (payload) => {
    await certificateService.createGeneratedCertificate(payload)
    toast({ title: 'Certificate generated', description: payload.issued_by })
    refetch()
  }, [refetch, toast])

  const deleteGeneratedCertificate = useCallback(async (id) => {
    await certificateService.deleteGeneratedCertificate(id)
    toast({ title: 'Generated certificate deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    createGeneratedCertificate,
    deleteGeneratedCertificate,
  }
}

// ─── useStudentIdCards ────────────────────────────────────────────────────────────
// Manages student ID card list state, filtering, stats, and CRUD.
// Fields: template_config (Mixed/Object), layout (String), fields_to_show ([String])
export function useStudentIdCards() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getStudentIdCards(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered ID cards
  // unless card list or search changes. Filters by layout.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.layout || '').toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveStudentIdCard = useCallback(async (payload, id) => {
    if (id) {
      await certificateService.updateStudentIdCard(id, payload)
      toast({ title: 'ID card updated', description: payload.layout })
    } else {
      await certificateService.createStudentIdCard(payload)
      toast({ title: 'ID card added', description: payload.layout })
    }
    refetch()
  }, [refetch, toast])

  const deleteStudentIdCard = useCallback(async (id) => {
    await certificateService.deleteStudentIdCard(id)
    toast({ title: 'ID card deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveStudentIdCard,
    deleteStudentIdCard,
  }
}

// ─── useGeneratedStudentIdCards ──────────────────────────────────────────────────
// Manages generated student ID card list state, filtering, create, and delete.
// Fields: student_id (ObjectId), design_id (ObjectId), generated_date (Date)
export function useGeneratedStudentIdCards() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getGeneratedStudentIdCards(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered generated ID cards
  // unless list or search changes. Filters by generated_date.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.generated_date || '').toString().toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const createGeneratedStudentIdCard = useCallback(async (payload) => {
    await certificateService.createGeneratedStudentIdCard(payload)
    toast({ title: 'Student ID card generated' })
    refetch()
  }, [refetch, toast])

  const deleteGeneratedStudentIdCard = useCallback(async (id) => {
    await certificateService.deleteGeneratedStudentIdCard(id)
    toast({ title: 'Generated student ID card deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    createGeneratedStudentIdCard,
    deleteGeneratedStudentIdCard,
  }
}

// ─── useStaffIdCards ──────────────────────────────────────────────────────────────
// Manages staff ID card list state, filtering, stats, and CRUD.
// Fields: template_config (Mixed/Object), layout (String), fields_to_show ([String])
export function useStaffIdCards() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getStaffIdCards(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered staff ID cards
  // unless card list or search changes. Filters by layout.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.layout || '').toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveStaffIdCard = useCallback(async (payload, id) => {
    if (id) {
      await certificateService.updateStaffIdCard(id, payload)
      toast({ title: 'Staff ID card updated', description: payload.layout })
    } else {
      await certificateService.createStaffIdCard(payload)
      toast({ title: 'Staff ID card added', description: payload.layout })
    }
    refetch()
  }, [refetch, toast])

  const deleteStaffIdCard = useCallback(async (id) => {
    await certificateService.deleteStaffIdCard(id)
    toast({ title: 'Staff ID card deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveStaffIdCard,
    deleteStaffIdCard,
  }
}

// ─── useGeneratedStaffIdCards ────────────────────────────────────────────────────
// Manages generated staff ID card list state, filtering, create, and delete.
// Fields: staff_id (ObjectId), design_id (ObjectId), generated_date (Date)
export function useGeneratedStaffIdCards() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => certificateService.getGeneratedStaffIdCards(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered generated staff ID cards
  // unless list or search changes. Filters by generated_date.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.generated_date || '').toString().toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const createGeneratedStaffIdCard = useCallback(async (payload) => {
    await certificateService.createGeneratedStaffIdCard(payload)
    toast({ title: 'Staff ID card generated' })
    refetch()
  }, [refetch, toast])

  const deleteGeneratedStaffIdCard = useCallback(async (id) => {
    await certificateService.deleteGeneratedStaffIdCard(id)
    toast({ title: 'Generated staff ID card deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    createGeneratedStaffIdCard,
    deleteGeneratedStaffIdCard,
  }
}
