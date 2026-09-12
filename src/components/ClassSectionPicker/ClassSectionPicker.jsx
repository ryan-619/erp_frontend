// ====================================================================
// Reusable Component — ClassSectionPicker
//
// A shared "pick a class (and optionally a section)" control. Used to drive
// any bulk-by-class view (attendance roster, bulk student lists, fee lists…).
// Loads classes and sections once and emits { class_name, section } via
// onChange. Sections are filtered to the chosen class.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { academicsService } from '@/services/academics.service'
import { Loader as Loader2 } from 'lucide-react'

export function ClassSectionPicker({
  value = {},
  onChange,
  showSection = true,
  className = '',
}) {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([academicsService.classes(1, 500), academicsService.sections({ limit: 500 })])
      .then(([cls, sec]) => {
        if (!active) return
        setClasses(Array.isArray(cls) ? cls : cls?.data || [])
        setSections(Array.isArray(sec) ? sec : sec?.data || [])
      })
      .catch(() => { if (active) { setClasses([]); setSections([]) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // The class the user picked (to filter its sections).
  const selectedClass = useMemo(
    () => classes.find((c) => c.class_name === value.class_name),
    [classes, value.class_name],
  )
  const classSections = useMemo(
    () => sections.filter((s) => !selectedClass || String(s.class_id) === String(selectedClass._id)),
    [sections, selectedClass],
  )

  const emit = (next) => onChange?.({ class_name: value.class_name, section: value.section, ...next })

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <div className="min-w-[180px]">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Class</label>
        <Select
          value={value.class_name || ''}
          onValueChange={(v) => emit({ class_name: v, section: '' })}
        >
          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
          <SelectContent>
            {classes.length === 0 ? (
              <SelectItem value="__none" disabled>No classes found</SelectItem>
            ) : (
              classes.map((c) => (
                <SelectItem key={c._id} value={c.class_name}>{c.class_name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {showSection && (
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Section (optional)</label>
          <Select
            value={value.section || 'all'}
            onValueChange={(v) => emit({ section: v === 'all' ? '' : v })}
            disabled={!value.class_name}
          >
            <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {classSections.map((s) => (
                <SelectItem key={s._id} value={s.section_name}>{s.section_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

export default ClassSectionPicker
