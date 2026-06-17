import type { RiskLevel } from '@/types'

export function calculateRiskScore(probability: number, impact: number): number {
  return probability * impact
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 20) return 'critical'
  if (score >= 12) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

export function calculateExposureIndex(risks: { probability: number; impact: number }[]): number {
  if (risks.length === 0) return 0
  const totalScore = risks.reduce((sum, r) => sum + r.probability * r.impact, 0)
  return Math.round((totalScore / risks.length) * 10) / 10
}

export function generateRiskId(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const seq = Math.floor(Math.random() * 999) + 1
  return `RSK-${dateStr}-${String(seq).padStart(3, '0')}`
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function formatDateString(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}
