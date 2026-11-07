import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Summary from './components/Summary'
import ExpenseForm from './components/ExpenseForm'
import ExpenseSection from './components/ExpenseSection'
import { createExpense, deleteExpense, getExpenses, updateExpense } from './services/expenseApi'
import { normalizeExpense } from './utils/expenses'
import './App.css'
import './components/Expenses.css'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem('expense-tracker-theme') === 'dark'
    } catch {
      return false
    }
  })
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [editingExpense, setEditingExpense] = useState(null)
  const [notice, setNotice] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  // Lock immediately, before React renders the disabled controls.
  const requestPending = useRef(false)

  useEffect(() => {
    try {
      window.localStorage.setItem('expense-tracker-theme', darkMode ? 'dark' : 'light')
    } catch {
      // The toggle still works if browser storage is unavailable.
    }
  }, [darkMode])

  useEffect(() => {
    let ignore = false

    async function loadExpenses() {
      try {
        const records = await getExpenses()
        if (!Array.isArray(records)) throw new Error('Invalid expenses response')
        const expensesFromDatabase = records.map(normalizeExpense)
        if (!ignore) setExpenses(expensesFromDatabase)
      } catch {
        if (!ignore) setError('Unable to load your expenses. Please check the server and refresh to try again.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadExpenses()
    // Ignore stale responses after unmount, including StrictMode's development cleanup.
    return () => { ignore = true }
  }, [])

  // Sum whole paise to avoid floating-point rounding in the displayed total.
  const totalSpending = expenses.reduce((total, expense) => total + Math.round(expense.amount * 100), 0) / 100
  const visibleExpenses = expenses
    .filter(expense => category === 'all' || expense.category === category)
    .toSorted((a, b) => b.expense_date.localeCompare(a.expense_date))

  async function saveExpense(details) {
    if (requestPending.current) return false
    requestPending.current = true
    setPendingAction({ type: 'save' })
    setError('')
    setNotice('')

    try {
      if (editingExpense) {
        const savedExpense = normalizeExpense(await updateExpense(editingExpense.id, details))
        setExpenses(current => current.map(expense => expense.id === savedExpense.id ? savedExpense : expense))
        setEditingExpense(null)
        setNotice('Expense updated.')
      } else {
        const savedExpense = normalizeExpense(await createExpense(details))
        setExpenses(current => [savedExpense, ...current])
        setNotice('Expense added.')
      }
      // Show the saved expense even if a different category was selected.
      setCategory('all')
      return true
    } catch (error) {
      setError(`Unable to save expense. ${error.message || 'Check your connection and try again.'}`)
      return false
    } finally {
      requestPending.current = false
      setPendingAction(null)
    }
  }

  async function handleDeleteExpense(id) {
    if (requestPending.current) return
    requestPending.current = true
    setPendingAction({ type: 'delete', id })
    setError('')
    setNotice('')

    try {
      await deleteExpense(id)
      setExpenses(current => current.filter(expense => expense.id !== id))
      if (editingExpense?.id === id) setEditingExpense(null)
      setNotice('Expense deleted.')
    } catch (error) {
      setError(`Unable to delete expense. ${error.message || 'Check your connection and try again.'}`)
    } finally {
      requestPending.current = false
      setPendingAction(null)
    }
  }

  function editExpense(expense) {
    if (requestPending.current) return
    setEditingExpense(expense)
    setNotice(`Editing ${expense.title}.`)
    document.getElementById('expense-form-heading')?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="app" data-theme={darkMode ? 'dark' : 'light'}>
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(current => !current)} />
      <main>
        <Summary totalSpending={totalSpending} transactionCount={expenses.length} />
        <div className="dashboard-workspace">
          <div className="dashboard-notice" role={error ? 'alert' : 'status'}>
            {loading ? 'Loading expenses...' : pendingAction
              ? (pendingAction.type === 'save' ? 'Saving expense...' : 'Deleting expense...')
              : error || notice || 'Your everyday spending, all in one place.'}
          </div>
          {!loading && <div className="expense-layout">
            {/* A new key resets the form when switching between add/edit records. */}
            <ExpenseForm key={editingExpense?.id ?? 'new'} expense={editingExpense}
              disabled={Boolean(pendingAction)} isSaving={pendingAction?.type === 'save'}
              onSave={saveExpense} onCancel={() => { setEditingExpense(null); setNotice('Editing cancelled.') }} />
            <ExpenseSection expenses={visibleExpenses} category={category} onCategoryChange={setCategory}
              onEdit={editExpense} onDelete={handleDeleteExpense} editingId={editingExpense?.id}
              disabled={Boolean(pendingAction)} deletingId={pendingAction?.type === 'delete' ? pendingAction.id : null} />
          </div>}
          <p className="dashboard-local-note">Expenses are saved to your database after each successful add, edit, or delete.</p>
        </div>
      </main>
    </div>
  )
}

export default App
