// ====================================================================
// Reusable Component — DeleteDialog
//
// Used by: All modules with delete.
// Purpose: Delete confirmation dialog. Thin wrapper around ConfirmDialog
//          with destructive styling, a Trash2 icon, and optional
//          `entityName` interpolation in the description so users see
//          exactly what they're about to delete.
// ====================================================================

import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function DeleteDialog({
  open,
  onOpenChange,
  title = 'Delete this record?',
  description = 'This action is permanent and cannot be undone. The record and its related data will be removed.',
  confirmLabel = 'Delete',
  onConfirm,
  loading = false,
  entityName,
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={
        entityName
          ? `You are about to delete "${entityName}". ${description}`
          : description
      }
      confirmLabel={loading ? 'Deleting…' : confirmLabel}
      variant="destructive"
      icon={Trash2}
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}

export default DeleteDialog
