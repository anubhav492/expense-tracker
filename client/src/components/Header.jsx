import { CalendarDays, Moon, Sun, Wallet } from 'lucide-react'
import './Header.css'

function Header({ darkMode, onToggleDarkMode }) {
  // With no date argument, Intl formats the current date in the user's timezone.
  const currentMonth = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format()

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__inner">
        <div className="dashboard-header__brand">
          <div className="dashboard-header__logo">
            <Wallet size={25} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div>
            <h1 className="dashboard-header__title">Expense Tracker</h1>
            <p className="dashboard-header__subtitle">Manage your money smarter</p>
          </div>
        </div>

        <div className="dashboard-header__actions">
          <div className="dashboard-header__date">
            <CalendarDays size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>{currentMonth}</span>
          </div>
          <button className="theme-toggle" type="button" onClick={onToggleDarkMode}
            aria-label="Dark mode" aria-pressed={darkMode}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
