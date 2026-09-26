import type { MockExamScores } from '../types'
import {
  MOCK_EXAM_CHART_MAX,
  goalMockExamTargets,
  mockExamMonths,
} from '../data/goalPlan'

interface MockExamChartProps {
  data: Record<string, MockExamScores>
  onUpdate: (monthId: string, scores: Partial<MockExamScores>) => void
}

export function MockExamChart({ data, onUpdate }: MockExamChartProps) {
  const chartWidth = 900
  const chartHeight = 320
  const padding = { top: 32, right: 16, bottom: 28, left: 40 }
  const barGap = 12
  const plotWidth = chartWidth - padding.left - padding.right
  const plotH = chartHeight - padding.top - padding.bottom

  const targetY =
    padding.top + (1 - goalMockExamTargets.total / MOCK_EXAM_CHART_MAX) * plotH

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-5 mb-5 text-base text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-sm bg-brand-400" />
          Тест
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-sm bg-brand-600" />
          Письмо
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 border-t-2 border-dashed border-amber-500" />
          Цель {goalMockExamTargets.total}+
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[700px]"
          style={{ height: chartHeight }}
        >
          {[0, 10, 20, 30, MOCK_EXAM_CHART_MAX].map((tick) => {
            const y = padding.top + (1 - tick / MOCK_EXAM_CHART_MAX) * plotH
            return (
              <g key={tick}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#f1f5f9" />
                <text x={padding.left - 8} y={y + 5} textAnchor="end" fontSize={14} className="fill-slate-400">
                  {tick}
                </text>
              </g>
            )
          })}

          <line
            x1={padding.left}
            y1={targetY}
            x2={chartWidth - padding.right}
            y2={targetY}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="8 5"
          />
          <text
            x={chartWidth - padding.right}
            y={targetY - 6}
            textAnchor="end"
            className="fill-amber-600 font-medium"
            fontSize={14}
          >
            {goalMockExamTargets.total}+
          </text>

          {mockExamMonths.map((month, index) => {
            const scores = data[month.id] ?? { test: 0, written: 0 }
            const total = scores.test + scores.written
            const barWidth = (plotWidth - barGap * (mockExamMonths.length - 1)) / mockExamMonths.length
            const x = padding.left + index * (barWidth + barGap)

            const testH = (scores.test / MOCK_EXAM_CHART_MAX) * plotH
            const writtenH = (scores.written / MOCK_EXAM_CHART_MAX) * plotH
            const writtenY = padding.top + plotH - testH - writtenH
            const testY = padding.top + plotH - testH

            return (
              <g key={month.id}>
                {scores.written > 0 && (
                  <rect
                    x={x}
                    y={writtenY}
                    width={barWidth}
                    height={writtenH}
                    rx={5}
                    className="fill-brand-600"
                  />
                )}
                {scores.test > 0 && (
                  <rect
                    x={x}
                    y={testY}
                    width={barWidth}
                    height={testH}
                    rx={5}
                    className="fill-brand-400"
                  />
                )}
                {total > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={padding.top + plotH - testH - writtenH - 8}
                    textAnchor="middle"
                    className="fill-slate-700 font-semibold"
                    fontSize={15}
                  >
                    {total}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="fill-slate-600 font-medium"
                  fontSize={15}
                >
                  {month.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="grid grid-cols-9 gap-2 min-w-[700px]">
          {mockExamMonths.map((month) => {
            const scores = data[month.id] ?? { test: 0, written: 0 }
            return (
              <div key={month.id} className="text-center">
                <div className="text-sm text-muted mb-1.5 truncate" title={month.fullLabel}>
                  {month.label}
                </div>
                <input
                  type="number"
                  min={0}
                  max={20}
                  placeholder="Т"
                  title={`${month.fullLabel}: тест`}
                  className="w-full rounded-lg border border-border px-1.5 py-2 text-sm text-center"
                  value={scores.test || ''}
                  onChange={(e) =>
                    onUpdate(month.id, { test: Number(e.target.value) })
                  }
                />
                <input
                  type="number"
                  min={0}
                  max={25}
                  placeholder="П"
                  title={`${month.fullLabel}: письмо`}
                  className="w-full rounded-lg border border-border px-1.5 py-2 text-sm text-center mt-1.5"
                  value={scores.written || ''}
                  onChange={(e) =>
                    onUpdate(month.id, { written: Number(e.target.value) })
                  }
                />
              </div>
            )
          })}
        </div>
        <p className="text-sm text-muted mt-3 text-center">Т — тест · П — письменная часть</p>
      </div>
    </div>
  )
}
