// ====================================================================
// Reusable Component — ExportButtons
//
// Used by: All table pages.
// Purpose: CSV export button that delegates to exportToCsv(). Exports
//          selected rows when present, otherwise all rows. Disabled when
//          there's no data to export.
// ====================================================================

import { Download, File as FileJson, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { exportToCsv } from '@/utils/export'

export function ExportButtons({
  rows = [],
  columns = [],
  filename = 'export',
  className,
  selectedRows,
}) {
  const data = selectedRows && selectedRows.length ? selectedRows : rows

  const handleCsv = () => {
    exportToCsv(data, columns, filename)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="sm" onClick={handleCsv} disabled={!data.length}>
        <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
      </Button>
    </div>
  )
}

export default ExportButtons
