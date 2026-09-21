/**
 * DonationStatusPage.tsx — Phase 4 Donation Lifecycle
 *
 * Shows the coordinator a live stepper for a confirmed donation match.
 * State is read from (and written back to) sessionStorage via donationStore.
 *
 * Lifecycle path: Matched → Accepted → In Transit → Completed
 * Early exit:     Matched | Accepted → Cancelled
 *
 * No real-time backend. All transitions are manual demo advances.
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getActiveDonation,
  advanceDonationStatus,
  clearActiveDonation,
  canTransitionTo,
  STATUS_STEPS,
} from '../services/donationStore'
import type { ActiveDonation, DonationStatus } from '../types'
import styles from './DonationStatusPage.module.css'

// ─── Stepper helpers ──────────────────────────────────────────────────────────

const STEP_LABELS: Record<DonationStatus, string> = {
  Available:  'Available',
  Matched:    'Matched',
  Accepted:   'Accepted',
  'In Transit': 'In Transit',
  Completed:  'Completed',
  Cancelled:  'Cancelled',
}

const STEP_DESCRIPTIONS: Record<DonationStatus, string> = {
  Available:    'Donation listed and awaiting a match.',
  Matched:      'A community organisation has been recommended. Awaiting recipient acceptance.',
  Accepted:     'Recipient has accepted the donation. Preparing for collection or delivery.',
  'In Transit': 'Donation is on its way to the recipient organisation.',
  Completed:    'Donation has been received. Thank you for supporting your community.',
  Cancelled:    'This donation has been cancelled.',
}

// Next manual action labels for the demo advance buttons
const NEXT_ACTION_LABEL: Partial<Record<DonationStatus, string>> = {
  Matched:      'Mark as Accepted',
  Accepted:     'Mark as In Transit',
  'In Transit': 'Mark as Completed',
}

// Statuses from which cancellation is permitted
const CAN_CANCEL: DonationStatus[] = ['Matched', 'Accepted']

function stepIndex(status: DonationStatus): number {
  return STATUS_STEPS.indexOf(status)
}

// ─── Stepper component ────────────────────────────────────────────────────────

function StatusStepper({ current }: { current: DonationStatus }) {
  const cancelled = current === 'Cancelled'

  return (
    <div className={styles.stepper} aria-label="Donation lifecycle steps">
      {STATUS_STEPS.map((step, idx) => {
        const currentIdx = stepIndex(current)
        const isPast     = !cancelled && idx < currentIdx
        const isActive   = !cancelled && idx === currentIdx
        const isFuture   = cancelled ? true : idx > currentIdx

        return (
          <div
            key={step}
            className={`${styles.stepItem} ${isPast ? styles.stepPast : ''} ${isActive ? styles.stepActive : ''} ${isFuture ? styles.stepFuture : ''}`}
          >
            <div className={styles.stepCircleWrap}>
              <div className={styles.stepCircle}>
                {isPast ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${isPast ? styles.stepConnectorFilled : ''}`} />
              )}
            </div>
            <div className={styles.stepLabel}>{STEP_LABELS[step]}</div>
          </div>
        )
      })}

      {cancelled && (
        <div className={`${styles.stepItem} ${styles.stepCancelled}`}>
          <div className={styles.stepCircleWrap}>
            <div className={styles.stepCircle}>✕</div>
          </div>
          <div className={styles.stepLabel}>Cancelled</div>
        </div>
      )}
    </div>
  )
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: DonationStatus }) {
  const colorMap: Record<DonationStatus, string> = {
    Available:    'badge-green',
    Matched:      'badge-blue',
    Accepted:     'badge-blue',
    'In Transit': 'badge-yellow',
    Completed:    'badge-green',
    Cancelled:    'badge-red',
  }
  return <span className={`badge ${colorMap[status]}`}>{status}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DonationStatusPage() {
  const navigate = useNavigate()
  const [donation, setDonation] = useState<ActiveDonation | null>(() => getActiveDonation())
  const [cancelConfirm, setCancelConfirm] = useState(false)

  // Keep UI in sync if another tab/window changes sessionStorage
  useEffect(() => {
    function onStorage() {
      setDonation(getActiveDonation())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── No active donation ────────────────────────────────────────────────────

  if (!donation) {
    return (
      <main className="page-content">
        <div className="container">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">📦</div>
            <h2 className={styles.emptyTitle}>No active donation</h2>
            <p className={styles.emptyText}>
              There is no confirmed donation in this session. Start a new donation to begin the
              matching process.
            </p>
            <div className={styles.emptyActions}>
              <Link to="/donate" className="btn btn-primary">Donate Surplus Food</Link>
              <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const { status } = donation
  const confirmedAt = new Date(donation.confirmedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const nextStatus: DonationStatus | undefined = (() => {
    const idx = STATUS_STEPS.indexOf(status)
    return idx >= 0 && idx < STATUS_STEPS.length - 1
      ? STATUS_STEPS[idx + 1]
      : undefined
  })()

  function handleAdvance() {
    if (!nextStatus || !canTransitionTo(status, nextStatus)) return
    const updated = advanceDonationStatus(nextStatus)
    if (updated) setDonation(updated)
  }

  function handleCancel() {
    if (!canTransitionTo(status, 'Cancelled')) return
    const updated = advanceDonationStatus('Cancelled')
    if (updated) {
      setDonation(updated)
      setCancelConfirm(false)
    }
  }

  function handleClear() {
    clearActiveDonation()
    navigate('/')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isCancelled  = status === 'Cancelled'
  const isCompleted  = status === 'Completed'
  const isTerminal   = isCancelled || isCompleted

  return (
    <main className="page-content">
      <div className="container">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.breadcrumb}>
              <Link to="/matching" className={styles.breadcrumbLink}>Community Matching</Link>
              <span className={styles.breadcrumbSep}>›</span>
              <span>Donation Status</span>
            </div>
            <h1 className={styles.pageTitle}>Donation Status</h1>
            <p className={styles.pageSubtitle}>
              Track the lifecycle of your confirmed food donation.
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        {/* ── Stepper ──────────────────────────────────────────────────────── */}
        <div className={`card ${styles.stepperCard}`}>
          <StatusStepper current={status} />
          <div className={styles.currentStatusRow}>
            <div>
              <p className={styles.currentStatusLabel}>Current status</p>
              <p className={styles.currentStatusName}>{STEP_LABELS[status]}</p>
              <p className={styles.currentStatusDesc}>{STEP_DESCRIPTIONS[status]}</p>
            </div>
          </div>
        </div>

        {/* ── Human verification notice ─────────────────────────────────── */}
        {!isTerminal && (
          <div className="notice notice-warning mt-4">
            <span>⚠</span>
            <span>
              <strong>Human verification required.</strong> All food safety, handling, and
              redistribution decisions must be verified by a responsible coordinator before
              and during transfer. AI recommendations are advisory only.
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="notice notice-success mt-4">
            <span>✓</span>
            <span>
              <strong>Donation complete.</strong> The food has been delivered to{' '}
              {donation.organizationName}. Thank you for reducing food waste and supporting
              your community.
            </span>
          </div>
        )}

        {isCancelled && (
          <div className="notice mt-4" style={{ background: 'var(--color-critical-light)', borderColor: 'var(--color-critical-muted)', color: '#7f1d1d' }}>
            <span>✕</span>
            <span>
              <strong>Donation cancelled.</strong> This donation has been removed from the
              active lifecycle. No redistribution action will be taken.
            </span>
          </div>
        )}

        {/* ── Details grid ─────────────────────────────────────────────── */}
        <div className={styles.detailsGrid}>

          {/* Food */}
          <div className={`card ${styles.detailCard}`}>
            <h2 className={styles.detailCardTitle}>Food</h2>
            <dl className={styles.detailDl}>
              <DetailRow label="Name"       value={donation.foodName} />
              <DetailRow label="Category"   value={donation.category} />
              <DetailRow label="Quantity"   value={donation.quantity} />
              <DetailRow label="Servings"   value={donation.estimatedServings} />
              <DetailRow label="Suitability" value={donation.donationSuitability} />
              <DetailRow label="Donor area" value={donation.donorArea || '—'} />
            </dl>
          </div>

          {/* Recipient */}
          <div className={`card ${styles.detailCard}`}>
            <h2 className={styles.detailCardTitle}>Recipient</h2>
            <dl className={styles.detailDl}>
              <DetailRow label="Organisation"   value={donation.organizationName} />
              <DetailRow label="Requested type" value={donation.requestedType} />
              <DetailRow label="Area"           value={donation.recipientArea} />
              <DetailRow label="Match score"    value={`${donation.confirmedMatch.matchScore}/100`} />
              <DetailRow label="Priority"       value={donation.confirmedMatch.priority} />
              <DetailRow label="Confirmed at"   value={confirmedAt} />
            </dl>
          </div>
        </div>

        {/* ── Match reason ─────────────────────────────────────────────── */}
        <div className={`card ${styles.reasonCard}`}>
          <h2 className={styles.detailCardTitle}>Match Recommendation</h2>
          <p className={styles.reasonQty}>
            <strong>Recommended quantity:</strong> {donation.confirmedMatch.recommendedQuantity}
          </p>
          <p className={styles.reasonText}>{donation.confirmedMatch.reason}</p>
          <p className={styles.reasonDisclaimer}>
            This recommendation was generated by the FoodBridge AI matching engine.
            It is advisory only. A responsible coordinator must verify all details before
            redistribution.
          </p>
        </div>

        {/* ── Demo advance controls ─────────────────────────────────────── */}
        {!isTerminal && (
          <div className={`card ${styles.actionsCard}`}>
            <div className={styles.actionsHeader}>
              <h2 className={styles.detailCardTitle}>Status Management</h2>
              <span className="demo-label">Coordinator Action</span>
            </div>
            <p className={styles.actionsDesc}>
              Update the distribution status as operations proceed through dispatch, transit, and handover verification.
            </p>

            <div className={styles.actionButtons}>
              {nextStatus && canTransitionTo(status, nextStatus) && (
                <button className="btn btn-primary" onClick={handleAdvance}>
                  {NEXT_ACTION_LABEL[status] ?? `Advance to ${nextStatus}`}
                </button>
              )}

              {CAN_CANCEL.includes(status) && !cancelConfirm && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCancelConfirm(true)}
                >
                  Cancel Donation
                </button>
              )}
            </div>

            {cancelConfirm && (
              <div className={`notice notice-warning ${styles.cancelConfirmBox}`}>
                <div>
                  <p className={styles.cancelConfirmText}>
                    <strong>Are you sure?</strong> Cancelling this donation will end the
                    lifecycle. This cannot be undone in the current session.
                  </p>
                  <div className={styles.cancelConfirmActions}>
                    <button className="btn btn-sm" style={{ background: 'var(--color-critical)', color: '#fff', borderColor: 'var(--color-critical)' }} onClick={handleCancel}>
                      Yes, Cancel Donation
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setCancelConfirm(false)}>
                      Keep Donation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Terminal actions ──────────────────────────────────────────── */}
        {isTerminal && (
          <div className={styles.terminalActions}>
            <button className="btn btn-primary" onClick={handleClear}>
              Start a New Donation
            </button>
            <Link to="/" className="btn btn-secondary">
              Back to Dashboard
            </Link>
            <Link to="/impact" className="btn btn-secondary">
              View Impact Dashboard
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
