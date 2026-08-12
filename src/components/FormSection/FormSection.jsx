// ====================================================================
// Reusable Component — FormSection
//
// Used by: All form pages.
// Purpose: Groups related form fields under an optional title/description.
//          Renders a responsive CSS grid (1–3 columns) so forms look
//          correct on both mobile and desktop without manual grid markup
//          in every form.
// ====================================================================

import { cn } from '@/lib/utils'

export function FormSection({ title, description, children, className, columns = 2 }) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-0.5">
          {title ? <h3 className="text-sm font-semibold text-foreground">{title}</h3> : null}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      )}
      <div
        className={cn(
          'grid gap-4',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-1 sm:grid-cols-2',
          columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {children}
      </div>
    </section>
  )
}

export default FormSection
