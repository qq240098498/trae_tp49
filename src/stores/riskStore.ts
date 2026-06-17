import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Risk, RiskHistory, ResponsePlan, TrendSnapshot, Alert } from '@/types'
import { mockRisks, mockRiskHistories, mockResponsePlans, mockTrendSnapshots, mockAlerts } from '@/data/mockData'
import { calculateRiskScore, getRiskLevel, generateRiskId, generateId } from '@/utils/riskCalc'

interface RiskStore {
  risks: Risk[]
  riskHistories: RiskHistory[]
  responsePlans: ResponsePlan[]
  trendSnapshots: TrendSnapshot[]
  alerts: Alert[]
  initialized: boolean

  initialize: () => void
  addRisk: (risk: Omit<Risk, 'id' | 'riskScore' | 'level' | 'lastUpdated'>) => Risk
  updateRisk: (id: string, updates: Partial<Risk>) => void
  deleteRisk: (id: string) => void
  addResponsePlan: (plan: Omit<ResponsePlan, 'id'>) => void
  updateResponsePlan: (id: string, updates: Partial<ResponsePlan>) => void
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void
}

export const useRiskStore = create<RiskStore>()(
  persist(
    (set, get) => ({
      risks: [],
      riskHistories: [],
      responsePlans: [],
      trendSnapshots: [],
      alerts: [],
      initialized: false,

      initialize: () => {
        if (!get().initialized) {
          set({
            risks: mockRisks,
            riskHistories: mockRiskHistories,
            responsePlans: mockResponsePlans,
            trendSnapshots: mockTrendSnapshots,
            alerts: mockAlerts,
            initialized: true,
          })
        }
      },

      addRisk: (riskData) => {
        const riskScore = calculateRiskScore(riskData.probability, riskData.impact)
        const level = getRiskLevel(riskScore)
        const newRisk: Risk = {
          ...riskData,
          id: generateRiskId(),
          riskScore,
          level,
          lastUpdated: new Date().toISOString().split('T')[0],
        }
        set((state) => ({ risks: [...state.risks, newRisk] }))
        return newRisk
      },

      updateRisk: (id, updates) => {
        set((state) => {
          const oldRisk = state.risks.find(r => r.id === id)
          if (!oldRisk) return state
          let processedUpdates = { ...updates }
          if (updates.probability !== undefined || updates.impact !== undefined) {
            const p = updates.probability ?? oldRisk.probability
            const i = updates.impact ?? oldRisk.impact
            processedUpdates.riskScore = calculateRiskScore(p, i)
            processedUpdates.level = getRiskLevel(processedUpdates.riskScore)
          }
          processedUpdates.lastUpdated = new Date().toISOString().split('T')[0]
          const newHistories: RiskHistory[] = []
          Object.entries(processedUpdates).forEach(([field, newValue]) => {
            const oldValue = String((oldRisk as unknown as Record<string, unknown>)[field] ?? '')
            if (oldValue !== String(newValue)) {
              newHistories.push({
                id: generateId(),
                riskId: id,
                field,
                oldValue,
                newValue: String(newValue),
                changedAt: new Date().toISOString().split('T')[0],
                changedBy: '当前用户',
              })
            }
          })
          return {
            risks: state.risks.map(r => r.id === id ? { ...r, ...processedUpdates } : r),
            riskHistories: [...state.riskHistories, ...newHistories],
          }
        })
      },

      deleteRisk: (id) => {
        set((state) => ({
          risks: state.risks.filter(r => r.id !== id),
          responsePlans: state.responsePlans.filter(p => p.riskId !== id),
          riskHistories: state.riskHistories.filter(h => h.riskId !== id),
        }))
      },

      addResponsePlan: (planData) => {
        const newPlan: ResponsePlan = { ...planData, id: generateId() }
        set((state) => ({ responsePlans: [...state.responsePlans, newPlan] }))
      },

      updateResponsePlan: (id, updates) => {
        set((state) => ({
          responsePlans: state.responsePlans.map(p => p.id === id ? { ...p, ...updates } : p),
        }))
      },

      markAlertRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
        }))
      },

      markAllAlertsRead: () => {
        set((state) => ({
          alerts: state.alerts.map(a => ({ ...a, read: true })),
        }))
      },
    }),
    { name: 'risk-control-store' }
  )
)
