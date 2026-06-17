import { useMemo, useState } from 'react'
import type { Risk, RiskConductionEdge, GraphNode, GraphEdge } from '@/types'
import { DIMENSION_COLORS, LEVEL_COLORS } from '@/types'
import { generateGraphLayout, getEdgeColor, calculateHubScore } from '@/utils/conductionAnalysis'
import { Info, Zap } from 'lucide-react'

interface RiskConductionGraphProps {
  risks: Risk[]
  edges: RiskConductionEdge[]
  selectedRiskId?: string
  onRiskClick?: (risk: Risk) => void
  height?: number
}

export default function RiskConductionGraph({
  risks,
  edges,
  selectedRiskId,
  onRiskClick,
  height = 480,
}: RiskConductionGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const { nodes, edges: graphEdges } = useMemo(() => {
    return generateGraphLayout(risks, edges)
  }, [risks, edges])

  const nodeMap = useMemo(() => {
    const map: Record<string, GraphNode> = {}
    nodes.forEach(n => { map[n.id] = n })
    return map
  }, [nodes])

  const highlightedEdgeIds = useMemo(() => {
    if (!hoveredNodeId && !selectedRiskId) return new Set<string>()
    const targetId = hoveredNodeId || selectedRiskId || ''
    const ids = new Set<string>()
    graphEdges.forEach(e => {
      if (e.source === targetId || e.target === targetId) {
        ids.add(e.id)
      }
    })
    return ids
  }, [hoveredNodeId, selectedRiskId, graphEdges])

  const highlightedNodeIds = useMemo(() => {
    if (!hoveredNodeId && !selectedRiskId) return new Set<string>()
    const targetId = hoveredNodeId || selectedRiskId || ''
    const ids = new Set<string>([targetId])
    graphEdges.forEach(e => {
      if (e.source === targetId) ids.add(e.target)
      if (e.target === targetId) ids.add(e.source)
    })
    return ids
  }, [hoveredNodeId, selectedRiskId, graphEdges])

  const viewBox = useMemo(() => {
    const dim = 800
    const height = 500
    return `0 0 ${dim} ${height}`
  }, [])

  const getNodeRadius = (node: GraphNode) => {
    const base = 24
    if (node.isHub) return base + 8
    return base + (node.risk.riskScore / 25) * 8
  }

  const handleMouseEnter = (nodeId: string, e: React.MouseEvent) => {
    setHoveredNodeId(nodeId)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredNodeId(null)
  }

  const handleNodeClick = (node: GraphNode) => {
    onRiskClick?.(node.risk)
  }

  const renderEdge = (edge: GraphEdge) => {
    const sourceNode = nodeMap[edge.source]
    const targetNode = nodeMap[edge.target]
    if (!sourceNode || !targetNode) return null

    const isHighlighted = highlightedEdgeIds.has(edge.id)
    const hasHighlight = highlightedEdgeIds.size > 0
    const opacity = hasHighlight ? (isHighlighted ? 1 : 0.15) : 0.6

    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return null

    const sourceR = getNodeRadius(sourceNode)
    const targetR = getNodeRadius(targetNode)

    const startX = sourceNode.x + (dx / dist) * sourceR
    const startY = sourceNode.y + (dy / dist) * sourceR
    const endX = targetNode.x - (dx / dist) * targetR
    const endY = targetNode.y - (dy / dist) * targetR

    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    const perpX = -dy / dist
    const perpY = dx / dist
    const curveOffset = 20
    const ctrlX = midX + perpX * curveOffset
    const ctrlY = midY + perpY * curveOffset

    const color = getEdgeColor(edge.type, edge.strength)
    const strokeWidth = 1 + edge.strength * 0.6

    const arrowSize = 6
    const arrowAngle = Math.atan2(endY - ctrlY, endX - ctrlX)

    return (
      <g key={edge.id}>
        <path
          d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          className="transition-opacity duration-200"
        />
        <polygon
          points={`
            ${endX},${endY}
            ${endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6)},${endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)}
            ${endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6)},${endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)}
          `}
          fill={color}
          opacity={opacity}
          className="transition-opacity duration-200"
        />
      </g>
    )
  }

  const renderNode = (node: GraphNode) => {
    const radius = getNodeRadius(node)
    const isHighlighted = highlightedNodeIds.has(node.id)
    const hasHighlight = highlightedNodeIds.size > 0
    const opacity = hasHighlight ? (isHighlighted ? 1 : 0.3) : 1
    const isSelected = selectedRiskId === node.id
    const color = DIMENSION_COLORS[node.risk.dimension] || '#5A6F8E'

    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        className="cursor-pointer"
        onMouseEnter={(e) => handleMouseEnter(node.id, e)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleNodeClick(node)}
      >
        {node.isHub && (
          <circle
            r={radius + 12}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="4 3"
            opacity={opacity * 0.8}
            className="animate-spin"
            style={{ animationDuration: '20s' }}
          />
        )}
        {isSelected && (
          <circle
            r={radius + 6}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={3}
            opacity={opacity}
          />
        )}
        <circle
          r={radius}
          fill={color}
          opacity={opacity * 0.9}
          className="transition-all duration-200 hover:opacity-100"
          stroke={node.isHub ? '#F59E0B' : 'rgba(255,255,255,0.3)'}
          strokeWidth={node.isHub ? 3 : 1}
        />
        <text
          y={4}
          textAnchor="middle"
          fill="white"
          fontSize={12}
          fontWeight={600}
          opacity={opacity}
        >
          {node.risk.riskScore}
        </text>
        <text
          y={radius + 16}
          textAnchor="middle"
          fill="#E8EDF5"
          fontSize={11}
          opacity={opacity}
        >
          {node.risk.title.length > 8 ? node.risk.title.slice(0, 8) + '...' : node.risk.title}
        </text>
      </g>
    )
  }

  const hoveredNode = hoveredNodeId ? nodeMap[hoveredNodeId] : null

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={viewBox}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="bg-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A2A4A" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#0B1426" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="800" height="500" fill="url(#bg-gradient)" />
        <g>
          {graphEdges.map(renderEdge)}
        </g>
        <g>
          {nodes.map(renderNode)}
        </g>
      </svg>

      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-50 rounded-lg p-3 border shadow-xl"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
            background: 'rgba(11, 20, 38, 0.95)',
            borderColor: '#1E3A5F',
            minWidth: 200,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: DIMENSION_COLORS[hoveredNode.risk.dimension] }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {hoveredNode.risk.title}
            </span>
          </div>
          <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>风险分值</span>
              <span className="font-mono" style={{ color: LEVEL_COLORS[hoveredNode.risk.level] }}>
                {hoveredNode.risk.riskScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span>入度 / 出度</span>
              <span className="font-mono">
                {hoveredNode.inDegree} / {hoveredNode.outDegree}
              </span>
            </div>
            <div className="flex justify-between">
              <span>枢纽评分</span>
              <span className="font-mono" style={{ color: hoveredNode.isHub ? '#F59E0B' : 'inherit' }}>
                {hoveredNode.hubScore.toFixed(1)}
              </span>
            </div>
            {hoveredNode.isHub && (
              <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: '1px solid #1E3A5F' }}>
                <Zap size={12} style={{ color: '#F59E0B' }} />
                <span style={{ color: '#F59E0B' }}>关键枢纽节点</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
