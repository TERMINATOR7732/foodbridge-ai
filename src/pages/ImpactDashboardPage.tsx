import { useState, useEffect } from 'react'
import MetricCard from '../components/common/MetricCard'
import { demoMatchRecommendations } from '../data/demoData'
import { getImpactMetrics, getCompletedDonations, getActiveDonation } from '../services/donationStore'
import type { ImpactMetrics } from '../types'
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
  const [metrics, setMetrics] = useState<ImpactMetrics>(() => getImpactMetrics())
  const [completed, setCompleted] = useState(() => getCompletedDonations())
  const [active, setActive] = useState(() => getActiveDonation())

  useEffect(() => {
    function handleUpdate() {
      setMetrics(getImpactMetrics())
      setCompleted(getCompletedDonations())
      setActive(getActiveDonation())
    }
    window.addEventListener('impactMetricsChange', handleUpdate)
    window.addEventListener('activeDonationChange', handleUpdate)
    return () => {
      window.removeEventListener('impactMetricsChange', handleUpdate)
      window.removeEventListener('activeDonationChange', handleUpdate)
    }
  }, [])

  const m = metrics

  const weeklyDonations = [
    { label: 'Mon', value: 8, color: '#2d7a4f' },
    { label: 'Tue', value: 12, color: '#2d7a4f' },
    { label: 'Wed', value: 6, color: '#2d7a4f' },
    { label: 'Thu', value: 14, color: '#2d7a4f' },
    { label: 'Fri', value: 18, color: '#2d7a4f' },
    { label: 'Sat', value: 9, color: '#2d7a4f' },
    { label: 'Sun', value: 5, color: '#2d7a4f' },
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
    ...(active ? [{
      id: active.id,
      foodName: active.foodName,
      category: active.category,
      quantity: active.quantity,
      unit: '',
      estimatedServings: String(active.estimatedServings),
      location: active.donorArea || active.recipientArea || 'Central District',
      status: active.status.toLowerCase() as any,
    }] : []),
    ...completed.filter((c) => !active || c.id !== active.id).map((c) => ({
      id: c.id,
      foodName: c.foodName,
      category: c.category,
      quantity: c.quantity,
      unit: '',
      estimatedServings: String(c.estimatedServings),
      location: c.donorArea || c.recipientArea || 'Central District',
      status: 'completed' as const,
    })),
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
            Metrics and redistribution impact reflect aggregated platform activity and verified community transfers.
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
              note="Estimated"
              accent
            />
            <MetricCard
              value={`${m.foodPotentiallyRedirectedKg} kg`}
              label="Food potentially redirected"
              note="Estimated"
            />
            <MetricCard
              value={m.donationEvents}
              label="Donation events"
              note="Logged events"
            />
            <MetricCard
              value={m.communityRequests}
              label="Community requests"
              note="Partner requests"
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
              <p className={styles.chartNote}>Number of donation submissions per day.</p>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>Donations by category</h3>
              </div>
              <BarChart data={categoryData} label="Donations by food category bar chart" />
              <p className={styles.chartNote}>Breakdown of donation events by food category.</p>
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
                {m.successfulDemoMatches} of {m.communityRequests} community requests matched
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
                {recentDonations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No recent donations recorded yet. Completed donations will appear here.
                    </td>
                  </tr>
                ) : (
                  recentDonations.map((d) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}
