// ====================================================================
// Reusable Component — Drawer
//
// Used by: All modules with create/edit forms (Students, Staff, Fees,
//          Library, Hostel, Transport, Front Office, etc.).
// Purpose: Slide-out panel (right-side Sheet) for create/edit forms.
//          Wraps Radix Sheet with a consistent header, scrollable body,
//          and footer slot for action buttons.
// ====================================================================

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 'sm:max-w-lg',
  loading = false,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn('flex flex-col gap-0 p-0', width)}
      >
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle className="text-lg">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            children
          )}
        </div>
        {footer ? (
          <SheetFooter className="border-t px-6 py-4 sm:justify-end">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function DrawerFooter({ onCancel, onSubmit, cancelLabel = 'Cancel', submitLabel = 'Save', submitDisabled, formId }) {
  return (
    <>
      <Button variant="outline" onClick={onCancel} type="button">
        {cancelLabel}
      </Button>
      <Button onClick={onSubmit} disabled={submitDisabled} type="submit" form={formId}>
        {submitLabel}
      </Button>
    </>
  )
}

export default Drawer
