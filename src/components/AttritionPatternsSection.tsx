import React from 'react';
import { EmployeeRecord, FilterState } from '../data/hrDataset';

interface AttritionPatternsSectionProps {
  records: EmployeeRecord[];
  filters: FilterState;
  onUpdateFilter: (key: keyof FilterState, value: string) => void;
}

export const AttritionPatternsSection: React.FC<AttritionPatternsSectionProps> = ({
  records,
  filters,
  onUpdateFilter,
}) => {
  // 1. Attrition by Salary Band
  const salaryBands = [
    { id: 'under-65k', label: 'Under $65,000', min: 0, max: 64999 },
    { id: '65k-95k', label: '$65,000 – $94,999', min: 65000, max: 94999 },
    { id: '95k-130k', label: '$95,000 – $129,999', min: 95000, max: 129999 },
    { id: '130k-plus', label: '$130,000 & Above', min: 130000, max: Infinity },
  ].map((band) => {
    const group = records.filter(
      (r) => r.annualSalary >= band.min && r.annualSalary <= band.max
    );
    const total = group.length;
    const attrited = group.filter((r) => r.attrition).length;
    const retained = total - attrited;
    const rate = total > 0 ? (attrited / total) * 100 : 0;
    const avgExp =
      total > 0
        ? group.reduce((acc, r) => acc + r.totalWorkingYears, 0) / total
        : 0;
    return {
      ...band,
      total,
      attrited,
      retained,
      rate,
      avgExp,
    };
  });

  // 2. Attrition by Experience / Company Tenure Cohort
  const tenureCohorts = [
    { id: '0-1', label: '0–1 Years (Onboarding)', min: 0, max: 1 },
    { id: '2-4', label: '2–4 Years (Early Career)', min: 2, max: 4 },
    { id: '5-8', label: '5–8 Years (Mid-Tenure)', min: 5, max: 8 },
    { id: '9-plus', label: '9+ Years (Senior Tenure)', min: 9, max: 100 },
  ].map((cohort) => {
    const group = records.filter(
      (r) => r.yearsAtCompany >= cohort.min && r.yearsAtCompany <= cohort.max
    );
    const total = group.length;
    const attrited = group.filter((r) => r.attrition).length;
    const rate = total > 0 ? (attrited / total) * 100 : 0;
    const avgSalary =
      total > 0
        ? Math.round(group.reduce((acc, r) => acc + r.annualSalary, 0) / total)
        : 0;
    return {
      ...cohort,
      total,
      attrited,
      rate,
      avgSalary,
    };
  });

  // 3. Overtime vs Standard Hours Comparison
  const overtimeGroup = records.filter((r) => r.overTime);
  const standardGroup = records.filter((r) => !r.overTime);
  const otAttritionRate =
    overtimeGroup.length > 0
      ? (overtimeGroup.filter((r) => r.attrition).length / overtimeGroup.length) * 100
      : 0;
  const stdAttritionRate =
    standardGroup.length > 0
      ? (standardGroup.filter((r) => r.attrition).length / standardGroup.length) * 100
      : 0;

  // 4. Job Satisfaction Tiers (1 to 4)
  const satisfactionLevels = [
    { level: 1, label: 'Level 1 · Low Satisfaction' },
    { level: 2, label: 'Level 2 · Moderate' },
    { level: 3, label: 'Level 3 · High' },
    { level: 4, label: 'Level 4 · Very High' },
  ].map((item) => {
    const group = records.filter((r) => r.jobSatisfaction === item.level);
    const total = group.length;
    const attrited = group.filter((r) => r.attrition).length;
    const rate = total > 0 ? (attrited / total) * 100 : 0;
    return { ...item, total, attrited, rate };
  });

  // 5. Primary Exit Drivers among Attrited Employees
  const attritedRecords = records.filter((r) => r.attrition);
  const exitReasonsMap: Record<string, number> = {};
  for (const r of attritedRecords) {
    exitReasonsMap[r.attritionReason] = (exitReasonsMap[r.attritionReason] || 0) + 1;
  }
  const exitDrivers = Object.entries(exitReasonsMap)
    .map(([reason, count]) => ({
      reason,
      count,
      share: attritedRecords.length > 0 ? (count / attritedRecords.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <section id="attrition-patterns" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            02. Pattern Identification & Cohort Diagnostics
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Employee Attrition Patterns Across Salary, Experience & Workload
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          <span>Active Sample: {records.length} employees</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Departures: {attritedRecords.length}</span>
        </div>
      </div>

      {/* Row 1: Salary Band Attrition & Experience Cohort Attrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Band Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Attrition by Annual Compensation Band
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any compensation bracket to filter the active dataset
                </p>
              </div>
              {filters.salaryBand !== 'All' && (
                <button
                  onClick={() => onUpdateFilter('salaryBand', 'All')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Reset Band Filter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {salaryBands.map((band) => {
                const isSelected = filters.salaryBand === band.id;
                return (
                  <button
                    key={band.id}
                    type="button"
                    onClick={() =>
                      onUpdateFilter('salaryBand', isSelected ? 'All' : band.id)
                    }
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-900">
                        {band.label}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                        <span
                          className={`font-semibold ${
                            band.rate >= 22
                              ? 'text-rose-700'
                              : band.rate >= 14
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {band.rate.toFixed(1)}% Attrition
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {band.attrited}/{band.total} left
                        </span>
                      </div>
                    </div>

                    {/* Stacked Bar: Attrited vs Retained */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden flex">
                      <div
                        className="bg-rose-600 h-full transition-all duration-200"
                        style={{ width: `${Math.min(100, band.rate)}%` }}
                        title={`Attrition: ${band.rate.toFixed(1)}%`}
                      />
                      <div
                        className="bg-slate-300 h-full transition-all duration-200"
                        style={{ width: `${Math.max(0, 100 - band.rate)}%` }}
                        title={`Retained: ${(100 - band.rate).toFixed(1)}%`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                      <span>Retained: {band.retained} staff</span>
                      <span>Avg Career Exp: {band.avgExp.toFixed(1)} yrs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Key Finding: Sub-$65k earners exhibit highest turnover vulnerability</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {(salaryBands[0].rate - salaryBands[3].rate).toFixed(1)} pts spread
            </span>
          </div>
        </div>

        {/* Tenure / Experience Cohort Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Attrition by Company Tenure & Experience Stage
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click any tenure stage to isolate onboarding vs. senior retention cohorts
                </p>
              </div>
              {filters.experienceBand !== 'All' && (
                <button
                  onClick={() => onUpdateFilter('experienceBand', 'All')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Reset Tenure Filter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {tenureCohorts.map((cohort) => {
                const isSelected = filters.experienceBand === cohort.id;
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() =>
                      onUpdateFilter(
                        'experienceBand',
                        isSelected ? 'All' : cohort.id
                      )
                    }
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-900">
                        {cohort.label}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                        <span
                          className={`font-semibold ${
                            cohort.rate >= 22
                              ? 'text-rose-700'
                              : cohort.rate >= 14
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {cohort.rate.toFixed(1)}% Attrition
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {cohort.attrited}/{cohort.total} left
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-sm overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full transition-all duration-200"
                        style={{ width: `${Math.min(100, cohort.rate)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                      <span>Cohort Headcount: {cohort.total}</span>
                      <span>
                        Avg Annual Pay: ${cohort.avgSalary.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Early-tenure (0–1 yr) turnover outpaces 9+ yr veterans</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {tenureCohorts[0].rate.toFixed(1)}% vs {tenureCohorts[3].rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Overtime Multiplier, Satisfaction Curve, and Root-Cause Exit Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overtime & Burnout Impact */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Overtime Workload Impact
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Turnover differential between standard schedules and frequent overtime
            </p>

            <div className="mt-6 space-y-5">
              <div
                onClick={() =>
                  onUpdateFilter(
                    'overTime',
                    filters.overTime === 'Yes' ? 'All' : 'Yes'
                  )
                }
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  filters.overTime === 'Yes'
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Overtime Logged (Yes)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-rose-700">
                    {otAttritionRate.toFixed(1)}% Attrition
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden mt-2.5">
                  <div
                    className="h-full bg-rose-600"
                    style={{ width: `${Math.min(100, otAttritionRate)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                  <span>{overtimeGroup.length} Employees</span>
                  <span>
                    {overtimeGroup.filter((r) => r.attrition).length} Departures
                  </span>
                </div>
              </div>

              <div
                onClick={() =>
                  onUpdateFilter(
                    'overTime',
                    filters.overTime === 'No' ? 'All' : 'No'
                  )
                }
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  filters.overTime === 'No'
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    Standard Hours (No Overtime)
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-700">
                    {stdAttritionRate.toFixed(1)}% Attrition
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden mt-2.5">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${Math.min(100, stdAttritionRate)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                  <span>{standardGroup.length} Employees</span>
                  <span>
                    {standardGroup.filter((r) => r.attrition).length} Departures
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Overtime Risk Multiplier</span>
            <span className="font-mono tabular-nums font-semibold text-rose-700">
              {stdAttritionRate > 0
                ? `${(otAttritionRate / stdAttritionRate).toFixed(2)}x higher turnover`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Job Satisfaction Sentiment Curve */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Job Satisfaction Retention Curve
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Attrition incidence across quarterly pulse survey tiers (1–4)
            </p>

            <div className="mt-5 space-y-3.5">
              {satisfactionLevels.map((tier) => (
                <div
                  key={tier.level}
                  className="p-3 rounded-lg border border-slate-200/80"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800">
                      {tier.label}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {tier.rate.toFixed(1)}% ({tier.attrited}/{tier.total})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className={`h-full ${
                        tier.level === 1
                          ? 'bg-rose-600'
                          : tier.level === 2
                          ? 'bg-amber-500'
                          : tier.level === 3
                          ? 'bg-blue-600'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, tier.rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Retention Gain (Level 4 vs Level 1)</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-700">
              +{(satisfactionLevels[0].rate - satisfactionLevels[3].rate).toFixed(1)}% Retained
            </span>
          </div>
        </div>

        {/* Exit Interview Primary Reasons */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Primary Exit Interview Drivers
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Root-cause distribution across {attritedRecords.length} recorded departures
            </p>

            {exitDrivers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No attrition events in the currently filtered slice.
              </div>
            ) : (
              <div className="mt-5 space-y-3.5">
                {exitDrivers.map((item) => (
                  <div key={item.reason} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate pr-2">
                        {item.reason}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 shrink-0">
                        {item.count} ({item.share.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-slate-800"
                        style={{ width: `${Math.min(100, item.share)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Top Controllable Driver</span>
            <span className="font-medium text-slate-900 truncate max-w-[180px]">
              {exitDrivers[0]?.reason || 'None'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
