import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { getActiveDonation } from '../../services/donationStore'
import styles from './Header.module.css'

const baseNavItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/donate', label: 'Donate Food' },
  { to: '/matching', label: 'Community Matching' },
  { to: '/assistant', label: 'AI Assistant' },
  { to: '/impact', label: 'Impact' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasDonation, setHasDonation] = useState(() => getActiveDonation() !== null)

  // Re-check when donationStore writes/clears (same tab) or another tab changes it
  useEffect(() => {
    function check() {
      setHasDonation(getActiveDonation() !== null)
    }
    window.addEventListener('activeDonationChange', check)
    window.addEventListener('storage', check)
    return () => {
      window.removeEventListener('activeDonationChange', check)
      window.removeEventListener('storage', check)
    }
  }, [])

  const navItems = hasDonation
    ? [...baseNavItems, { to: '/donation-status', label: 'Donation Status', end: false }]
    : baseNavItems

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#2d7a4f" />
            <path d="M10 21 Q16 10 22 21" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="16" cy="21" r="2.8" fill="white" />
          </svg>
          <span className={styles.logoText}>
            FoodBridge <span className={styles.logoAi}>AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className={styles.menuBtn}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpenMid : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className={styles.mobileMenu} aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
