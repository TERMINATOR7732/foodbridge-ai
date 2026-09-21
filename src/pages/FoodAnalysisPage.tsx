import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { PriorityBadge } from '../components/common/StatusBadge'
import { demoAnalysisResult, demoDonations } from '../data/demoData'
import { analyseFood, FoodAnalysisValidationError, FoodAnalysisServiceError } from '../services/aiService'
import type { DonationFormData, FoodAnalysisResult, DonationSuitability } from '../types'
import styles from './FoodAnalysisPage.module.css'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFormData(): DonationFormData | null {
  try {
    const raw = sessionStorage.getItem('donationForm')
    return raw ? (JSON.parse(raw) as DonationFormData) : null
  } catch {
    return null
  }
}

function confidenceLabel(c: number): string {
  if (c >= 0.85) return 'High'
  if (c >= 0.65) return 'Moderate'
  return 'Low'
}

function confidenceClass(c: number): string {
  if (c >= 0.85) return styles.confHigh
  if (c >= 0.65) return styles.confMedium
  return styles.confLow
}

function suitabilityClass(s: DonationSuitability): string {
  switch (s) {
    case 'Suitable': return styles.suitGreen
    case 'Suitable with Conditions': return styles.suitYellow
    case 'Requires Review': return styles.suitOrange
    case 'Not Recommended': return styles.suitRed
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingSpinner} aria-hidden="true" />
      <div className={styles.loadingText}>
        <strong>Analysing food donation…</strong>
        <span>The AI analyser is assessing your submission.</span>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`notice notice-warning ${styles.errorState}`}>
      <span>⚠</span>
      <div>
        <strong>Analysis could not be completed</strong>
        <p className="mt-2">{message}</p>
        <button className={`btn btn-secondary btn-sm ${styles.retryBtn}`} onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FoodAnalysisPage() {
  const formData = getFormData()
  const isLiveSubmission = formData !== null

  // Fallback donation for display when no form data (direct navigation to /analysis)
  const displayDonation = formData ?? demoDonations[0]

  const [analysis, setAnalysis] = useState<FoodAnalysisResult | null>(
    isLiveSubmission ? null : demoAnalysisResult,
  )
  const [isLoading, setIsLoading] = useState(isLiveSubmission)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function runAnalysis() {
    if (!formData) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const result = await analyseFood(formData)
      setAnalysis(result)
      // Store the result so CommunityMatchingPage can read it without re-running analysis
      try {
        sessionStorage.setItem('analysisResult', JSON.stringify(result))
      } catch {
        // sessionStorage write failure is non-fatal — matching page will fall back to demo
      }
    } catch (err) {
      if (err instanceof FoodAnalysisValidationError) {
        setErrorMessage(err.message)
      } else if (err instanceof FoodAnalysisServiceError) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage('An unexpected error occurred. Please return to the donation form and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLiveSubmission) {
      void runAnalysis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-content">
      <div className="container">
        <PageHeader
          title="Food Analysis"
          subtitle="AI-generated advisory assessment of the submitted food donation."
          tag={isLiveSubmission ? 'AI Advisory' : 'Demo Data'}
        />

        {!isLiveSubmission && (
          <div className="notice notice-info mb-6">
            <span>ℹ</span>
            <span>
              Showing demo analysis results. Submit a donation via the{' '}
              <Link to="/donate">Donate Food</Link> page to see results based on your input.
            </span>
          </div>
        )}

        <div className={styles.layout}>
          {/* ── Left col: Food summary + Human verification ──────────────── */}
          <div className={styles.leftCol}>
            <section className={`card ${styles.summaryCard}`}>
              <h2 className={styles.cardTitle}>Food Summary</h2>
              <dl className={styles.dataList}>
                <div className={styles.dataRow}>
                  <dt>Food name</dt>
                  <dd>{displayDonation.foodName}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Category</dt>
                  <dd>{displayDonation.category}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Quantity</dt>
                  <dd>{displayDonation.quantity} {displayDonation.unit}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Est. servings</dt>
                  <dd>{displayDonation.estimatedServings}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Prepared</dt>
                  <dd>
                    {displayDonation.preparationDate
                      ? new Date(displayDonation.preparationDate).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Available until</dt>
                  <dd>
                    {displayDonation.availabilityUntil
                      ? new Date(displayDonation.availabilityUntil).toLocaleString()
                      : '—'}
                  </dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Storage</dt>
                  <dd>{displayDonation.storageCondition}</dd>
                </div>
                <div className={styles.dataRow}>
                  <dt>Location</dt>
                  <dd>{displayDonation.location}</dd>
                </div>
                {displayDonation.additionalInfo && (
                  <div className={styles.dataRow}>
                    <dt>Notes</dt>
                    <dd>{displayDonation.additionalInfo}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* ── Human verification notice — always visible ────────────── */}
            <section className={`notice notice-warning ${styles.verificationNotice}`}>
              <span className={styles.noticeIcon}>⚠</span>
              <div>
                <strong>Human verification required</strong>
                <p className="mt-2">
                  AI recommendations are advisory. Food safety and redistribution decisions must be
                  verified by a responsible person and follow applicable requirements before any
                  action is taken.
                </p>
              </div>
            </section>

            {analysis && (
              <Link to="/matching" className="btn btn-primary">
                Continue to Community Matching →
              </Link>
            )}
          </div>

          {/* ── Right col: AI analysis results ───────────────────────────── */}
          <div className={styles.rightCol}>
            <div className={styles.aiHeader}>
              <h2 className={styles.cardTitle}>AI Analysis</h2>
              <span className="demo-label">AI Advisory</span>
            </div>

            {/* Loading */}
            {isLoading && <LoadingState />}

            {/* Error */}
            {!isLoading && errorMessage && (
              <ErrorState message={errorMessage} onRetry={runAnalysis} />
            )}

            {/* Results */}
            {!isLoading && !errorMessage && analysis && (
              <>
                {/* Quick stats grid */}
                <div className={styles.statsGrid}>
                  <div className={`card card-sm ${styles.statCard}`}>
                    <div className={styles.statLabel}>Category</div>
                    <div className={styles.statValue}>{analysis.category}</div>
                  </div>
                  <div className={`card card-sm ${styles.statCard}`}>
                    <div className={styles.statLabel}>Est. servings</div>
                    <div className={styles.statValue}>{analysis.estimatedServings}</div>
                  </div>
                  <div className={`card card-sm ${styles.statCard}`}>
                    <div className={styles.statLabel}>Priority</div>
                    <div className={`${styles.statValue} ${styles.priorityValue}`}>
                      <PriorityBadge priority={analysis.priority} />
                    </div>
                  </div>
                  <div className={`card card-sm ${styles.statCard}`}>
                    <div className={styles.statLabel}>Availability window</div>
                    <div className={styles.statValue}>
                      {analysis.availabilityWindowDisplay ||
                        `${analysis.availabilityWindowHours}h total — ${analysis.availabilityStatus === 'Expired' ? 'Expired' : 'Active'}`}
                    </div>
                  </div>
                </div>

                {/* Suitability + confidence row */}
                <div className={styles.assessmentRow}>
                  <div className={`card card-sm ${styles.assessCard}`}>
                    <div className={styles.statLabel}>Donation suitability</div>
                    <div className={`${styles.suitabilityValue} ${suitabilityClass(analysis.donationSuitability)}`}>
                      {analysis.donationSuitability}
                    </div>
                  </div>
                  <div className={`card card-sm ${styles.assessCard}`}>
                    <div className={styles.statLabel}>Analysis confidence</div>
                    <div className={styles.confidenceRow}>
                      <div className={styles.confTrack}>
                        <div
                          className={`${styles.confFill} ${confidenceClass(analysis.confidence)}`}
                          style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                        />
                      </div>
                      <span className={`${styles.confLabel} ${confidenceClass(analysis.confidence)}`}>
                        {confidenceLabel(analysis.confidence)} ({Math.round(analysis.confidence * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shelf life & storage */}
                <div className={`card card-sm ${styles.shelfCard}`}>
                  <div className={styles.shelfRow}>
                    <div>
                      <div className={styles.statLabel}>Estimated shelf life</div>
                      <div className={styles.shelfValue}>{analysis.estimatedShelfLife}</div>
                    </div>
                    <div>
                      <div className={styles.statLabel}>Storage recommendation</div>
                      <div className={styles.storageValue}>{analysis.storageRecommendation}</div>
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div className={`card ${styles.recommendationCard}`}>
                  <h3 className={styles.subCardTitle}>Recommended action</h3>
                  <p className={styles.recommendationText}>{analysis.recommendation}</p>
                </div>

                {/* Safety considerations */}
                {analysis.safetyConsiderations.length > 0 && (
                  <div className={`card ${styles.safetyCard}`}>
                    <h3 className={styles.subCardTitle}>Safety considerations</h3>
                    <ul className={styles.guidanceList}>
                      {analysis.safetyConsiderations.map((c, i) => (
                        <li key={i} className={styles.guidanceItem}>
                          <span className={styles.safetyDot} aria-hidden="true" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className={styles.guidanceNote}>
                      These are informational observations for human review.
                      They are not certified food-safety assessments.
                    </div>
                  </div>
                )}

                {/* Relevant guidance */}
                <div className={`card ${styles.guidanceCard}`}>
                  <h3 className={styles.subCardTitle}>Relevant guidance</h3>
                  <ul className={styles.guidanceList}>
                    {analysis.relevantGuidance.map((g, i) => (
                      <li key={i} className={styles.guidanceItem}>
                        <span className={styles.guidanceDot} aria-hidden="true" />
                        {g}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.guidanceNote}>
                    Guidance is based on food category and submitted information.
                    Verify with a responsible person before redistribution.
                  </div>
                </div>

                {/* AI reasoning */}
                <div className={`card ${styles.reasoningCard}`}>
                  <h3 className={styles.subCardTitle}>AI reasoning</h3>
                  <p className={styles.reasoning}>{analysis.reasoning}</p>
                  <div className={styles.analysedAt}>
                    Analysis generated: {new Date(analysis.analysedAt).toLocaleString()}
                    {!isLiveSubmission && ' (demo)'}
                  </div>
                </div>

                <div className="notice notice-info">
                  <span>ℹ</span>
                  <span>
                    <strong>Advisory only:</strong> This analysis is generated by the FoodBridge AI
                    analyser and is intended as decision support only. All food safety and
                    redistribution decisions must be verified by a responsible coordinator.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
