import { useState, useMemo, useEffect } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import {
  DIMENSION_LABELS,
  DIMENSION_COLORS,
  PROJECT_TYPE_LABELS,
  PROJECT_STAGE_LABELS,
  type ProjectType,
  type ProjectStage,
  type RiskDimension,
  LESSON_PRIORITY_LABELS,
  LESSON_PRIORITY_COLORS,
  PROJECT_RATING_LABELS,
  PROJECT_RATING_COLORS,
  SIMILARITY_DIMENSION_LABELS,
  type HistoricalProject,
  type LessonInsight,
} from '@/types'
import {
  BookOpen,
  Search,
  Filter,
  Lightbulb,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  History,
  FileText,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Sparkles,
  Target,
  CheckCircle2,
  Circle,
  ExternalLink,
  Tag,
  Zap,
} from 'lucide-react'

const DIMENSIONS: RiskDimension[] = ['schedule', 'resource', 'requirement', 'dependency']
const PROJECT_TYPES: ProjectType[] = ['agile', 'waterfall']
const PROJECT_STAGES: ProjectStage[] = ['requirements', 'development', 'testing', 'launch']

function getRelevanceColor(score: number): string {
  if (score >= 0.85) return '#EF4444'
  if (score >= 0.7) return '#F97316'
  if (score >= 0.5) return '#EAB308'
  return '#22C55E'
}

function getRelevanceLabel(score: number): string {
  if (score >= 0.85) return '极相关'
  if (score >= 0.7) return '高度相关'
  if (score >= 0.5) return '中度相关'
  return '一般相关'
}

export default function HistoricalLessons() {
  const {
    initialize,
    getHistoricalProjects,
    getHistoricalRiskRecords,
    getProjectReviewConclusions,
    getLessonInsights,
    appliedLessonIds,
    applyLesson,
    unapplyLesson,
    risks,
  } = useRiskStore()

  useMemo(() => { initialize() }, [initialize])

  const [activeTab, setActiveTab] = useState<'insights' | 'projects'>('insights')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDimensions, setSelectedDimensions] = useState<RiskDimension[]>([])
  const [minRelevance, setMinRelevance] = useState(0)
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | 'all'>('all')
  const [selectedProjectStage, setSelectedProjectStage] = useState<ProjectStage | 'all'>('all')
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set(['LI-001']))
  const [selectedProject, setSelectedProject] = useState<HistoricalProject | null>(null)

  const historicalProjects = useMemo(() => getHistoricalProjects(), [getHistoricalProjects])

  const lessonInsights = useMemo(() => {
    const filter: any = {}
    if (searchKeyword.trim()) filter.searchKeyword = searchKeyword.trim()
    if (selectedDimensions.length > 0) filter.dimensions = selectedDimensions
    if (minRelevance > 0) filter.minRelevance = minRelevance
    return getLessonInsights(filter)
  }, [getLessonInsights, searchKeyword, selectedDimensions, minRelevance])

  const filteredProjects = useMemo(() => {
    let result = historicalProjects
    if (selectedProjectType !== 'all') {
      result = result.filter(p => p.type === selectedProjectType)
    }
    if (selectedProjectStage !== 'all') {
      result = result.filter(p => {
        const start = new Date(p.startDate)
        const end = new Date(p.endDate)
        const duration = end.getTime() - start.getTime()
        const elapsed = new Date('2026-06-17').getTime() - start.getTime()
        const progress = Math.min(1, Math.max(0, elapsed / duration))
        if (selectedProjectStage === 'requirements') return progress < 0.25
        if (selectedProjectStage === 'development') return progress >= 0.25 && progress < 0.6
        if (selectedProjectStage === 'testing') return progress >= 0.6 && progress < 0.85
        return progress >= 0.85
      })
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.tags.some(t => t.toLowerCase().includes(kw)) ||
        p.industry.toLowerCase().includes(kw)
      )
    }
    return result
  }, [historicalProjects, selectedProjectType, selectedProjectStage, searchKeyword])

  useEffect(() => {
    if (activeTab !== 'projects') return
    setSelectedProject(prevSelected => {
      if (prevSelected) {
        const stillExists = filteredProjects.some(p => p.id === prevSelected.id)
        if (!stillExists) {
          return filteredProjects.length > 0 ? filteredProjects[0] : null
        }
        return prevSelected
      }
      return filteredProjects.length > 0 ? filteredProjects[0] : prevSelected
    })
  }, [filteredProjects, activeTab])

  const projectRiskMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    getHistoricalRiskRecords().forEach(r => {
      if (!map[r.historicalProjectId]) map[r.historicalProjectId] = []
      map[r.historicalProjectId].push(r)
    })
    return map
  }, [getHistoricalRiskRecords])

  const projectConclusionsMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    getProjectReviewConclusions().forEach(c => {
      if (!map[c.historicalProjectId]) map[c.historicalProjectId] = []
      map[c.historicalProjectId].push(c)
    })
    return map
  }, [getProjectReviewConclusions])

  const toggleLessonExpand = (id: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleDimension = (dim: RiskDimension) => {
    setSelectedDimensions(prev => {
      if (prev.includes(dim)) return prev.filter(d => d !== dim)
      return [...prev, dim]
    })
  }

  const handleToggleApply = (lessonId: string, isApplied: boolean) => {
    if (isApplied) unapplyLesson(lessonId)
    else applyLesson(lessonId)
  }

  const avgRelevance = lessonInsights.length > 0
    ? lessonInsights.reduce((s, l) => s + l.relevanceScore, 0) / lessonInsights.length
    : 0

  const criticalHighCount = lessonInsights.filter(l => l.priority === 'critical' || l.priority === 'high').length
  const appliedCount = appliedLessonIds.length

  const metricCards = [
    { label: '历史项目', value: historicalProjects.length, icon: History, color: '#3B82F6' },
    { label: '复盘结论', value: getProjectReviewConclusions().length, icon: FileText, color: '#8B5CF6' },
    { label: '教训洞察', value: lessonInsights.length, icon: Lightbulb, color: '#F59E0B' },
    { label: '已采纳', value: appliedCount, icon: CheckCircle2, color: '#22C55E' },
  ]

  const selectedProjectRisks = selectedProject
    ? projectRiskMap[selectedProject.id] || []
    : []
  const selectedProjectConclusions = selectedProject
    ? projectConclusionsMap[selectedProject.id] || []
    : []

  const similarSourceProjects = (insight: LessonInsight): HistoricalProject[] => {
    return insight.sourceProjectIds
      .map(id => historicalProjects.find(p => p.id === id))
      .filter((p): p is HistoricalProject => p !== undefined)
  }

  return (
    <div className="w-full p-6 space-y-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: 'var(--accent-amber)' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            历史项目复盘借鉴
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Sparkles size={14} />
          <span>基于 {historicalProjects.length} 个历史项目经验库，智能匹配当前项目场景</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl p-5 border transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #162240, #1A2A4A)',
                borderColor: '#1E3A5F',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.label}</span>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <div className="font-mono text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => setActiveTab('insights')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === 'insights' ? 'var(--accent-amber)' : 'transparent',
                color: activeTab === 'insights' ? '#0B1426' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Zap size={14} />
                <span>智能教训洞察</span>
                {criticalHighCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: activeTab === 'insights' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
                      color: '#EF4444',
                    }}
                  >
                    {criticalHighCount}高优先
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              style={{
                background: activeTab === 'projects' ? 'var(--accent-amber)' : 'transparent',
                color: activeTab === 'projects' ? '#0B1426' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <History size={14} />
                <span>历史项目库</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                placeholder={activeTab === 'insights' ? '搜索关键词、标题...' : '搜索项目名称、标签...'}
                className="w-64 pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-amber-500/30"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-3" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
          {activeTab === 'insights' ? (
            <>
              <div>
                <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <Filter size={11} />
                  <span>风险维度</span>
                </div>
                <div className="flex gap-2">
                  {DIMENSIONS.map(d => {
                    const isActive = selectedDimensions.includes(d)
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDimension(d)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                        style={{
                          background: isActive ? `${DIMENSION_COLORS[d]}20` : 'rgba(255,255,255,0.04)',
                          color: isActive ? DIMENSION_COLORS[d] : 'var(--text-secondary)',
                          border: `1px solid ${isActive ? DIMENSION_COLORS[d] : 'var(--border-color)'}`,
                        }}
                      >
                        {DIMENSION_LABELS[d]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <Target size={11} />
                  <span>最低相关度 ≥ {(minRelevance * 100).toFixed(0)}%</span>
                  <span className="ml-2" style={{ color: getRelevanceColor(minRelevance) }}>
                    {minRelevance > 0 ? getRelevanceLabel(minRelevance) : '全部'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={minRelevance}
                  onChange={e => setMinRelevance(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent-amber) 0%, var(--accent-amber) ${minRelevance * 100}%, rgba(255,255,255,0.08) ${minRelevance * 100}%, rgba(255,255,255,0.08) 100%)`,
                  }}
                />
              </div>

              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="mb-1">匹配统计</div>
                <div className="flex items-center gap-4">
                  <span>平均相关度: <span style={{ color: getRelevanceColor(avgRelevance), fontWeight: 600 }}>{(avgRelevance * 100).toFixed(0)}%</span></span>
                  <span>高+极高优先: <span style={{ color: '#F97316', fontWeight: 600 }}>{criticalHighCount}</span></span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>项目类型</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProjectType('all')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                    style={{
                      background: selectedProjectType === 'all' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedProjectType === 'all' ? '#8B5CF6' : 'var(--text-secondary)',
                      border: `1px solid ${selectedProjectType === 'all' ? '#8B5CF6' : 'var(--border-color)'}`,
                    }}
                  >
                    全部
                  </button>
                  {PROJECT_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedProjectType(t)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                      style={{
                        background: selectedProjectType === t ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                        color: selectedProjectType === t ? '#8B5CF6' : 'var(--text-secondary)',
                        border: `1px solid ${selectedProjectType === t ? '#8B5CF6' : 'var(--border-color)'}`,
                      }}
                    >
                      {PROJECT_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>阶段筛选</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProjectStage('all')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                    style={{
                      background: selectedProjectStage === 'all' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                      color: selectedProjectStage === 'all' ? '#3B82F6' : 'var(--text-secondary)',
                      border: `1px solid ${selectedProjectStage === 'all' ? '#3B82F6' : 'var(--border-color)'}`,
                    }}
                  >
                    全部
                  </button>
                  {PROJECT_STAGES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedProjectStage(s)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                      style={{
                        background: selectedProjectStage === s ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                        color: selectedProjectStage === s ? '#3B82F6' : 'var(--text-secondary)',
                        border: `1px solid ${selectedProjectStage === s ? '#3B82F6' : 'var(--border-color)'}`,
                      }}
                    >
                      {PROJECT_STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                匹配到 <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filteredProjects.length}</span> 个历史项目
              </div>
            </>
          )}
        </div>
      </div>

      {activeTab === 'insights' ? (
        <div className="space-y-4">
          {lessonInsights.length === 0 ? (
            <div className="rounded-xl p-16 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <Lightbulb size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
              <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>暂无匹配的历史教训</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>尝试降低相关度阈值或清除筛选条件</div>
            </div>
          ) : (
            lessonInsights.map((insight, idx) => {
              const isExpanded = expandedLessons.has(insight.id)
              const isApplied = appliedLessonIds.includes(insight.id)
              const relevanceColor = getRelevanceColor(insight.relevanceScore)
              const priorityColor = LESSON_PRIORITY_COLORS[insight.priority]
              const sourceProjects = similarSourceProjects(insight)

              return (
                <div
                  key={insight.id}
                  className="rounded-xl border overflow-hidden transition-all duration-200"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: isApplied ? 'rgba(34,197,94,0.3)' : 'var(--border-color)',
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                        style={{
                          background: `${relevanceColor}15`,
                          color: relevanceColor,
                        }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {insight.title}
                              </h3>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: `${priorityColor}20`, color: priorityColor }}
                              >
                                {LESSON_PRIORITY_LABELS[insight.priority]}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: `${relevanceColor}20`, color: relevanceColor }}
                              >
                                {getRelevanceLabel(insight.relevanceScore)} {(insight.relevanceScore * 100).toFixed(0)}%
                              </span>
                              {isApplied && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                                  <Check size={10} />
                                  已采纳
                                </span>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {insight.summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleToggleApply(insight.id, isApplied)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                              style={{
                                background: isApplied ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                                color: isApplied ? '#EF4444' : '#22C55E',
                                border: `1px solid ${isApplied ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                              }}
                            >
                              {isApplied ? (<><X size={12} />取消采纳</>) : (<><Check size={12} />采纳建议</>)}
                            </button>
                            <button
                              onClick={() => toggleLessonExpand(insight.id)}
                              className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-[rgba(255,255,255,0.05)]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap mt-3">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} style={{ color: '#8B5CF6' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              历史重现 <span style={{ color: '#8B5CF6', fontWeight: 600 }}>{insight.occurrenceCount}</span> 次
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={12} style={{ color: '#F59E0B' }} />
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>关联维度: </span>
                            <div className="flex gap-1">
                              {insight.relatedDimensions.map(d => (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{ background: `${DIMENSION_COLORS[d]}20`, color: DIMENSION_COLORS[d] }}
                                >
                                  {DIMENSION_LABELS[d]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Tag size={12} style={{ color: '#06B6D4' }} />
                            <div className="flex gap-1 flex-wrap">
                              {insight.keywords.slice(0, 4).map(kw => (
                                <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 pt-5 space-y-5" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <ShieldCheck size={14} style={{ color: '#22C55E' }} />
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>建议行动项</span>
                          </div>
                          <div className="space-y-2 pl-6">
                            {insight.suggestedActions.map((action, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <div
                                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
                                >
                                  <span className="text-[10px] font-bold" style={{ color: '#22C55E' }}>{i + 1}</span>
                                </div>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <BarChart3 size={14} style={{ color: '#3B82F6' }} />
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>相似性匹配分析</span>
                            </div>
                            <div className="space-y-2">
                              {insight.matchDetails.map((m, i) => (
                                <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(26,42,74,0.5)' }}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                      {SIMILARITY_DIMENSION_LABELS[m.dimension]}
                                    </span>
                                    <span
                                      className="text-xs font-bold"
                                      style={{ color: getRelevanceColor(m.similarity) }}
                                    >
                                      {(m.similarity * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${m.similarity * 100}%`,
                                        background: getRelevanceColor(m.similarity),
                                      }}
                                    />
                                  </div>
                                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{m.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 mb-3">
                              <History size={14} style={{ color: '#8B5CF6' }} />
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>来源历史项目</span>
                            </div>
                            <div className="space-y-2">
                              {sourceProjects.map(p => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedProject(p)
                                    setActiveTab('projects')
                                  }}
                                  className="rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-[rgba(139,92,246,0.08)]"
                                  style={{ background: 'rgba(26,42,74,0.5)', border: '1px solid transparent' }}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                                        {p.code}
                                      </span>
                                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                                    </div>
                                    <span
                                      className="text-[10px] px-1.5 py-0.5 rounded"
                                      style={{ background: `${PROJECT_RATING_COLORS[p.overallRating]}20`, color: PROJECT_RATING_COLORS[p.overallRating] }}
                                    >
                                      {PROJECT_RATING_LABELS[p.overallRating]}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1"><Clock size={10} />{p.actualDuration}</span>
                                    <span className="flex items-center gap-1">
                                      <TrendingUp size={10} />
                                      偏差 {p.scheduleDeviation}%
                                    </span>
                                    <span className={p.onTimeDelivered ? 'flex items-center gap-1 text-green-400' : 'flex items-center gap-1 text-red-400'}>
                                      {p.onTimeDelivered ? <Check size={10} /> : <X size={10} />}
                                      {p.onTimeDelivered ? '按时交付' : '延期交付'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
            {filteredProjects.length === 0 ? (
              <div className="rounded-xl p-16 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <History size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>暂无历史项目</div>
              </div>
            ) : (
              filteredProjects.map(p => {
                const riskCount = (projectRiskMap[p.id] || []).length
                const conclusionCount = (projectConclusionsMap[p.id] || []).length
                const isSelected = selectedProject?.id === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="rounded-xl p-4 border cursor-pointer transition-all duration-200"
                    style={{
                      background: isSelected ? 'rgba(139,92,246,0.08)' : 'var(--bg-card)',
                      borderColor: isSelected ? 'rgba(139,92,246,0.4)' : 'var(--border-color)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                            {p.code}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: `${PROJECT_RATING_COLORS[p.overallRating]}20`,
                              color: PROJECT_RATING_COLORS[p.overallRating],
                            }}
                          >
                            {PROJECT_RATING_LABELS[p.overallRating]}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</h3>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} style={{ color: '#8B5CF6' }} />
                      )}
                    </div>

                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <Users size={10} style={{ color: '#3B82F6' }} />
                        <span>{p.teamSize}人团队</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <DollarSign size={10} style={{ color: '#22C55E' }} />
                        <span>{p.budget}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={10} style={{ color: '#F59E0B' }} />
                        <span>{p.actualDuration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <TrendingUp size={10} />
                        <span className={p.scheduleDeviation > 15 ? 'text-red-400' : p.scheduleDeviation > 5 ? 'text-yellow-400' : 'text-green-400'}>
                          偏差 {p.scheduleDeviation}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1"><AlertTriangle size={10} style={{ color: '#EF4444' }} />{riskCount}风险</span>
                        <span className="flex items-center gap-1"><FileText size={10} style={{ color: '#8B5CF6' }} />{conclusionCount}复盘</span>
                      </div>
                      <div className="flex gap-1 flex-wrap max-w-[50%] justify-end">
                        {p.keyRisksEncountered.slice(0, 3).map(d => (
                          <span
                            key={d}
                            className="px-1 py-0.5 rounded text-[9px] font-medium"
                            style={{ background: `${DIMENSION_COLORS[d]}20`, color: DIMENSION_COLORS[d] }}
                          >
                            {DIMENSION_LABELS[d]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="col-span-7">
            {!selectedProject ? (
              <div
                className="rounded-xl p-16 border text-center"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', minHeight: '500px' }}
              >
                <FileText size={56} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <div className="text-base mb-2" style={{ color: 'var(--text-secondary)' }}>选择左侧项目查看详情</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>包含项目基本信息、历史风险记录、复盘结论等</div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono px-2 py-1 rounded-md" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                          {selectedProject.code}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                          {PROJECT_TYPE_LABELS[selectedProject.type]}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-md"
                          style={{
                            background: `${PROJECT_RATING_COLORS[selectedProject.overallRating]}20`,
                            color: PROJECT_RATING_COLORS[selectedProject.overallRating],
                          }}
                        >
                          综合评级：{PROJECT_RATING_LABELS[selectedProject.overallRating]}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedProject.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={selectedProject.onTimeDelivered
                        ? 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium'
                        : 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium'}
                        style={{
                          background: selectedProject.onTimeDelivered ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: selectedProject.onTimeDelivered ? '#22C55E' : '#EF4444',
                          border: `1px solid ${selectedProject.onTimeDelivered ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}
                      >
                        {selectedProject.onTimeDelivered ? <Check size={12} /> : <X size={12} />}
                        {selectedProject.onTimeDelivered ? '按时交付' : '延期交付'}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {selectedProject.description}
                  </p>

                  <div className="grid grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>行业领域</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.industry}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>项目规模</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.scale}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>项目预算</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.budget}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>团队规模</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.teamSize} 人</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>开始时间</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.startDate}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>结束时间</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.endDate}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>实际工期</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedProject.actualDuration}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>进度偏差率</div>
                      <div className="text-sm font-bold" style={{
                        color: selectedProject.scheduleDeviation > 15 ? '#EF4444' : selectedProject.scheduleDeviation > 5 ? '#EAB308' : '#22C55E'
                      }}>
                        {selectedProject.scheduleDeviation}%
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {selectedProject.tags.map(t => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)' }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} style={{ color: '#EF4444' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      历史风险记录 ({selectedProjectRisks.length})
                    </h3>
                  </div>

                  {selectedProjectRisks.length === 0 ? (
                    <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>暂无风险记录</div>
                  ) : (
                    <div className="space-y-3">
                      {selectedProjectRisks.map(r => (
                        <div
                          key={r.id}
                          className="rounded-lg p-4"
                          style={{ background: 'rgba(26,42,74,0.5)', border: '1px solid rgba(30,58,95,0.8)' }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: DIMENSION_COLORS[r.dimension] }}
                              />
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: `${DIMENSION_COLORS[r.dimension]}20`, color: DIMENSION_COLORS[r.dimension] }}>
                                {DIMENSION_LABELS[r.dimension]}
                              </span>
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.title}</span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                                style={{
                                  background: r.actualOccurrence ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                  color: r.actualOccurrence ? '#EF4444' : '#22C55E',
                                }}
                              >
                                {r.actualOccurrence ? '实际发生' : '未发生'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                background: r.probability * r.impact >= 16 ? 'rgba(239,68,68,0.15)' : r.probability * r.impact >= 10 ? 'rgba(249,115,22,0.15)' : 'rgba(234,179,8,0.15)',
                                color: r.probability * r.impact >= 16 ? '#EF4444' : r.probability * r.impact >= 10 ? '#F97316' : '#EAB308',
                              }}>
                                P{r.probability}×I{r.impact}={r.probability * r.impact}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>

                          {r.actualOccurrence && (
                            <div className="mb-2 p-2 rounded-md" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#EF4444' }}>实际影响</div>
                              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{r.actualImpact}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
                            <div>
                              <div className="text-[10px] font-medium mb-0.5" style={{ color: '#3B82F6' }}>缓解措施</div>
                              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{r.mitigationMeasures}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-medium" style={{ color: '#22C55E' }}>缓解有效性</span>
                                <span className="text-[10px] font-bold" style={{ color: r.mitigationEffectiveness >= 4 ? '#22C55E' : r.mitigationEffectiveness >= 3 ? '#EAB308' : '#EF4444' }}>
                                  {r.mitigationEffectiveness}/5
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${r.mitigationEffectiveness * 20}%`,
                                    background: r.mitigationEffectiveness >= 4 ? '#22C55E' : r.mitigationEffectiveness >= 3 ? '#EAB308' : '#EF4444',
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 p-2 rounded-md flex items-start gap-1.5" style={{ background: 'rgba(245,158,11,0.08)' }}>
                            <Lightbulb size={12} className="flex-shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                            <div>
                              <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#F59E0B' }}>经验教训</div>
                              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{r.lessonsLearned}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} style={{ color: '#8B5CF6' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      复盘结论 ({selectedProjectConclusions.length})
                    </h3>
                  </div>

                  {selectedProjectConclusions.length === 0 ? (
                    <div className="py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>暂无复盘结论</div>
                  ) : (
                    <div className="space-y-4">
                      {selectedProjectConclusions.map(c => (
                        <div key={c.id} className="rounded-lg p-4" style={{ background: 'rgba(26,42,74,0.5)', border: '1px solid rgba(30,58,95,0.8)' }}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
                                {c.category}
                              </span>
                              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                              <span className="flex items-center gap-1"><Users size={10} />{c.author}</span>
                              <span className="flex items-center gap-1"><Clock size={10} />{c.createdAt}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-medium mb-1" style={{ color: '#EF4444' }}>
                                <AlertTriangle size={10} />问题结论
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.conclusion}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-medium mb-1" style={{ color: '#F59E0B' }}>
                                <Lightbulb size={10} />优化建议
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{c.recommendation}</p>
                            </div>

                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-medium mb-1.5" style={{ color: '#22C55E' }}>
                                <CheckCircle2 size={10} />可执行步骤
                              </div>
                              <div className="space-y-1.5 pl-1">
                                {c.actionableSteps.map((step, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 text-[9px] font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                                      {i + 1}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {c.evidenceLinks.length > 0 && (
                              <div className="pt-2" style={{ borderTop: '1px solid rgba(30,58,95,0.5)' }}>
                                <div className="flex items-center gap-1 text-[10px] font-medium mb-1" style={{ color: '#3B82F6' }}>
                                  <ExternalLink size={10} />佐证材料
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {c.evidenceLinks.map((el, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                                      {el}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
