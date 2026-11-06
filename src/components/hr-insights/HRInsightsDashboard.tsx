"use client";

/**
 * Horizon Portal — HR Insights Dashboard Master Container
 * src/components/hr-insights/HRInsightsDashboard.tsx
 *
 * Primary interactive container for Day 15:
 * - Scoped Department filtering with '< 5' suppression indicators
 * - Zero-race-condition request cancellation using AbortController
 * - 6 Top-level KPI summary cards
 * - Attrition risk distribution meters & top contributing factors
 * - Department comparison table preserving primary & complementary suppression
 * - Deterministically sorted payroll and attendance anomaly audit stream
 * - Responsible AI human review guidance
 * - Full dark mode and responsive layout support
 */

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HRInsightsApiResponse,
  HRInsightsFiltersApiResponse,
  DepartmentFilterItem,
} from "@/lib/hr-insights/types";
import { InsightsHeader } from "./InsightsHeader";
import { HRInsightsMetrics } from "./HRInsightsMetrics";
import { AttritionRiskOverview } from "./AttritionRiskOverview";
import { DepartmentAttritionTable } from "./DepartmentAttritionTable";
import { TopAttritionFactors } from "./TopAttritionFactors";
import { PayrollAnomalyPanel } from "./PayrollAnomalyPanel";
import { HumanReviewGuidance } from "./HumanReviewGuidance";
import { HRInsightsSkeleton } from "./HRInsightsSkeleton";
import { HRInsightsEmptyState } from "./HRInsightsEmptyState";
import { HRInsightsErrorState } from "./HRInsightsErrorState";
import { cn } from "@/lib/utils";

export interface HRInsightsDashboardProps {
  initialDepartments?: DepartmentFilterItem[];
  initialData?: HRInsightsApiResponse["data"] | null;
  currentUserRole?: string;
  className?: string;
}

export const HRInsightsDashboard: React.FC<HRInsightsDashboardProps> = ({
  initialDepartments = [],
  initialData = null,
  className,
}) => {
  const router = useRouter();

  // State
  const [departments, setDepartments] = useState<DepartmentFilterItem[]>(initialDepartments);
  const [unassignedOption, setUnassignedOption] = useState<{
    id: string;
    name: string;
    anomalyCount: number;
    anomalyCountDisplay: string;
  } | undefined>(undefined);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [insightsData, setInsightsData] = useState<HRInsightsApiResponse["data"] | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(!initialData);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);

  // Active abort controller reference for in-flight request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch filter metadata (/api/v1/hr-insights/filters)
  useEffect(() => {
    let isMounted = true;
    async function fetchFilters() {
      try {
        const res = await fetch("/api/v1/hr-insights/filters");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 403) {
            setErrorMessage("Access Restricted — AI Insights require Admin or HR role.");
            return;
          }
          throw new Error(`Filters error: HTTP ${res.status}`);
        }

        const json: HRInsightsFiltersApiResponse = await res.json();
        if (isMounted && json.success && json.data) {
          setDepartments(json.data.departments);
          if (json.data.unassignedOption) {
            setUnassignedOption({
              ...json.data.unassignedOption,
              anomalyCountDisplay: String(json.data.unassignedOption.anomalyCount),
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load department filters:", err);
        }
      }
    }

    if (initialDepartments.length === 0) {
      fetchFilters();
    }
    return () => {
      isMounted = false;
    };
  }, [initialDepartments.length, router]);

  // 2. Fetch insights data when selectedDepartmentId changes or on refresh
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadInsights() {
      try {
        // Handle UNASSIGNED filter option gracefully
        if (selectedDepartmentId === "UNASSIGNED") {
          const res = await fetch("/api/v1/hr-insights", {
            signal: controller.signal,
          });

          if (ignore) return;

          if (!res.ok) {
            if (res.status === 401) {
              router.push("/login");
              return;
            }
            if (res.status === 403) {
              setErrorMessage("Access Restricted — AI Insights require Admin or HR permissions.");
              return;
            }
            throw new Error(`HTTP error ${res.status}`);
          }

          const json: HRInsightsApiResponse = await res.json();
          if (ignore) return;

          if (json.success && json.data) {
            const orgData = json.data;
            const unmatchedItems = orgData.payrollAnomalies.items.filter(
              (item) => item.isUnmatchedEmployee
            );

            const unmatchedExposure = unmatchedItems.reduce(
              (sum, i) => sum + (i.moneyAtRisk || 0),
              0
            );

            const adaptedData: HRInsightsApiResponse["data"] = {
              ...orgData,
              filter: {
                departmentId: "UNASSIGNED",
                departmentName: "Unassigned / Former Employees",
                isFiltered: true,
              },
              attrition: {
                totalEvaluated: 0,
                riskBands: {
                  low: 0,
                  medium: 0,
                  high: 0,
                  total: 0,
                  lowDisplay: "0",
                  mediumDisplay: "0",
                  highDisplay: "0",
                  highRiskPercentage: 0,
                  isSuppressed: false,
                  suppressionNote: "Former employees are not in current attrition dataset.",
                },
                departmentDistribution: [],
                topFactors: [],
                topSpecificReasons: [],
                countingSemantics: orgData.attrition.countingSemantics,
              },
              payrollAnomalies: {
                ...orgData.payrollAnomalies,
                totalAnomalies: unmatchedItems.length,
                totalPayrollAnomalies: unmatchedItems.filter((i) => i.category === "PAYROLL").length,
                totalAttendanceAnomalies: unmatchedItems.filter((i) => i.category === "ATTENDANCE").length,
                flaggedForReviewCount: unmatchedItems.length,
                cumulativeMoneyAtRisk: unmatchedExposure,
                formattedCumulativeMoneyAtRisk: `₹${unmatchedExposure.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                items: unmatchedItems,
              },
            };

            setInsightsData(adaptedData);
            setErrorMessage(null);
            setLastUpdated(new Date());
          }
          return;
        }

        // Standard organization-wide or department-specific fetch
        const url = selectedDepartmentId
          ? `/api/v1/hr-insights?departmentId=${encodeURIComponent(selectedDepartmentId)}`
          : "/api/v1/hr-insights";

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (ignore) return;

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          if (res.status === 403) {
            setErrorMessage("Access Restricted — AI Insights require Admin or HR permissions.");
            return;
          }
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP error ${res.status}`);
        }

        const json: HRInsightsApiResponse = await res.json();
        if (ignore) return;

        if (json.success && json.data) {
          setInsightsData(json.data);
          setErrorMessage(null);
          setLastUpdated(new Date());
        } else {
          throw new Error("Invalid response received from AI insights service.");
        }
      } catch (err: unknown) {
        if (ignore) return;
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load workforce AI insights. Please check connection and try again.";
        setErrorMessage(msg);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadInsights();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedDepartmentId, refreshCount, router]);

  // Handlers
  const handleSelectDepartment = (deptId: string) => {
    setIsLoading(true);
    setSelectedDepartmentId(deptId);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshCount((c) => c + 1);
  };

  const handleResetFilter = () => {
    setIsLoading(true);
    setSelectedDepartmentId("");
  };

  return (
    <div className={cn("space-y-6 pb-12", className)}>
      {/* 1. Header & Scoped Department Filter */}
      <InsightsHeader
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onSelectDepartment={handleSelectDepartment}
        unassignedOption={unassignedOption}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      {/* 2. Error State */}
      {errorMessage && !isLoading && (
        <HRInsightsErrorState
          message={errorMessage}
          onRetry={handleRefresh}
        />
      )}

      {/* 3. Loading Skeleton */}
      {isLoading && <HRInsightsSkeleton />}

      {/* 4. Content Display */}
      {!isLoading && !errorMessage && insightsData && (
        <>
          {insightsData.attrition.totalEvaluated === 0 &&
          insightsData.payrollAnomalies.totalAnomalies === 0 ? (
            <HRInsightsEmptyState
              departmentName={insightsData.filter.departmentName}
              onResetFilter={handleResetFilter}
            />
          ) : (
            <>
              {/* Overview Metrics Cards */}
              <HRInsightsMetrics
                attrition={insightsData.attrition}
                payrollAnomalies={insightsData.payrollAnomalies}
              />

              {/* Attrition Risk Overview & Contributing Factors (2-column layout on desktop) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <AttritionRiskOverview
                  riskBands={insightsData.attrition.riskBands}
                  totalEvaluated={insightsData.attrition.totalEvaluated}
                />

                <TopAttritionFactors
                  topFactors={insightsData.attrition.topFactors}
                  topSpecificReasons={insightsData.attrition.topSpecificReasons}
                  totalEvaluated={insightsData.attrition.totalEvaluated}
                  countingSemantics={insightsData.attrition.countingSemantics}
                />
              </div>

              {/* Department Comparison Table (shown when viewing organization-wide) */}
              {!selectedDepartmentId && insightsData.attrition.departmentDistribution.length > 0 && (
                <DepartmentAttritionTable
                  departments={insightsData.attrition.departmentDistribution}
                />
              )}

              {/* Ranked Anomaly Audit Stream */}
              <PayrollAnomalyPanel data={insightsData.payrollAnomalies} />

              {/* Human Review & Ethical AI Guidance */}
              <HumanReviewGuidance />
            </>
          )}
        </>
      )}
    </div>
  );
};
