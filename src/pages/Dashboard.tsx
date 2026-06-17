import { useMemo } from 'react'
import { useRiskStore } from '@/stores/riskStore'
import { DIMENSION_LABELS, DIMENSION_COLORS, type RiskDimension } from '@/types'
import { calculateExposureIndex } from '@/utils/riskCalc'
import { ShieldAlert, AlertTriangle, PlusCircle, Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

function formatRelativeTime(timestamp: string): string {
  const now = new Date('2026-06-17T00:00:00')
  const t = new Date(timestamp)
  const diffMs = now.getTime() - t.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay > 0) return `${diffDay}天前`
  if (diffHour > 0) return `${diffHour}小时前`
  if (diffMin > 0) return `${diffMin}分钟前`
  return '刚刚'
}

function getHeatmapColor(score: number): string {
  if (score <= 4) return '#22C55E'
  if (score <= 8) return '#84CC16'
  if (score <= 12) return '#EAB308'
  if (score <= 16) return '#F97316'
  return '#EF4444'
}

export default function Dashboard() {
  const { risks, trendSnapshots, alerts, markAlertRead, initialize } = useRiskStore()

  useMemo(() => { initialize() }, [initialize])

  const totalRisks = risks.length
  const highRisks = risks.filter(r => r.level === 'critical' || r.level === 'high').length
  const sevenDaysAgo = new Date('2026-06-17')
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const newThisWeek = risks.filter(r => new Date(r.identifiedDate) >= sevenDaysAgo).length
  const exposureIndex = calculateExposureIndex(risks)

  const last10Snapshots = trendSnapshots.slice(-10)
  const last30Snapshots = trendSnapshots.slice(-30)

  const sparkData = {
    total: last10Snapshots.map(s => ({ v: s.totalRisks })),
    high: last10Snapshots.map(s => ({ v: s.highRisks })),
    new: last10Snapshots.map(s => ({ v: s.totalRisks > 0 ? Math.round(s.totalRisks * 0.15) : 0 })),
    exposure: last10Snapshots.map(s => ({ v: s.exposureIndex })),
  }

  const metricCards = [
    { label: '风险总数', value: totalRisks, icon: ShieldAlert, color: '#3B82F6', data: sparkData.total },
    { label: '高风险数', value: highRisks, icon: AlertTriangle, color: '#EF4444', data: sparkData.high },
    { label: '本周新增', value: newThisWeek, icon: PlusCircle, color: '#22C55E', data: sparkData.new },
    { label: '风险暴露度', value: exposureIndex.toFixed(1), icon: Activity, color: '#F59E0B', data: sparkData.exposure },
  ]

  const heatmapData = useMemo(() => {
    const grid: Record<string, number> = {}
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        grid[`${p}-${i}`] = 0
      }
    }
    risks.forEach(r => {
      const key = `${r.probability}-${r.impact}`
      if (key in grid) grid[key]++
    })
    return grid
  }, [risks])

  const maxBubble = useMemo(() => {
    return Math.max(...Object.values(heatmapData), 1)
  }, [heatmapData])

  const dimensionData = useMemo(() => {
    const dims: RiskDimension[] = ['schedule', 'resource', 'requirement', 'dependency']
    return dims.map(d => ({
      name: DIMENSION_LABELS[d],
      value: risks.filter(r => r.dimension === d).length,
      color: DIMENSION_COLORS[d],
    }))
  }, [risks])

  const trendData = useMemo(() => {
    return last30Snapshots.map(s => ({
      date: s.snapshotDate.slice(5),
      totalRisks: s.totalRisks,
      exposureIndex: s.exposureIndex,
    }))
  }, [last30Snapshots])

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [alerts])

  const alertBorderColors: Record<string, string> = {
    critical: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  }

  return (
    <div className="w-full p-6 space-y-6">
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
              <div className="font-mono text-3xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              <div style={{ height: 32 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.data}>
                    <defs>
                      <linearGradient id={`spark-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={card.color}
                      strokeWidth={1.5}
                      fill={`url(#spark-${card.label})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
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
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            风险热力图
          </h3>
          <div className="flex">
            <div className="flex flex-col items-center justify-end mr-2" style={{ height: 280 }}>
              <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>5</span>
              <span className="text-xs flex-1 flex items-center" style={{ color: 'var(--text-muted)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                概率
              </span>
              <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>1</span>
            </div>
            <div className="flex-1">
              <svg viewBox="0 0 300 280" className="w-full">
                {[5, 4, 3, 2, 1].map((p, ri) =>
                  [1, 2, 3, 4, 5].map((i, ci) => {
                    const count = heatmapData[`${p}-${i}`] || 0
                    const score = p * i
                    const cellX = ci * 56 + 10
                    const cellY = ri * 52 + 10
                    const bubbleR = count > 0 ? Math.max(6, (count / maxBubble) * 22) : 0
                    return (
                      <g key={`${p}-${i}`}>
                        <rect
                          x={cellX}
                          y={cellY}
                          width={50}
                          height={46}
                          rx={6}
                          fill={getHeatmapColor(score)}
                          opacity={0.15}
                          className="cursor-pointer transition-opacity duration-150 hover:opacity-40"
                        />
                        {count > 0 && (
                          <circle
                            cx={cellX + 25}
                            cy={cellY + 23}
                            r={bubbleR}
                            fill={getHeatmapColor(score)}
                            opacity={0.7}
                            className="cursor-pointer transition-opacity duration-150 hover:opacity-100"
                          />
                        )}
                        {count > 0 && (
                          <text
                            x={cellX + 25}
                            y={cellY + 27}
                            textAnchor="middle"
                            fill="white"
                            fontSize={11}
                            fontWeight={600}
                            className="pointer-events-none"
                          >
                            {count}
                          </text>
                        )}
                      </g>
                    )
                  })
                )}
              </svg>
              <div className="flex justify-between px-3 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>{i}</span>
                ))}
              </div>
              <div className="text-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>影响</div>
            </div>
          </div>
        </div>

        <div
          className="col-span-7 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            趋势总览
          </h3>
          <div style={{ height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <defs>
                  <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exposureAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#5A6F8E', fontSize: 11 }}
                  axisLine={{ stroke: '#1E3A5F' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#5A6F8E', fontSize: 11 }}
                  axisLine={{ stroke: '#1E3A5F' }}
                  tickLine={false}
                  label={{ value: '风险数量', angle: -90, position: 'insideLeft', fill: '#5A6F8E', fontSize: 11, offset: -5 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#5A6F8E', fontSize: 11 }}
                  axisLine={{ stroke: '#1E3A5F' }}
                  tickLine={false}
                  label={{ value: '暴露度指数', angle: 90, position: 'insideRight', fill: '#5A6F8E', fontSize: 11, offset: -5 }}
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
                    if (name === 'totalRisks') return [value, '风险数量']
                    return [value, '暴露度指数']
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalRisks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#riskAreaGrad)"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalRisks"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3B82F6' }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="exposureIndex"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#exposureAreaGrad)"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="exposureIndex"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div
          className="col-span-5 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            维度分布
          </h3>
          <div className="flex flex-col items-center">
            <div style={{ width: 220, height: 220, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dimensionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {dimensionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#162240',
                      border: '1px solid #1E3A5F',
                      borderRadius: 8,
                      color: '#E8EDF5',
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [`${value} 项`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {totalRisks}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>总计</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
              {dimensionData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {d.name} ({d.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="col-span-7 rounded-xl p-5 border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--accent-amber)' }} />
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              预警通知
            </h3>
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-lg p-3 cursor-pointer transition-colors duration-150 border-l-[3px]"
                style={{
                  background: alert.read ? 'rgba(22,34,64,0.5)' : 'rgba(26,42,74,0.8)',
                  borderLeftColor: alertBorderColors[alert.type] || '#3B82F6',
                }}
                onClick={() => markAlertRead(alert.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {alert.title}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeTime(alert.timestamp)}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {alert.message}
                </p>
              </div>
            ))}
            {sortedAlerts.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无预警通知
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
