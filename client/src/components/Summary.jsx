import { Receipt, Wallet } from 'lucide-react'
import SummaryCard from './SummaryCard'
import './Summary.css'
import { formatCurrency } from '../utils/expenses'

function Summary({ totalSpending, transactionCount }) {
  return (
    <section className="summary" aria-label="Expense summary">
      <SummaryCard
        title="Total Spending"
        value={formatCurrency(totalSpending)}
        description="Across all expenses"
        icon={Wallet}
      />
      <SummaryCard
        title="Transactions"
        value={transactionCount}
        description="Total expenses recorded"
        icon={Receipt}
      />
    </section>
  )
}

export default Summary
