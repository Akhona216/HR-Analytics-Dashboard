/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Download, Filter, Upload, X } from 'lucide-react';
import {
  Department,
  EmployeeRecord,
  FilterState,
  JobRole,
  WorkMode,
  generateInitialDataset,
  evaluateActiveFlightRisks,
} from './data/hrDataset';
import { AttritionPatternsSection } from './components/AttritionPatternsSection';
import { CorrelationAnalysisSection } from './components/CorrelationAnalysisSection';
import { DepartmentRoleComparisonSection } from './components/DepartmentRoleComparisonSection';
import { DecisionSimulatorSection } from './components/DecisionSimulatorSection';
import { EmployeeDatasetExplorer } from './components/EmployeeDatasetExplorer';

const INITIAL_FILTERS: FilterState = {
  department: 'All',
  role: 'All',
  salaryBand: 'All',
  experienceBand: 'All',
  overTime: 'All',
  attritionStatus: 'All',
  workMode: 'All',
  searchQuery: '',
};

export default function App() {
  const [allRecords, setAllRecords] = useState<EmployeeRecord[]>(() =>
    generateInitialDataset(250)
  );
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.department !== 'All') count++;
    if (filters.role !== 'All') count++;
    if (filters.salaryBand !== 'All') count++;
    if (filters.experienceBand !== 'All') count++;
    if (filters.overTime !== 'All') count++;
    if (filters.attritionStatus !== 'All') count++;
    if (filters.workMode !== 'All') count++;
    if (filters.searchQuery.trim() !== '') count++;
    return count;
  }, [filters]);

  // Filtered Employee Dataset
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      if (filters.department !== 'All' && r.department !== filters.department) {
        return false;
      }
      if (filters.role !== 'All' && r.role !== filters.role) {
        return false;
      }
      if (filters.salaryBand !== 'All') {
        if (filters.salaryBand === 'under-65k' && r.annualSalary >= 65000) return false;
        if (
          filters.salaryBand === '65k-95k' &&
          (r.annualSalary < 65000 || r.annualSalary >= 95000)
        )
          return false;
        if (
          filters.salaryBand === '95k-130k' &&
          (r.annualSalary < 95000 || r.annualSalary >= 130000)
        )
          return false;
        if (filters.salaryBand === '130k-plus' && r.annualSalary < 130000) return false;
      }
      if (filters.experienceBand !== 'All') {
        if (filters.experienceBand === '0-1' && r.yearsAtCompany > 1) return false;
        if (
          filters.experienceBand === '2-4' &&
          (r.yearsAtCompany < 2 || r.yearsAtCompany > 4)
        )
          return false;
        if (
          filters.experienceBand === '5-8' &&
          (r.yearsAtCompany < 5 || r.yearsAtCompany > 8)
        )
          return false;
        if (filters.experienceBand === '9-plus' && r.yearsAtCompany < 9) return false;
      }
      if (filters.overTime !== 'All') {
        if (filters.overTime === 'Yes' && !r.overTime) return false;
        if (filters.overTime === 'No' && r.overTime) return false;
      }
      if (filters.attritionStatus !== 'All') {
        if (filters.attritionStatus === 'Attrited' && !r.attrition) return false;
        if (filters.attritionStatus === 'Retained' && r.attrition) return false;
      }
      if (filters.workMode !== 'All' && r.workMode !== filters.workMode) {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const match =
          r.fullName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.role.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allRecords, filters]);

  // Executive KPIs computed dynamically over filteredRecords
  const kpis = useMemo(() => {
    const total = filteredRecords.length;
    const attritedRecords = filteredRecords.filter((r) => r.attrition);
    const retainedRecords = filteredRecords.filter((r) => !r.attrition);
    const attritedCount = attritedRecords.length;
    const retainedCount = retainedRecords.length;

    const attritionRate = total > 0 ? (attritedCount / total) * 100 : 0;
    const retentionRate = total > 0 ? (retainedCount / total) * 100 : 0;

    const avgSalary =
      total > 0
        ? Math.round(
            filteredRecords.reduce((s, r) => s + r.annualSalary, 0) / total
          )
        : 0;

    const stayerAvgSalary =
      retainedCount > 0
        ? Math.round(
            retainedRecords.reduce((s, r) => s + r.annualSalary, 0) /
              retainedCount
          )
        : 0;

    const leaverAvgSalary =
      attritedCount > 0
        ? Math.round(
            attritedRecords.reduce((s, r) => s + r.annualSalary, 0) /
              attritedCount
          )
        : 0;

    const avgTenure =
      total > 0
        ? filteredRecords.reduce((s, r) => s + r.yearsAtCompany, 0) / total
        : 0;

    const avgTotalExp =
      total > 0
        ? filteredRecords.reduce((s, r) => s + r.totalWorkingYears, 0) / total
        : 0;

    const overtimeCount = filteredRecords.filter((r) => r.overTime).length;
    const overtimeRate = total > 0 ? (overtimeCount / total) * 100 : 0;

    const highRiskActiveCount = evaluateActiveFlightRisks(filteredRecords).filter(
      (f) => f.riskScore >= 52
    ).length;

    return {
      total,
      attritedCount,
      retainedCount,
      attritionRate,
      retentionRate,
      avgSalary,
      stayerAvgSalary,
      leaverAvgSalary,
      avgTenure,
      avgTotalExp,
      overtimeRate,
      highRiskActiveCount,
    };
  }, [filteredRecords]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'EmployeeID',
      'FullName',
      'Department',
      'JobRole',
      'Age',
      'Gender',
      'Education',
      'AnnualSalaryUSD',
      'YearsAtCompany',
      'TotalExperienceYears',
      'YearsSinceLastPromotion',
      'Overtime',
      'JobSatisfaction',
      'WorkLifeBalance',
      'DistanceFromHomeMiles',
      'WorkMode',
      'Attrition',
      'AttritionReason',
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      `"${r.fullName}"`,
      `"${r.department}"`,
      `"${r.role}"`,
      r.age,
      r.gender,
      r.educationLevel,
      r.annualSalary,
      r.yearsAtCompany,
      r.totalWorkingYears,
      r.yearsSinceLastPromotion,
      r.overTime ? 'Yes' : 'No',
      r.jobSatisfaction,
      r.workLifeBalance,
      r.distanceFromHome,
      r.workMode,
      r.attrition ? 'Yes' : 'No',
      `"${r.attritionReason}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `peoplepulse_hr_analytics_${filteredRecords.length}_records.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return;

      const parsed: EmployeeRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(',')
          .map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 8) continue;

        const salary = parseInt(cols[7], 10) || 75000;
        const tenure = parseInt(cols[8], 10) || 3;
        const totalExp = parseInt(cols[9], 10) || Math.max(tenure, 5);
        const isOvertime = cols[11]?.toLowerCase() === 'yes' || cols[11] === '1';
        const isAttrited = cols[16]?.toLowerCase() === 'yes' || cols[16] === '1';

        parsed.push({
          id: cols[0] || `EMP-${2000 + i}`,
          fullName: cols[1] || `Employee ${i}`,
          department: (cols[2] as Department) || 'Engineering',
          role: (cols[3] as JobRole) || 'Software Engineer',
          age: parseInt(cols[4], 10) || 32,
          gender: (cols[5] as EmployeeRecord['gender']) || 'Female',
          educationLevel:
            (cols[6] as EmployeeRecord['educationLevel']) || 'Bachelors',
          annualSalary: salary,
          monthlyIncome: Math.round(salary / 12),
          percentSalaryHike: 14,
          yearsAtCompany: tenure,
          totalWorkingYears: totalExp,
          yearsSinceLastPromotion: parseInt(cols[10], 10) || 1,
          overTime: isOvertime,
          jobSatisfaction: (Math.min(
            4,
            Math.max(1, parseInt(cols[12], 10) || 3)
          ) as 1 | 2 | 3 | 4),
          workLifeBalance: (Math.min(
            4,
            Math.max(1, parseInt(cols[13], 10) || 3)
          ) as 1 | 2 | 3 | 4),
          environmentSatisfaction: 3,
          performanceRating: 3,
          distanceFromHome: parseInt(cols[14], 10) || 8,
          workMode: (cols[15] as WorkMode) || 'Hybrid',
          attrition: isAttrited,
          attritionReason: isAttrited
            ? (cols[17] as EmployeeRecord['attritionReason']) ||
              'Compensation Below Market'
            : 'Active Employee',
          hireDate: `${2026 - tenure}-03-15`,
        });
      }

      if (parsed.length > 0) {
        setAllRecords(parsed);
        setFilters(INITIAL_FILTERS);
        setImportFeedback(`Imported ${parsed.length} employee records from ${file.name}`);
        setTimeout(() => setImportFeedback(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          PeoplePulse Analytics
        </a>

        {/* Zone 2: 5 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#overview"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <a
            href="#attrition-patterns"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Attrition Patterns
          </a>
          <a
            href="#correlation-lab"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Correlation Lab
          </a>
          <a
            href="#departments-roles"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Departments & Roles
          </a>
          <a
            href="#decision-simulator"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Decision Simulator
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </header>

      {/* Main Analytical Workspace Container (1440px max-w) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Executive Header & Interactive Global Dataset Slicer */}
        <section id="overview" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                01. Workforce Intelligence & Retention Telemetry
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1 text-balance">
                HR Analytics & Employee Attrition Decision Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-1.5 max-w-3xl">
                Multivariate analysis of compensation, department structure, tenure experience, and behavioral drivers to isolate turnover risk and guide retention policy.
              </p>
            </div>

            {/* Dataset Import & Quick Slice Status */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import Custom CSV</span>
              </button>

              <a
                href="#dataset-explorer"
                className="px-3.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100/70 transition-colors whitespace-nowrap shrink-0"
              >
                Inspect Raw Dataset ({filteredRecords.length})
              </a>
            </div>
          </div>

          {importFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
              <span>{importFeedback}</span>
              <button
                type="button"
                onClick={() => setImportFeedback(null)}
                className="text-emerald-700 hover:text-emerald-950"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Global Interactive Filter Control Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Global Workforce Cohort Slicers</span>
                <span className="text-slate-400 font-normal" aria-hidden="true">
                  ·
                </span>
                <span className="font-mono tabular-nums font-normal text-slate-500">
                  Showing {filteredRecords.length} of {allRecords.length} employees
                </span>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear {activeFilterCount} Active Filter{activeFilterCount > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) => handleUpdateFilter('department', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Departments (5)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Compensation Bracket
                </label>
                <select
                  value={filters.salaryBand}
                  onChange={(e) => handleUpdateFilter('salaryBand', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Salary Bands</option>
                  <option value="under-65k">Under $65,000</option>
                  <option value="65k-95k">$65,000 – $94,999</option>
                  <option value="95k-130k">$95,000 – $129,999</option>
                  <option value="130k-plus">$130,000 & Above</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Tenure / Experience
                </label>
                <select
                  value={filters.experienceBand}
                  onChange={(e) => handleUpdateFilter('experienceBand', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Tenure Stages</option>
                  <option value="0-1">0–1 Years (Onboarding)</option>
                  <option value="2-4">2–4 Years (Early Career)</option>
                  <option value="5-8">5–8 Years (Mid-Tenure)</option>
                  <option value="9-plus">9+ Years (Senior)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Overtime Workload
                </label>
                <select
                  value={filters.overTime}
                  onChange={(e) => handleUpdateFilter('overTime', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Schedules</option>
                  <option value="Yes">Overtime Logged (Yes)</option>
                  <option value="No">Standard Hours (No)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Work Arrangement
                </label>
                <select
                  value={filters.workMode}
                  onChange={(e) => handleUpdateFilter('workMode', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">All Work Modes</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-Site">On-Site</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Retention Status
                </label>
                <select
                  value={filters.attritionStatus}
                  onChange={(e) =>
                    handleUpdateFilter('attritionStatus', e.target.value)
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                >
                  <option value="All">Full Workforce</option>
                  <option value="Retained">Retained (Active Only)</option>
                  <option value="Attrited">Attrited (Departed Only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5-Column Executive KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Attrition Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Employee Attrition Rate
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-3xl font-bold font-mono tabular-nums ${
                      kpis.attritionRate >= 18
                        ? 'text-rose-700'
                        : kpis.attritionRate >= 13
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {kpis.attritionRate.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {kpis.attritedCount} / {kpis.total}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono tabular-nums">
                <span className="font-sans text-slate-500">Target Threshold</span>
                <span
                  className={
                    kpis.attritionRate > 15.0
                      ? 'text-rose-700 font-medium'
                      : 'text-emerald-700 font-medium'
                  }
                >
                  15.0% ({kpis.attritionRate > 15 ? `+${(kpis.attritionRate - 15).toFixed(1)}%` : `${(kpis.attritionRate - 15).toFixed(1)}%`})
                </span>
              </div>
            </div>

            {/* KPI 2: Retention Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Workforce Retention Rate
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tabular-nums text-emerald-700">
                    {kpis.retentionRate.toFixed(1)}%
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {kpis.retainedCount} active
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono tabular-nums">
                <span className="font-sans text-slate-500">Stability Benchmark</span>
                <span className="text-slate-900 font-medium">85.0% Goal</span>
              </div>
            </div>

            {/* KPI 3: Average Annual Salary & Pay Gap */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Average Annual Salary
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    ${kpis.avgSalary.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono tabular-nums">
                <span className="font-sans text-slate-500">Leaver vs Stayer Avg</span>
                <span className="text-rose-700 font-medium">
                  ${Math.round(kpis.leaverAvgSalary / 1000)}k vs $
                  {Math.round(kpis.stayerAvgSalary / 1000)}k
                </span>
              </div>
            </div>

            {/* KPI 4: Average Experience & Company Tenure */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Average Company Tenure
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    {kpis.avgTenure.toFixed(1)} <span className="text-base font-normal text-slate-500">yrs</span>
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono tabular-nums">
                <span className="font-sans text-slate-500">Total Career Exp</span>
                <span className="text-slate-900 font-medium">
                  {kpis.avgTotalExp.toFixed(1)} yrs avg
                </span>
              </div>
            </div>

            {/* KPI 5: Overtime Rate & High-Risk Watchlist */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  High-Risk Active Staff
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-bold font-mono tabular-nums text-amber-700">
                    {kpis.highRiskActiveCount}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    flight risk ≥52%
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between font-mono tabular-nums">
                <span className="font-sans text-slate-500">Overtime Incidence</span>
                <span className="text-slate-900 font-medium">
                  {kpis.overtimeRate.toFixed(1)}% of slice
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Attrition Patterns (Salary, Tenure, Overtime, Satisfaction, Exit Reasons) */}
        <AttritionPatternsSection
          records={filteredRecords}
          filters={filters}
          onUpdateFilter={handleUpdateFilter}
        />

        {/* Section 3: Correlation Analysis (Ranked Key Factors, Bivariate Scatter & 9x9 Matrix) */}
        <CorrelationAnalysisSection records={filteredRecords} />

        {/* Section 4: Department & Role Cross-Comparison */}
        <DepartmentRoleComparisonSection
          records={filteredRecords}
          allRecords={allRecords}
          filters={filters}
          onUpdateFilter={handleUpdateFilter}
        />

        {/* Section 5: Executive Decision-Making & Policy Simulator */}
        <DecisionSimulatorSection records={filteredRecords} />

        {/* Section 6: Granular Employee Dataset Explorer & Record Creator */}
        <EmployeeDatasetExplorer
          records={filteredRecords}
          totalCount={allRecords.length}
          searchQuery={filters.searchQuery}
          onSearchChange={(q) => handleUpdateFilter('searchQuery', q)}
          onAddEmployee={(newEmp) =>
            setAllRecords((prev) => [newEmp, ...prev])
          }
          onResetDataset={() => {
            setAllRecords(generateInitialDataset(250));
            setFilters(INITIAL_FILTERS);
          }}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-6 px-6">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            PeoplePulse HR Analytics · Workforce Attrition, Correlation & Decision Support Suite
          </div>
          <div className="flex items-center gap-4">
            <a href="#overview" className="hover:text-slate-900 transition-colors">
              Back to Top
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleExportCSV}
              className="hover:text-slate-900 transition-colors"
            >
              Download Filtered Dataset CSV
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
