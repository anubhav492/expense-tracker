export const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Other']

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function todayDate() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export function normalizeExpenseDate(value) {
  // A date-only value already fits date inputs. For ISO timestamps, recover the
  // local calendar day: pg can serialize local midnight as the previous UTC day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid expense date')
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function normalizeExpense(expense) {
  const amount = Number(expense.amount)
  if (!Number.isFinite(amount)) throw new Error('Invalid expense amount')
  return { ...expense, amount, expense_date: normalizeExpenseDate(expense.expense_date) }
}

export function formatExpenseDate(date) {
  // Parse as a local date so timezone differences never shift the expense day.
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
