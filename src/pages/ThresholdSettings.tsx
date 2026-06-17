import { useMemo, useState } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STAGE_LABELS,
  THRESHOLD_INDICATOR_LABELS,
  THRESHOLD_INDICATOR_UNITS,
  type ProjectType,
  type ProjectStage,
  type ThresholdIndicator,
  type ThresholdConfig,
} from '@/types'
import { getIndicatorColor } from '@/utils/thresholdRecommendation'
import {
  Settings,
  Gauge,
  Sparkles,
  Check,
  X,
  Edit3,
  Save,
  RefreshCw,
  Info,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Clock,
  User,
  BarChart3,
} from 'lucide-react'

export default function ThresholdSettings() {
  const {
    thresholdConfigs,
    initialize,
    getThresholdConfigs,
    updateThresholdConfig,
    getRecommendations,
    applyRecommendation,
  } = useRiskStore()

  useMemo(() => { initialize() }, [initialize])

  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>('agile')
  const [selectedStage, setSelectedStage] = useState<ProjectStage>('development')
  const [editingId, setEditingId] = useState<string>('')
  const [editValues, setEditValues] = useState<{ yellow: number; red: number }>({ yellow: 0, red: 0 })

  const currentConfigs = useMemo(() => {
    return getThresholdConfigs(selectedProjectType, selectedStage)
  }, [getThresholdConfigs, selectedProjectType, selectedStage])

  const recommendations = useMemo(() => {
    return getRecommendations(selectedProjectType, selectedStage)
  }, [getRecommendations, selectedProjectType, selectedStage])

  const isReverseIndicator = (indicator: ThresholdIndicator): boolean => {
    return indicator === 'testPassRate'
  }

  const handleEditStart = (config: ThresholdConfig) => {
    setEditingId(config.id)
    setEditValues({ yellow: config.yellowWarning, red: config.redWarning })
  }

  const handleEditSave = (id: string) => {
    updateThresholdConfig(id, {
      yellowWarning: editValues.yellow,
      redWarning: editValues.red,
    })
    setEditingId('')
  }

  const handleEditCancel = () => {
    setEditingId('')
  }

  const handleApplyRecommendation = (indicator: ThresholdIndicator) => {
    applyRecommendation(indicator, selectedProjectType, selectedStage)
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return '#22C55E'
    if (confidence >= 0.7) return '#EAB308'
    return '#F97316'
  }

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.85) return '高置信度'
    if (confidence >= 0.7) return '中置信度'
    return '低置信度'
  }

  const projectTypeOptions: { value: ProjectType; label: string }[] = [
    { value: 'agile', label: PROJECT_TYPE_LABELS.agile },
    { value: 'waterfall', label: PROJECT_TYPE_LABELS.waterfall },
  ]

  const stageOptions: { value: ProjectStage; label: string; color: string }[] = [
    { value: 'requirements', label: PROJECT_STAGE_LABELS.requirements, color: '#8B5CF6' },
    { value: 'development', label: PROJECT_STAGE_LABELS.development, color: '#3B82F6' },
    { value: 'testing', label: PROJECT_STAGE_LABELS.testing, color: '#22C55E' },
    { value: 'launch', label: PROJECT_STAGE_LABELS.launch, color: '#F59E0B' },
  ]

  const avgConfidence = recommendations.length > 0
    ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
    : 0

  const metricCards = [
    {
      label: '已配置指标',
      value: currentConfigs.length,
      icon: Gauge,
      color: '#3B82F6',
    },
    {
      label: '推荐指标数',
      value: recommendations.length,
      icon: Sparkles,
      color: '#8B5CF6',
    },
    {
      label: '平均置信度',
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      icon: BarChart3,
      color: getConfidenceColor(avgConfidence),
    },
  ]

  return (
    <div className="w-full p-6 space-y-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={22} style={{ color: 'var(--accent-amber)' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            预警阈值设定
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Info size={14} />
          <span>基于项目类型和阶段智能推荐阈值，避免"一刀切"</span>
        </div>
      </div>

      <div
        className="rounded-xl p-4 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={14} style={{ color: 'var(--accent-amber)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>项目上下文</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>项目类型</div>
            <div className="flex gap-2">
              {projectTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedProjectType(opt.value)}
                  className="px-4 py-2 rounded-lg border text-sm transition-all duration-200"
                  style={{
                    background: selectedProjectType === opt.value
                      ? 'var(--accent-amber)'
                      : 'var(--bg-card-hover)',
                    borderColor: selectedProjectType === opt.value
                      ? 'var(--accent-amber)'
                      : 'var(--border-color)',
                    color: selectedProjectType === opt.value
                      ? '#0B1426'
                      : 'var(--text-secondary)',
                    fontWeight: selectedProjectType === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>当前阶段</div>
            <div className="flex gap-2">
              {stageOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStage(opt.value)}
                  className="px-4 py-2 rounded-lg border text-sm transition-all duration-200"
                  style={{
                    background: selectedStage === opt.value
                      ? `${opt.color}20`
                      : 'var(--bg-card-hover)',
                    borderColor: selectedStage === opt.value
                      ? opt.color
                      : 'var(--border-color)',
                    color: selectedStage === opt.value
                      ? opt.color
                      : 'var(--text-secondary)',
                    fontWeight: selectedStage === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-5 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: '#8B5CF6' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              智能阈值推荐
            </h3>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {recommendations.map((rec) => {
              const color = getIndicatorColor(rec.indicator)
              const existingConfig = currentConfigs.find(c => c.indicator === rec.indicator)
              const isApplied = existingConfig &&
                existingConfig.yellowWarning === rec.yellowWarning &&
                existingConfig.redWarning === rec.redWarning

              return (
                <div
                  key={rec.indicator}
                  className="rounded-lg p-4 border transition-all duration-200"
                  style={{
                    background: isApplied ? 'rgba(34, 197, 94, 0.05)' : 'rgba(26, 42, 74, 0.5)',
                    borderColor: isApplied ? 'rgba(34, 197, 94, 0.3)' : '#1E3A5F',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {rec.label}
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: `${getConfidenceColor(rec.confidence)}20`,
                        color: getConfidenceColor(rec.confidence),
                      }}
                    >
                      {getConfidenceLabel(rec.confidence)} {(rec.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        黄灯阈值 {isReverseIndicator(rec.indicator) ? '(低于)' : '(超过)'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="font-mono text-lg font-semibold"
                          style={{ color: '#EAB308' }}
                        >
                          {rec.yellowWarning}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {rec.unit}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    <div className="flex-1">
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        红灯阈值 {isReverseIndicator(rec.indicator) ? '(低于)' : '(超过)'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="font-mono text-lg font-semibold"
                          style={{ color: '#EF4444' }}
                        >
                          {rec.redWarning}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {rec.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mb-3">
                    <Lightbulb size={12} style={{ color: '#8B5CF6', flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {rec.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <TrendingUp size={12} />
                      <span>基于 {rec.historicalSamples} 个历史同类项目样本</span>
                    </div>
                    <button
                      onClick={() => handleApplyRecommendation(rec.indicator)}
                      disabled={isApplied}
                      className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                      style={{
                        background: isApplied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                        color: isApplied ? '#22C55E' : '#8B5CF6',
                        cursor: isApplied ? 'default' : 'pointer',
                      }}
                    >
                      {isApplied ? <Check size={12} /> : <RefreshCw size={12} />}
                      {isApplied ? '已应用' : '应用推荐'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="col-span-7 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gauge size={16} style={{ color: '#3B82F6' }} />
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                当前阈值配置
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: '#EAB308' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>黄灯</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: '#EF4444' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>红灯</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {currentConfigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Settings size={32} className="mb-3 opacity-30" />
                <span>暂无阈值配置，应用左侧推荐快速开始</span>
              </div>
            ) : (
              currentConfigs.map((config) => {
                const color = getIndicatorColor(config.indicator)
                const isEditing = editingId === config.id
                const isReverse = isReverseIndicator(config.indicator)

                return (
                  <div
                    key={config.id}
                    className="rounded-lg p-4 border transition-all duration-200"
                    style={{
                      background: 'rgba(26, 42, 74, 0.5)',
                      borderColor: '#1E3A5F',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: color }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {THRESHOLD_INDICATOR_LABELS[config.indicator]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleEditSave(config.id)}
                              className="flex items-center gap-1 p-1 rounded transition-colors"
                              style={{ color: '#22C55E' }}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="flex items-center gap-1 p-1 rounded transition-colors"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditStart(config)}
                            className="flex items-center gap-1 p-1 rounded transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 items-center mb-3">
                      <div className="col-span-3">
                        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          黄灯 {isReverse ? '(低于)' : '(超过)'}
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.yellow}
                            onChange={(e) => setEditValues(prev => ({ ...prev, yellow: Number(e.target.value) }))}
                            className="w-full px-2 py-1 rounded border text-sm font-mono outline-none"
                            style={{
                              background: 'var(--bg-card-hover)',
                              borderColor: '#EAB308',
                              color: '#EAB308',
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono text-xl font-semibold"
                              style={{ color: '#EAB308' }}
                            >
                              {config.yellowWarning}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {config.unit || THRESHOLD_INDICATOR_UNITS[config.indicator]}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-3">
                        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          红灯 {isReverse ? '(低于)' : '(超过)'}
                        </div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.red}
                            onChange={(e) => setEditValues(prev => ({ ...prev, red: Number(e.target.value) }))}
                            className="w-full px-2 py-1 rounded border text-sm font-mono outline-none"
                            style={{
                              background: 'var(--bg-card-hover)',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono text-xl font-semibold"
                              style={{ color: '#EF4444' }}
                            >
                              {config.redWarning}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {config.unit || THRESHOLD_INDICATOR_UNITS[config.indicator]}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-6">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: isReverse ? '100%' : `${Math.min(config.redWarning, 100)}%`,
                              background: isReverse
                                ? `linear-gradient(to right, #EF4444 0%, #EF4444 ${100 - config.redWarning}%, #EAB308 ${100 - config.redWarning}%, #EAB308 ${100 - config.yellowWarning}%, #22C55E ${100 - config.yellowWarning}%, #22C55E 100%)`
                                : `linear-gradient(to right, #22C55E 0%, #22C55E ${config.yellowWarning}%, #EAB308 ${config.yellowWarning}%, #EAB308 ${config.redWarning}%, #EF4444 ${config.redWarning}%, #EF4444 100%)`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>正常</span>
                          <span style={{ color: '#EAB308' }}>黄灯区</span>
                          <span style={{ color: '#EF4444' }}>红灯区</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(30, 58, 95, 0.5)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {config.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex items-center gap-1">
                          <Clock size={10} />
                          <span>{config.lastUpdated}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User size={10} />
                          <span>{config.updatedBy}</span>
                        </div>
                      </div>
                    </div>

                    {config.recommendationSource && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        <Sparkles size={10} style={{ color: '#8B5CF6' }} />
                        <span style={{ color: 'var(--text-muted)' }}>{config.recommendationSource}</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} style={{ color: '#06B6D4' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            阈值设置说明
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg p-4" style={{ background: 'rgba(26, 42, 74, 0.5)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ background: '#22C55E' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>正常区间</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              指标值处于正常范围内，无需特别关注，按常规项目节奏推进即可。
            </p>
          </div>

          <div className="rounded-lg p-4" style={{ background: 'rgba(26, 42, 74, 0.5)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ background: '#EAB308' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>黄灯预警</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              指标超过/低于黄灯阈值，项目经理需关注趋势变化，分析原因并制定预防措施。
            </p>
          </div>

          <div className="rounded-lg p-4" style={{ background: 'rgba(26, 42, 74, 0.5)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded" style={{ background: '#EF4444' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>红灯预警</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              指标超过/低于红灯阈值，必须立即启动应急预案，上报项目管理层，组织风险应对会议。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
