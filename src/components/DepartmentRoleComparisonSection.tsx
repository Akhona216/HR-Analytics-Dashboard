import React, { useState, useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { EmployeeRecord, FilterState } from '../data/hrDataset';

interface DepartmentRoleComparisonSectionProps {
  records: EmployeeRecord[];
  allRecords: EmployeeRecord[];
  filters: FilterState;
  onUpdateFilter: (key: keyof FilterState, value: string) => void;
}

type RoleSortField =
  | 'role'
  | 'total'
  | 'attritionRate'
  | 'retentionRate'
  | 'avgSalary'
  | 'payGap'
  | 'avgTenure'
  | 'overtimeRate';

export const DepartmentRoleComparisonSection: React.FC<DepartmentRoleComparisonSectionProps> = ({
  records,
  allRecords,
  filters,
  onUpdateFilter,
}) => {
  const [sortField, setSortField] = useState<RoleSortField>('attritionRate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Department Summary (computed over allRecords or filtered records so user can compare departments side-by-side)
  const departmentMetrics = useMemo(() => {
    const depts = [
      'Sales',
      'Research & Development',
      'Engineering',
      'Operations',
      'Human Resources',
    ];

    return depts
      .map((dept) => {
        const group = allRecords.filter((r) => r.department === dept);
        const total = group.length;
        const attrited = group.filter((r) => r.attrition).length;
        const retained = total - attrited;
        const attritionRate = total > 0 ? (attrited / total) * 100 : 0;
        const retentionRate = 100 - attritionRate;
        const avgSalary =
          total > 0
            ? Math.round(group.reduce((s, r) => s + r.annualSalary, 0) / total)
            : 0;
        const avgExp =
          total > 0
            ? group.reduce((s, r) => s + r.totalWorkingYears, 0) / total
            : 0;
        const overtimeRate =
          total > 0
            ? (group.filter((r) => r.overTime).length / total) * 100
            : 0;

        return {
          department: dept,
          total,
          attrited,
          retained,
          attritionRate,
          retentionRate,
          avgSalary,
          avgExp,
          overtimeRate,
        };
      })
      .sort((a, b) => b.attritionRate - a.attritionRate);
  }, [allRecords]);

  // Role Summary (computed over active filtered slice)
  const roleMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        role: string;
        department: string;
        records: EmployeeRecord[];
      }
    >();

    for (const r of records) {
      const existing = map.get(r.role);
      if (existing) {
        existing.records.push(r);
      } else {
        map.set(r.role, {
          role: r.role,
          department: r.department,
          records: [r],
        });
      }
    }

    const rows = Array.from(map.values()).map((entry) => {
      const total = entry.records.length;
      const leavers = entry.records.filter((r) => r.attrition);
      const stayers = entry.records.filter((r) => !r.attrition);
      const attrited = leavers.length;
      const attritionRate = total > 0 ? (attrited / total) * 100 : 0;
      const retentionRate = 100 - attritionRate;

      const avgSalary =
        total > 0
          ? Math.round(
              entry.records.reduce((s, r) => s + r.annualSalary, 0) / total
            )
          : 0;

      const stayerSalary =
        stayers.length > 0
          ? Math.round(
              stayers.reduce((s, r) => s + r.annualSalary, 0) / stayers.length
            )
          : avgSalary;

      const leaverSalary =
        leavers.length > 0
          ? Math.round(
              leavers.reduce((s, r) => s + r.annualSalary, 0) / leavers.length
            )
          : avgSalary;

      // Positive gap means leavers were paid X% less than retained peers in the same role
      const payGap =
        stayerSalary > 0 && leavers.length > 0
          ? ((leaverSalary - stayerSalary) / stayerSalary) * 100
          : 0;

      const avgTenure =
        total > 0
          ? entry.records.reduce((s, r) => s + r.yearsAtCompany, 0) / total
          : 0;

      const overtimeRate =
        total > 0
          ? (entry.records.filter((r) => r.overTime).length / total) * 100
          : 0;

      return {
        role: entry.role,
        department: entry.department,
        total,
        attrited,
        retained: total - attrited,
        attritionRate,
        retentionRate,
        avgSalary,
        stayerSalary,
        leaverSalary,
        payGap,
        avgTenure,
        overtimeRate,
      };
    });

    return rows.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortField === 'role') return a.role.localeCompare(b.role) * mul;
      return ((a[sortField] as number) - (b[sortField] as number)) * mul;
    });
  }, [records, sortField, sortAsc]);

  const handleSort = (field: RoleSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section id="departments-roles" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            04. Cross-Functional Organizational Benchmarking
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Attrition & Compensation Comparison Across Departments and Job Roles
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {filters.department !== 'All' && (
            <button
              type="button"
              onClick={() => onUpdateFilter('department', 'All')}
              className="font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              Show All Departments
            </button>
          )}
          {filters.role !== 'All' && (
            <button
              type="button"
              onClick={() => onUpdateFilter('role', 'All')}
              className="font-medium text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap shrink-0"
            >
              Clear Role Filter ({filters.role})
            </button>
          )}
        </div>
      </div>

      {/* Department-Level Benchmark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {departmentMetrics.map((dept) => {
          const isSelected = filters.department === dept.department;
          return (
            <button
              key={dept.department}
              type="button"
              onClick={() =>
                onUpdateFilter(
                  'department',
                  isSelected ? 'All' : dept.department
                )
              }
              className={`text-left bg-white rounded-xl p-5 border transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {dept.department}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      dept.attritionRate >= 20
                        ? 'text-rose-700'
                        : dept.attritionRate >= 14
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {dept.attritionRate.toFixed(1)}%
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                    {dept.attrited}/{dept.total} left
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Attrition · {dept.retentionRate.toFixed(1)}% Retained
                </p>

                {/* Proportional Visual Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-sm overflow-hidden mt-3 flex">
                  <div
                    className="bg-rose-600 h-full"
                    style={{ width: `${Math.min(100, dept.attritionRate)}%` }}
                  />
                  <div
                    className="bg-emerald-600/70 h-full"
                    style={{ width: `${Math.max(0, dept.retentionRate)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] font-mono tabular-nums text-slate-600">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Avg Salary</span>
                  <span className="font-medium text-slate-900">
                    ${dept.avgSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Avg Exp</span>
                  <span>{dept.avgExp.toFixed(1)} yrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-500">Overtime</span>
                  <span>{dept.overtimeRate.toFixed(0)}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Role-Level Granular Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Job Role Attrition, Retention & Leaver Pay-Gap Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any column header to sort or click a job role row to filter the entire workspace
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {roleMetrics.length} distinct roles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('role')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Job Role & Department</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('total')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Headcount</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right min-w-[170px]">
                  <button
                    type="button"
                    onClick={() => handleSort('attritionRate')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Attrition Rate</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('retentionRate')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Retention Rate</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('avgSalary')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Avg Salary</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('payGap')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                    title="Difference between average salary of employees who left vs those who stayed in the same role"
                  >
                    <span>Leaver vs Stayer Pay</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('avgTenure')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Avg Tenure</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('overtimeRate')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Overtime %</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roleMetrics.map((row) => {
                const isSelected = filters.role === row.role;
                return (
                  <tr
                    key={row.role}
                    onClick={() =>
                      onUpdateFilter('role', isSelected ? 'All' : row.role)
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {row.role}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.department}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {row.total}
                      </span>
                      <span className="text-slate-400 ml-1">
                        ({row.attrited} left)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20 h-2 bg-slate-100 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${
                              row.attritionRate >= 22
                                ? 'bg-rose-600'
                                : row.attritionRate >= 14
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{
                              width: `${Math.min(100, row.attritionRate * 2)}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`font-semibold w-12 text-right ${
                            row.attritionRate >= 22
                              ? 'text-rose-700'
                              : row.attritionRate >= 14
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {row.attritionRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {row.retentionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                      ${row.avgSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {row.attrited === 0 ? (
                        <span className="text-slate-400">No Departures</span>
                      ) : (
                        <span
                          className={
                            row.payGap < -5
                              ? 'text-rose-700 font-medium'
                              : 'text-slate-600'
                          }
                        >
                          {row.payGap > 0 ? `+${row.payGap.toFixed(1)}%` : `${row.payGap.toFixed(1)}%`}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {row.avgTenure.toFixed(1)} yrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                      {row.overtimeRate.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
