import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader'
import { UrgencyBadge, RequestStatusBadge, PriorityBadge } from '../components/common/StatusBadge'
import { demoCommunityRequests, demoMatchRecommendations } from '../data/demoData'
import { matchFromAnalysis } from '../services/matchingService'
import { saveActiveDonation } from '../services/donationStore'
import type {
  MatchRecommendation,
  FoodAnalysisResult,
  MatchingResult,
  DonationFormData,
  CommunityRequest,
  ActiveDonation,
} from '../types'
import styles from './CommunityMatchingPage.module.css'

// ─── SessionStorage helpers ───────────────────────────────────────────────────

function getAnalysisResult(): FoodAnalysisResult | null {
  try {
    const raw = sessionStorage.getItem('analysisResult')
    return raw ? (JSON.parse(raw) as FoodAnalysisResult) : null
  } catch {
    return null
  }
}

function getDonorArea(): string {
  try {
    const raw = sessionStorage.getItem('donationForm')
    if (!raw) return ''
    const form = JSON.parse(raw) as DonationFormData
    return form.location ?? ''
  } catch {
    return ''
  }
}

// ─── Confirmation validation ──────────────────────────────────────────────────

interface ConfirmValidation {
  ok: boolean
  reason: string | null
}

function validateConfirmation(
  analysis: FoodAnalysisResult,
  rec: MatchRecommendation,
  requests: CommunityRequest[],
): ConfirmValidation {
  // Safety hard gate
  if (analysis.donationSuitability === 'Not Recommended') {
    return {
      ok: false,
      reason: `Food Analysis marked this donation as "${analysis.donationSuitability}" — it cannot be confirmed for redistribution.`,
    }
  }

  // Request still exists
  const req = requests.find((r) => r.id === rec.communityRequestId)
  if (!req) {
    return { ok: false, reason: 'The selected community request no longer exists in the current data.' }
  }

  // Request still available
  if (req.status !== 'Open' && req.status !== 'Partially Matched') {
    return {
      ok: false,
      reason: `${req.organizationName} is no longer accepting donations (status: ${req.status}).`,
    }
  }

  // Category compatible
  if (rec.matchFactors && !rec.matchFactors.categoryMatch) {
    return {
      ok: false,
      reason: `The food category (${analysis.category}) is not compatible with what ${req.organizationName} has requested ("${req.requestedType}"). Confirm only if the coordinator has verified this is appropriate.`,
    }
  }

  // Quantity not insufficient
  if (rec.matchFactors && !rec.matchFactors.quantityMatch) {
    return {
      ok: false,
      reason: `The available quantity (${analysis.estimatedServings} servings) is below 50% of ${req.organizationName}'s stated need (${req.quantityNeeded}). A partial match this small cannot be confirmed automatically.`,
    }
  }

  return { ok: true, reason: null }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#2d7a4f' : score >= 45 ? '#d97706' : '#8b949e'
  return (
    <div className={styles.scoreBar}>
      <div className={styles.scoreTrack}>
        <div className={styles.scoreFill} style={{ width: `${score}%`, background: color }} />
      </div>
      <span className={styles.scoreValue} style={{ color }}>{score}</span>
    </div>
  )
}

function FactorChips({ rec }: { rec: MatchRecommendation }) {
  const f = rec.matchFactors
  if (!f) return null
  const chips: { label: string; ok: boolean }[] = [
    { label: 'Category', ok: f.categoryMatch },
    { label: f.quantityFullyMet ? 'Quantity: Full' : 'Quantity: Partial', ok: f.quantityMatch },
    { label: 'Available', ok: f.availabilityMatch },
    { label: 'Location', ok: f.locationMatch },
    { label: 'Safety', ok: f.safetyMatch },
  ]
  return (
    <div className={styles.factorChips}>
      {chips.map(({ label, ok }) => (
        <span key={label} className={`badge ${ok ? 'badge-green' : 'badge-grey'} ${styles.factorChip}`}>
          {ok ? '✓' : '✗'} {label}
        </span>
      ))}
    </div>
  )
}

// ─── Confirmation panel ───────────────────────────────────────────────────────

interface ConfirmPanelProps {
  rec: MatchRecommendation
  analysis: FoodAnalysisResult
  requests: CommunityRequest[]
  donorArea: string
  onCancel: () => void
}

function ConfirmPanel({ rec, analysis, requests, donorArea, onCancel }: ConfirmPanelProps) {
  const navigate = useNavigate()
  const validation = validateConfirmation(analysis, rec, requests)
  const req = requests.find((r) => r.id === rec.communityRequestId)

  function handleConfirm() {
    if (!validation.ok || !req) return

    const donation: ActiveDonation = {
      id: `don-${Date.now()}`,
      foodName: analysis.foodName,
      category: analysis.category,
      quantity: analysis.quantity,
      estimatedServings: analysis.estimatedServings,
      donorArea,
      donationSuitability: analysis.donationSuitability,
      confirmedMatch: rec,
      communityRequestId: req.id,
      organizationName: req.organizationName,
      recipientArea: req.area,
      requestedType: req.requestedType,
      status: 'Matched',
      confirmedAt: new Date().toISOString(),
    }

    saveActiveDonation(donation)
    navigate('/donation-status')
  }

  return (
    <div className={`card ${styles.confirmPanel}`}>
      <div className={styles.confirmHeader}>
        <h3 className={styles.confirmTitle}>Confirm Match</h3>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>← Back</button>
      </div>

      <p className={styles.confirmIntro}>
        Review the details below before confirming. This action records the match and begins the
        donation lifecycle. Human verification is still required before redistribution.
      </p>

      <div className={styles.confirmGrid}>
        {/* Food */}
        <div className={styles.confirmSection}>
          <div className={styles.confirmSectionTitle}>Food</div>
          <dl className={styles.confirmDl}>
            <div className={styles.confirmRow}><dt>Name</dt><dd>{analysis.foodName}</dd></div>
            <div className={styles.confirmRow}><dt>Category</dt><dd>{analysis.category}</dd></div>
            <div className={styles.confirmRow}><dt>Quantity</dt><dd>{analysis.quantity}</dd></div>
            <div className={styles.confirmRow}><dt>Servings</dt><dd>{analysis.estimatedServings}</dd></div>
            <div className={styles.confirmRow}><dt>Suitability</dt><dd>{analysis.donationSuitability}</dd></div>
          </dl>
        </div>

        {/* Recipient */}
        <div className={styles.confirmSection}>
          <div className={styles.confirmSectionTitle}>Recipient</div>
          {req ? (
            <dl className={styles.confirmDl}>
              <div className={styles.confirmRow}><dt>Organisation</dt><dd>{req.organizationName}</dd></div>
              <div className={styles.confirmRow}><dt>Requests</dt><dd>{req.requestedType}</dd></div>
              <div className={styles.confirmRow}><dt>Needs</dt><dd>{req.quantityNeeded}</dd></div>
              <div className={styles.confirmRow}><dt>Area</dt><dd>{req.area}</dd></div>
              <div className={styles.confirmRow}><dt>Urgency</dt><dd>{req.urgency}</dd></div>
            </dl>
          ) : (
            <p className={styles.confirmMissing}>Request not found in current data.</p>
          )}
        </div>
      </div>

      {/* Match score & factors */}
      <div className={styles.confirmMatchRow}>
        <div className={styles.confirmSectionTitle}>Match</div>
        <div className={styles.confirmMatchInner}>
          <div className={styles.confirmScoreWrap}>
            <span className={styles.confirmScoreLabel}>Score</span>
            <MatchScoreBar score={rec.matchScore} />
          </div>
          <FactorChips rec={rec} />
          <p className={styles.confirmReason}>{rec.reason}</p>
        </div>
      </div>

      {/* Validation result */}
      {!validation.ok && (
        <div className="notice notice-warning mt-4">
          <span>⚠</span>
          <span><strong>Cannot confirm:</strong> {validation.reason}</span>
        </div>
      )}

      {validation.ok && analysis.donationSuitability === 'Requires Review' && (
        <div className="notice notice-warning mt-4">
          <span>⚠</span>
          <span>
            <strong>Coordinator review required:</strong> Food Analysis indicated this donation
            requires review before redistribution. Confirm only after direct assessment.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className={styles.confirmActions}>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!validation.ok || !req}
        >
          Confirm Match
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityMatchingPage() {
  const analysisResult = getAnalysisResult()
  const donorArea = getDonorArea()
  const isLiveMatch = analysisResult !== null

  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null)
  const [isLoading, setIsLoading] = useState(isLiveMatch)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [selectedRec, setSelectedRec] = useState<MatchRecommendation | null>(null)

  useEffect(() => {
    if (!isLiveMatch || !analysisResult) return

    let cancelled = false
    setIsLoading(true)
    setMatchError(null)

    matchFromAnalysis(analysisResult, demoCommunityRequests, donorArea)
      .then((result) => {
        if (!cancelled) { setMatchingResult(result); setIsLoading(false) }
      })
      .catch(() => {
        if (!cancelled) {
          setMatchError('The matching service encountered an error. Please return to the analysis page and try again.')
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isBlocked = matchingResult?.blocked === true
  const liveMatches = (!isBlocked && matchingResult && !matchingResult.blocked)
    ? matchingResult.matches
    : null

  const pageTag = isLiveMatch ? 'Live Match' : 'Demo Data'
  const pageSubtitle = isLiveMatch
    ? `Matching results for: ${analysisResult!.foodName}`
    : 'Review community food requests and AI-generated match recommendations.'

  // If a match is selected, show the confirmation panel instead of the list
  if (selectedRec && analysisResult) {
    return (
      <div className="page-content">
        <div className="container">
          <PageHeader title="Confirm Match" subtitle="Review and confirm the selected match." tag="Human Approval Required" />
          <ConfirmPanel
            rec={selectedRec}
            analysis={analysisResult}
            requests={demoCommunityRequests}
            donorArea={donorArea}
            onCancel={() => setSelectedRec(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="container">
        <PageHeader title="Community Matching" subtitle={pageSubtitle} tag={pageTag} />

        <div className="notice notice-warning mb-6">
          <span>⚠</span>
          <span>
            <strong>Human approval required:</strong> All match recommendations require review
            and explicit approval by a coordinator before any redistribution action is taken.
            AI recommendations are advisory only.
          </span>
        </div>

        {/* Live analysis context banner */}
        {isLiveMatch && analysisResult && (
          <div className="notice notice-success mb-6">
            <span>✓</span>
            <span>
              <strong>Live analysis connected:</strong> Matching results below are generated from
              the Food Analysis of <strong>{analysisResult.foodName}</strong> (
              {analysisResult.category}, {analysisResult.estimatedServings} servings,
              suitability: <strong>{analysisResult.donationSuitability}</strong>).
            </span>
          </div>
        )}

        {/* Community Requests */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title">Community Requests</h2>
            <span className="demo-label">Demo Data</span>
          </div>
          <p className="section-subtitle">
            Active requests from community organisations. Data shown is simulated for demonstration.
          </p>
          <div className={styles.requestGrid}>
            {demoCommunityRequests.map((req) => (
              <div key={req.id} className={`card ${styles.requestCard}`}>
                <div className={styles.requestCardTop}>
                  <div>
                    <div className={styles.orgName}>{req.organizationName}</div>
                    <div className={styles.requestType}>{req.requestedType}</div>
                  </div>
                  <div className={styles.badges}>
                    <UrgencyBadge urgency={req.urgency} />
                    <RequestStatusBadge status={req.status} />
                  </div>
                </div>
                <dl className={styles.reqDetails}>
                  <div className={styles.reqRow}><dt>Quantity needed</dt><dd>{req.quantityNeeded}</dd></div>
                  <div className={styles.reqRow}><dt>Availability</dt><dd>{req.availabilityRequirement}</dd></div>
                  <div className={styles.reqRow}><dt>Area</dt><dd>{req.area}</dd></div>
                </dl>
                {req.notes && <p className={styles.reqNotes}>{req.notes}</p>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* Match Recommendations */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="section-title">
              {isLiveMatch ? 'Match Recommendations' : 'AI Match Recommendations'}
            </h2>
            <span className="demo-label">AI Advisory</span>
          </div>
          <p className="section-subtitle">
            {isLiveMatch
              ? 'Deterministic matches generated from the real food analysis result. Select a match to review and confirm.'
              : 'Suggested matches between available donations and community requests.'}
          </p>

          {isLoading && (
            <div className={styles.matchLoading}>
              <div className={styles.matchSpinner} aria-hidden="true" />
              <span>Running matching analysis…</span>
            </div>
          )}

          {!isLoading && matchError && (
            <div className="notice notice-warning">
              <span>⚠</span>
              <span><strong>Matching error:</strong> {matchError}</span>
            </div>
          )}

          {!isLoading && !matchError && isBlocked && matchingResult && matchingResult.blocked && (
            <div className={`notice notice-warning ${styles.safetyBlock}`}>
              <span className={styles.safetyBlockIcon}>🚫</span>
              <div>
                <strong>Matching blocked — food not suitable for redistribution</strong>
                <p className="mt-2">{matchingResult.reason}</p>
                <p className="mt-2 text-sm text-secondary">
                  Suitability: <strong>{matchingResult.donationSuitability}</strong> ·
                  Food: <strong>{matchingResult.foodName}</strong>
                </p>
                <Link to="/analysis" className={`btn btn-secondary btn-sm ${styles.safetyBlockBtn}`}>
                  ← Back to Food Analysis
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !matchError && !isBlocked && liveMatches !== null && liveMatches.length === 0 && (
            <div className="notice notice-info">
              <span>ℹ</span>
              <div>
                <strong>No suitable matches found</strong>
                <p className="mt-2">
                  No available community requests currently match the food type, quantity, and
                  location of this donation.
                </p>
                <p className="mt-2 text-sm text-muted">
                  The coordinator should review the community request list above and make a
                  direct allocation if appropriate.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !matchError && !isBlocked && liveMatches !== null && liveMatches.length > 0 && (
            <div className={styles.matchList}>
              {liveMatches.map((rec, idx) => (
                <div key={rec.id} className={`card ${styles.matchCard}`}>
                  <div className={styles.matchHeader}>
                    <div>
                      <span className={styles.matchIndex}>Match {idx + 1}</span>
                      <div className={styles.matchOrg}>{rec.organizationName}</div>
                    </div>
                    <PriorityBadge priority={rec.priority} />
                  </div>

                  <div className={styles.matchBody}>
                    <div className={styles.matchScoreSection}>
                      <div className={styles.scoreLabel}>Match score</div>
                      <MatchScoreBar score={rec.matchScore} />
                      <FactorChips rec={rec} />
                    </div>
                    <div className={styles.matchDetail}>
                      <div className={styles.matchDetailRow}>
                        <span className={styles.detailLabel}>Recommended quantity</span>
                        <span className={styles.detailValue}>{rec.recommendedQuantity}</span>
                      </div>
                      <div className={styles.matchDetailRow}>
                        <span className={styles.detailLabel}>Why this matches</span>
                        <span className={styles.detailValue}>{rec.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.matchFooter}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedRec(rec)}
                    >
                      Select this match →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLiveMatch && !isLoading && !matchError && (
            <>
              <div className={styles.matchList}>
                <DemoMatchList />
              </div>
              <div className="notice notice-info mt-6">
                <span>ℹ</span>
                <span>
                  <strong>Demo mode:</strong> No food analysis was submitted in this session.
                  Submit a donation via <Link to="/donate">Donate Food</Link> and proceed through
                  Food Analysis to see live matching results here.
                </span>
              </div>
            </>
          )}
        </section>

        <div className={styles.pageActions}>
          <Link to="/analysis" className="btn btn-secondary">← Back to Analysis</Link>
          <Link to="/assistant" className="btn btn-outline-primary">Ask AI Assistant</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Demo fallback ────────────────────────────────────────────────────────────

function DemoMatchList() {
  return (
    <>
      {demoMatchRecommendations.map((rec, idx) => (
        <div key={rec.id} className={`card ${styles.matchCard}`}>
          <div className={styles.matchHeader}>
            <div>
              <span className={styles.matchIndex}>Match {idx + 1}</span>
              <div className={styles.matchOrg}>{rec.organizationName}</div>
            </div>
            <PriorityBadge priority={rec.priority} />
          </div>
          <div className={styles.matchBody}>
            <div className={styles.matchScoreSection}>
              <div className={styles.scoreLabel}>Match score</div>
              <MatchScoreBar score={rec.matchScore} />
            </div>
            <div className={styles.matchDetail}>
              <div className={styles.matchDetailRow}>
                <span className={styles.detailLabel}>Recommended quantity</span>
                <span className={styles.detailValue}>{rec.recommendedQuantity}</span>
              </div>
              <div className={styles.matchDetailRow}>
                <span className={styles.detailLabel}>Reason</span>
                <span className={styles.detailValue}>{rec.reason}</span>
              </div>
            </div>
          </div>
          <div className={styles.matchFooter}>
            <span className={styles.approvalLabel}>Demo data — no confirmation available</span>
          </div>
        </div>
      ))}
    </>
  )
}
