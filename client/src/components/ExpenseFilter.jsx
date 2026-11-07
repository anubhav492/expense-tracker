import { ListFilter } from 'lucide-react'
import { categories } from '../utils/expenses'

function ExpenseFilter({ category, onCategoryChange }) {
  return (
    <div className="expense-filter">
      <ListFilter size={16} aria-hidden="true" />
      <label className="sr-only" htmlFor="category-filter">Filter expenses by category</label>
      <select id="category-filter" value={category} onChange={event => onCategoryChange(event.target.value)}>
        <option value="all">All Categories</option>
        {categories.map(item => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  )
}

export default ExpenseFilter
