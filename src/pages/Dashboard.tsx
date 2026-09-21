import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MetricCard from '../components/common/MetricCard'
import { demoActivity } from '../data/demoData'
import { getImpactMetrics } from '../services/donationStore'
import type { ActivityItem, ImpactMetrics } from '../types'
import styles from './Dashboard.module.css'

function activityIcon(type: ActivityItem['type']) {
  const icons: Record<ActivityItem['type'], string> = {
    donation: '↑',
    match: '⇄',
    request: '↓',
    approval: '✓',
  }
  return icons[type]
}

function activityColor(type: ActivityItem['type']) {
  const map: Record<ActivityItem['type'], string> = {
    donation: styles.iconDonation,
    match: styles.iconMatch,
    request: styles.iconRequest,
    approval: styles.iconApproval,
  }
  return map[type]
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<ImpactMetrics>(() => getImpactMetrics())

  useEffect(() => {
    function update() {
      setMetrics(getImpactMetrics())
    }
    window.addEventListener('impactMetricsChange', update)
    window.addEventListener('activeDonationChange', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('impactMetricsChange', update)
      window.removeEventListener('activeDonationChange', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <div className="page-content">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <span className="demo-label">AI for Sustainability</span>
              <h1 className={styles.heroHeadline}>
                Give surplus food<br />a second purpose.
              </h1>
              <p className={styles.heroText}>
                FoodBridge AI helps analyse surplus food and identify potential community
                support opportunities using AI — keeping humans in control of every decision.
              </p>
              <div className={styles.heroActions}>
                <Link to="/donate" className="btn btn-primary btn-lg">
                  Donate Surplus Food
                </Link>
                <Link to="/matching" className="btn btn-secondary btn-lg">
                  View Community Needs
                </Link>
              </div>
            </div>
            <div className={styles.heroIllustration} aria-hidden="true">
              <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.illustration}>
                {/* Background circle */}
                <circle cx="140" cy="110" r="90" fill="#e8f5ee" />
                {/* Bridge arc */}
                <path d="M60 140 Q140 60 220 140" stroke="#2d7a4f" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Donation box */}
                <rect x="48" y="130" width="40" height="32" rx="4" fill="#2d7a4f" />
                <rect x="56" y="122" width="24" height="12" rx="3" fill="#236040" />
                <line x1="68" y1="122" x2="68" y2="162" stroke="white" strokeWidth="1.5" />
                {/* Community house */}
                <rect x="192" y="138" width="40" height="28" rx="3" fill="#2d7a4f" />
                <path d="M188 142 L212 122 L236 142" fill="#236040" />
                <rect x="204" y="150" width="16" height="16" rx="2" fill="white" fillOpacity="0.3" />
                {/* Connection dots */}
                <circle cx="100" cy="95" r="5" fill="#2d7a4f" fillOpacity="0.6" />
                <circle cx="140" cy="72" r="6" fill="#2d7a4f" />
                <circle cx="180" cy="95" r="5" fill="#2d7a4f" fillOpacity="0.6" />
                {/* AI spark */}
                <circle cx="140" cy="72" r="10" fill="none" stroke="#2d7a4f" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="136" y="77" fill="#2d7a4f" fontSize="10" fontWeight="700">AI</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact Preview ───────────────────────────────────────────────── */}
      <section className={styles.impactSection}>
        <div className="container">
          <div className={styles.impactHeader}>
            <div>
              <h2 className="section-title">Platform Overview</h2>
              <p className="section-subtitle">Estimated figures based on platform activity.</p>
            </div>
          </div>
          <div className="grid-4">
            <MetricCard
              value={metrics.mealsPotentiallySupported.toLocaleString()}
              label="Meals potentially supported"
              note="Platform total"
              accent
            />
            <MetricCard
              value={`${metrics.foodPotentiallyRedirectedKg} kg`}
              label="Food potentially redirected"
              note="Platform total"
            />
            <MetricCard
              value={metrics.communityRequests}
              label="Community requests"
              note="Platform total"
            />
            <MetricCard
              value={metrics.donationEvents}
              label="Donation events"
              note="Platform total"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className="container">
          <h2 className="section-title">How FoodBridge AI works</h2>
          <p className="section-subtitle">
            A structured, human-supervised process for food redistribution.
          </p>
          <div className={styles.steps}>
            {[
              {
                n: '1',
                title: 'Submit surplus food',
                desc: 'A food donor enters details about available surplus food.',
              },
              {
                n: '2',
                title: 'AI analysis',
                desc: 'The system analyses food type, quantity, and time window to assess redistribution potential.',
              },
              {
                n: '3',
                title: 'Community matching',
                desc: 'The AI identifies and ranks potential community organisation matches.',
              },
              {
                n: '4',
                title: 'Human review & approval',
                desc: 'A coordinator reviews AI recommendations and approves or adjusts the plan.',
              },
            ].map((step) => (
              <div key={step.n} className={styles.step}>
                <div className={styles.stepNumber}>{step.n}</div>
                <div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <section className={styles.activitySection}>
        <div className="container">
          <div className={styles.activityHeader}>
            <h2 className="section-title">Recent Activity</h2>
            <span className="demo-label">Community Feed</span>
          </div>
          <div className={`card ${styles.activityList}`}>
            {demoActivity.map((item, idx) => (
              <div
                key={item.id}
                className={`${styles.activityItem} ${idx < demoActivity.length - 1 ? styles.activityItemBorder : ''}`}
              >
                <div className={`${styles.activityIcon} ${activityColor(item.type)}`}>
                  {activityIcon(item.type)}
                </div>
                <div className={styles.activityBody}>
                  <div className={styles.activityDescription}>{item.description}</div>
                  <div className={styles.activityDetail}>{item.detail}</div>
                </div>
                <div className={styles.activityTime}>{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────────────────── */}
      <section className={styles.principlesSection}>
        <div className="container">
          <h2 className="section-title">Design principles</h2>
          <p className="section-subtitle">
            These principles guide how FoodBridge AI is built and used.
          </p>
          <div className="grid-3">
            {[
              {
                title: 'AI supports, humans decide',
                desc: 'AI recommendations are advisory. All redistribution decisions require human approval.',
              },
              {
                title: 'Transparency in reasoning',
                desc: 'Every AI recommendation includes a plain-language explanation of why it was suggested.',
              },
              {
                title: 'Relevant matching only',
                desc: 'Community matching uses food type, quantity, and logistics — not personal characteristics.',
              },
              {
                title: 'Food safety first',
                desc: 'Food safety and applicable requirements must be verified by a responsible person before redistribution.',
              },
              {
                title: 'Minimal personal information',
                desc: 'The platform avoids collecting unnecessary personal data.',
              },
              {
                title: 'Continuous accountability',
                desc: 'Operational metrics and redistribution logs provide verifiable accountability across community transfers.',
              },
            ].map((p) => (
              <div key={p.title} className={`card card-sm ${styles.principleCard}`}>
                <div className={styles.principleTitle}>{p.title}</div>
                <div className={styles.principleDesc}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
