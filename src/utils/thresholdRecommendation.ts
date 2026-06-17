import type {
  ThresholdConfig,
  ThresholdRecommendation,
  ProjectType,
  ProjectStage,
  ThresholdIndicator,
} from '@/types'
import {
  THRESHOLD_INDICATOR_LABELS,
  THRESHOLD_INDICATOR_UNITS,
} from '@/types'

interface BaseThresholdTemplate {
  yellowWarning: number
  redWarning: number
  reason: string
  sampleCount: number
}

const BASELINE_THRESHOLDS: Record<
  ProjectType,
  Record<ProjectStage, Partial<Record<ThresholdIndicator, BaseThresholdTemplate>>>
> = {
  agile: {
    requirements: {
      scheduleDeviation: {
        yellowWarning: 8,
        redWarning: 15,
        reason: '敏捷需求阶段迭代周期短，进度偏差应控制在较小范围',
        sampleCount: 28,
      },
      requirementChangeFreq: {
        yellowWarning: 5,
        redWarning: 8,
        reason: '敏捷需求探索期变更较灵活，但超过5次/周需评估需求稳定性',
        sampleCount: 28,
      },
      resourceUtilization: {
        yellowWarning: 75,
        redWarning: 90,
        reason: '需求阶段资源投入较低，预留缓冲应对需求探索',
        sampleCount: 25,
      },
    },
    development: {
      scheduleDeviation: {
        yellowWarning: 10,
        redWarning: 20,
        reason: '敏捷开发阶段Sprint固定，>10%黄灯、>20%红灯触发预警',
        sampleCount: 35,
      },
      requirementChangeFreq: {
        yellowWarning: 3,
        redWarning: 6,
        reason: '敏捷开发阶段Sprint内变更需控制，>3次/周触发影响评估',
        sampleCount: 35,
      },
      resourceUtilization: {
        yellowWarning: 85,
        redWarning: 95,
        reason: '开发阶段满负荷但需保留应急空间，>85%黄灯',
        sampleCount: 32,
      },
      bugDensity: {
        yellowWarning: 5,
        redWarning: 10,
        reason: '开发阶段缺陷密度>5个/KLOC黄灯，关注代码质量',
        sampleCount: 30,
      },
    },
    testing: {
      scheduleDeviation: {
        yellowWarning: 5,
        redWarning: 12,
        reason: '敏捷测试阶段进度偏差控制更严格，>5%黄灯预警',
        sampleCount: 30,
      },
      requirementChangeFreq: {
        yellowWarning: 1,
        redWarning: 3,
        reason: '测试阶段需求应冻结，>1次/周触发变更影响评估',
        sampleCount: 30,
      },
      bugDensity: {
        yellowWarning: 3,
        redWarning: 6,
        reason: '测试阶段缺陷密度>3个/KLOC黄灯预警',
        sampleCount: 32,
      },
      testPassRate: {
        yellowWarning: 90,
        redWarning: 80,
        reason: '测试通过率为反向指标，低于90%黄灯、低于80%红灯',
        sampleCount: 30,
      },
    },
    launch: {
      scheduleDeviation: {
        yellowWarning: 3,
        redWarning: 8,
        reason: '上线阶段进度偏差要求最严格，>3%即黄灯预警',
        sampleCount: 22,
      },
      dependencyRisk: {
        yellowWarning: 6,
        redWarning: 8,
        reason: '上线阶段依赖风险指数>6分黄灯预警，确保依赖就绪',
        sampleCount: 20,
      },
      testPassRate: {
        yellowWarning: 95,
        redWarning: 88,
        reason: '上线阶段测试通过率要求更高，低于95%黄灯',
        sampleCount: 22,
      },
    },
  },
  waterfall: {
    requirements: {
      scheduleDeviation: {
        yellowWarning: 5,
        redWarning: 10,
        reason: '瀑布需求阶段基线需稳定，>5%黄灯预警',
        sampleCount: 25,
      },
      requirementChangeFreq: {
        yellowWarning: 2,
        redWarning: 4,
        reason: '瀑布需求阶段变更应严格控制，>2次/周触发评估',
        sampleCount: 25,
      },
      resourceUtilization: {
        yellowWarning: 65,
        redWarning: 85,
        reason: '瀑布需求阶段资源投入较低，重视需求质量',
        sampleCount: 20,
      },
    },
    development: {
      scheduleDeviation: {
        yellowWarning: 7,
        redWarning: 15,
        reason: '瀑布开发阶段里程碑固定，>7%黄灯、>15%红灯',
        sampleCount: 22,
      },
      requirementChangeFreq: {
        yellowWarning: 1,
        redWarning: 3,
        reason: '瀑布开发阶段需求应基线化，>1次/周触发变更控制委员会',
        sampleCount: 22,
      },
      resourceUtilization: {
        yellowWarning: 90,
        redWarning: 98,
        reason: '瀑布开发阶段资源通常满负荷投入，>90%黄灯',
        sampleCount: 20,
      },
      bugDensity: {
        yellowWarning: 4,
        redWarning: 8,
        reason: '瀑布开发阶段缺陷密度>4个/KLOC黄灯',
        sampleCount: 18,
      },
    },
    testing: {
      scheduleDeviation: {
        yellowWarning: 4,
        redWarning: 10,
        reason: '瀑布测试阶段有严格验收计划，>4%黄灯',
        sampleCount: 20,
      },
      requirementChangeFreq: {
        yellowWarning: 0,
        redWarning: 2,
        reason: '瀑布测试阶段需求原则上冻结，任何变更都需评估',
        sampleCount: 20,
      },
      bugDensity: {
        yellowWarning: 2,
        redWarning: 4,
        reason: '瀑布测试阶段缺陷密度>2个/KLOC黄灯，严格质量门禁',
        sampleCount: 18,
      },
      testPassRate: {
        yellowWarning: 95,
        redWarning: 85,
        reason: '瀑布测试通过率要求更高，低于95%黄灯、低于85%红灯',
        sampleCount: 18,
      },
    },
    launch: {
      scheduleDeviation: {
        yellowWarning: 2,
        redWarning: 5,
        reason: '瀑布上线阶段偏差容忍度最低，>2%即黄灯预警',
        sampleCount: 15,
      },
      dependencyRisk: {
        yellowWarning: 5,
        redWarning: 7,
        reason: '瀑布上线阶段依赖风险>5分黄灯，确保所有依赖就绪',
        sampleCount: 15,
      },
      testPassRate: {
        yellowWarning: 98,
        redWarning: 92,
        reason: '瀑布上线前测试通过率要求极高，低于98%黄灯',
        sampleCount: 15,
      },
    },
  },
}

const INDICATOR_COLORS: Record<ThresholdIndicator, string> = {
  scheduleDeviation: '#3B82F6',
  requirementChangeFreq: '#F59E0B',
  resourceUtilization: '#8B5CF6',
  bugDensity: '#EF4444',
  testPassRate: '#22C55E',
  dependencyRisk: '#06B6D4',
}

export function getIndicatorColor(indicator: ThresholdIndicator): string {
  return INDICATOR_COLORS[indicator] || '#8899B4'
}

export function generateThresholdRecommendations(
  projectType: ProjectType,
  projectStage: ProjectStage,
  existingConfigs: ThresholdConfig[]
): ThresholdRecommendation[] {
  const baseline = BASELINE_THRESHOLDS[projectType][projectStage]
  const recommendations: ThresholdRecommendation[] = []

  const relevantConfigs = existingConfigs.filter(
    c => c.projectType === projectType && c.projectStage === projectStage
  )

  Object.entries(baseline).forEach(([indicator, template]) => {
    if (!template) return

    const existing = relevantConfigs.find(c => c.indicator === indicator)
    let yellowWarning = template.yellowWarning
    let redWarning = template.redWarning
    let confidence = 0.7
    let historicalSamples = template.sampleCount

    if (existing) {
      const configMatchesBaseline =
        Math.abs(existing.yellowWarning - template.yellowWarning) <= 1 &&
        Math.abs(existing.redWarning - template.redWarning) <= 1

      yellowWarning = existing.yellowWarning
      redWarning = existing.redWarning
      confidence = configMatchesBaseline ? 0.92 : 0.65
      historicalSamples = template.sampleCount + 5
    }

    recommendations.push({
      indicator: indicator as ThresholdIndicator,
      label: THRESHOLD_INDICATOR_LABELS[indicator as ThresholdIndicator],
      yellowWarning,
      redWarning,
      unit: THRESHOLD_INDICATOR_UNITS[indicator as ThresholdIndicator],
      confidence,
      reason: template.reason,
      historicalSamples,
    })
  })

  return recommendations.sort((a, b) => b.confidence - a.confidence)
}
