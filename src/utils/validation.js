// ====================================================================
// Global Form Validation Utilities
// Use across Student, Academics, Attendance, Fees, HR, etc.
// ====================================================================

export const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  String(value).trim() === ''

export const validateRequired = (form, fields) => {
  for (const field of fields) {
    if (isEmpty(form[field])) {
      return `${field.replace(/_/g, ' ')} is required`
    }
  }
  return null
}

export const validateEmail = (email) => {
  if (!email) return null
  return /^\S+@\S+\.\S+$/.test(email)
    ? null
    : 'Please enter a valid email address'
}

export const validatePhone = (phone) => {
  if (!phone) return null
  return /^[0-9]{10}$/.test(phone)
    ? null
    : 'Phone number must contain exactly 10 digits'
}

export const validateAmount = (amount) => {
  return Number(amount) >= 0
    ? null
    : 'Amount cannot be negative'
}

export const validatePercentage = (value) => {
  const n = Number(value)
  return n >= 0 && n <= 100
    ? null
    : 'Percentage must be between 0 and 100'
}

export const validateDateNotFuture = (date) => {
  if (!date) return null

  const selected = new Date(date)
  const today = new Date()

  today.setHours(23,59,59,999)

  return selected <= today
    ? null
    : 'Future date is not allowed'
}