import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { categories, todayDate } from '../utils/expenses'

function emptyForm() {
  return { title: '', amount: '', category: '', expense_date: todayDate() }
}

function ExpenseForm({ expense, onSave, onCancel, disabled = false, isSaving = false }) {
  const [form, setForm] = useState(() => expense ? {
    title: expense.title,
    amount: String(expense.amount),
    category: expense.category,
    expense_date: expense.expense_date,
  } : emptyForm())
  const [errors, setErrors] = useState({})
  const isEditing = Boolean(expense)

  function handleChange(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (disabled) return
    const nextErrors = {}
    const amount = Number(form.amount)
    if (!form.title.trim()) nextErrors.title = 'Please enter an expense title.'
    if (form.title.trim().length > 100) nextErrors.title = 'Keep the title to 100 characters or fewer.'
    if (!/^\d+(\.\d{1,2})?$/.test(form.amount) || !Number.isFinite(amount) || amount <= 0 || amount > 99999999.99) {
      nextErrors.amount = 'Enter a positive amount up to 9,99,99,999.99, with at most 2 decimal places.'
    }
    if (!categories.includes(form.category)) nextErrors.category = 'Please choose a category.'
    const date = new Date(`${form.expense_date}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expense_date) || form.expense_date.startsWith('0000') ||
        !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== form.expense_date) {
      nextErrors.expense_date = 'Please choose a valid date.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    const saved = await onSave({ ...form, title: form.title.trim(), amount: Math.round(amount * 100) / 100 })
    // Failed requests leave all inputs intact; successful edits close via App.
    if (saved && !isEditing) setForm(emptyForm())
  }

  return (
    <section className="expense-panel expense-form-panel" aria-labelledby="expense-form-heading">
      <div className="panel-heading">
        <span className="panel-eyebrow">{isEditing ? 'MAKE AN ADJUSTMENT' : 'KEEP TRACK, STAY AHEAD'}</span>
        <h2 id="expense-form-heading">{isEditing ? 'Edit expense' : 'Add an expense'}</h2>
        <p>{isEditing ? 'Update the details of your expense below.' : 'Small details. A clearer financial picture.'}</p>
      </div>
      <form className="expense-form" onSubmit={handleSubmit} noValidate aria-busy={isSaving}>
        <div className="form-field">
          <label htmlFor="expense-title">Title</label>
          <input id="expense-title" name="title" placeholder="e.g. Weekly groceries" value={form.title}
            onChange={handleChange} maxLength={100} required disabled={disabled} aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined} />
          {errors.title && <p className="field-error" id="title-error">{errors.title}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="expense-amount">Amount <span>(INR)</span></label>
          <div className="amount-input">
            <span aria-hidden="true">₹</span>
            <input id="expense-amount" name="amount" type="number" inputMode="decimal" min="0.01" max="99999999.99"
              step="0.01" placeholder="0.00" value={form.amount} onChange={handleChange} required disabled={disabled}
              aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : undefined} />
          </div>
          {errors.amount && <p className="field-error" id="amount-error">{errors.amount}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="expense-category">Category</label>
          <select id="expense-category" name="category" value={form.category} onChange={handleChange} required disabled={disabled}
            aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined}>
            <option value="" disabled>Select a category</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          {errors.category && <p className="field-error" id="category-error">{errors.category}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="expense-date">Date</label>
          <input id="expense-date" name="expense_date" type="date" min="0001-01-01" max="9999-12-31"
            value={form.expense_date} onChange={handleChange} required disabled={disabled} aria-invalid={Boolean(errors.expense_date)}
            aria-describedby={errors.expense_date ? 'date-error' : undefined} />
          {errors.expense_date && <p className="field-error" id="date-error">{errors.expense_date}</p>}
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={disabled}>
            {isEditing ? <Check size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
            {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Add Expense'}
          </button>
          {isEditing && <button className="secondary-button" type="button" onClick={onCancel} disabled={disabled}>
            <X size={16} aria-hidden="true" /> Cancel
          </button>}
        </div>
      </form>
    </section>
  )
}

export default ExpenseForm
