import styles from './MetricCard.module.css'

interface MetricCardProps {
  value: string | number
  label: string
  note?: string
  accent?: boolean
}

export default function MetricCard({ value, label, note, accent }: MetricCardProps) {
  return (
    <div className={`card card-sm ${styles.card} ${accent ? styles.accent : ''}`}>
      <div className={`${styles.value} ${accent ? styles.accentValue : ''}`}>{value}</div>
      <div className={styles.label}>{label}</div>
      {note && <div className={styles.note}>{note}</div>}
    </div>
  )
}
