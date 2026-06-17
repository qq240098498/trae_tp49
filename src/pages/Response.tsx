import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Zap, CheckCircle, AlertTriangle, User, Calendar, X, ChevronDown, TrendingDown } from 'lucide-react'
import { useRiskStore } from '@/stores/riskStore'
import { PLAN_TYPE_LABELS, PLAN_STATUS_LABELS, LEVEL_COLORS } from '@/types'
import type { ResponsePlanType, ResponsePlanStatus } from '@/types'
import { formatDateString } from '@/utils/riskCalc'

const STATUS_COLORS: Record<ResponsePlanStatus, string> = {
  planned: '#6B7280',
  in_progress: '#F59E0B',
  completed: '#22C55E',
  overdue: '#EF4444',
}

const STATUS_BG: Record<ResponsePlanStatus, string> = {
  planned: 'rgba(107,114,128,0.15)',
  in_progress: 'rgba(245,158,11,0.15)',
  completed: 'rgba(34,197,94,0.15)',
  overdue: 'rgba(239,68,68,0.15)',
}

const PROGRESS_BAR_COLORS: Record<ResponsePlanStatus, string> = {
  completed: '#22C55E',
  in_progress: '#F59E0B',
  overdue: '#EF4444',
  planned: '#6B7280',
}

export default function Response() {
  const navigate = useNavigate()
  const { risks, riskHistories, responsePlans, addResponsePlan, updateResponsePlan, initialize } = useRiskStore()

  useEffect(() => { initialize() }, [initialize])

  const [activeTab, setActiveTab] = useState<ResponsePlanType>('prevention')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editProgress, setEditProgress] = useState(0)

  const [newPlan, setNewPlan] = useState({
    riskId: '',
    type: 'prevention' as ResponsePlanType,
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
  })

  const filteredPlans = useMemo(() => {
    return responsePlans.filter(p => p.type === activeTab)
  }, [responsePlans, activeTab])

  const preventionCount = responsePlans.filter(p => p.type === 'prevention').length
  const contingencyCount = responsePlans.filter(p => p.type === 'contingency').length
  const completedCount = responsePlans.filter(p => p.status === 'completed').length
  const overdueCount = responsePlans.filter(p => p.status === 'overdue').length

  const statCards = [
    { label: '预防措施数', value: preventionCount, icon: Shield, color: '#3B82F6' },
    { label: '应急预案数', value: contingencyCount, icon: Zap, color: '#F59E0B' },
    { label: '已完成数', value: completedCount, icon: CheckCircle, color: '#22C55E' },
    { label: '逾期数', value: overdueCount, icon: AlertTriangle, color: '#EF4444' },
  ]

  const getRiskTitle = (riskId: string) => {
    const risk = risks.find(r => r.id === riskId)
    return risk ? risk.title : riskId
  }

  const isOverdue = (plan: { dueDate: string; status: ResponsePlanStatus }) => {
    if (plan.status === 'completed') return false
    return new Date(plan.dueDate) < new Date()
  }

  const handleStartEdit = (planId: string, currentProgress: number) => {
    setEditingPlanId(planId)
    setEditProgress(currentProgress)
  }

  const handleSaveProgress = (planId: string) => {
    const newStatus: ResponsePlanStatus = editProgress >= 100 ? 'completed' : editProgress > 0 ? 'in_progress' : 'planned'
    updateResponsePlan(planId, { progress: editProgress, status: newStatus })
    setEditingPlanId(null)
  }

  const handleCancelEdit = () => {
    setEditingPlanId(null)
  }

  const handleAddPlan = () => {
    if (!newPlan.riskId || !newPlan.title) return
    addResponsePlan({
      riskId: newPlan.riskId,
      type: newPlan.type,
      title: newPlan.title,
      description: newPlan.description,
      assignee: newPlan.assignee,
      dueDate: newPlan.dueDate,
      status: 'planned',
      progress: 0,
    })
    setNewPlan({ riskId: '', type: 'prevention', title: '', description: '', assignee: '', dueDate: '' })
    setShowAddModal(false)
  }

  const completedPlans = useMemo(() => {
    return responsePlans.filter(p => p.status === 'completed')
  }, [responsePlans])

  const effectivenessData = useMemo(() => {
    return completedPlans.map(plan => {
      const histories = riskHistories.filter(h => h.riskId === plan.riskId && h.field === 'riskScore')
      if (histories.length === 0) return null
      const sorted = [...histories].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
      const before = sorted.length > 1 ? Number(sorted[0].oldValue) : Number(sorted[0].oldValue)
      const after = Number(sorted[sorted.length - 1].newValue)
      return { plan, before, after, improved: after < before }
    }).filter(Boolean) as { plan: typeof completedPlans[0]; before: number; after: number; improved: boolean }[]
  }, [completedPlans, riskHistories])

  return (
    <div className="min-h-screen bg-[#0A1628] text-white p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">响应预案管理</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#F59E0B] text-[#0A1628] hover:bg-[#D97706] transition-colors whitespace-nowrap"
          >
            + 新增预案
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-xl p-4 border transition-all duration-200 hover:scale-[1.02]"
                style={{ background: '#162240', borderColor: '#1E3A5F' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{card.label}</span>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <div className="font-mono text-2xl font-semibold">{card.value}</div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-[#162240] border border-[#1E3A5F] w-fit">
          {(['prevention', 'contingency'] as ResponsePlanType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-md text-sm transition-all"
              style={{
                background: activeTab === tab ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: activeTab === tab ? '#F59E0B' : '#94A3B8',
                border: activeTab === tab ? '1px solid #F59E0B' : '1px solid transparent',
              }}
            >
              {PLAN_TYPE_LABELS[tab]}
            </button>
          ))}
        </div>

        {filteredPlans.length === 0 ? (
          <div className="text-center py-16 text-slate-500 rounded-xl border border-[#1E3A5F] bg-[#162240]">
            暂无{PLAN_TYPE_LABELS[activeTab]}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {filteredPlans.map(plan => {
              const overdue = isOverdue(plan)
              const effectiveStatus: ResponsePlanStatus = overdue && plan.status !== 'completed' ? 'overdue' : plan.status
              const barColor = PROGRESS_BAR_COLORS[effectiveStatus]

              return (
                <div
                  key={plan.id}
                  className="rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                  style={{ background: '#162240', borderColor: '#1E3A5F' }}
                >
                  <div className="h-1" style={{ background: barColor }} />

                  <div className="p-5">
                    <div className="text-xs text-slate-500 mb-2 cursor-pointer hover:text-[#3B82F6] transition-colors" onClick={() => navigate('/register')}>
                      关联风险: {getRiskTitle(plan.riskId)}
                    </div>

                    <h3 className="text-base font-semibold mb-1">{plan.title}</h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{plan.description}</p>

                    <div className="flex items-center gap-4 mb-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <User size={14} />
                        {plan.assignee}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {formatDateString(plan.dueDate)}
                        {overdue && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(239,68,68,0.15)] text-[#EF4444]">
                            已逾期
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: STATUS_BG[effectiveStatus], color: STATUS_COLORS[effectiveStatus] }}
                      >
                        {PLAN_STATUS_LABELS[effectiveStatus]}
                      </span>
                    </div>

                    {editingPlanId === plan.id ? (
                      <div className="mb-3">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={editProgress}
                            onChange={e => setEditProgress(Number(e.target.value))}
                            className="flex-1 accent-[#F59E0B]"
                          />
                          <span className="text-sm font-mono w-10 text-right">{editProgress}%</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveProgress(plan.id)}
                            className="px-3 py-1 rounded text-xs bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 rounded text-xs bg-[rgba(255,255,255,0.1)] text-slate-300 hover:bg-[rgba(255,255,255,0.15)] transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span>进度</span>
                          <span className="font-mono">{plan.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${plan.progress}%`, background: barColor }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                      <button
                        onClick={() => handleStartEdit(plan.id, plan.progress)}
                        className="px-3 py-1.5 rounded text-xs bg-[rgba(255,255,255,0.05)] text-slate-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors border border-[rgba(255,255,255,0.08)]"
                      >
                        更新进度
                      </button>
                      <button
                        onClick={() => navigate('/register')}
                        className="px-3 py-1.5 rounded text-xs bg-[rgba(255,255,255,0.05)] text-slate-300 hover:bg-[rgba(255,255,255,0.1)] transition-colors border border-[rgba(255,255,255,0.08)]"
                      >
                        查看风险
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="rounded-xl border p-5" style={{ background: '#162240', borderColor: '#1E3A5F' }}>
          <h2 className="text-lg font-semibold mb-4">效果评估</h2>

          {effectivenessData.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              暂无已完成预案的效果评估数据
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {effectivenessData.map(({ plan, before, after, improved }) => (
                <div
                  key={plan.id}
                  className="rounded-lg p-4 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
                >
                  <div className="text-sm font-medium mb-3">{plan.title}</div>
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">措施前</div>
                      <div className="font-mono text-lg font-semibold text-[#EF4444]">{before}</div>
                    </div>
                    <div className="flex items-center">
                      {improved ? (
                        <TrendingDown size={20} className="text-[#22C55E]" />
                      ) : (
                        <TrendingDown size={20} className="text-[#EF4444] rotate-180" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">措施后</div>
                      <div
                        className="font-mono text-lg font-semibold"
                        style={{ color: improved ? '#22C55E' : '#EF4444' }}
                      >
                        {after}
                      </div>
                    </div>
                    {improved && (
                      <div className="ml-auto px-2 py-1 rounded text-xs bg-[rgba(34,197,94,0.15)] text-[#22C55E]">
                        风险降低 {before - after}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <div
            className="w-[480px] rounded-xl border p-6"
            style={{ background: '#0F1D33', borderColor: '#1E3A5F' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">新增预案</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">关联风险</label>
                <div className="relative">
                  <select
                    value={newPlan.riskId}
                    onChange={e => setNewPlan(prev => ({ ...prev, riskId: e.target.value }))}
                    className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-white appearance-none focus:outline-none focus:border-[#F59E0B]"
                  >
                    <option value="" className="bg-[#0F1D33]">请选择关联风险</option>
                    {risks.map(r => (
                      <option key={r.id} value={r.id} className="bg-[#0F1D33]">{r.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">预案类型</label>
                <div className="flex gap-4">
                  {(['prevention', 'contingency'] as ResponsePlanType[]).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="planType"
                        value={t}
                        checked={newPlan.type === t}
                        onChange={() => setNewPlan(prev => ({ ...prev, type: t }))}
                        className="accent-[#F59E0B]"
                      />
                      <span className="text-sm">{PLAN_TYPE_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">预案标题</label>
                <input
                  value={newPlan.title}
                  onChange={e => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入预案标题"
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">描述</label>
                <textarea
                  value={newPlan.description}
                  onChange={e => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入预案描述"
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F59E0B] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">负责人</label>
                <input
                  value={newPlan.assignee}
                  onChange={e => setNewPlan(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="请输入负责人"
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5">截止日期</label>
                <input
                  type="date"
                  value={newPlan.dueDate}
                  onChange={e => setNewPlan(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#F59E0B] [color-scheme:dark]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddPlan}
                  disabled={!newPlan.riskId || !newPlan.title}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#F59E0B] text-[#0A1628] hover:bg-[#D97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-[rgba(255,255,255,0.05)] text-slate-300 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
