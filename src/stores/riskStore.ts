import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Risk,
  RiskHistory,
  ResponsePlan,
  TrendSnapshot,
  Alert,
  RiskConductionEdge,
  RiskConductionPath,
  ConductionAnalysisResult,
  ThresholdConfig,
  ThresholdRecommendation,
  ProjectType,
  ProjectStage,
  ThresholdIndicator,
} from '@/types'
import {
  mockRisks,
  mockRiskHistories,
  mockResponsePlans,
  mockTrendSnapshots,
  mockAlerts,
  mockConductionEdges,
  mockConductionPaths,
  mockThresholdConfigs,
} from '@/data/mockData'
import { calculateRiskScore, getRiskLevel, generateRiskId, generateId } from '@/utils/riskCalc'
import { analyzeConduction as analyzeConductionUtil } from '@/utils/conductionAnalysis'
import { generateThresholdRecommendations } from '@/utils/thresholdRecommendation'

interface RiskStore {
  risks: Risk[]
  riskHistories: RiskHistory[]
  responsePlans: ResponsePlan[]
  trendSnapshots: TrendSnapshot[]
  alerts: Alert[]
  conductionEdges: RiskConductionEdge[]
  conductionPaths: RiskConductionPath[]
  thresholdConfigs: ThresholdConfig[]
  initialized: boolean

  initialize: () => void
  addRisk: (risk: Omit<Risk, 'id' | 'riskScore' | 'level' | 'lastUpdated'>) => Risk
  updateRisk: (id: string, updates: Partial<Risk>) => void
  deleteRisk: (id: string) => void
  addResponsePlan: (plan: Omit<ResponsePlan, 'id'>) => void
  updateResponsePlan: (id: string, updates: Partial<ResponsePlan>) => void
  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void
  addConductionEdge: (edge: Omit<RiskConductionEdge, 'id'>) => void
  removeConductionEdge: (id: string) => void
  addConductionPath: (path: Omit<RiskConductionPath, 'id'>) => void
  removeConductionPath: (id: string) => void
  getConductionAnalysis: () => ConductionAnalysisResult
  getRelatedRisks: (riskId: string) => Risk[]
  getThresholdConfigs: (projectType?: ProjectType, projectStage?: ProjectStage) => ThresholdConfig[]
  updateThresholdConfig: (id: string, updates: Partial<ThresholdConfig>) => void
  getRecommendations: (projectType: ProjectType, projectStage: ProjectStage) => ThresholdRecommendation[]
  applyRecommendation: (indicator: ThresholdIndicator, projectType: ProjectType, projectStage: ProjectStage) => void
}

export const useRiskStore = create<RiskStore>()(
  persist(
    (set, get) => ({
      risks: [],
      riskHistories: [],
      responsePlans: [],
      trendSnapshots: [],
      alerts: [],
      conductionEdges: [],
      conductionPaths: [],
      thresholdConfigs: [],
      initialized: false,

      initialize: () => {
        if (!get().initialized) {
          set({
            risks: mockRisks,
            riskHistories: mockRiskHistories,
            responsePlans: mockResponsePlans,
            trendSnapshots: mockTrendSnapshots,
            alerts: mockAlerts,
            conductionEdges: mockConductionEdges,
            conductionPaths: mockConductionPaths,
            thresholdConfigs: mockThresholdConfigs,
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

      addConductionEdge: (edgeData) => {
        const newEdge: RiskConductionEdge = { ...edgeData, id: generateId() }
        set((state) => ({ conductionEdges: [...state.conductionEdges, newEdge] }))
      },

      removeConductionEdge: (id) => {
        set((state) => ({
          conductionEdges: state.conductionEdges.filter(e => e.id !== id),
        }))
      },

      addConductionPath: (pathData) => {
        const newPath: RiskConductionPath = { ...pathData, id: generateId() }
        set((state) => ({ conductionPaths: [...state.conductionPaths, newPath] }))
      },

      removeConductionPath: (id) => {
        set((state) => ({
          conductionPaths: state.conductionPaths.filter(p => p.id !== id),
        }))
      },

      getConductionAnalysis: () => {
        const { risks, conductionEdges, conductionPaths } = get()
        return analyzeConductionUtil(risks, conductionEdges, conductionPaths)
      },

      getRelatedRisks: (riskId) => {
        const { risks, conductionEdges } = get()
        const relatedIds = new Set<string>()
        conductionEdges.forEach(e => {
          if (e.sourceRiskId === riskId) relatedIds.add(e.targetRiskId)
          if (e.targetRiskId === riskId) relatedIds.add(e.sourceRiskId)
        })
        return risks.filter(r => relatedIds.has(r.id))
      },

      getThresholdConfigs: (projectType, projectStage) => {
        const { thresholdConfigs } = get()
        return thresholdConfigs.filter(c => {
          if (projectType && c.projectType !== projectType) return false
          if (projectStage && c.projectStage !== projectStage) return false
          return true
        })
      },

      updateThresholdConfig: (id, updates) => {
        set((state) => ({
          thresholdConfigs: state.thresholdConfigs.map(c =>
            c.id === id
              ? { ...c, ...updates, lastUpdated: new Date().toISOString().split('T')[0], updatedBy: '当前用户' }
              : c
          ),
        }))
      },

      getRecommendations: (projectType, projectStage) => {
        const { thresholdConfigs } = get()
        return generateThresholdRecommendations(projectType, projectStage, thresholdConfigs)
      },

      applyRecommendation: (indicator, projectType, projectStage) => {
        const recommendations = get().getRecommendations(projectType, projectStage)
        const rec = recommendations.find(r => r.indicator === indicator)
        if (!rec) return

        const { thresholdConfigs } = get()
        const existing = thresholdConfigs.find(
          c => c.indicator === indicator && c.projectType === projectType && c.projectStage === projectStage
        )

        if (existing) {
          get().updateThresholdConfig(existing.id, {
            yellowWarning: rec.yellowWarning,
            redWarning: rec.redWarning,
            recommendationSource: `智能推荐（置信度${(rec.confidence * 100).toFixed(0)}%）`,
          })
        } else {
          const newConfig: ThresholdConfig = {
            id: generateId(),
            indicator,
            projectType,
            projectStage,
            yellowWarning: rec.yellowWarning,
            redWarning: rec.redWarning,
            unit: rec.unit,
            description: rec.reason,
            recommendationSource: `智能推荐（置信度${(rec.confidence * 100).toFixed(0)}%）`,
            lastUpdated: new Date().toISOString().split('T')[0],
            updatedBy: '当前用户',
          }
          set((state) => ({ thresholdConfigs: [...state.thresholdConfigs, newConfig] }))
        }
      },
    }),
    { name: 'risk-control-store' }
  )
)
