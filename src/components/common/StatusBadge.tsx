import type { UrgencyLevel, Priority, RequestStatus } from '../../types'
import styles from './StatusBadge.module.css'

interface UrgencyBadgeProps {
  urgency: UrgencyLevel
}

interface PriorityBadgeProps {
  priority: Priority
}

interface StatusBadgeProps {
  status: RequestStatus
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const map: Record<UrgencyLevel, string> = {
    Critical: 'badge badge-red',
    High: 'badge badge-yellow',
    Medium: 'badge badge-blue',
    Low: 'badge badge-grey',
  }
  return <span className={map[urgency]}>{urgency}</span>
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const map: Record<Priority, string> = {
    High: 'badge badge-red',
    Medium: 'badge badge-yellow',
    Low: 'badge badge-grey',
  }
  return <span className={map[priority]}>{priority} Priority</span>
}

export function RequestStatusBadge({ status }: StatusBadgeProps) {
  const map: Record<RequestStatus, string> = {
    Open: 'badge badge-green',
    'Partially Matched': 'badge badge-yellow',
    Matched: 'badge badge-blue',
    Closed: 'badge badge-grey',
  }
  return <span className={`${map[status]} ${styles.status}`}>{status}</span>
}
