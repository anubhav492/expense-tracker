import { ReceiptText } from 'lucide-react'
import ExpenseItem from './ExpenseItem'

function ExpenseList({ expenses, onEdit, onDelete, editingId, isFiltered, onClearFilter, disabled, deletingId }) {
  if (!expenses.length) {
    return (
      <div className="expense-empty">
        <span className="expense-empty__icon"><ReceiptText size={28} strokeWidth={1.5} aria-hidden="true" /></span>
        <h3>{isFiltered ? 'No expenses in this category' : 'A fresh start for your finances'}</h3>
        <p>{isFiltered ? 'Try another category to explore your spending.' : 'Add your first expense to start building a clearer picture of your money.'}</p>
        {isFiltered && <button className="secondary-button" type="button" onClick={onClearFilter}>Show all expenses</button>}
      </div>
    )
  }

  return (
    <ul className="expense-list">
      {expenses.map(expense => <ExpenseItem key={expense.id} expense={expense}
        onEdit={onEdit} onDelete={onDelete} isEditing={editingId === expense.id}
        disabled={disabled} isDeleting={deletingId === expense.id} />)}
    </ul>
  )
}

export default ExpenseList
