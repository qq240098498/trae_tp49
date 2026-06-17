import { useMemo, useState } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import RiskConductionGraph from '@/components/RiskConductionGraph'
import {
  DIMENSION_LABELS,
  DIMENSION_COLORS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  CHAIN_CATEGORY_LABELS,
  EDGE_TYPE_LABELS,
  type RiskConductionPath,
} from '@/types'
import {
  GitBranch,
  Zap,
  AlertTriangle,
  Link2,
  ChevronRight,
  Network,
  Layers,
  Target,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react'

export default function Conduction() {
  const { risks, conductionEdges, conductionPaths, getConductionAnalysis, initialize, getRelatedRisks } = useRiskStore()
  const [selectedRiskId, setSelectedRiskId] = useState<string>('')
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  useMemo(() => { initialize() }, [initialize])

  const analysis = useMemo(() => getConductionAnalysis(), [getConductionAnalysis])

  const selectedRisk = useMemo(() => {
    if (!selectedRiskId) return null
    return risks.find(r => r.id === selectedRiskId) || null
  }, [selectedRiskId, risks])

  const relatedRisks = useMemo(() => {
    if (!selectedRiskId) return []
    return getRelatedRisks(selectedRiskId)
  }, [selectedRiskId, getRelatedRisks])

  const selectedChain = useMemo(() => {
    if (!selectedChainId) return null
    return conductionPaths.find(p => p.id === selectedChainId) || null
  }, [selectedChainId, conductionPaths])

  const metricCards = [
    { label: '传导链路数', value: analysis.totalChains, icon: GitBranch, color: '#3B82F6' },
    { label: '关键枢纽节点', value: analysis.hubNodes.length, icon: Zap, color: '#F59E0B' },
    { label: '最长链路', value: `${analysis.maxChainLength}级`, icon: Layers, color: '#8B5CF6' },
    { label: '链路平均风险分', value: analysis.chainRiskScore.toFixed(1), icon: ShieldAlert, color: '#EF4444' },
  ]

  const edgeTypeLegend = [
    { type: 'direct', label: '直接传导', color: '#3B82F6' },
    { type: 'indirect', label: '间接影响', color: '#8B5CF6' },
    { type: 'cascading', label: '级联效应', color: '#EF4444' },
  ]

  const handleRiskClick = (risk: { id: string }) => {
    setSelectedRiskId(risk.id === selectedRiskId ? '' : risk.id)
    setSelectedChainId('')
  }

  const handleChainClick = (chain: RiskConductionPath) => {
    setSelectedChainId(chain.id === selectedChainId ? '' : chain.id)
    if (chain.riskIds.length > 0) {
      setSelectedRiskId(chain.riskIds[0])
    }
  }

  const getChainRiskColor = (score: number) => {
    if (score >= 40) return '#EF4444'
    if (score >= 30) return '#F97316'
    if (score >= 20) return '#EAB308'
    return '#22C55E'
  }

  return (
    <div className="w-full p-6 space-y-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network size={22} style={{ color: 'var(--accent-amber)' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            风险关联分析
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Info size={14} />
          <span>识别风险传导链路，定位关键枢纽节点</span>
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

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-8 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Network size={16} style={{ color: '#3B82F6' }} />
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                风险传导图谱
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>枢纽节点</span>
              </div>
              {edgeTypeLegend.map(item => (
                <div key={item.type} className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 rounded" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <RiskConductionGraph
            risks={risks}
            edges={conductionEdges}
            selectedRiskId={selectedRiskId || undefined}
            onRiskClick={handleRiskClick}
            height={440}
          />
        </div>

        <div
          className="col-span-4 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: '#F59E0B' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              关键枢纽节点
            </h3>
          </div>
          <div className="space-y-3">
            {analysis.hubNodes.map((risk, index) => (
              <div
                key={risk.id}
                className={`rounded-lg p-3 border cursor-pointer transition-all duration-200 ${
                  selectedRiskId === risk.id ? 'ring-2 ring-amber-500' : ''
                }`}
                style={{
                  background: selectedRiskId === risk.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(26, 42, 74, 0.5)',
                  borderColor: selectedRiskId === risk.id ? '#F59E0B' : '#1E3A5F',
                }}
                onClick={() => handleRiskClick(risk)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, #F59E0B, #F97316)` }}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {risk.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--bg-card-hover)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {DIMENSION_LABELS[risk.dimension]}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'var(--accent-amber)' }}
                      >
                        {risk.riskScore}分
                      </span>
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      连接 {getRelatedRisks(risk.id).length} 个风险节点
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {analysis.hubNodes.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无枢纽节点
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-7 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} style={{ color: '#8B5CF6' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              高风险传导链
            </h3>
          </div>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {analysis.highRiskChains.map((chain) => (
              <div
                key={chain.id}
                className={`rounded-lg p-4 border cursor-pointer transition-all duration-200 ${
                  selectedChainId === chain.id ? 'ring-2 ring-purple-500' : ''
                }`}
                style={{
                  background: selectedChainId === chain.id ? 'rgba(139, 92, 246, 0.1)' : 'rgba(26, 42, 74, 0.5)',
                  borderColor: selectedChainId === chain.id ? '#8B5CF6' : '#1E3A5F',
                }}
                onClick={() => handleChainClick(chain)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#8B5CF6',
                      }}
                    >
                      {CHAIN_CATEGORY_LABELS[chain.category] || '传导链'}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {chain.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>综合风险</span>
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: getChainRiskColor(chain.totalImpact) }}
                    >
                      {chain.totalImpact}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {chain.riskIds.map((riskId, idx) => {
                    const risk = risks.find(r => r.id === riskId)
                    return (
                      <div key={riskId} className="flex items-center gap-1">
                        <div
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            background: risk
                              ? `rgba(255,255,255,0.08)`
                              : 'var(--bg-card-hover)',
                            color: risk
                              ? `var(--text-secondary)`
                              : 'var(--text-muted)',
                            border: `1px solid ${risk ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}`,
                          }}
                        >
                          {risk ? (risk.title.length > 6 ? risk.title.slice(0, 6) + '...' : risk.title) : riskId}
                        </div>
                        {idx < chain.riskIds.length - 1 && (
                          <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  {chain.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="col-span-5 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={16} style={{ color: '#06B6D4' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              风险详情
            </h3>
          </div>

          {!selectedRisk ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Link2 size={32} className="mb-3 opacity-30" />
              <span>点击图谱或列表中的风险节点查看详情</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: DIMENSION_COLORS[selectedRisk.dimension] }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {DIMENSION_LABELS[selectedRisk.dimension]}
                  </span>
                </div>
                <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedRisk.title}
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>风险分值</div>
                  <div
                    className="text-xl font-mono font-semibold"
                    style={{ color: LEVEL_COLORS[selectedRisk.level] }}
                  >
                    {selectedRisk.riskScore}
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>概率</div>
                  <div className="text-xl font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedRisk.probability}
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 text-center"
                  style={{ background: 'var(--bg-card-hover)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>影响</div>
                  <div className="text-xl font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedRisk.impact}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>风险描述</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {selectedRisk.description}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    关联风险 ({relatedRisks.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {relatedRisks.map(risk => (
                    <div
                      key={risk.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => handleRiskClick(risk)}
                    >
                      <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {risk.title}
                      </span>
                      <span
                        className="text-xs font-mono ml-auto"
                        style={{ color: LEVEL_COLORS[risk.level] }}
                      >
                        {risk.riskScore}
                      </span>
                    </div>
                  ))}
                  {relatedRisks.length === 0 && (
                    <div className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                      暂无关联风险
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {analysis.isolatedNodes.length > 0 && (
        <div
          className="rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: '#F97316' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              孤立风险节点
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#F97316' }}>
              {analysis.isolatedNodes.length} 个
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.isolatedNodes.map(risk => (
              <div
                key={risk.id}
                className="px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(249, 115, 22, 0.05)',
                  borderColor: 'rgba(249, 115, 22, 0.3)',
                }}
                onClick={() => handleRiskClick(risk)}
              >
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {risk.title}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {DIMENSION_LABELS[risk.dimension]} · {LEVEL_LABELS[risk.level]}风险
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            提示：孤立风险节点尚未建立传导关联，建议评估其是否存在潜在传导路径
          </p>
        </div>
      )}
    </div>
  )
}
