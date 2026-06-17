import type { TrendSnapshot } from '@/types'

export function detectAnomalies(snapshots: TrendSnapshot[]): number[] {
  if (snapshots.length < 5) return []
  const recentExposure = snapshots.slice(-4).map(s => s.exposureIndex)
  const mean = recentExposure.reduce((a, b) => a + b, 0) / recentExposure.length
  const stdDev = Math.sqrt(
    recentExposure.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / recentExposure.length
  )
  const threshold = mean + 1.5 * stdDev
  const anomalies: number[] = []
  snapshots.forEach((s, i) => {
    if (s.exposureIndex > threshold) {
      anomalies.push(i)
    }
  })
  return anomalies
}

export function getTrendDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  const recent = values.slice(-3)
  const earlier = values.slice(-6, -3)
  if (earlier.length === 0) return 'stable'
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
  const diff = recentAvg - earlierAvg
  if (Math.abs(diff) < 0.5) return 'stable'
  return diff > 0 ? 'up' : 'down'
}
