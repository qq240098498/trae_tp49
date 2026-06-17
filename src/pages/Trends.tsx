import { useState, useMemo } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import { DIMENSION_LABELS, STATUS_LABELS, type RiskDimension } from '@/types'
import { detectAnomalies } from '@/utils/trendAnalysis'
import { TrendingUp, History, AlertTriangle, ChevronDown, CheckCircle, ScanSearch } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceDot,
  Legend,
} from 'recharts'

type TimeWindow = 7 | 14 | 30

export default function Trends() {
  const { risks, riskHistories, trendSnapshots, initialize } = useRiskStore()
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(30)
  const [selectedRiskId, setSelectedRiskId] = useState<string>('')

  useMemo(() => { initialize() }, [initialize])

  const filteredSnapshots = useMemo(() => {
    return trendSnapshots.slice(-timeWindow)
  }, [trendSnapshots, timeWindow])

  const anomalyIndices = useMemo(() => {
    return detectAnomalies(filteredSnapshots)
  }, [filteredSnapshots])

  const anomalyDateSet = useMemo(() => {
    const s = new Set<string>()
    anomalyIndices.forEach(i => {
      if (filteredSnapshots[i]) s.add(filteredSnapshots[i].snapshotDate)
    })
    return s
  }, [anomalyIndices, filteredSnapshots])

  const areaData = useMemo(() => {
    return filteredSnapshots.map((s, i) => ({
      date: s.snapshotDate.slice(5),
      totalRisks: s.totalRisks,
      highRisks: s.highRisks,
      exposureIndex: s.exposureIndex,
      isAnomaly: anomalyIndices.includes(i),
    }))
  }, [filteredSnapshots, anomalyIndices])

  const radarData = useMemo(() => {
    const dims: RiskDimension[] = ['schedule', 'resource', 'requirement', 'dependency']
    const half = Math.floor(filteredSnapshots.length / 2)
    const currentPeriod = filteredSnapshots.slice(half)
    const previousPeriod = filteredSnapshots.slice(0, half)
    const sumDim = (snaps: typeof filteredSnapshots, dim: RiskDimension) =>
      snaps.reduce((acc, s) => acc + s.dimensionBreakdown[dim], 0)
    return dims.map(d => ({
      dimension: DIMENSION_LABELS[d],
      current: sumDim(currentPeriod, d),
      previous: sumDim(previousPeriod, d),
    }))
  }, [filteredSnapshots])

  const selectedHistories = useMemo(() => {
    if (!selectedRiskId) return []
    return riskHistories
      .filter(h => h.riskId === selectedRiskId)
      .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
  }, [riskHistories, selectedRiskId])

  const anomalySnapshots = useMemo(() => {
    return anomalyIndices.map(i => filteredSnapshots[i]).filter(Boolean)
  }, [anomalyIndices, filteredSnapshots])

  const anomalyThreshold = useMemo(() => {
    if (filteredSnapshots.length < 5) return 0
    const recentExposure = filteredSnapshots.slice(-4).map(s => s.exposureIndex)
    const mean = recentExposure.reduce((a, b) => a + b, 0) / recentExposure.length
    const stdDev = Math.sqrt(
      recentExposure.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentExposure.length
    )
    return Math.round((mean + 1.5 * stdDev) * 10) / 10
  }, [filteredSnapshots])

  const fieldLabels: Record<string, string> = {
    status: '状态',
    probability: '概率',
    impact: '影响',
    riskScore: '风险分值',
    level: '等级',
  }

  const formatFieldValue = (field: string, value: string) => {
    if (field === 'status') return STATUS_LABELS[value as keyof typeof STATUS_LABELS] || value
    return value
  }

  const statusBadgeColor = (value: string) => {
    const map: Record<string, string> = {
      identified: '#5A6F8E',
      assessing: '#3B82F6',
      mitigating: '#F59E0B',
      monitoring: '#8B5CF6',
      closed: '#22C55E',
    }
    return map[value] || '#5A6F8E'
  }

  const timeWindows: { value: TimeWindow; label: string }[] = [
    { value: 7, label: '近7天' },
    { value: 14, label: '近14天' },
    { value: 30, label: '近30天' },
  ]

  const anomalyReferenceDots = useMemo(() => {
    return areaData
      .map((d, i) => ({ ...d, _i: i }))
      .filter(d => d.isAnomaly)
      .map(d => (
        <ReferenceDot
          key={`anomaly-${d._i}`}
          x={d.date}
          y={d.totalRisks}
          r={6}
          fill="#EF4444"
          stroke="#EF4444"
          strokeWidth={2}
          fillOpacity={0.8}
        />
      ))
  }, [areaData])

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={22} style={{ color: 'var(--accent-amber)' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            趋势分析中心
          </h1>
        </div>
        <div
          className="inline-flex rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {timeWindows.map(tw => (
            <button
              key={tw.value}
              onClick={() => setTimeWindow(tw.value)}
              className="px-4 py-1.5 text-sm font-medium transition-colors duration-150"
              style={{
                background: timeWindow === tw.value ? 'var(--accent-amber)' : 'var(--bg-card)',
                color: timeWindow === tw.value ? '#0B1426' : 'var(--text-secondary)',
              }}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl p-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: '#3B82F6' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            风险趋势图
          </h3>
        </div>
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="totalRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="highRiskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#5A6F8E', fontSize: 11 }}
                axisLine={{ stroke: '#1E3A5F' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#5A6F8E', fontSize: 11 }}
                axisLine={{ stroke: '#1E3A5F' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#162240',
                  border: '1px solid #1E3A5F',
                  borderRadius: 8,
                  color: '#E8EDF5',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'totalRisks') return [value, '风险总数']
                  if (name === 'highRisks') return [value, '高风险数']
                  return [value, name]
                }}
              />
              <Legend
                formatter={(value: string) => {
                  if (value === 'totalRisks') return '风险总数'
                  if (value === 'highRisks') return '高风险数'
                  return value
                }}
                wrapperStyle={{ color: '#8899B4', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="totalRisks"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#totalRiskGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
              <Area
                type="monotone"
                dataKey="highRisks"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#highRiskGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#EF4444' }}
              />
              {anomalyReferenceDots}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-5 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ScanSearch size={16} style={{ color: 'var(--accent-amber)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              维度对比雷达
            </h3>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E3A5F" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#8899B4', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  tick={{ fill: '#5A6F8E', fontSize: 10 }}
                  axisLine={{ stroke: '#1E3A5F' }}
                />
                <RechartsRadar
                  name="当前周期"
                  dataKey="current"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <RechartsRadar
                  name="上一周期"
                  dataKey="previous"
                  stroke="#1B3A5C"
                  fill="#1B3A5C"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend
                  wrapperStyle={{ color: '#8899B4', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#162240',
                    border: '1px solid #1E3A5F',
                    borderRadius: 8,
                    color: '#E8EDF5',
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="col-span-7 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={16} style={{ color: '#8B5CF6' }} />
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                风险演变时间线
              </h3>
            </div>
            <div className="relative">
              <select
                value={selectedRiskId}
                onChange={e => setSelectedRiskId(e.target.value)}
                className="appearance-none rounded-lg px-3 py-1.5 pr-8 text-sm border outline-none cursor-pointer"
                style={{
                  background: 'var(--bg-card-hover)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">选择风险...</option>
                {risks.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>
          {!selectedRiskId ? (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              请从下拉列表中选择一个风险以查看演变历史
            </div>
          ) : selectedHistories.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              该风险暂无变更记录
            </div>
          ) : (
            <div className="space-y-0 max-h-[310px] overflow-y-auto pr-2">
              {selectedHistories.map((h, idx) => {
                const isLast = idx === selectedHistories.length - 1
                const isStatusField = h.field === 'status'
                return (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1.5"
                        style={{
                          borderColor: isStatusField ? statusBadgeColor(h.newValue) : 'var(--border-color)',
                          background: isStatusField ? statusBadgeColor(h.newValue) : 'var(--bg-card)',
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-px flex-1 my-1"
                          style={{ background: 'var(--border-color)' }}
                        />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {h.changedAt}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          ·
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {h.changedBy}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>
                          {fieldLabels[h.field] || h.field}
                        </span>
                        {' : '}
                        <span style={{ color: 'var(--text-muted)' }}>
                          {formatFieldValue(h.field, h.oldValue)}
                        </span>
                        {' → '}
                        {isStatusField ? (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{
                              background: statusBadgeColor(h.newValue),
                              color: '#fff',
                            }}
                          >
                            {formatFieldValue(h.field, h.newValue)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-primary)' }}>
                            {formatFieldValue(h.field, h.newValue)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className="rounded-xl p-5 border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: '#EF4444' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            异常检测
          </h3>
          {anomalyThreshold > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
              阈值: {anomalyThreshold}
            </span>
          )}
        </div>
        {anomalySnapshots.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <CheckCircle size={20} style={{ color: '#22C55E' }} />
            <span className="text-sm font-medium" style={{ color: '#22C55E' }}>
              暂无异常波动
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {anomalySnapshots.map(s => (
              <div
                key={s.id}
                className="rounded-lg p-3 border flex items-center justify-between"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.25)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: '#EF4444' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {s.snapshotDate}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    暴露度指数: <span className="font-mono font-semibold" style={{ color: '#EF4444' }}>{s.exposureIndex}</span>
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                  >
                    超出阈值
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
