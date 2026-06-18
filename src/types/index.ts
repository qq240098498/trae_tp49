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

export interface RiskConductionEdge {
  id: string
  sourceRiskId: string
  targetRiskId: string
  strength: number
  description: string
  type: 'direct' | 'indirect' | 'cascading'
}

export interface RiskConductionPath {
  id: string
  name: string
  riskIds: string[]
  totalImpact: number
  description: string
  category: string
}

export interface GraphNode {
  id: string
  x: number
  y: number
  risk: Risk
  isHub: boolean
  hubScore: number
  inDegree: number
  outDegree: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  strength: number
  type: 'direct' | 'indirect' | 'cascading'
}

export interface ConductionAnalysisResult {
  hubNodes: Risk[]
  highRiskChains: RiskConductionPath[]
  isolatedNodes: Risk[]
  totalChains: number
  maxChainLength: number
  chainRiskScore: number
}

export const EDGE_TYPE_LABELS: Record<string, string> = {
  direct: '直接传导',
  indirect: '间接影响',
  cascading: '级联效应',
}

export const CHAIN_CATEGORY_LABELS: Record<string, string> = {
  schedule: '进度传导链',
  quality: '质量传导链',
  resource: '资源传导链',
  dependency: '依赖传导链',
}

export type ProjectType = 'agile' | 'waterfall'
export type ProjectStage = 'requirements' | 'development' | 'testing' | 'launch'
export type ThresholdIndicator =
  | 'scheduleDeviation'
  | 'requirementChangeFreq'
  | 'resourceUtilization'
  | 'bugDensity'
  | 'testPassRate'
  | 'dependencyRisk'

export interface ThresholdConfig {
  id: string
  indicator: ThresholdIndicator
  projectType: ProjectType
  projectStage: ProjectStage
  yellowWarning: number
  redWarning: number
  unit: string
  description: string
  recommendationSource: string
  lastUpdated: string
  updatedBy: string
}

export interface ThresholdRecommendation {
  indicator: ThresholdIndicator
  label: string
  yellowWarning: number
  redWarning: number
  unit: string
  confidence: number
  reason: string
  historicalSamples: number
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  agile: '敏捷项目',
  waterfall: '瀑布项目',
}

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  requirements: '需求阶段',
  development: '开发阶段',
  testing: '测试阶段',
  launch: '上线阶段',
}

export const THRESHOLD_INDICATOR_LABELS: Record<ThresholdIndicator, string> = {
  scheduleDeviation: '进度偏差率',
  requirementChangeFreq: '需求变更频次',
  resourceUtilization: '资源利用率',
  bugDensity: '缺陷密度',
  testPassRate: '测试通过率',
  dependencyRisk: '依赖风险指数',
}

export const THRESHOLD_INDICATOR_UNITS: Record<ThresholdIndicator, string> = {
  scheduleDeviation: '%',
  requirementChangeFreq: '次/周',
  resourceUtilization: '%',
  bugDensity: '个/KLOC',
  testPassRate: '%',
  dependencyRisk: '分',
}

export type SimilarityDimension = 'schedule' | 'resource' | 'requirement' | 'dependency' | 'scale' | 'industry'
export type LessonPriority = 'critical' | 'high' | 'medium' | 'low'

export interface HistoricalProject {
  id: string
  name: string
  code: string
  description: string
  startDate: string
  endDate: string
  type: ProjectType
  industry: string
  scale: string
  budget: string
  teamSize: number
  actualDuration: string
  scheduleDeviation: number
  onTimeDelivered: boolean
  overallRating: 'excellent' | 'good' | 'average' | 'poor'
  tags: string[]
  keyRisksEncountered: RiskDimension[]
}

export interface HistoricalRiskRecord {
  id: string
  historicalProjectId: string
  title: string
  description: string
  dimension: RiskDimension
  probability: number
  impact: number
  riskScore: number
  level: RiskLevel
  actualOccurrence: boolean
  actualImpact: string
  mitigationMeasures: string
  mitigationEffectiveness: number
  lessonsLearned: string
}

export interface ProjectReviewConclusion {
  id: string
  historicalProjectId: string
  category: string
  title: string
  conclusion: string
  recommendation: string
  actionableSteps: string[]
  evidenceLinks: string[]
  createdAt: string
  author: string
}

export interface LessonInsight {
  id: string
  title: string
  summary: string
  sourceProjectIds: string[]
  occurrenceCount: number
  relatedDimensions: RiskDimension[]
  priority: LessonPriority
  suggestedActions: string[]
  keywords: string[]
  relevanceScore: number
  matchDetails: {
    dimension: SimilarityDimension
    similarity: number
    explanation: string
  }[]
}

export interface HistoricalLessonsFilter {
  projectType?: ProjectType
  projectStage?: ProjectStage
  dimensions?: RiskDimension[]
  minRelevance?: number
  searchKeyword?: string
}

export const HISTORICAL_PROJECT_TAGS = [
  '支付系统', '电商平台', 'SaaS应用', '数据中台', '移动App',
  '政企项目', '金融科技', '教育系统', '医疗信息化', '物流平台',
]

export const LESSON_PRIORITY_LABELS: Record<LessonPriority, string> = {
  critical: '极高优先',
  high: '高优先',
  medium: '中优先',
  low: '低优先',
}

export const LESSON_PRIORITY_COLORS: Record<LessonPriority, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#22C55E',
}

export const PROJECT_RATING_LABELS: Record<HistoricalProject['overallRating'], string> = {
  excellent: '优秀',
  good: '良好',
  average: '一般',
  poor: '较差',
}

export const PROJECT_RATING_COLORS: Record<HistoricalProject['overallRating'], string> = {
  excellent: '#22C55E',
  good: '#3B82F6',
  average: '#EAB308',
  poor: '#EF4444',
}

export const SIMILARITY_DIMENSION_LABELS: Record<SimilarityDimension, string> = {
  schedule: '进度特征',
  resource: '资源配置',
  requirement: '需求模式',
  dependency: '外部依赖',
  scale: '项目规模',
  industry: '行业领域',
}
