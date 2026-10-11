import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Plus, RotateCcw, Search } from 'lucide-react';
import {
  Department,
  EmployeeRecord,
  JobRole,
  WorkMode,
} from '../data/hrDataset';

interface EmployeeDatasetExplorerProps {
  records: EmployeeRecord[];
  totalCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddEmployee: (emp: EmployeeRecord) => void;
  onResetDataset: () => void;
}

type SortKey =
  | 'id'
  | 'fullName'
  | 'department'
  | 'annualSalary'
  | 'yearsAtCompany'
  | 'totalWorkingYears'
  | 'jobSatisfaction'
  | 'attrition';

export const EmployeeDatasetExplorer: React.FC<EmployeeDatasetExplorerProps> = ({
  records,
  totalCount,
  searchQuery,
  onSearchChange,
  onAddEmployee,
  onResetDataset,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('annualSalary');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Add employee form state
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState<Department>('Engineering');
  const [newRole, setNewRole] = useState<JobRole>('Software Engineer');
  const [newSalary, setNewSalary] = useState('92000');
  const [newTenure, setNewTenure] = useState('2');
  const [newTotalExp, setNewTotalExp] = useState('5');
  const [newOvertime, setNewOvertime] = useState(false);
  const [newSatisfaction, setNewSatisfaction] = useState<1 | 2 | 3 | 4>(3);
  const [newWorkMode, setNewWorkMode] = useState<WorkMode>('Hybrid');
  const [newAttrition, setNewAttrition] = useState(false);

  const pageSize = 12;

  const sortedRecords = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === 'id') return a.id.localeCompare(b.id) * mul;
      if (sortKey === 'fullName') return a.fullName.localeCompare(b.fullName) * mul;
      if (sortKey === 'department') return a.department.localeCompare(b.department) * mul;
      if (sortKey === 'attrition') {
        return ((a.attrition ? 1 : 0) - (b.attrition ? 1 : 0)) * mul;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * mul;
    });
    return copy;
  }, [records, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = sortedRecords.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(1);
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const salaryNum = Math.max(30000, parseInt(newSalary, 10) || 85000);
    const tenureNum = Math.max(0, parseInt(newTenure, 10) || 2);
    const expNum = Math.max(tenureNum, parseInt(newTotalExp, 10) || 4);

    const newRecord: EmployeeRecord = {
      id: `EMP-${1001 + totalCount}`,
      fullName: newName.trim() || 'Alex Morgan',
      department: newDept,
      role: newRole,
      age: 24 + expNum,
      gender: 'Female',
      educationLevel: 'Bachelors',
      annualSalary: salaryNum,
      monthlyIncome: Math.round(salaryNum / 12),
      percentSalaryHike: 14,
      yearsAtCompany: tenureNum,
      totalWorkingYears: expNum,
      yearsSinceLastPromotion: Math.min(tenureNum, 2),
      overTime: newOvertime,
      jobSatisfaction: newSatisfaction,
      workLifeBalance: newOvertime ? 2 : 3,
      environmentSatisfaction: 3,
      performanceRating: 3,
      distanceFromHome: 9,
      workMode: newWorkMode,
      attrition: newAttrition,
      attritionReason: newAttrition
        ? newOvertime
          ? 'Work-Life Balance & Burnout'
          : 'Compensation Below Market'
        : 'Active Employee',
      hireDate: `${2026 - tenureNum}-04-15`,
    };

    onAddEmployee(newRecord);
    setNewName('');
    setShowAddForm(false);
  };

  return (
    <section id="dataset-explorer" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            06. Granular Workforce Record Inspector
          </p>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Employee Dataset Explorer (Salary, Department, Experience & Attrition)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Entry Form' : 'Add Employee Record'}</span>
          </button>
          <button
            type="button"
            onClick={onResetDataset}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Dataset</span>
          </button>
        </div>
      </div>

      {/* Add New Employee Record Collapsible Panel */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRecord}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Append New Employee Record to Live Analytical Model
              </h3>
              <p className="text-xs text-slate-500">
                All KPIs, correlation matrices, and attrition rates recalculate immediately
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Employee Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Taylor"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value as Department)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Job Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as JobRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Senior Software Engineer">Senior Software Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Sales Representative">Sales Representative</option>
                <option value="Sales Executive">Sales Executive</option>
                <option value="Laboratory Technician">Laboratory Technician</option>
                <option value="Research Scientist">Research Scientist</option>
                <option value="Operations Analyst">Operations Analyst</option>
                <option value="HR Specialist">HR Specialist</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Annual Salary (USD)
              </label>
              <input
                type="number"
                min={35000}
                max={250000}
                step={500}
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Company Tenure (Years)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={newTenure}
                onChange={(e) => setNewTenure(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Total Career Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={newTotalExp}
                onChange={(e) => setNewTotalExp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Job Satisfaction (1–4) & Work Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newSatisfaction}
                  onChange={(e) =>
                    setNewSatisfaction(Number(e.target.value) as 1 | 2 | 3 | 4)
                  }
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value={1}>1 · Low</option>
                  <option value={2}>2 · Mod</option>
                  <option value={3}>3 · High</option>
                  <option value={4}>4 · Max</option>
                </select>
                <select
                  value={newWorkMode}
                  onChange={(e) => setNewWorkMode(e.target.value as WorkMode)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-Site">On-Site</option>
                </select>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={newOvertime}
                  onChange={(e) => setNewOvertime(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span className="text-slate-700 font-medium">Overtime</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={newAttrition}
                  onChange={(e) => setNewAttrition(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600"
                />
                <span className="text-slate-700 font-medium">Attrited</span>
              </label>

              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Save Record
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setPage(1);
              }}
              placeholder="Search employee name, ID, role, or department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Showing {(safePage - 1) * pageSize + (sortedRecords.length > 0 ? 1 : 0)}–
            {Math.min(safePage * pageSize, sortedRecords.length)} of{' '}
            {sortedRecords.length} matching records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Emp ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('fullName')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Employee & Role</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSort('department')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('annualSalary')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Annual Salary</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('yearsAtCompany')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Tenure</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('totalWorkingYears')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Total Exp</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('jobSatisfaction')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Satisfaction · Overtime</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('attrition')}
                    className="inline-flex items-center gap-1 hover:text-slate-900 whitespace-nowrap"
                  >
                    <span>Retention Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No employee records match your active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {emp.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {emp.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.role} · {emp.workMode}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div>{emp.department}</div>
                      <div className="text-[11px] text-slate-400">
                        {emp.educationLevel} · Age {emp.age}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <div className="font-semibold text-slate-900">
                        ${emp.annualSalary.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ${emp.monthlyIncome.toLocaleString()}/mo
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      <div>{emp.yearsAtCompany} yrs</div>
                      <div className="text-[11px] text-slate-400">
                        Promo gap: {emp.yearsSinceLastPromotion}y
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {emp.totalWorkingYears} yrs
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      <div>Level {emp.jobSatisfaction}/4</div>
                      <div
                        className={`text-[11px] font-sans ${
                          emp.overTime
                            ? 'text-amber-700 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {emp.overTime ? 'Overtime: Yes' : 'Standard Hours'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`font-semibold ${
                          emp.attrition ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {emp.attrition ? 'Attrited · Left' : 'Retained · Active'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px] ml-auto">
                        {emp.attritionReason}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
