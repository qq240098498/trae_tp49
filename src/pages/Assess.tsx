import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, X, Crosshair } from 'lucide-react'
import { useRiskStore } from '@/stores/riskStore'
import {
  DIMENSION_LABELS,
  DIMENSION_COLORS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  LEVEL_BG_COLORS,
  STATUS_LABELS,
  type RiskDimension,
  type RiskStatus,
} from '@/types'
import { calculateRiskScore, getRiskLevel } from '@/utils/riskCalc'

const PROB_LABELS = ['很低', '较低', '中等', '较高', '很高']
const DIMENSIONS: RiskDimension[] = ['schedule', 'resource', 'requirement', 'dependency']
const STATUSES: RiskStatus[] = ['identified', 'assessing', 'mitigating', 'monitoring', 'closed']

function getCellColor(score: number, isActive: boolean) {
  if (score >= 20) return { bg: isActive ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.15)', level: 'critical' as const }
  if (score >= 12) return { bg: isActive ? 'rgba(249,115,22,0.5)' : 'rgba(249,115,22,0.15)', level: 'high' as const }
  if (score >= 6) return { bg: isActive ? 'rgba(234,179,8,0.5)' : 'rgba(234,179,8,0.15)', level: 'medium' as const }
  return { bg: isActive ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.15)', level: 'low' as const }
}

export default function Assess() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { risks, addRisk, updateRisk, initialize } = useRiskStore()
  const isEditing = Boolean(id)

  useEffect(() => {
    initialize()
  }, [initialize])

  const existingRisk = useMemo(() => {
    if (!id) return null
    return risks.find(r => r.id === id) ?? null
  }, [risks, id])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dimension, setDimension] = useState<RiskDimension>('schedule')
  const [probability, setProbability] = useState(3)
  const [impact, setImpact] = useState(3)
  const [rootCause, setRootCause] = useState('')
  const [assignee, setAssignee] = useState('')
  const [status, setStatus] = useState<RiskStatus>('identified')
  const [relatedRiskIds, setRelatedRiskIds] = useState<string[]>([])

  useEffect(() => {
    if (existingRisk) {
      setTitle(existingRisk.title)
      setDescription(existingRisk.description)
      setDimension(existingRisk.dimension)
      setProbability(existingRisk.probability)
      setImpact(existingRisk.impact)
      setRootCause(existingRisk.rootCause)
      setAssignee(existingRisk.assignee)
      setStatus(existingRisk.status)
      setRelatedRiskIds(existingRisk.relatedRiskIds)
    }
  }, [existingRisk])

  const riskScore = useMemo(() => calculateRiskScore(probability, impact), [probability, impact])
  const level = useMemo(() => getRiskLevel(riskScore), [riskScore])

  const otherRisks = useMemo(() => {
    return risks.filter(r => r.id !== id)
  }, [risks, id])

  const handleCellClick = useCallback((p: number, i: number) => {
    setProbability(p)
    setImpact(i)
  }, [])

  const toggleRelated = useCallback((riskId: string) => {
    setRelatedRiskIds(prev => {
      if (prev.includes(riskId)) return prev.filter(rid => rid !== riskId)
      return [...prev, riskId]
    })
  }, [])

  const handleSave = () => {
    if (!title.trim()) return
    if (isEditing && id) {
      updateRisk(id, {
        title,
        description,
        dimension,
        probability,
        impact,
        rootCause,
        assignee,
        status,
        relatedRiskIds,
      })
    } else {
      addRisk({
        title,
        description,
        dimension,
        probability,
        impact,
        rootCause,
        assignee,
        status,
        identifiedDate: new Date().toISOString().split('T')[0],
        relatedRiskIds,
      })
    }
    navigate('/register')
  }

  return (
    <div className="text-white w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isEditing ? '编辑风险' : '风险识别与评估'}
          </h1>
          <button
            onClick={() => navigate('/register')}
            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="w-[60%] flex flex-col">
            <div className="bg-[#162240] border border-[#1E3A5F] rounded-xl p-6 flex-1 flex flex-col">
              <div className="text-sm text-slate-400 mb-4 font-medium">评估矩阵</div>

              <div className="flex items-end gap-3 flex-1">
                <div className="flex flex-col items-center justify-center gap-1 pb-8">
                  <span
                    className="text-xs text-slate-500"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    概率
                  </span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className="flex flex-col gap-1.5 w-full">
                    {[5, 4, 3, 2, 1].map(p => (
                      <div key={p} className="flex items-center gap-1.5">
                        <span className="w-5 text-right text-xs text-slate-500">{p}</span>
                        <div className="flex gap-1.5 flex-1">
                          {[1, 2, 3, 4, 5].map(i => {
                            const score = p * i
                            const isActive = p === probability && i === impact
                            const { bg, level: cellLevel } = getCellColor(score, isActive)
                            const hasRisks = risks.some(
                              r => r.probability === p && r.impact === i && r.id !== id
                            )
                            return (
                              <button
                                key={i}
                                onClick={() => handleCellClick(p, i)}
                                className="relative flex-1 aspect-square rounded-lg flex items-center justify-center text-sm font-mono transition-all hover:scale-105"
                                style={{
                                  background: bg,
                                  color: isActive ? '#fff' : '#64748B',
                                  border: isActive
                                    ? `2px solid ${LEVEL_COLORS[cellLevel]}`
                                    : '1px solid rgba(255,255,255,0.06)',
                                  fontWeight: isActive ? 700 : 400,
                                }}
                              >
                                {score}
                                {isActive && (
                                  <span
                                    className="absolute inset-0 rounded-lg animate-pulse"
                                    style={{
                                      border: `2px solid ${LEVEL_COLORS[cellLevel]}`,
                                      boxShadow: `0 0 12px ${LEVEL_COLORS[cellLevel]}80`,
                                    }}
                                  />
                                )}
                                {hasRisks && !isActive && (
                                  <span
                                    className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full"
                                    style={{ background: LEVEL_COLORS[cellLevel] }}
                                  />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 w-full">
                    <span className="w-5" />
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className="flex-1 text-center text-xs text-slate-500">{i}</span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">影响</div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4 pt-4 border-t border-[#1E3A5F]">
                <Crosshair className="w-5 h-5" style={{ color: LEVEL_COLORS[level] }} />
                <div className="text-2xl font-mono font-bold" style={{ color: LEVEL_COLORS[level] }}>
                  风险值: {probability}×{impact}={riskScore}
                </div>
                <span
                  className="px-3 py-1 rounded-md text-sm font-semibold"
                  style={{
                    background: LEVEL_BG_COLORS[level],
                    color: LEVEL_COLORS[level],
                  }}
                >
                  {LEVEL_LABELS[level]}
                </span>
              </div>
            </div>
          </div>

          <div className="w-[40%] bg-[#162240] border border-[#1E3A5F] rounded-xl overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">风险名称</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="输入风险名称"
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">风险描述</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="输入风险描述"
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">风险维度</label>
                <div className="flex gap-2">
                  {DIMENSIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDimension(d)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: dimension === d ? `${DIMENSION_COLORS[d]}25` : 'rgba(255,255,255,0.05)',
                        color: dimension === d ? DIMENSION_COLORS[d] : '#94A3B8',
                        border: dimension === d ? `1px solid ${DIMENSION_COLORS[d]}` : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {DIMENSION_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  概率: <span className="text-white font-medium">{probability}</span>
                  <span className="ml-2 text-xs" style={{ color: LEVEL_COLORS[level] }}>
                    {PROB_LABELS[probability - 1]}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={probability}
                  onChange={e => setProbability(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${LEVEL_COLORS[level]} 0%, ${LEVEL_COLORS[level]} ${(probability - 1) * 25}%, rgba(255,255,255,0.1) ${(probability - 1) * 25}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  {PROB_LABELS.map((label, idx) => (
                    <span key={idx} className="text-[10px] text-slate-600 w-8 text-center">{label}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  影响: <span className="text-white font-medium">{impact}</span>
                  <span className="ml-2 text-xs" style={{ color: LEVEL_COLORS[level] }}>
                    {PROB_LABELS[impact - 1]}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={impact}
                  onChange={e => setImpact(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${LEVEL_COLORS[level]} 0%, ${LEVEL_COLORS[level]} ${(impact - 1) * 25}%, rgba(255,255,255,0.1) ${(impact - 1) * 25}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between mt-1">
                  {PROB_LABELS.map((label, idx) => (
                    <span key={idx} className="text-[10px] text-slate-600 w-8 text-center">{label}</span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">根本原因</label>
                <input
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  placeholder="输入根本原因"
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">负责人</label>
                <input
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="输入负责人"
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">状态</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as RiskStatus)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[#1E3A5F] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
                  style={{ appearance: 'none' }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s} className="bg-[#162240] text-white">
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {otherRisks.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">关联风险</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {otherRisks.map(r => (
                      <label
                        key={r.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={relatedRiskIds.includes(r.id)}
                          onChange={() => toggleRelated(r.id)}
                          className="w-4 h-4 rounded border-[#1E3A5F] accent-[#F59E0B]"
                        />
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: LEVEL_COLORS[r.level] }}
                        />
                        <span className="text-sm text-slate-300 truncate">{r.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#1E3A5F]">
                <button
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#F59E0B] text-[#0B1426] hover:bg-[#D97706] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[#1E3A5F] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
