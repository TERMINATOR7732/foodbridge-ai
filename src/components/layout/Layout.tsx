import type { ReactNode } from 'react'
import Header from './Header'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerText}>
            FoodBridge AI &nbsp;·&nbsp; All data shown is simulated for demonstration purposes.
          </p>
        </div>
      </footer>
    </div>
  )
}
