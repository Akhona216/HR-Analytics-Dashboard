import React, { useState, useMemo } from 'react';
import {
  EmployeeRecord,
  CORRELATION_VARIABLES,
  computeCorrelationAnalytics,
  calculatePearsonCorrelation,
} from '../data/hrDataset';

interface CorrelationAnalysisSectionProps {
  records: EmployeeRecord[];
}

export const CorrelationAnalysisSection: React.FC<CorrelationAnalysisSectionProps> = ({
  records,
}) => {
  const [selectedVarXKey, setSelectedVarXKey] = useState<string>('totalWorkingYears');
  const [selectedVarYKey, setSelectedVarYKey] = useState<string>('annualSalary');
  const [hoveredEmployee, setHoveredEmployee] = useState<EmployeeRecord | null>(null);

  const correlationData = useMemo(
    () => computeCorrelationAnalytics(records),
    [records]
  );

  const varX =
    CORRELATION_VARIABLES.find((v) => v.key === selectedVarXKey) ||
    CORRELATION_VARIABLES[3];
  const varY =
    CORRELATION_VARIABLES.find((v) => v.key === selectedVarYKey) ||
    CORRELATION_VARIABLES[1];

  // Compute bivariate stats & linear regression for scatter plot
  const scatterStats = useMemo(() => {
    if (records.length < 2) {
      return {
        r: 0,
        minX: 0,
        maxX: 1,
        minY: 0,
        maxY: 1,
        slope: 0,
        intercept: 0,
      };
    }

    const xs = records.map((r) => varX.extract(r));
    const ys = records.map((r) => varY.extract(r));
    const r = calculatePearsonCorrelation(xs, ys);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) === minX ? minX + 1 : Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys) === minY ? minY + 1 : Math.max(...ys);

    const n = xs.length;
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - meanX) * (ys[i] - meanY);
      den += (xs[i] - meanX) * (xs[i] - meanX);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    return { r, minX, maxX, minY, maxY, slope, intercept };
  }, [records, varX, varY]);

  const handleMatrixCellClick = (rowIdx: number, colIdx: number) => {
    if (rowIdx === colIdx) return;
    setSelectedVarXKey(CORRELATION_VARIABLES[colIdx].key);
    setSelectedVarYKey(CORRELATION_VARIABLES[rowIdx].key);
  };

  const formatAxisValue = (val: number, key: string) => {
    if (key === 'annualSalary') return `$${Math.round(val / 1000)}k`;
    if (key === 'attrition' || key === 'overTime') return val >= 0.5 ? 'Yes (1)' : 'No (0)';
    return Number.isInteger(val) ? String(val) : val.toFixed(1);
  };

  return (
    <section id="correlation-lab" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            03. Multivariate Statistical Correlation Analysis
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Key Attrition Drivers & Pearson Correlation Matrix
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          <span>Method: Pearson / Point-Biserial (r)</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>n = {records.length} records</span>
        </div>
      </div>

      {/* Top Row: Ranked Key Factors Tornado Chart + Bivariate Scatter Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Ranked Key Factors Driving Employee Attrition */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Key Factors Correlated with Employee Attrition
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ranked by absolute correlation magnitude (|r|) against voluntary turnover
                </p>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 text-right shrink-0">
                <div>+r Increases Turnover</div>
                <div>-r Anchors Retention</div>
              </div>
            </div>

            <div className="space-y-3.5">
              {correlationData.attritionCorrelations.map((item, idx) => {
                const isPositive = item.r >= 0;
                // Scale bar width relative to 0.50 max correlation for clear visual proportion
                const barWidthPercent = Math.min(100, (item.absR / 0.45) * 100);

                return (
                  <button
                    key={item.variable.key}
                    type="button"
                    onClick={() => {
                      setSelectedVarXKey(item.variable.key);
                      setSelectedVarYKey('annualSalary');
                    }}
                    className="w-full text-left p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-400">
                          0{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.variable.label}
                        </span>
                        <span className="text-slate-400" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={`text-[11px] font-medium ${
                            isPositive ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {isPositive ? 'Attrition Catalyst' : 'Retention Anchor'}
                        </span>
                      </div>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          isPositive ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        r = {item.r >= 0 ? `+${item.r.toFixed(2)}` : item.r.toFixed(2)}
                      </span>
                    </div>

                    {/* Bidirectional Diverging Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden grid grid-cols-2">
                      {/* Left side: Negative correlation (Retention Anchor) */}
                      <div className="flex justify-end pr-px border-r border-slate-300">
                        {!isPositive && (
                          <div
                            className="h-full bg-emerald-600 rounded-l-sm transition-all duration-200"
                            style={{ width: `${barWidthPercent}%` }}
                          />
                        )}
                      </div>
                      {/* Right side: Positive correlation (Attrition Driver) */}
                      <div className="flex justify-start pl-px">
                        {isPositive && (
                          <div
                            className="h-full bg-rose-600 rounded-r-sm transition-all duration-200"
                            style={{ width: `${barWidthPercent}%` }}
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {item.impactSummary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Primary Positive Driver: {correlationData.attritionCorrelations[0]?.variable.label}</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              |r| = {correlationData.attritionCorrelations[0]?.absR.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Right 6 cols: Interactive Bivariate Scatter & OLS Regression Plot */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Bivariate Distribution & Regression Explorer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect how any two workforce variables covary across Retained vs. Attrited staff
                </p>
              </div>
              <div className="font-mono tabular-nums text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-900 rounded-md shrink-0">
                r = {scatterStats.r >= 0 ? `+${scatterStats.r.toFixed(3)}` : scatterStats.r.toFixed(3)}
              </div>
            </div>

            {/* Axis Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  htmlFor="corr-x-select"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Horizontal Axis (X Variable)
                </label>
                <select
                  id="corr-x-select"
                  value={selectedVarXKey}
                  onChange={(e) => setSelectedVarXKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  {CORRELATION_VARIABLES.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="corr-y-select"
                  className="block text-[11px] font-medium text-slate-600 mb-1"
                >
                  Vertical Axis (Y Variable)
                </label>
                <select
                  id="corr-y-select"
                  value={selectedVarYKey}
                  onChange={(e) => setSelectedVarYKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  {CORRELATION_VARIABLES.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SVG Scatter Canvas */}
            <div className="relative border border-slate-200 rounded-lg bg-slate-50/50 p-3">
              <svg
                viewBox="0 0 520 300"
                className="w-full h-[270px] overflow-visible"
                role="img"
                aria-label={`Scatter plot of ${varX.label} versus ${varY.label}`}
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const yPos = 250 - t * 220;
                  const val =
                    scatterStats.minY +
                    t * (scatterStats.maxY - scatterStats.minY);
                  return (
                    <g key={`y-grid-${t}`}>
                      <line
                        x1={56}
                        y1={yPos}
                        x2={495}
                        y2={yPos}
                        stroke="#E2E8F0"
                        strokeDasharray={t === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={48}
                        y={yPos + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[10px] font-mono tabular-nums"
                      >
                        {formatAxisValue(val, varY.key)}
                      </text>
                    </g>
                  );
                })}

                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const xPos = 56 + t * 439;
                  const val =
                    scatterStats.minX +
                    t * (scatterStats.maxX - scatterStats.minX);
                  return (
                    <g key={`x-grid-${t}`}>
                      <line
                        x1={xPos}
                        y1={30}
                        x2={xPos}
                        y2={250}
                        stroke="#E2E8F0"
                        strokeDasharray={t === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={xPos}
                        y={268}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono tabular-nums"
                      >
                        {formatAxisValue(val, varX.key)}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Titles */}
                <text
                  x={275}
                  y={290}
                  textAnchor="middle"
                  className="fill-slate-700 text-[11px] font-medium"
                >
                  {varX.label} ({varX.unit})
                </text>

                {/* OLS Linear Trend Line */}
                {records.length >= 2 && (() => {
                  const yStart =
                    scatterStats.slope * scatterStats.minX +
                    scatterStats.intercept;
                  const yEnd =
                    scatterStats.slope * scatterStats.maxX +
                    scatterStats.intercept;

                  const clampY = (yVal: number) =>
                    Math.max(
                      scatterStats.minY,
                      Math.min(scatterStats.maxY, yVal)
                    );

                  const y1Norm =
                    (clampY(yStart) - scatterStats.minY) /
                    (scatterStats.maxY - scatterStats.minY);
                  const y2Norm =
                    (clampY(yEnd) - scatterStats.minY) /
                    (scatterStats.maxY - scatterStats.minY);

                  return (
                    <line
                      x1={56}
                      y1={250 - y1Norm * 220}
                      x2={495}
                      y2={250 - y2Norm * 220}
                      stroke="#2563EB"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                    />
                  );
                })()}

                {/* Data Points */}
                {records.map((emp, idx) => {
                  const rawX = varX.extract(emp);
                  const rawY = varY.extract(emp);
                  // Deterministic micro-jitter when discrete binary/ordinal variables are plotted
                  const jitterX =
                    varX.key === 'attrition' ||
                    varX.key === 'overTime' ||
                    varX.key === 'jobSatisfaction' ||
                    varX.key === 'workLifeBalance'
                      ? (((idx * 17) % 11) - 5) * 1.8
                      : 0;
                  const jitterY =
                    varY.key === 'attrition' ||
                    varY.key === 'overTime' ||
                    varY.key === 'jobSatisfaction' ||
                    varY.key === 'workLifeBalance'
                      ? (((idx * 23) % 11) - 5) * 1.8
                      : 0;

                  const xNorm =
                    (rawX - scatterStats.minX) /
                    (scatterStats.maxX - scatterStats.minX);
                  const yNorm =
                    (rawY - scatterStats.minY) /
                    (scatterStats.maxY - scatterStats.minY);

                  const cx = Math.max(56, Math.min(495, 56 + xNorm * 439 + jitterX));
                  const cy = Math.max(30, Math.min(250, 250 - yNorm * 220 + jitterY));

                  const isHovered = hoveredEmployee?.id === emp.id;

                  return (
                    <circle
                      key={emp.id}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : emp.attrition ? 4.2 : 3.4}
                      className={`cursor-pointer transition-opacity ${
                        emp.attrition
                          ? 'fill-rose-600 opacity-90 hover:opacity-100'
                          : 'fill-slate-600 opacity-55 hover:opacity-100'
                      }`}
                      stroke={isHovered ? '#0F172A' : 'white'}
                      strokeWidth={isHovered ? 2 : 0.75}
                      onMouseEnter={() => setHoveredEmployee(emp)}
                      onMouseLeave={() => setHoveredEmployee(null)}
                    />
                  );
                })}
              </svg>

              {/* Live Hover Inspector Bar */}
              <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono tabular-nums min-h-[24px]">
                {hoveredEmployee ? (
                  <>
                    <div className="text-slate-900 font-sans">
                      <span className="font-semibold">{hoveredEmployee.fullName}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span className="text-slate-600">{hoveredEmployee.role}</span>
                      <span className="mx-1.5 text-slate-400">·</span>
                      <span
                        className={
                          hoveredEmployee.attrition
                            ? 'text-rose-700 font-semibold'
                            : 'text-emerald-700 font-medium'
                        }
                      >
                        {hoveredEmployee.attrition ? 'Attrited (Left)' : 'Retained (Active)'}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      ${hoveredEmployee.annualSalary.toLocaleString()} · {hoveredEmployee.totalWorkingYears}y exp
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 font-sans">
                      Hover any employee point to inspect compensation, tenure, and retention status
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-sans">
                      <span className="text-rose-700 font-semibold">Crimson: Attrited</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 font-medium">Slate: Retained</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Relationship: {varX.shortLabel} vs. {varY.shortLabel}
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {Math.abs(scatterStats.r) >= 0.5
                ? 'Strong Linear Association'
                : Math.abs(scatterStats.r) >= 0.25
                ? 'Moderate Correlation'
                : 'Weak / Orthogonal Relationship'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width: 9x9 Multivariate Correlation Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Full 9×9 Workforce Feature Correlation Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any intersecting cell to load that variable pair into the Bivariate Scatter Explorer above
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600 font-mono tabular-nums">
            <span>-1.0 (Inverse)</span>
            <div className="w-24 h-2.5 rounded-sm bg-gradient-to-r from-emerald-600 via-slate-100 to-rose-600 border border-slate-200" />
            <span>+1.0 (Direct)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 text-left font-semibold text-slate-700 bg-slate-50 min-w-[140px]">
                  Variable
                </th>
                {correlationData.variables.map((v) => (
                  <th
                    key={v.key}
                    className="py-2.5 px-2 text-right font-semibold text-slate-700 bg-slate-50 whitespace-nowrap"
                  >
                    {v.shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {correlationData.variables.map((rowVar, rIdx) => (
                <tr key={rowVar.key} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap bg-slate-50/40">
                    {rowVar.label}
                  </td>
                  {correlationData.variables.map((colVar, cIdx) => {
                    const rVal = correlationData.matrix[rIdx][cIdx];
                    const isDiagonal = rIdx === cIdx;
                    const isSelectedPair =
                      (rowVar.key === selectedVarYKey && colVar.key === selectedVarXKey) ||
                      (rowVar.key === selectedVarXKey && colVar.key === selectedVarYKey);

                    // Compute subtle cell background based on rVal
                    let cellTone = 'bg-white text-slate-700';
                    if (isDiagonal) {
                      cellTone = 'bg-slate-100 text-slate-400';
                    } else if (rVal >= 0.45) {
                      cellTone = 'bg-rose-100/90 text-rose-950 font-semibold';
                    } else if (rVal >= 0.2) {
                      cellTone = 'bg-rose-50 text-rose-900 font-medium';
                    } else if (rVal <= -0.35) {
                      cellTone = 'bg-emerald-100/90 text-emerald-950 font-semibold';
                    } else if (rVal <= -0.18) {
                      cellTone = 'bg-emerald-50 text-emerald-900 font-medium';
                    }

                    return (
                      <td
                        key={`${rowVar.key}-${colVar.key}`}
                        onClick={() => handleMatrixCellClick(rIdx, cIdx)}
                        className={`py-2.5 px-2 text-right font-mono tabular-nums transition-colors ${cellTone} ${
                          !isDiagonal ? 'cursor-pointer hover:ring-1 hover:ring-blue-600' : ''
                        } ${isSelectedPair ? 'ring-2 ring-blue-600 z-10 relative' : ''}`}
                        title={`${rowVar.label} vs ${colVar.label}: r = ${rVal.toFixed(3)}`}
                      >
                        {isDiagonal
                          ? '1.00'
                          : rVal >= 0
                          ? `+${rVal.toFixed(2)}`
                          : rVal.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
