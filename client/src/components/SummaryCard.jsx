import './SummaryCard.css'

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <article className="summary-card">
      <div className="summary-card__heading">
        <h2 className="summary-card__title">{title}</h2>
        <span className="summary-card__icon">
          <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <p className="summary-card__value">{value}</p>
      <p className="summary-card__description">{description}</p>
    </article>
  )
}

export default SummaryCard
