export type RiskDimension = 'schedule' | 'resource' | 'requirement' | 'dependency'
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type RiskStatus = 'identified' | 'assessing' | 'mitigating' | 'monitoring' | 'closed'
export type ResponsePlanType = 'prevention' | 'contingency'
export type ResponsePlanStatus = 'planned' | 'in_progress' | 'completed' | 'overdue'

export interface Risk {
  id: string
  title: string
  description: string
  dimension: RiskDimension
  probability: number
  impact: number
  riskScore: number
  level: RiskLevel
  status: RiskStatus
  rootCause: string
  assignee: string
  identifiedDate: string
  lastUpdated: string
  relatedRiskIds: string[]
}

export interface RiskHistory {
  id: string
  riskId: string
  field: string
  oldValue: string
  newValue: string
  changedAt: string
  changedBy: string
}

export interface ResponsePlan {
  id: string
  riskId: string
  type: ResponsePlanType
  title: string
  description: string
  assignee: string
  dueDate: string
  status: ResponsePlanStatus
  progress: number
}

export interface TrendSnapshot {
  id: string
  snapshotDate: string
  totalRisks: number
  highRisks: number
  exposureIndex: number
  dimensionBreakdown: {
    schedule: number
    resource: number
    requirement: number
    dependency: number
  }
}

export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export const DIMENSION_LABELS: Record<RiskDimension, string> = {
  schedule: '进度偏差',
  resource: '资源冲突',
  requirement: '需求变更',
  dependency: '外部依赖',
}

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  critical: '极高',
  high: '高',
  medium: '中',
  low: '低',
}

export const STATUS_LABELS: Record<RiskStatus, string> = {
  identified: '已识别',
  assessing: '评估中',
  mitigating: '缓解中',
  monitoring: '监控中',
  closed: '已关闭',
}

export const PLAN_TYPE_LABELS: Record<ResponsePlanType, string> = {
  prevention: '预防措施',
  contingency: '应急预案',
}

export const PLAN_STATUS_LABELS: Record<ResponsePlanStatus, string> = {
  planned: '已计划',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已逾期',
}

export const LEVEL_COLORS: Record<RiskLevel, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

export const LEVEL_BG_COLORS: Record<RiskLevel, string> = {
  critical: 'rgba(239, 68, 68, 0.15)',
  high: 'rgba(249, 115, 22, 0.15)',
  medium: 'rgba(234, 179, 8, 0.15)',
  low: 'rgba(34, 197, 94, 0.15)',
}

export const DIMENSION_COLORS: Record<RiskDimension, string> = {
  schedule: '#3B82F6',
  resource: '#8B5CF6',
  requirement: '#F59E0B',
  dependency: '#06B6D4',
}
