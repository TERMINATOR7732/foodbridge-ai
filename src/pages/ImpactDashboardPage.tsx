import { useState, useEffect } from 'react'
import MetricCard from '../components/common/MetricCard'
import { demoDonations, demoMatchRecommendations } from '../data/demoData'
import { getImpactMetrics, getCompletedDonations } from '../services/donationStore'
import type { ImpactMetrics, ActiveDonation } from '../types'
import styles from './ImpactDashboardPage.module.css'

// Simple SVG bar chart component
function BarChart({
  data,
  label,
}: {
  data: { label: string; value: number; color?: string }[]
  label: string
}) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className={styles.chartWrap} aria-label={label}>
      <div className={styles.bars}>
        {data.map((d) => (
          <div key={d.label} className={styles.barGroup}>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  height: `${(d.value / max) * 100}%`,
                  background: d.color ?? 'var(--color-primary)',
                }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className={styles.barLabel}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Simple horizontal progress bar
function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className={styles.progressTrack}>
      <div
        className={styles.progressFill}
        style={{ width: `${pct}%`, background: color ?? 'var(--color-primary)' }}
      />
    </div>
  )
}

export default function ImpactDashboardPage() {
  const [m, setMetrics] = useState<ImpactMetrics>(() => getImpactMetrics())
  const [completed, setCompleted] = useState<ActiveDonation[]>(() => getCompletedDonations())

  useEffect(() => {
    function update() {
      setMetrics(getImpactMetrics())
      setCompleted(getCompletedDonations())
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

  const weeklyDonations = [
    { label: 'Mon', value: 6 },
    { label: 'Tue', value: 9 },
    { label: 'Wed', value: 7 },
    { label: 'Thu', value: 12 },
    { label: 'Fri', value: 8 },
    { label: 'Sat', value: 3 },
    { label: 'Sun', value: 2 },
  ]

  const categoryData = [
    { label: 'Prepared', value: 18, color: '#2d7a4f' },
    { label: 'Produce', value: 12, color: '#3b82d4' },
    { label: 'Bakery', value: 9, color: '#d97706' },
    { label: 'Dairy', value: 5, color: '#7c5cd8' },
    { label: 'Other', value: 3, color: '#8b949e' },
  ]

  const matchRate = m.communityRequests > 0
    ? Math.min(100, Math.round((m.successfulDemoMatches / m.communityRequests) * 100))
    : 0

  const recentDonations = [
    ...completed.map((c) => ({
      id: c.id,
      foodName: c.foodName,
      category: c.category,
      quantity: c.quantity,
      unit: '',
      estimatedServings: String(c.estimatedServings),
      location: c.donorArea || c.recipientArea || 'Central District',
      status: 'completed' as const,
    })),
    ...demoDonations,
  ]

  return (
    <div className="page-content">
      <div className="container">
        <div className={styles.pageHeading}>
          <h1 className="page-title">Impact Dashboard</h1>
          <p className="page-subtitle">
            FoodBridge AI — tracking food rescue activity and community connections.
          </p>
        </div>

        <div className="notice notice-info mb-6">
          <span>ℹ</span>
          <span>
            All metrics and match data shown are simulated figures used to demonstrate the
            platform. They do not represent real-world outcomes, verified impact, or real
            organisational partnerships.
          </span>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className="section-title">Key metrics</h2>
          <p className="section-subtitle">Estimated cumulative figures across all recorded activity.</p>
          <div className="grid-4">
            <MetricCard
              value={m.mealsPotentiallySupported.toLocaleString()}
              label="Meals potentially supported"
              note="Simulated estimate"
              accent
            />
            <MetricCard
              value={`${m.foodPotentiallyRedirectedKg} kg`}
              label="Food potentially redirected"
              note="Simulated estimate"
            />
            <MetricCard
              value={m.donationEvents}
              label="Donation events"
              note="Demo entries"
            />
            <MetricCard
              value={m.communityRequests}
              label="Community requests"
              note="Demo entries"
            />
          </div>
        </section>

        {/* ── Charts row ──────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className="grid-2">
            {/* Weekly donations */}
            <div className="card">
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Donations this week</h3>
              </div>
              <BarChart data={weeklyDonations} label="Weekly donations bar chart" />
              <p className={styles.chartNote}>Number of donation submissions per day (simulated).</p>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Donations by category</h3>
              </div>
              <BarChart data={categoryData} label="Donations by food category bar chart" />
              <p className={styles.chartNote}>Breakdown of donation events by food category (simulated).</p>
            </div>
          </div>
        </section>

        {/* ── Matching performance ─────────────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className="section-title">Matching performance</h2>
          <p className="section-subtitle">
            How well the platform matched donations to community requests.
          </p>
          <div className="grid-2">
            <div className="card">
              <h3 className={styles.subTitle}>Match success rate</h3>
              <div className={styles.matchRateNumber}>{matchRate}%</div>
              <ProgressBar value={m.successfulDemoMatches} max={m.communityRequests} />
              <p className={styles.progressNote}>
                {m.successfulDemoMatches} of {m.communityRequests} community requests matched (demo)
              </p>
            </div>

            <div className="card">
              <h3 className={styles.subTitle}>Active matches</h3>
              <div className={styles.matchList}>
                {demoMatchRecommendations.map((rec) => (
                  <div key={rec.id} className={styles.matchRow}>
                    <div className={styles.matchOrg}>{rec.organizationName}</div>
                    <div className={styles.matchScore}>
                      <ProgressBar
                        value={rec.matchScore}
                        max={100}
                        color={rec.matchScore >= 80 ? '#2d7a4f' : '#d97706'}
                      />
                      <span className={styles.matchScoreNum}>{rec.matchScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Recent donations table ─────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.tableHeader}>
            <h2 className="section-title">Recent donations</h2>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Food</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Servings</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((d) => (
                  <tr key={d.id}>
                    <td className={styles.tdMain}>{d.foodName}</td>
                    <td>{d.category}</td>
                    <td>{d.unit ? `${d.quantity} ${d.unit}` : d.quantity}</td>
                    <td>{d.estimatedServings}</td>
                    <td>{d.location}</td>
                    <td>
                      <span className={`badge ${
                        d.status === 'completed' ? 'badge-green' :
                        d.status === 'matched' ? 'badge-green' :
                        d.status === 'analysed' ? 'badge-blue' :
                        'badge-grey'
                      }`}>
                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}
