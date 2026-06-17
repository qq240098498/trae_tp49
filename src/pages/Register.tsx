import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Pencil, X } from 'lucide-react'
import { useRiskStore } from '@/stores/riskStore'
import {
  DIMENSION_LABELS,
  LEVEL_LABELS,
  STATUS_LABELS,
  LEVEL_COLORS,
  LEVEL_BG_COLORS,
  DIMENSION_COLORS,
  PLAN_TYPE_LABELS,
  PLAN_STATUS_LABELS,
  type RiskDimension,
  type RiskLevel,
  type RiskStatus,
} from '@/types'
import { formatDateString } from '@/utils/riskCalc'

const DIMENSIONS: RiskDimension[] = ['schedule', 'resource', 'requirement', 'dependency']
const LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low']
const STATUSES: RiskStatus[] = ['identified', 'assessing', 'mitigating', 'monitoring', 'closed']

const STATUS_BG_COLORS: Record<RiskStatus, string> = {
  identified: 'rgba(59,130,246,0.15)',
  assessing: 'rgba(168,85,247,0.15)',
  mitigating: 'rgba(249,115,22,0.15)',
  monitoring: 'rgba(34,197,94,0.15)',
  closed: 'rgba(107,114,128,0.15)',
}

const STATUS_TEXT_COLORS: Record<RiskStatus, string> = {
  identified: '#3B82F6',
  assessing: '#A855F7',
  mitigating: '#F97316',
  monitoring: '#22C55E',
  closed: '#6B7280',
}

function FilterButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap"
      style={{
        background: active ? (color ?? 'rgba(245,158,11,0.15)') : 'rgba(255,255,255,0.05)',
        color: active ? (color ?? '#F59E0B') : '#94A3B8',
        border: active ? `1px solid ${color ?? '#F59E0B'}` : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {label}
    </button>
  )
}

function ProbabilityImpactMatrix({ probability, impact }: { probability: number; impact: number }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-400 mb-2">概率 × 影响矩阵</div>
      <div className="flex items-end gap-1">
        <div className="text-[10px] text-slate-500 writing-mode-vertical mr-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          概率
        </div>
        <div>
          {[5, 4, 3, 2, 1].map((p) => (
            <div key={p} className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => {
                const score = p * i
                const isActive = p === probability && i === impact
                let bg = 'rgba(34,197,94,0.1)'
                if (score >= 20) bg = 'rgba(239,68,68,0.2)'
                else if (score >= 12) bg = 'rgba(249,115,22,0.15)'
                else if (score >= 6) bg = 'rgba(234,179,8,0.1)'
                return (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-sm flex items-center justify-center text-[10px] transition-all"
                    style={{
                      background: isActive ? LEVEL_COLORS[score >= 20 ? 'critical' : score >= 12 ? 'high' : score >= 6 ? 'medium' : 'low'] : bg,
                      color: isActive ? '#fff' : '#64748B',
                      border: isActive ? '2px solid #fff' : 'none',
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {score}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-7 text-center text-[10px] text-slate-500">
                {i}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 text-center mt-0.5">影响</div>
        </div>
      </div>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { risks, responsePlans, riskHistories, initialize } = useRiskStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const [selectedDimensions, setSelectedDimensions] = useState<Set<RiskDimension>>(new Set())
  const [selectedLevels, setSelectedLevels] = useState<Set<RiskLevel>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<RiskStatus>>(new Set())
  const [search, setSearch] = useState('')
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null)

  const toggleDimension = (d: RiskDimension) => {
    setSelectedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  const toggleLevel = (l: RiskLevel) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(l)) next.delete(l)
      else next.add(l)
      return next
    })
  }

  const toggleStatus = (s: RiskStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (selectedDimensions.size > 0 && !selectedDimensions.has(r.dimension)) return false
      if (selectedLevels.size > 0 && !selectedLevels.has(r.level)) return false
      if (selectedStatuses.size > 0 && !selectedStatuses.has(r.status)) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q) &&
          !r.assignee.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [risks, selectedDimensions, selectedLevels, selectedStatuses, search])

  const selectedRisk = useMemo(() => {
    if (!selectedRiskId) return null
    return risks.find((r) => r.id === selectedRiskId) ?? null
  }, [risks, selectedRiskId])

  const riskResponsePlans = useMemo(() => {
    if (!selectedRiskId) return []
    return responsePlans.filter((p) => p.riskId === selectedRiskId)
  }, [responsePlans, selectedRiskId])

  const riskHistory = useMemo(() => {
    if (!selectedRiskId) return []
    return riskHistories
      .filter((h) => h.riskId === selectedRiskId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  }, [riskHistories, selectedRiskId])

  const relatedRisks = useMemo(() => {
    if (!selectedRisk) return []
    return risks.filter((r) => selectedRisk.relatedRiskIds.includes(r.id))
  }, [risks, selectedRisk])

  const formatFieldName = (field: string): string => {
    const map: Record<string, string> = {
      status: '状态',
      probability: '概率',
      impact: '影响',
      riskScore: '风险值',
      level: '等级',
      assignee: '负责人',
      title: '名称',
      description: '描述',
      dimension: '维度',
    }
    return map[field] ?? field
  }

  const formatFieldValue = (field: string, value: string): string => {
    if (field === 'status') return STATUS_LABELS[value as RiskStatus] ?? value
    if (field === 'level') return LEVEL_LABELS[value as RiskLevel] ?? value
    if (field === 'dimension') return DIMENSION_LABELS[value as RiskDimension] ?? value
    return value
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-white p-6 relative">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">风险登记册</h1>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400 mr-1">维度:</span>
            {DIMENSIONS.map((d) => (
              <FilterButton
                key={d}
                label={DIMENSION_LABELS[d]}
                active={selectedDimensions.has(d)}
                color={DIMENSION_COLORS[d]}
                onClick={() => toggleDimension(d)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400 mr-1">等级:</span>
            {LEVELS.map((l) => (
              <FilterButton
                key={l}
                label={LEVEL_LABELS[l]}
                active={selectedLevels.has(l)}
                color={LEVEL_COLORS[l]}
                onClick={() => toggleLevel(l)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-400 mr-1">状态:</span>
            {STATUSES.map((s) => (
              <FilterButton
                key={s}
                label={STATUS_LABELS[s]}
                active={selectedStatuses.has(s)}
                color={STATUS_TEXT_COLORS[s]}
                onClick={() => toggleStatus(s)}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索风险名称、ID、负责人..."
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <button
              onClick={() => navigate('/assess')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F59E0B] text-[#0A1628] hover:bg-[#D97706] transition-colors whitespace-nowrap"
            >
              + 新增风险
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.1)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.1)]">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">风险名称</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">维度</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">等级</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">风险值</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">负责人</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">识别日期</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500">
                    没有匹配的风险记录
                  </td>
                </tr>
              ) : (
                filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[#1A2A4A] transition-colors cursor-pointer"
                    style={{ borderLeft: `3px solid ${LEVEL_COLORS[risk.level]}` }}
                    onClick={() => setSelectedRiskId(risk.id)}
                  >
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{risk.id}</td>
                    <td className="px-4 py-3 font-medium">{risk.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: `${DIMENSION_COLORS[risk.dimension]}20`,
                          color: DIMENSION_COLORS[risk.dimension],
                        }}
                      >
                        {DIMENSION_LABELS[risk.dimension]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: LEVEL_BG_COLORS[risk.level],
                          color: LEVEL_COLORS[risk.level],
                        }}
                      >
                        {LEVEL_LABELS[risk.level]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-[JetBrains_Mono,monospace] font-semibold">
                      {risk.riskScore}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: STATUS_BG_COLORS[risk.status],
                          color: STATUS_TEXT_COLORS[risk.status],
                        }}
                      >
                        {STATUS_LABELS[risk.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{risk.assignee}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDateString(risk.identifiedDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRiskId(risk.id)
                          }}
                          className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/assess/${risk.id}`)
                          }}
                          className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          共 {filteredRisks.length} 条风险记录
        </div>
      </div>

      {selectedRiskId && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSelectedRiskId(null)}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full w-[480px] bg-[#0F1D33] border-l border-[rgba(255,255,255,0.1)] z-50 overflow-y-auto transition-transform duration-300"
        style={{
          transform: selectedRiskId ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {selectedRisk && (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold mb-1">{selectedRisk.title}</h2>
                <span className="text-xs font-mono text-slate-500">{selectedRisk.id}</span>
              </div>
              <button
                onClick={() => setSelectedRiskId(null)}
                className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-xs text-slate-500 mb-1">描述</div>
                <div className="text-sm text-slate-300 leading-relaxed">{selectedRisk.description}</div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">维度</div>
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: `${DIMENSION_COLORS[selectedRisk.dimension]}20`,
                      color: DIMENSION_COLORS[selectedRisk.dimension],
                    }}
                  >
                    {DIMENSION_LABELS[selectedRisk.dimension]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">等级</div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: LEVEL_BG_COLORS[selectedRisk.level],
                      color: LEVEL_COLORS[selectedRisk.level],
                    }}
                  >
                    {LEVEL_LABELS[selectedRisk.level]}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">风险值</div>
                  <span className="font-[JetBrains_Mono,monospace] text-lg font-bold" style={{ color: LEVEL_COLORS[selectedRisk.level] }}>
                    {selectedRisk.riskScore}
                  </span>
                </div>
              </div>

              <ProbabilityImpactMatrix probability={selectedRisk.probability} impact={selectedRisk.impact} />

              <div>
                <div className="text-xs text-slate-500 mb-1">根本原因</div>
                <div className="text-sm text-slate-300">{selectedRisk.rootCause}</div>
              </div>

              {relatedRisks.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">关联风险</div>
                  <div className="space-y-1.5">
                    {relatedRisks.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                        onClick={() => setSelectedRiskId(r.id)}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: LEVEL_COLORS[r.level] }}
                        />
                        <span className="text-sm">{r.title}</span>
                        <span className="text-xs text-slate-500 ml-auto">{r.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {riskResponsePlans.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">应对计划</div>
                  <div className="space-y-2">
                    {riskResponsePlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{plan.title}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                              background: STATUS_BG_COLORS[plan.status === 'in_progress' ? 'mitigating' : plan.status === 'completed' ? 'closed' : plan.status === 'overdue' ? 'identified' : 'monitoring'],
                              color: STATUS_TEXT_COLORS[plan.status === 'in_progress' ? 'mitigating' : plan.status === 'completed' ? 'closed' : plan.status === 'overdue' ? 'identified' : 'monitoring'],
                            }}
                          >
                            {PLAN_STATUS_LABELS[plan.status]}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">{plan.description}</div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span>{PLAN_TYPE_LABELS[plan.type]}</span>
                          <span>负责人: {plan.assignee}</span>
                          <span>截止: {formatDateString(plan.dueDate)}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${plan.progress}%`,
                              background: LEVEL_COLORS[plan.progress >= 80 ? 'low' : plan.progress >= 50 ? 'medium' : 'high'],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {riskHistory.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">变更历史</div>
                  <div className="space-y-0">
                    {riskHistory.map((h, idx) => (
                      <div key={h.id} className="flex gap-3 relative pb-4">
                        {idx < riskHistory.length - 1 && (
                          <div className="absolute left-[5px] top-3 bottom-0 w-px bg-[rgba(255,255,255,0.1)]" />
                        )}
                        <div className="w-[11px] h-[11px] rounded-full bg-[#F59E0B] mt-1.5 shrink-0 z-10" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-300">
                            <span className="text-slate-500">{formatFieldName(h.field)}</span>
                            {' 由 '}
                            <span className="text-slate-400">{formatFieldValue(h.field, h.oldValue)}</span>
                            {' 变更为 '}
                            <span className="text-white font-medium">{formatFieldValue(h.field, h.newValue)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {formatDateString(h.changedAt)} · {h.changedBy}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
