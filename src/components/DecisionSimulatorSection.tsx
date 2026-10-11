import React, { useState, useMemo } from 'react';
import { Check, Sliders } from 'lucide-react';
import {
  EmployeeRecord,
  evaluateActiveFlightRisks,
} from '../data/hrDataset';

interface DecisionSimulatorSectionProps {
  records: EmployeeRecord[];
}

export const DecisionSimulatorSection: React.FC<DecisionSimulatorSectionProps> = ({
  records,
}) => {
  // Interactive policy toggles
  const [capOvertime, setCapOvertime] = useState<boolean>(true);
  const [alignMarketComp, setAlignMarketComp] = useState<boolean>(true);
  const [acceleratePromotions, setAcceleratePromotions] = useState<boolean>(false);
  const [enableHybridCommute, setEnableHybridCommute] = useState<boolean>(false);

  // Track which high-risk employees have been assigned an active retention plan
  const [assignedInterventions, setAssignedInterventions] = useState<Record<string, string>>({});
  const [riskFilterTier, setRiskFilterTier] = useState<'All' | 'Critical Risk' | 'Elevated Risk'>('All');

  const flightRisks = useMemo(
    () => evaluateActiveFlightRisks(records),
    [records]
  );

  // Compute simulation outcomes from real dataset cohorts
  const simulation = useMemo(() => {
    const total = records.length;
    const currentAttrited = records.filter((r) => r.attrition).length;
    const baselineAttritionRate = total > 0 ? (currentAttrited / total) * 100 : 0;
    const baselineRetentionRate = 100 - baselineAttritionRate;

    // Identify targetable cohorts among high-risk / attrited patterns
    const overtimeCohort = flightRisks.filter((f) => f.employee.overTime && f.riskScore >= 45);
    const underpaidCohort = flightRisks.filter((f) => f.salaryGapPercent <= -10);
    const stalledPromoCohort = flightRisks.filter(
      (f) => f.employee.yearsSinceLastPromotion >= 4
    );
    const longCommuteCohort = flightRisks.filter(
      (f) => f.employee.distanceFromHome >= 15 && f.employee.workMode === 'On-Site'
    );

    let savedDepartures = 0;
    let programCost = 0;

    if (capOvertime) {
      savedDepartures += overtimeCohort.length * 0.24;
      // Modest contractor / sprint rebalancing operational cost
      programCost += overtimeCohort.length * 2400;
    }

    if (alignMarketComp) {
      savedDepartures += underpaidCohort.length * 0.28;
      // Cost to bring underpaid staff halfway to role median
      const compLiftCost = underpaidCohort.reduce((sum, item) => {
        const deficit = Math.max(0, item.roleMedianSalary - item.employee.annualSalary);
        return sum + deficit * 0.55;
      }, 0);
      programCost += compLiftCost;
    }

    if (acceleratePromotions) {
      savedDepartures += stalledPromoCohort.length * 0.19;
      programCost += stalledPromoCohort.length * 5200;
    }

    if (enableHybridCommute) {
      savedDepartures += longCommuteCohort.length * 0.18;
      programCost += longCommuteCohort.length * 800; // Home office stipend
    }

    // Factor in individual retention plans assigned by user in the table
    const manualPlansCount = Object.keys(assignedInterventions).length;
    savedDepartures += manualPlansCount * 0.45;
    programCost += manualPlansCount * 3000;

    const effectiveSaved = Math.min(
      currentAttrited,
      Math.round(savedDepartures * 10) / 10
    );

    const projectedAttrited = Math.max(0, currentAttrited - effectiveSaved);
    const projectedAttritionRate =
      total > 0 ? (projectedAttrited / total) * 100 : 0;
    const projectedRetentionRate = 100 - projectedAttritionRate;

    // Average replacement cost = 65% of annual salary (SHRM benchmark for skilled technical/sales roles)
    const avgAnnualSalary =
      total > 0
        ? records.reduce((s, r) => s + r.annualSalary, 0) / total
        : 85000;
    const grossReplacementSavings = Math.round(effectiveSaved * avgAnnualSalary * 0.65);
    const netSavings = Math.round(grossReplacementSavings - programCost);

    return {
      total,
      currentAttrited,
      baselineAttritionRate,
      baselineRetentionRate,
      projectedAttritionRate,
      projectedRetentionRate,
      effectiveSaved,
      programCost: Math.round(programCost),
      grossReplacementSavings,
      netSavings,
      cohorts: {
        overtimeCount: overtimeCohort.length,
        underpaidCount: underpaidCohort.length,
        stalledPromoCount: stalledPromoCohort.length,
        longCommuteCount: longCommuteCohort.length,
      },
    };
  }, [
    records,
    flightRisks,
    capOvertime,
    alignMarketComp,
    acceleratePromotions,
    enableHybridCommute,
    assignedInterventions,
  ]);

  const filteredWatchlist = useMemo(() => {
    return flightRisks
      .filter((item) => {
        if (riskFilterTier === 'All') return item.riskScore >= 45;
        return item.riskTier === riskFilterTier;
      })
      .slice(0, 10);
  }, [flightRisks, riskFilterTier]);

  const toggleInterventionPlan = (empId: string, actionLabel: string) => {
    setAssignedInterventions((prev) => {
      const next = { ...prev };
      if (next[empId]) {
        delete next[empId];
      } else {
        next[empId] = actionLabel;
      }
      return next;
    });
  };

  return (
    <section id="decision-simulator" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            05. Executive Decision Support & Retention Policy Simulator
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Retention Intervention Modeling & Proactive Flight-Risk Queue
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums">
          <span>Replacement Cost Benchmark: 0.65× Annual Base</span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Active Watchlist: {flightRisks.filter((f) => f.riskScore >= 52).length} staff</span>
        </div>
      </div>

      {/* Policy Simulator Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Policy Controls */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Retention Policy Levers (What-If Scenario Builder)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Toggle policy interventions to model projected impact on attrition rate and replacement budget
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Policy 1: Overtime Cap */}
              <div
                onClick={() => setCapOvertime(!capOvertime)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  capOvertime
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={capOvertime}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      aria-label="Cap Overtime & Rebalance Sprint Capacity"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Cap Overtime & Rebalance Workload Capacity
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Targets {simulation.cohorts.overtimeCount} active staff logging frequent overtime hours (strongest correlation r = +0.34).
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 shrink-0">
                    -24% Cohort Risk
                  </span>
                </div>
              </div>

              {/* Policy 2: Market Comp Adjustment */}
              <div
                onClick={() => setAlignMarketComp(!alignMarketComp)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  alignMarketComp
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={alignMarketComp}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      aria-label="Market Salary Band Calibration"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Market Salary Band Calibration (Close Role Median Gap)
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Adjusts base pay for {simulation.cohorts.underpaidCount} active employees currently paid ≥10% below role median.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 shrink-0">
                    -28% Cohort Risk
                  </span>
                </div>
              </div>

              {/* Policy 3: Promotion Velocity */}
              <div
                onClick={() => setAcceleratePromotions(!acceleratePromotions)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  acceleratePromotions
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={acceleratePromotions}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      aria-label="Mid-Tenure Career Progression & Leveling Review"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Mid-Tenure Career Progression & Leveling Review
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Establishes structured promotion tracks for {simulation.cohorts.stalledPromoCount} employees with ≥4 years in current grade.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 shrink-0">
                    -19% Cohort Risk
                  </span>
                </div>
              </div>

              {/* Policy 4: Hybrid Commute Flexibility */}
              <div
                onClick={() => setEnableHybridCommute(!enableHybridCommute)}
                className={`cursor-pointer p-4 rounded-lg border transition-colors ${
                  enableHybridCommute
                    ? 'border-blue-600 bg-blue-50/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={enableHybridCommute}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      aria-label="Hybrid Work Transition for Long-Commute Staff"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Hybrid Work Transition for Long-Commute Staff (≥15 Miles)
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Grants 2–3 days remote flexibility for {simulation.cohorts.longCommuteCount} on-site employees with high commute burden.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 shrink-0">
                    -18% Cohort Risk
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Individual Retention Plans Assigned in Watchlist: {Object.keys(assignedInterventions).length}
            </span>
            <button
              type="button"
              onClick={() => {
                setCapOvertime(true);
                setAlignMarketComp(true);
                setAcceleratePromotions(true);
                setEnableHybridCommute(true);
              }}
              className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Enable All Recommended Policies
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Simulated Executive ROI & Retention Impact Readout */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Projected Policy Outcome
            </p>
            <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
              Simulated Workforce Stability & Financial ROI
            </h3>

            {/* Before vs After Attrition Rate */}
            <div className="grid grid-cols-2 gap-4 mt-6 pb-6 border-b border-slate-800">
              <div>
                <div className="text-xs text-slate-400">Current Attrition Rate</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-1">
                  {simulation.baselineAttritionRate.toFixed(1)}%
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                  Retention: {simulation.baselineRetentionRate.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Projected Attrition Rate</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {simulation.projectedAttritionRate.toFixed(1)}%
                </div>
                <div className="text-[11px] font-mono tabular-nums text-emerald-300 mt-1">
                  Retention: {simulation.projectedRetentionRate.toFixed(1)}% (+
                  {(
                    simulation.projectedRetentionRate -
                    simulation.baselineRetentionRate
                  ).toFixed(1)}{' '}
                  pts)
                </div>
              </div>
            </div>

            {/* Financial & Headcount Breakdown */}
            <div className="mt-6 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Projected Regrettable Departures Prevented
                </span>
                <span className="font-mono tabular-nums font-semibold text-white text-sm">
                  {simulation.effectiveSaved.toFixed(1)} employees
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Avoided Turnover & Backfill Cost
                </span>
                <span className="font-mono tabular-nums font-semibold text-emerald-400">
                  +${simulation.grossReplacementSavings.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300">
                  Estimated Annual Policy Investment
                </span>
                <span className="font-mono tabular-nums text-slate-300">
                  -${simulation.programCost.toLocaleString()}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">
                    Net Annual Retention Savings
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Replacement savings minus compensation & program outlay
                  </div>
                </div>
                <span
                  className={`text-xl font-bold font-mono tabular-nums ${
                    simulation.netSavings >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {simulation.netSavings >= 0
                    ? `+$${simulation.netSavings.toLocaleString()}`
                    : `-$${Math.abs(simulation.netSavings).toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Decision Guidance: Combining Overtime Rebalancing with Role Median Pay Calibration delivers the highest net retention lift per dollar invested.
          </div>
        </div>
      </div>

      {/* Actionable Flight-Risk Priority Queue */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Proactive Flight-Risk Watchlist (Active Employees)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active employees flagged by multivariate correlation weights for immediate retention action
            </p>
          </div>

          {/* Interactive Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
            {(['All', 'Critical Risk', 'Elevated Risk'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setRiskFilterTier(tier)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  riskFilterTier === tier
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier === 'All' ? 'All High-Risk' : tier}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th className="py-3 px-4 font-semibold">Employee & Role</th>
                <th className="py-3 px-3 font-semibold text-right">Salary vs Role Median</th>
                <th className="py-3 px-3 font-semibold text-right">Tenure · Promo Gap</th>
                <th className="py-3 px-3 font-semibold text-right">Flight Risk Score</th>
                <th className="py-3 px-4 font-semibold">Primary Risk Factors</th>
                <th className="py-3 px-4 font-semibold">Recommended HR Decision</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWatchlist.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active employees match the selected flight-risk tier in this filter slice.
                  </td>
                </tr>
              ) : (
                filteredWatchlist.map((item) => {
                  const isAssigned = Boolean(assignedInterventions[item.employee.id]);
                  return (
                    <tr key={item.employee.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.employee.fullName}
                          <span className="text-slate-400 font-mono font-normal ml-1.5">
                            {item.employee.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.employee.role} · {item.employee.department}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-semibold text-slate-900">
                          ${item.employee.annualSalary.toLocaleString()}
                        </div>
                        <div
                          className={`text-[11px] ${
                            item.salaryGapPercent <= -10
                              ? 'text-rose-700 font-medium'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.salaryGapPercent >= 0
                            ? `+${item.salaryGapPercent}% vs median`
                            : `${item.salaryGapPercent}% vs median`}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        <div>{item.employee.yearsAtCompany} yrs tenure</div>
                        <div className="text-[11px] text-slate-500">
                          {item.employee.yearsSinceLastPromotion} yrs since promo
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-bold ${
                            item.riskScore >= 72
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.riskScore}%
                        </span>
                        <div className="text-[11px] font-sans text-slate-500">
                          {item.riskTier}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-[240px]">
                        {item.riskFactors.join(' · ')}
                      </td>

                      <td className="py-3 px-4 text-slate-800 font-medium max-w-[230px]">
                        {item.recommendedAction}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            toggleInterventionPlan(
                              item.employee.id,
                              item.recommendedAction
                            )
                          }
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                            isAssigned
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isAssigned ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Plan Active</span>
                            </>
                          ) : (
                            <span>Assign Intervention</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
