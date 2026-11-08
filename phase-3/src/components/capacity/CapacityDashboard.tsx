"use client";

/**
 * Horizon Portal — Capacity Dashboard Client Container
 * src/components/capacity/CapacityDashboard.tsx
 *
 * Primary interactive view uniting:
 * - Scoped filter controls (Sprint, Team)
 * - Top-level KPI summary cards
 * - Active sprint duration and burn progress
 * - Workload overload warnings
 * - Educational formula breakdown
 * - Responsive desktop table and mobile card listing
 * - Pagination controls and error/empty handling
 */

import React, { useState, useEffect } from "react";
import {
  CapacityDashboardData,
  CapacitySprintInfo,
  CapacityApiResponse,
  CapacityFiltersResponse,
} from "@/lib/capacity/capacity-types";
import { CapacityHeader } from "./CapacityHeader";
import { CapacitySummary } from "./CapacitySummary";
import { SprintProgressSummary } from "./SprintProgressSummary";
import { CapacityFormulaCard } from "./CapacityFormulaCard";
import { OverloadWarning } from "./OverloadWarning";
import { EmployeeCapacityTable } from "./EmployeeCapacityTable";
import { EmployeeCapacityCard } from "./EmployeeCapacityCard";
import { CapacityPagination } from "./CapacityPagination";
import { CapacitySkeleton } from "./CapacitySkeleton";
import { CapacityEmptyState } from "./CapacityEmptyState";
import { CapacityErrorState } from "./CapacityErrorState";

export interface CapacityDashboardProps {
  initialSprints?: CapacitySprintInfo[];
  initialTeams?: Array<{ id: string; teamName: string }>;
  currentUserRole?: string;
}

export const CapacityDashboard: React.FC<CapacityDashboardProps> = ({
  initialSprints = [],
  initialTeams = [],
}) => {
  const [sprints, setSprints] = useState<CapacitySprintInfo[]>(initialSprints);
  const [teams, setTeams] = useState<Array<{ id: string; teamName: string }>>(initialTeams);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    initialSprints.length > 0 ? initialSprints[0].id : ""
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  const [dashboardData, setDashboardData] = useState<CapacityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 1. Fetch filters if not supplied initially
  useEffect(() => {
    if (initialSprints.length === 0) {
      let isMounted = true;
      const fetchFilters = async () => {
        try {
          const res = await fetch("/api/v1/capacity/filters");
          if (!res.ok) throw new Error("Failed to load capacity filter options");
          const json: CapacityFiltersResponse = await res.json();
          if (isMounted && json.success && json.data) {
            setSprints(json.data.sprints);
            setTeams(json.data.teams);
            if (json.data.sprints.length > 0 && !selectedSprintId) {
              setSelectedSprintId(json.data.sprints[0].id);
            }
          }
        } catch (err) {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : "Error fetching filters";
            setErrorMessage(msg);
          }
        }
      };
      fetchFilters();
      return () => {
        isMounted = false;
      };
    }
  }, [initialSprints.length, selectedSprintId]);

  // 2. Fetch capacity data for active sprint and filters
  useEffect(() => {
    if (!selectedSprintId) return;

    let ignore = false;
    const abortController = new AbortController();

    async function loadCapacity() {
      try {
        const params = new URLSearchParams({
          sprintId: selectedSprintId,
          page: String(page),
          pageSize: String(pageSize),
        });

        if (selectedTeamId) {
          params.set("teamId", selectedTeamId);
        }

        const res = await fetch(`/api/v1/capacity?${params.toString()}`, {
          signal: abortController.signal,
        });

        if (ignore) return;

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }

        const json: CapacityApiResponse = await res.json();
        if (ignore) return;

        if (json.success && json.data) {
          setDashboardData(json.data);
          setErrorMessage(null);
          setLastUpdated(new Date());
        } else {
          throw new Error("Invalid response received from capacity API");
        }
      } catch (err) {
        if (ignore) return;
        const msg = err instanceof Error ? err.message : "Failed to load capacity data";
        setErrorMessage(msg);
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadCapacity();

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, [selectedSprintId, selectedTeamId, page, refreshCount]);

  // Handle sprint filter change (reset to page 1)
  const handleSelectSprint = (sprintId: string) => {
    setIsLoading(true);
    setSelectedSprintId(sprintId);
    setPage(1);
  };

  // Handle team filter change (reset to page 1)
  const handleSelectTeam = (teamId: string) => {
    setIsLoading(true);
    setSelectedTeamId(teamId);
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshCount((prev) => prev + 1);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header and Filter Bar */}
      <CapacityHeader
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        onSelectSprint={handleSelectSprint}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={handleSelectTeam}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      {/* 2. Loading State */}
      {isLoading && !dashboardData && <CapacitySkeleton />}

      {/* 3. Error State */}
      {errorMessage && !dashboardData && (
        <CapacityErrorState
          errorMessage={errorMessage}
          onRetry={handleRetry}
        />
      )}

      {/* 4. Active Dashboard Content */}
      {dashboardData && (
        <>
          {/* Overload Alert Warning */}
          <OverloadWarning
            overloadedCount={dashboardData.summary.overloadedEmployees}
          />

          {/* Top KPI Metrics Cards */}
          <CapacitySummary summary={dashboardData.summary} />

          {/* Sprint Progress and Educational Formula Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SprintProgressSummary
              sprint={dashboardData.sprint}
              progress={dashboardData.sprintProgress}
            />
            <CapacityFormulaCard />
          </div>

          {/* Data Presentation (Table or Empty State) */}
          {dashboardData.employees.length === 0 ? (
            <CapacityEmptyState
              onResetFilters={
                selectedTeamId ? () => handleSelectTeam("") : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Desktop / Tablet Table */}
              <EmployeeCapacityTable employees={dashboardData.employees} />

              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-3">
                {dashboardData.employees.map((record) => (
                  <EmployeeCapacityCard
                    key={record.employeeId}
                    record={record}
                  />
                ))}
              </div>

              {/* Server-backed Pagination */}
              <CapacityPagination
                page={dashboardData.pagination.page}
                pageSize={dashboardData.pagination.pageSize}
                total={dashboardData.pagination.total}
                totalPages={dashboardData.pagination.totalPages}
                onPageChange={handlePageChange}
                isLoading={isRefreshing}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
