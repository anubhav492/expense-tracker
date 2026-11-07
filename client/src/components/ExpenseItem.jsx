import { Clapperboard, MoreHorizontal, Pencil, ShoppingBag, Trash2, Utensils, Car } from 'lucide-react'
import { formatCurrency, formatExpenseDate } from '../utils/expenses'

const categoryStyles = {
  Food: { icon: Utensils, className: 'food' },
  Transport: { icon: Car, className: 'transport' },
  Shopping: { icon: ShoppingBag, className: 'shopping' },
  Entertainment: { icon: Clapperboard, className: 'entertainment' },
  Other: { icon: MoreHorizontal, className: 'other' },
}

function ExpenseItem({ expense, onEdit, onDelete, isEditing, disabled = false, isDeleting = false }) {
  const { icon: Icon, className } = categoryStyles[expense.category] || categoryStyles.Other

  return (
    <li className={`expense-item${isEditing ? ' expense-item--editing' : ''}`}>
      <span className={`expense-category-icon expense-category-icon--${className}`}>
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div className="expense-item__details">
        <h3>{expense.title}</h3>
        <div className="expense-item__metadata">
          <span>{expense.category}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={expense.expense_date}>{formatExpenseDate(expense.expense_date)}</time>
        </div>
      </div>
      <span className="expense-item__amount">{formatCurrency(expense.amount)}</span>
      <div className="expense-item__actions">
        <button className="icon-button" type="button" aria-label={`Edit ${expense.title}`}
          title="Edit expense" onClick={() => onEdit(expense)} disabled={isEditing || disabled}>
          <Pencil size={16} aria-hidden="true" />
        </button>
        <button className="icon-button icon-button--delete" type="button"
          aria-label={`${isDeleting ? 'Deleting' : 'Delete'} ${expense.title}`} aria-busy={isDeleting}
          title={isDeleting ? 'Deleting expense...' : 'Delete expense'} onClick={() => onDelete(expense.id)} disabled={disabled}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default ExpenseItem
