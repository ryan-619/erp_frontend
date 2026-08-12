// Static option constants for the Fees module.
// These are UI-only filter/form options, not mock data.

export const FEE_FREQUENCIES = ['One Time', 'Monthly', 'Quarterly', 'Half-Yearly', 'Annually']

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "bank", label: "Bank Transfer" },
]

export const PAYMENT_STATUSES = ['Paid', 'Partial', 'Pending', 'Overdue', 'Rejected']
export const BANK_PAYMENT_STATUSES = ['Pending', 'Approved', 'Rejected']
export const DISCOUNT_TYPES = ['Percentage', 'Fixed']
export const FEE_SESSIONS = ['2024-2025', '2025-2026', '2023-2024']
export const classOptions = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Year 1', 'Year 2', 'Year 3', 'All']
export const sectionOptions = ['A', 'B', 'C']
