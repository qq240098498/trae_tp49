import type { Risk, RiskConductionEdge, RiskConductionPath, GraphNode, GraphEdge, ConductionAnalysisResult } from '@/types'
import { DIMENSION_COLORS } from '@/types'

export function calculateHubScore(
  riskId: string,
  edges: RiskConductionEdge[],
  risks: Risk[]
): { score: number; inDegree: number; outDegree: number } {
  const inEdges = edges.filter(e => e.targetRiskId === riskId)
  const outEdges = edges.filter(e => e.sourceRiskId === riskId)
  const inDegree = inEdges.length
  const outDegree = outEdges.length

  const inStrength = inEdges.reduce((sum, e) => sum + e.strength, 0)
  const outStrength = outEdges.reduce((sum, e) => sum + e.strength, 0)

  const risk = risks.find(r => r.id === riskId)
  const riskWeight = risk ? (risk.riskScore / 25) : 0.5

  const degreeScore = (inDegree + outDegree) * 2
  const strengthScore = (inStrength + outStrength) / 2
  const betweenness = inDegree * outDegree * 0.5

  const totalScore = degreeScore + strengthScore + betweenness + riskWeight * 10

  return {
    score: Math.round(totalScore * 10) / 10,
    inDegree,
    outDegree,
  }
}

export function identifyHubNodes(
  risks: Risk[],
  edges: RiskConductionEdge[],
  topN: number = 3
): Risk[] {
  const scored = risks.map(risk => {
    const { score } = calculateHubScore(risk.id, edges, risks)
    return { risk, score }
  })
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(item => item.risk)
}

export function findConductionChains(
  edges: RiskConductionEdge[],
  risks: Risk[],
  minLength: number = 2
): RiskConductionPath[] {
  const adjacency: Record<string, RiskConductionEdge[]> = {}
  edges.forEach(e => {
    if (!adjacency[e.sourceRiskId]) adjacency[e.sourceRiskId] = []
    adjacency[e.sourceRiskId].push(e)
  })

  const chains: RiskConductionPath[] = []
  const visited = new Set<string>()

  function dfs(startId: string, currentId: string, path: string[], strength: number, depth: number) {
    if (depth > 5) return
    if (path.length >= minLength) {
      const riskList = path.map(id => risks.find(r => r.id === id)).filter(Boolean) as Risk[]
      const totalImpact = riskList.reduce((sum, r) => sum + r.riskScore, 0)
      const firstRisk = riskList[0]
      const category = firstRisk ? firstRisk.dimension : 'schedule'

      chains.push({
        id: `chain-${startId}-${currentId}-${path.length}`,
        name: generateChainName(riskList),
        riskIds: [...path],
        totalImpact: Math.round(totalImpact * 10) / 10,
        description: generateChainDescription(riskList),
        category,
      })
    }

    const nextEdges = adjacency[currentId] || []
    for (const edge of nextEdges) {
      if (path.includes(edge.targetRiskId)) continue
      const visitKey = `${startId}-${edge.targetRiskId}-${path.length}`
      if (visited.has(visitKey)) continue
      visited.add(visitKey)
      dfs(startId, edge.targetRiskId, [...path, edge.targetRiskId], strength + edge.strength, depth + 1)
    }
  }

  risks.forEach(risk => {
    dfs(risk.id, risk.id, [risk.id], 0, 0)
  })

  return chains.sort((a, b) => b.totalImpact - a.totalImpact)
}

function generateChainName(risks: Risk[]): string {
  if (risks.length === 0) return '传导链'
  const dims = [...new Set(risks.map(r => r.dimension))]
  const dimNames: Record<string, string> = {
    schedule: '进度',
    resource: '资源',
    requirement: '需求',
    dependency: '依赖',
  }
  const dimStr = dims.map(d => dimNames[d] || d).join('-')
  return `${dimStr}传导链`
}

function generateChainDescription(risks: Risk[]): string {
  if (risks.length < 2) return ''
  const firstTitle = risks[0].title.length > 10 ? risks[0].title.slice(0, 10) + '...' : risks[0].title
  const lastTitle = risks[risks.length - 1].title.length > 10 ? risks[risks.length - 1].title.slice(0, 10) + '...' : risks[risks.length - 1].title
  return `${firstTitle} → ... → ${lastTitle}，形成级联风险传导`
}

export function generateGraphLayout(
  risks: Risk[],
  edges: RiskConductionEdge[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const width = 800
  const height = 500
  const padding = 60

  const nodeDegrees: Record<string, { inDegree: number; outDegree: number; score: number }> = {}
  risks.forEach(r => {
    const { score, inDegree, outDegree } = calculateHubScore(r.id, edges, risks)
    nodeDegrees[r.id] = { inDegree, outDegree, score }
  })

  const sortedRisks = [...risks].sort((a, b) => nodeDegrees[b.id].score - nodeDegrees[a.id].score)

  const hubThreshold = sortedRisks.length > 0 ? nodeDegrees[sortedRisks[Math.floor(sortedRisks.length * 0.2)].id].score : 10

  const nodes: GraphNode[] = sortedRisks.map((risk, index) => {
    const { score, inDegree, outDegree } = nodeDegrees[risk.id]
    const isHub = score >= hubThreshold && (inDegree + outDegree) >= 2

    let x: number, y: number

    if (isHub) {
      const angle = (index / 4) * Math.PI * 2
      x = width / 2 + Math.cos(angle) * 100
      y = height / 2 + Math.sin(angle) * 80
    } else {
      const angle = (index / risks.length) * Math.PI * 2 + Math.PI / 6
      const radius = 180 + (index % 3) * 30
      x = width / 2 + Math.cos(angle) * radius
      y = height / 2 + Math.sin(angle) * (radius * 0.7)
    }

    x = Math.max(padding, Math.min(width - padding, x))
    y = Math.max(padding, Math.min(height - padding, y))

    return {
      id: risk.id,
      x,
      y,
      risk,
      isHub,
      hubScore: score,
      inDegree,
      outDegree,
    }
  })

  const graphEdges: GraphEdge[] = edges.map(e => ({
    id: e.id,
    source: e.sourceRiskId,
    target: e.targetRiskId,
    strength: e.strength,
    type: e.type,
  }))

  return { nodes, edges: graphEdges }
}

export function analyzeConduction(
  risks: Risk[],
  edges: RiskConductionEdge[],
  paths: RiskConductionPath[]
): ConductionAnalysisResult {
  const hubNodes = identifyHubNodes(risks, edges, 3)

  const highRiskChains = [...paths].sort((a, b) => b.totalImpact - a.totalImpact).slice(0, 5)

  const connectedIds = new Set<string>()
  edges.forEach(e => {
    connectedIds.add(e.sourceRiskId)
    connectedIds.add(e.targetRiskId)
  })
  const isolatedNodes = risks.filter(r => !connectedIds.has(r.id))

  const maxChainLength = paths.length > 0 ? Math.max(...paths.map(p => p.riskIds.length)) : 0

  const chainRiskScore = paths.reduce((sum, p) => sum + p.totalImpact, 0) / Math.max(paths.length, 1)

  return {
    hubNodes,
    highRiskChains,
    isolatedNodes,
    totalChains: paths.length,
    maxChainLength,
    chainRiskScore: Math.round(chainRiskScore * 10) / 10,
  }
}

export function getNodeColor(risk: Risk, isHub: boolean): string {
  if (isHub) return '#F59E0B'
  return DIMENSION_COLORS[risk.dimension] || '#5A6F8E'
}

export function getEdgeColor(type: string, strength: number): string {
  const baseColors: Record<string, string> = {
    direct: '#3B82F6',
    indirect: '#8B5CF6',
    cascading: '#EF4444',
  }
  return baseColors[type] || '#5A6F8E'
}

export function getChainRiskLevel(score: number): { level: string; color: string } {
  if (score >= 40) return { level: '极高', color: '#EF4444' }
  if (score >= 30) return { level: '高', color: '#F97316' }
  if (score >= 20) return { level: '中', color: '#EAB308' }
  return { level: '低', color: '#22C55E' }
}
