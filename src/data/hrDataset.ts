export type Department =
  | 'Engineering'
  | 'Sales'
  | 'Research & Development'
  | 'Operations'
  | 'Human Resources';

export type JobRole =
  | 'Software Engineer'
  | 'Senior Software Engineer'
  | 'Product Manager'
  | 'Sales Representative'
  | 'Sales Executive'
  | 'Sales Manager'
  | 'Research Scientist'
  | 'Laboratory Technician'
  | 'Research Director'
  | 'Operations Analyst'
  | 'Supply Chain Manager'
  | 'HR Specialist';

export type WorkMode = 'Hybrid' | 'Remote' | 'On-Site';

export type AttritionReason =
  | 'Compensation Below Market'
  | 'Work-Life Balance & Burnout'
  | 'Limited Career Progression'
  | 'Commute & Return-to-Office'
  | 'Role & Manager Alignment'
  | 'Active Employee';

export interface EmployeeRecord {
  id: string;
  fullName: string;
  department: Department;
  role: JobRole;
  age: number;
  gender: 'Female' | 'Male' | 'Non-Binary';
  educationLevel: 'Bachelors' | 'Masters' | 'Doctorate' | 'Associate';
  annualSalary: number;
  monthlyIncome: number;
  percentSalaryHike: number;
  yearsAtCompany: number;
  totalWorkingYears: number;
  yearsSinceLastPromotion: number;
  overTime: boolean;
  jobSatisfaction: 1 | 2 | 3 | 4;
  workLifeBalance: 1 | 2 | 3 | 4;
  environmentSatisfaction: 1 | 2 | 3 | 4;
  performanceRating: 1 | 2 | 3 | 4;
  distanceFromHome: number; // miles
  workMode: WorkMode;
  attrition: boolean; // true = left company, false = retained/active
  attritionReason: AttritionReason;
  hireDate: string;
}

export interface FilterState {
  department: string;
  role: string;
  salaryBand: string;
  experienceBand: string;
  overTime: string;
  attritionStatus: string;
  workMode: string;
  searchQuery: string;
}

export interface CorrelationVariable {
  key: string;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
  extract: (e: EmployeeRecord) => number;
}

export const CORRELATION_VARIABLES: CorrelationVariable[] = [
  {
    key: 'attrition',
    label: 'Employee Attrition',
    shortLabel: 'Attrition',
    unit: 'Binary (0/1)',
    description: '1 if employee left the organization, 0 if actively retained',
    extract: (e) => (e.attrition ? 1 : 0),
  },
  {
    key: 'annualSalary',
    label: 'Annual Salary',
    shortLabel: 'Salary',
    unit: 'USD ($)',
    description: 'Base annual gross compensation in USD',
    extract: (e) => e.annualSalary,
  },
  {
    key: 'yearsAtCompany',
    label: 'Company Tenure',
    shortLabel: 'Tenure',
    unit: 'Years',
    description: 'Years of continuous service at the organization',
    extract: (e) => e.yearsAtCompany,
  },
  {
    key: 'totalWorkingYears',
    label: 'Total Experience',
    shortLabel: 'Experience',
    unit: 'Years',
    description: 'Cumulative professional career experience in years',
    extract: (e) => e.totalWorkingYears,
  },
  {
    key: 'overTime',
    label: 'Overtime Status',
    shortLabel: 'Overtime',
    unit: 'Binary (0/1)',
    description: '1 if employee regularly logs overtime hours, 0 otherwise',
    extract: (e) => (e.overTime ? 1 : 0),
  },
  {
    key: 'jobSatisfaction',
    label: 'Job Satisfaction',
    shortLabel: 'Job Sat.',
    unit: 'Scale (1–4)',
    description: 'Self-reported quarterly job satisfaction index (1 Low to 4 Very High)',
    extract: (e) => e.jobSatisfaction,
  },
  {
    key: 'workLifeBalance',
    label: 'Work-Life Balance',
    shortLabel: 'WLB Score',
    unit: 'Scale (1–4)',
    description: 'Work-life equilibrium rating (1 Bad to 4 Best)',
    extract: (e) => e.workLifeBalance,
  },
  {
    key: 'yearsSinceLastPromotion',
    label: 'Promotion Gap',
    shortLabel: 'Promo Gap',
    unit: 'Years',
    description: 'Years elapsed since most recent grade or title promotion',
    extract: (e) => e.yearsSinceLastPromotion,
  },
  {
    key: 'distanceFromHome',
    label: 'Commute Distance',
    shortLabel: 'Commute',
    unit: 'Miles',
    description: 'One-way residential distance from primary office hub',
    extract: (e) => e.distanceFromHome,
  },
];

// Deterministic PRNG for reproducible, realistic workforce dataset
function createSeededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

const FIRST_NAMES = [
  'Elena', 'Marcus', 'Priya', 'David', 'Sofia', 'James', 'Amara', 'Liam',
  'Chloe', 'Lucas', 'Nadia', 'Ethan', 'Maya', 'Noah', 'Zoe', 'Julian',
  'Hannah', 'Gabriel', 'Aria', 'Benjamin', 'Leila', 'Samuel', 'Claire', 'Owen',
  'Fatima', 'Alexander', 'Eva', 'Daniel', 'Sienna', 'Matthew', 'Aisha', 'Henry',
  'grace', 'Sebastian', 'Nina', 'Jack', 'victoria', 'Leo', 'Camila', 'Nathan',
  'Tariq', 'Audrey', 'Isaac', 'Hazel', 'Caleb', 'Ruby', 'Ryan', 'Alice',
  'Kenji', 'Mei', 'Mateo', 'Valeria', 'Devon', 'Kieran', 'Sora', 'Ananya'
].map((n) => n.charAt(0).toUpperCase() + n.slice(1));

const LAST_NAMES = [
  'Rostova', 'Vance', 'Patel', 'Kim', 'Lindqvist', 'Okafor', 'Chen', 'Mercer',
  'Alvarez', 'Thorne', 'Kowalski', 'berg', 'Shah', 'Moreau', 'Takahashi', 'Silva',
  'Novak', 'Castillo', 'Haddad', 'Sato', 'Sinclair', 'Bauer', 'Mehta', 'Gallagher',
  'Volkov', 'Delgado', 'Chandra', 'Hartmann', 'Bello', 'Keller', 'Vargas', 'Lin',
  'wallace', 'Reyes', 'Ferreira', 'Mendoza', 'kapoor', 'Zimmerman', 'Park', 'Costa'
].map((n) => n.charAt(0).toUpperCase() + n.slice(1));

interface RoleTemplate {
  department: Department;
  role: JobRole;
  baseSalaryMin: number;
  baseSalaryMax: number;
  minExp: number;
  maxExp: number;
  weight: number;
  baseOvertimeProb: number;
}

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    department: 'Engineering',
    role: 'Software Engineer',
    baseSalaryMin: 82000,
    baseSalaryMax: 128000,
    minExp: 1,
    maxExp: 9,
    weight: 16,
    baseOvertimeProb: 0.34,
  },
  {
    department: 'Engineering',
    role: 'Senior Software Engineer',
    baseSalaryMin: 126000,
    baseSalaryMax: 178000,
    minExp: 5,
    maxExp: 18,
    weight: 12,
    baseOvertimeProb: 0.25,
  },
  {
    department: 'Engineering',
    role: 'Product Manager',
    baseSalaryMin: 112000,
    baseSalaryMax: 162000,
    minExp: 3,
    maxExp: 15,
    weight: 7,
    baseOvertimeProb: 0.28,
  },
  {
    department: 'Sales',
    role: 'Sales Representative',
    baseSalaryMin: 46000,
    baseSalaryMax: 74000,
    minExp: 0,
    maxExp: 6,
    weight: 14,
    baseOvertimeProb: 0.44,
  },
  {
    department: 'Sales',
    role: 'Sales Executive',
    baseSalaryMin: 72000,
    baseSalaryMax: 118000,
    minExp: 2,
    maxExp: 12,
    weight: 14,
    baseOvertimeProb: 0.32,
  },
  {
    department: 'Sales',
    role: 'Sales Manager',
    baseSalaryMin: 115000,
    baseSalaryMax: 165000,
    minExp: 6,
    maxExp: 20,
    weight: 5,
    baseOvertimeProb: 0.22,
  },
  {
    department: 'Research & Development',
    role: 'Laboratory Technician',
    baseSalaryMin: 48000,
    baseSalaryMax: 76000,
    minExp: 0,
    maxExp: 8,
    weight: 12,
    baseOvertimeProb: 0.38,
  },
  {
    department: 'Research & Development',
    role: 'Research Scientist',
    baseSalaryMin: 78000,
    baseSalaryMax: 124000,
    minExp: 2,
    maxExp: 14,
    weight: 11,
    baseOvertimeProb: 0.29,
  },
  {
    department: 'Research & Development',
    role: 'Research Director',
    baseSalaryMin: 138000,
    baseSalaryMax: 192000,
    minExp: 8,
    maxExp: 24,
    weight: 4,
    baseOvertimeProb: 0.18,
  },
  {
    department: 'Operations',
    role: 'Operations Analyst',
    baseSalaryMin: 56000,
    baseSalaryMax: 88000,
    minExp: 1,
    maxExp: 10,
    weight: 9,
    baseOvertimeProb: 0.35,
  },
  {
    department: 'Operations',
    role: 'Supply Chain Manager',
    baseSalaryMin: 96000,
    baseSalaryMax: 142000,
    minExp: 4,
    maxExp: 16,
    weight: 5,
    baseOvertimeProb: 0.24,
  },
  {
    department: 'Human Resources',
    role: 'HR Specialist',
    baseSalaryMin: 58000,
    baseSalaryMax: 96000,
    minExp: 1,
    maxExp: 12,
    weight: 6,
    baseOvertimeProb: 0.21,
  },
];

export function generateInitialDataset(count = 250): EmployeeRecord[] {
  const rand = createSeededRandom(42026);
  const totalWeight = ROLE_TEMPLATES.reduce((acc, t) => acc + t.weight, 0);

  const records: EmployeeRecord[] = [];

  for (let i = 0; i < count; i++) {
    // Pick role template by weight
    let rWeight = rand() * totalWeight;
    let template = ROLE_TEMPLATES[0];
    for (const t of ROLE_TEMPLATES) {
      if (rWeight <= t.weight) {
        template = t;
        break;
      }
      rWeight -= t.weight;
    }

    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[(i * 7 + Math.floor(rand() * LAST_NAMES.length)) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;

    // Experience & tenure
    const expSpan = template.maxExp - template.minExp;
    const totalWorkingYears = Math.max(
      1,
      Math.round(template.minExp + Math.pow(rand(), 1.15) * expSpan)
    );
    const yearsAtCompany = Math.max(
      0,
      Math.min(totalWorkingYears, Math.round(totalWorkingYears * (0.35 + rand() * 0.65)))
    );

    const age = Math.min(62, Math.max(22, 21 + totalWorkingYears + Math.floor(rand() * 7)));

    // Gender & Education
    const gRoll = rand();
    const gender: EmployeeRecord['gender'] =
      gRoll < 0.46 ? 'Female' : gRoll < 0.94 ? 'Male' : 'Non-Binary';

    const eduRoll = rand();
    const educationLevel: EmployeeRecord['educationLevel'] =
      template.role.includes('Director') || template.role.includes('Scientist')
        ? eduRoll < 0.35
          ? 'Doctorate'
          : eduRoll < 0.8
          ? 'Masters'
          : 'Bachelors'
        : eduRoll < 0.12
        ? 'Associate'
        : eduRoll < 0.68
        ? 'Bachelors'
        : eduRoll < 0.93
        ? 'Masters'
        : 'Doctorate';

    // Salary correlated with experience & role band
    const expRatio = Math.min(1, (totalWorkingYears - template.minExp) / Math.max(1, expSpan));
    const salarySpread = template.baseSalaryMax - template.baseSalaryMin;
    const rawSalary =
      template.baseSalaryMin +
      salarySpread * (0.65 * expRatio + 0.35 * rand());
    const annualSalary = Math.round(rawSalary / 500) * 500;
    const monthlyIncome = Math.round(annualSalary / 12);

    // Overtime, Satisfaction, Work-Life Balance, Promotion Gap, Commute
    const overTime = rand() < template.baseOvertimeProb;

    // Years since last promotion
    const yearsSinceLastPromotion =
      yearsAtCompany <= 1
        ? 0
        : Math.min(yearsAtCompany, Math.floor(Math.pow(rand(), 1.3) * (yearsAtCompany + 1)));

    // Work Mode
    const wmRoll = rand();
    const workMode: WorkMode =
      template.role === 'Laboratory Technician'
        ? wmRoll < 0.72
          ? 'On-Site'
          : 'Hybrid'
        : wmRoll < 0.28
        ? 'On-Site'
        : wmRoll < 0.74
        ? 'Hybrid'
        : 'Remote';

    const distanceFromHome =
      workMode === 'Remote'
        ? Math.max(2, Math.round(4 + rand() * 24))
        : Math.max(1, Math.round(1 + Math.pow(rand(), 1.25) * 28));

    // Job satisfaction (influenced slightly by salary position in role & overtime)
    const salaryPercentileInRole = (annualSalary - template.baseSalaryMin) / Math.max(1, salarySpread);
    const satScoreRaw =
      2.65 +
      (salaryPercentileInRole - 0.5) * 1.1 -
      (overTime ? 0.55 : 0) -
      (yearsSinceLastPromotion >= 4 ? 0.45 : 0) +
      (rand() - 0.5) * 1.6;
    const jobSatisfaction = Math.max(1, Math.min(4, Math.round(satScoreRaw))) as 1 | 2 | 3 | 4;

    const wlbRaw =
      2.85 -
      (overTime ? 0.85 : 0) -
      (distanceFromHome > 18 && workMode === 'On-Site' ? 0.55 : 0) +
      (workMode === 'Remote' ? 0.35 : 0) +
      (rand() - 0.5) * 1.4;
    const workLifeBalance = Math.max(1, Math.min(4, Math.round(wlbRaw))) as 1 | 2 | 3 | 4;

    const envRaw = 2.6 + (rand() - 0.45) * 1.7;
    const environmentSatisfaction = Math.max(1, Math.min(4, Math.round(envRaw))) as 1 | 2 | 3 | 4;

    const perfRaw = 2.75 + (salaryPercentileInRole > 0.6 ? 0.35 : 0) + (rand() - 0.45) * 1.3;
    const performanceRating = Math.max(1, Math.min(4, Math.round(perfRaw))) as 1 | 2 | 3 | 4;

    const percentSalaryHike = Math.round(11 + (performanceRating - 1) * 3.2 + rand() * 4);

    // Realistic Multi-Factor Attrition Probability Model
    // Baseline turnover risk
    let attritionLogit = -2.35;
    if (overTime) attritionLogit += 1.25;
    if (jobSatisfaction === 1) attritionLogit += 1.1;
    else if (jobSatisfaction === 2) attritionLogit += 0.45;
    else if (jobSatisfaction === 4) attritionLogit -= 0.65;

    if (workLifeBalance === 1) attritionLogit += 0.95;
    else if (workLifeBalance === 2) attritionLogit += 0.35;
    else if (workLifeBalance === 4) attritionLogit -= 0.45;

    if (salaryPercentileInRole < 0.3) attritionLogit += 0.85;
    else if (salaryPercentileInRole > 0.75) attritionLogit -= 0.65;

    if (yearsAtCompany <= 1) attritionLogit += 0.72;
    else if (yearsAtCompany >= 8) attritionLogit -= 0.68;

    if (yearsSinceLastPromotion >= 4) attritionLogit += 0.78;
    if (distanceFromHome >= 16 && workMode === 'On-Site') attritionLogit += 0.65;

    const attritionProb = 1 / (1 + Math.exp(-attritionLogit));
    const attrition = rand() < attritionProb;

    let attritionReason: AttritionReason = 'Active Employee';
    if (attrition) {
      if (salaryPercentileInRole < 0.38) {
        attritionReason = 'Compensation Below Market';
      } else if (overTime && workLifeBalance <= 2) {
        attritionReason = 'Work-Life Balance & Burnout';
      } else if (yearsSinceLastPromotion >= 3) {
        attritionReason = 'Limited Career Progression';
      } else if (distanceFromHome >= 14 && workMode !== 'Remote') {
        attritionReason = 'Commute & Return-to-Office';
      } else {
        attritionReason = 'Role & Manager Alignment';
      }
    }

    const hireYear = 2026 - yearsAtCompany;
    const hireMonth = String(1 + ((i * 3) % 12)).padStart(2, '0');
    const hireDate = `${hireYear}-${hireMonth}-15`;

    records.push({
      id: `EMP-${String(1001 + i)}`,
      fullName,
      department: template.department,
      role: template.role,
      age,
      gender,
      educationLevel,
      annualSalary,
      monthlyIncome,
      percentSalaryHike,
      yearsAtCompany,
      totalWorkingYears,
      yearsSinceLastPromotion,
      overTime,
      jobSatisfaction,
      workLifeBalance,
      environmentSatisfaction,
      performanceRating,
      distanceFromHome,
      workMode,
      attrition,
      attritionReason,
      hireDate,
    });
  }

  return records;
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2 || y.length !== n) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return Math.max(-1, Math.min(1, num / den));
}

export interface CorrelationMatrixResult {
  variables: CorrelationVariable[];
  matrix: number[][]; // [row][col]
  attritionCorrelations: {
    variable: CorrelationVariable;
    r: number;
    absR: number;
    direction: 'positive' | 'negative';
    impactSummary: string;
  }[];
}

export function computeCorrelationAnalytics(records: EmployeeRecord[]): CorrelationMatrixResult {
  const vars = CORRELATION_VARIABLES;
  const vectors = vars.map((v) => records.map((r) => v.extract(r)));

  const matrix: number[][] = vars.map((_, i) =>
    vars.map((__, j) => {
      if (i === j) return 1.0;
      return calculatePearsonCorrelation(vectors[i], vectors[j]);
    })
  );

  // Index 0 is 'attrition'
  const attritionCorrelations = vars
    .slice(1)
    .map((v, idx) => {
      const r = matrix[0][idx + 1];
      const absR = Math.abs(r);
      const direction: 'positive' | 'negative' = r >= 0 ? 'positive' : 'negative';

      let impactSummary = '';
      if (v.key === 'overTime') {
        impactSummary = 'Frequent overtime is the strongest positive catalyst of voluntary turnover';
      } else if (v.key === 'annualSalary') {
        impactSummary = 'Competitive compensation acts as a primary buffer against attrition';
      } else if (v.key === 'jobSatisfaction') {
        impactSummary = 'Higher quarterly satisfaction scores strongly anchor employee retention';
      } else if (v.key === 'workLifeBalance') {
        impactSummary = 'Sustainable workload equilibrium directly reduces burnout exits';
      } else if (v.key === 'yearsAtCompany') {
        impactSummary = 'Early-tenure cohorts face higher risk before organizational embedding';
      } else if (v.key === 'totalWorkingYears') {
        impactSummary = 'Senior career experience correlates with higher role stability';
      } else if (v.key === 'yearsSinceLastPromotion') {
        impactSummary = 'Extended promotion gaps elevate flight risk among mid-tenure staff';
      } else if (v.key === 'distanceFromHome') {
        impactSummary = 'Longer office commutes increase attrition pressure for on-site roles';
      }

      return {
        variable: v,
        r,
        absR,
        direction,
        impactSummary,
      };
    })
    .sort((a, b) => b.absR - a.absR);

  return {
    variables: vars,
    matrix,
    attritionCorrelations,
  };
}

export interface FlightRiskAssessment {
  employee: EmployeeRecord;
  riskScore: number; // 0 to 99
  riskTier: 'Critical Risk' | 'Elevated Risk' | 'Moderate Risk' | 'Low Risk';
  riskFactors: string[];
  recommendedAction: string;
  roleMedianSalary: number;
  salaryGapPercent: number;
}

export function evaluateActiveFlightRisks(records: EmployeeRecord[]): FlightRiskAssessment[] {
  // Compute median salary by role
  const roleSalaries: Record<string, number[]> = {};
  for (const r of records) {
    if (!roleSalaries[r.role]) roleSalaries[r.role] = [];
    roleSalaries[r.role].push(r.annualSalary);
  }

  const roleMedians: Record<string, number> = {};
  for (const [role, list] of Object.entries(roleSalaries)) {
    const sorted = [...list].sort((a, b) => a - b);
    roleMedians[role] = sorted[Math.floor(sorted.length / 2)] || 75000;
  }

  const activeEmployees = records.filter((r) => !r.attrition);

  return activeEmployees
    .map((emp) => {
      const median = roleMedians[emp.role] || emp.annualSalary;
      const salaryGapPercent = Math.round(((emp.annualSalary - median) / median) * 100);

      let score = 18;
      const factors: string[] = [];

      if (emp.overTime) {
        score += 24;
        factors.push('Frequent Overtime');
      }
      if (emp.jobSatisfaction === 1) {
        score += 22;
        factors.push('Low Job Satisfaction (1/4)');
      } else if (emp.jobSatisfaction === 2) {
        score += 11;
        factors.push('Below-Target Satisfaction (2/4)');
      }

      if (emp.workLifeBalance === 1) {
        score += 18;
        factors.push('Severe Work-Life Imbalance (1/4)');
      } else if (emp.workLifeBalance === 2) {
        score += 9;
      }

      if (salaryGapPercent <= -12) {
        score += 19;
        factors.push(`${Math.abs(salaryGapPercent)}% Below Role Median Pay`);
      }

      if (emp.yearsSinceLastPromotion >= 4) {
        score += 15;
        factors.push(`${emp.yearsSinceLastPromotion} Yrs Without Promotion`);
      }

      if (emp.distanceFromHome >= 16 && emp.workMode === 'On-Site') {
        score += 12;
        factors.push(`${emp.distanceFromHome}mi On-Site Commute`);
      }

      if (emp.yearsAtCompany <= 1) {
        score += 8;
        factors.push('First-Year Onboarding Window');
      }

      const clampedScore = Math.min(96, Math.max(8, score));
      const riskTier: FlightRiskAssessment['riskTier'] =
        clampedScore >= 72
          ? 'Critical Risk'
          : clampedScore >= 52
          ? 'Elevated Risk'
          : clampedScore >= 35
          ? 'Moderate Risk'
          : 'Low Risk';

      let recommendedAction = 'Maintain standard quarterly check-in';
      if (salaryGapPercent <= -12) {
        recommendedAction = 'Conduct Market Compensation Adjustment Review';
      } else if (emp.overTime && emp.workLifeBalance <= 2) {
        recommendedAction = 'Rebalance Sprint Capacity & Cap Overtime Hours';
      } else if (emp.yearsSinceLastPromotion >= 4) {
        recommendedAction = 'Initiate Career Progression & Leveling Pathway';
      } else if (emp.distanceFromHome >= 16 && emp.workMode === 'On-Site') {
        recommendedAction = 'Offer Hybrid Schedule Flexibility (2–3 Days Remote)';
      } else if (emp.jobSatisfaction <= 2) {
        recommendedAction = 'Schedule Skip-Level Stay Interview & Role Alignment';
      }

      return {
        employee: emp,
        riskScore: clampedScore,
        riskTier,
        riskFactors: factors.length > 0 ? factors : ['Baseline Retention Profile'],
        recommendedAction,
        roleMedianSalary: median,
        salaryGapPercent,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}
