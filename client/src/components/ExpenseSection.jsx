import ExpenseFilter from './ExpenseFilter'
import ExpenseList from './ExpenseList'

function ExpenseSection({ expenses, category, onCategoryChange, onEdit, onDelete, editingId, disabled, deletingId }) {
  return (
    <section className="expense-panel expense-section" aria-labelledby="expense-list-heading">
      <div className="expense-section__heading">
        <div className="panel-heading">
          <h2 id="expense-list-heading">Recent Expenses</h2>
          <p aria-live="polite">{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            {category === 'all' ? ' in your overview' : ` in ${category}`}</p>
        </div>
        <ExpenseFilter category={category} onCategoryChange={onCategoryChange} />
      </div>
      <ExpenseList expenses={expenses} onEdit={onEdit} onDelete={onDelete} editingId={editingId}
        disabled={disabled} deletingId={deletingId}
        isFiltered={category !== 'all'} onClearFilter={() => onCategoryChange('all')} />
    </section>
  )
}

export default ExpenseSection
