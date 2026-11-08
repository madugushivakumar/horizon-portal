/**
 * Horizon Portal — AI Insights Types & API Contracts
 * src/lib/hr-insights/types.ts
 *
 * Strongly typed definitions for Day 15: AI Insights Panel for HR Advanced.
 * Covers Attrition Risk aggregates, Anomaly Results rankings, Small-Group Suppression,
 * and Department Filter structures.
 */

export interface RiskBandCounts {
  low: number | null;
  medium: number | null;
  high: number | null;
  total: number;
  lowDisplay: string;
  mediumDisplay: string;
  highDisplay: string;
  highRiskPercentage: number | null;
  isSuppressed: boolean;
  suppressionNote?: string;
}

export interface DepartmentAttritionMetric {
  departmentId: string;
  departmentName: string;
  totalEvaluated: number;
  high: number | null;
  medium: number | null;
  low: number | null;
  highDisplay: string;
  mediumDisplay: string;
  lowDisplay: string;
  hasSuppression: boolean;
  suppressedBands: string[];
  suppressionReason?: string;
}

export interface ContributingFactor {
  factor: string;
  count: number;
  percentage: number;
}

export interface SpecificReasonItem {
  reason: string;
  count: number;
  percentage: number;
}

export interface AttritionInsightsData {
  totalEvaluated: number;
  riskBands: RiskBandCounts;
  departmentDistribution: DepartmentAttritionMetric[];
  topFactors: ContributingFactor[];
  topSpecificReasons: SpecificReasonItem[];
  countingSemantics: {
    description: string;
    intraRecordDeduplication: boolean;
    maxReasonsPerRecord: number;
  };
}

export interface AnomalyItem {
  id: string;
  sourceDataset: "payroll_monthly_features" | "attendance_monthly_features";
  category: "PAYROLL" | "ATTENDANCE";
  isMonetary: boolean;
  recordId: string;
  period: string;
  anomalyScore: number;
  flagged: string;
  reviewStatus: "Flagged for Review";
  reasonCode: string;
  reasonText: string;
  moneyAtRisk: number | null;
  formattedMoneyAtRisk: string | null;
  modelVersion: string;
  scoredAt: string;
  departmentId: string | null;
  departmentName: string | null;
  employeeMask: string;
  isUnmatchedEmployee: boolean;
}

export interface PayrollAnomalyInsightsData {
  totalAnomalies: number;
  totalPayrollAnomalies: number;
  totalAttendanceAnomalies: number;
  flaggedForReviewCount: number;
  aggregationAvailable: boolean;
  aggregationLabel: string;
  timeHorizonMonths: number;
  currency: string;
  currencySymbol: string;
  cumulativeMoneyAtRisk: number;
  formattedCumulativeMoneyAtRisk: string;
  zeroMoneyCount: number;
  positiveMoneyCount: number;
  nullMoneyCount: number;
  unmatchedEmployeeRecordsCount: number;
  items: AnomalyItem[];
}

export interface HRInsightsApiResponse {
  success: boolean;
  data: {
    filter: {
      departmentId: string | null;
      departmentName: string | null;
      isFiltered: boolean;
    };
    disclaimer: "AI-generated, for human review";
    governanceNotice: string;
    attrition: AttritionInsightsData;
    payrollAnomalies: PayrollAnomalyInsightsData;
  };
}

export interface DepartmentFilterItem {
  id: string;
  code: string | null;
  name: string;
  hasAttritionData: boolean;
  attritionCount: number | null;
  attritionCountDisplay: string;
  anomalyCount: number | null;
  anomalyCountDisplay: string;
  isSuppressed: boolean;
}

export interface HRInsightsFiltersApiResponse {
  success: boolean;
  data: {
    departments: DepartmentFilterItem[];
    unassignedOption?: {
      id: string;
      name: string;
      anomalyCount: number;
    };
  };
}
