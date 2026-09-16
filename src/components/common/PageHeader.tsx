import styles from './PageHeader.module.css'

interface PageHeaderProps {
  title: string
  subtitle?: string
  tag?: string
}

export default function PageHeader({ title, subtitle, tag }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      {tag && <span className="demo-label">{tag}</span>}
      <h1 className={`page-title ${styles.title}`}>{title}</h1>
      {subtitle && <p className={`page-subtitle ${styles.subtitle}`}>{subtitle}</p>}
    </div>
  )
}
