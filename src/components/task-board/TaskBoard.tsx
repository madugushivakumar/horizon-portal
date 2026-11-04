"use client";

/**
 * Horizon Portal — Team Task Board Container
 * src/components/task-board/TaskBoard.tsx
 *
 * Core interactive container for the Kanban Task Board:
 * - Real API integration with GET /api/v1/tasks & PATCH /api/v1/tasks/[id].
 * - Full drag-and-drop workflow via @dnd-kit (DndContext, DragOverlay, Sensors).
 * - Instant optimistic UI task movements.
 * - Concurrency conflict handling (HTTP 409) with latest server state reconciliation.
 * - Automatic rollback on authorization failure (HTTP 403) or server errors.
 * - Independent pending update tracking per task ID.
 * - Permission-aware: HR role has read-only drag experience.
 * - Preserves active Team & Sprint filters and pagination.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  Task,
  TaskStatus,
  TaskPagination,
  TeamOption,
  SprintOption,
  TaskBoardSummaryMetrics,
  TaskBoardNotification as NotificationType,
} from "@/types/task";
import { TaskBoardHeader } from "./TaskBoardHeader";
import { TaskBoardSummary } from "./TaskBoardSummary";
import { TaskBoardFilters } from "./TaskBoardFilters";
import { TaskBoardColumn } from "./TaskBoardColumn";
import { TaskCard } from "./TaskCard";
import { TaskBoardPagination } from "./TaskBoardPagination";
import { TaskBoardSkeleton } from "./TaskBoardSkeleton";
import { TaskBoardEmptyState } from "./TaskBoardEmptyState";
import { TaskBoardErrorState } from "./TaskBoardErrorState";
import { TaskBoardNotificationBanner } from "./TaskBoardNotification";

export interface TaskBoardProps {
  initialTeams?: TeamOption[];
  initialSprints?: SprintOption[];
  currentUserRole?: string;
  className?: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  initialTeams = [],
  initialSprints = [],
  currentUserRole = "Employee",
  className,
}) => {
  // Filter options state
  const [teams, setTeams] = useState<TeamOption[]>(initialTeams);
  const [sprints, setSprints] = useState<SprintOption[]>(initialSprints);
  const [isLoadingFilters, setIsLoadingFilters] = useState(
    initialTeams.length === 0 && initialSprints.length === 0
  );

  // Active filters & pagination
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  // Task data & pagination state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<TaskPagination>({
    page: 1,
    pageSize,
    total: 0,
    totalPages: 0,
  });

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<NotificationType | null>(null);

  // HR is strictly read-only; other roles can initiate drag
  const isDraggable = currentUserRole !== "HR";

  // Configure drag sensors with activation constraints
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 5px movement required to distinguish click from drag
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Active request controller for filter requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load filter options if not provided initially
  useEffect(() => {
    if (initialTeams.length > 0 && initialSprints.length > 0) return;

    let isMounted = true;
    async function loadFilterOptions() {
      try {
        setIsLoadingFilters(true);
        const res = await fetch("/api/v1/tasks/filters");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success) {
            setTeams(data.teams || []);
            setSprints(data.sprints || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch task filter options:", err);
      } finally {
        if (isMounted) setIsLoadingFilters(false);
      }
    }

    loadFilterOptions();
    return () => {
      isMounted = false;
    };
  }, [initialTeams, initialSprints]);

  // Fetch tasks based on active filters and pagination
  useEffect(() => {
    let ignore = false;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    async function loadTasks() {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", String(page));
        queryParams.set("pageSize", String(pageSize));

        if (selectedTeamId) {
          queryParams.set("teamId", selectedTeamId);
        }
        if (selectedSprintId) {
          queryParams.set("sprintId", selectedSprintId);
        }

        const res = await fetch(`/api/v1/tasks?${queryParams.toString()}`, {
          signal: abortController.signal,
        });

        if (ignore) return;

        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired or authentication required. Please log in.");
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
          if (res.status === 403) {
            setError("You do not have permission to view tasks for this selection.");
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
          const errorData = await res.json().catch(() => null);
          throw new Error(errorData?.error || `Server responded with status ${res.status}`);
        }

        const data = await res.json();
        if (ignore) return;

        if (data.success && Array.isArray(data.data)) {
          setTasks(data.data);
          setPagination(
            data.pagination || {
              page,
              pageSize,
              total: data.data.length,
              totalPages: 1,
            }
          );
          setError(null);
          setLastUpdated(new Date());
        } else {
          throw new Error("Invalid response format received from tasks API.");
        }
      } catch (err: unknown) {
        if (ignore) return;
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error fetching tasks:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load tasks. Please verify your connection."
        );
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadTasks();

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, [page, pageSize, selectedTeamId, selectedSprintId, refreshTrigger]);

  // Filter change handlers (always reset to page 1)
  const handleTeamChange = (newTeamId: string) => {
    setIsLoading(true);
    setSelectedTeamId(newTeamId);
    setPage(1);
  };

  const handleSprintChange = (newSprintId: string) => {
    setIsLoading(true);
    setSelectedSprintId(newSprintId);
    setPage(1);
  };

  const handleClearFilters = () => {
    setIsLoading(true);
    setSelectedTeamId("");
    setSelectedSprintId("");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // -------------------------------------------------------------------------
  // DRAG AND DROP HANDLERS & OPTIMISTIC CONCURRENCY WORKFLOW
  // -------------------------------------------------------------------------

  const handleDragStart = (event: DragStartEvent) => {
    if (!isDraggable) return;
    const task = event.active.data.current?.task as Task | undefined;
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    // Cancelled if dropped outside any droppable column
    if (!over) return;

    const targetStatus = over.id as TaskStatus;
    const validStatuses: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Done"];
    if (!validStatuses.includes(targetStatus)) return;

    // Find the task that was moved
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // Do nothing if dropped within the exact same status column
    if (task.status === targetStatus) return;

    // Prevent duplicate updates if this specific task is already pending
    if (pendingTaskIds.has(task.id)) return;

    const taskId = task.id;
    const previousStatus = task.status;
    const previousVersion = task.version;

    // 1. Mark task as pending
    setPendingTaskIds((prev) => new Set(prev).add(taskId));

    // 2. Optimistic UI update: move card immediately to destination column
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      // 3. Persist via PATCH /api/v1/tasks/[id]
      const res = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: targetStatus,
          expectedVersion: previousVersion,
        }),
      });

      // 4. Case HTTP 200: Successful update -> Reconcile with updated server task
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? result.data : t))
          );
        }
        return;
      }

      // 5. Case HTTP 409: Concurrency Conflict -> Reconcile with latest server state
      if (res.status === 409) {
        const conflictData = await res.json().catch(() => null);
        if (conflictData?.data) {
          const latestStatus = conflictData.data.status;
          const latestVersion = conflictData.data.version;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: latestStatus, version: latestVersion }
                : t
            )
          );
        }
        setNotification({
          id: String(Date.now()),
          type: "warning",
          message:
            "This task was updated by another user. The board has been synchronized with the latest status.",
        });
        return;
      }

      // 6. Case HTTP 403: Permission Forbidden -> Rollback to previous status & version
      if (res.status === 403) {
        const err = await res.json().catch(() => null);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status: previousStatus, version: previousVersion }
              : t
          )
        );
        setNotification({
          id: String(Date.now()),
          type: "error",
          message:
            err?.error ||
            "Permission denied: You are not authorized to update this task.",
        });
        return;
      }

      // 7. Case HTTP 400, 404, 500: Server error -> Rollback
      const err = await res.json().catch(() => null);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: previousStatus, version: previousVersion }
            : t
        )
      );
      setNotification({
        id: String(Date.now()),
        type: "error",
        message:
          err?.error ||
          "Failed to update task status. Changes have been rolled back.",
      });
    } catch (err: unknown) {
      console.error("Network error during task status update:", err);
      // Rollback on network failure
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: previousStatus, version: previousVersion }
            : t
        )
      );
      setNotification({
        id: String(Date.now()),
        type: "error",
        message:
          "Network failure connecting to task service. Changes have been rolled back.",
      });
    } finally {
      // 8. Always clear pending state for this task
      setPendingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  // Group tasks into the four Kanban columns
  const todoTasks = tasks.filter((t) => t.status === "To Do");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");
  const doneTasks = tasks.filter((t) => t.status === "Done");

  // Calculate live summary metrics
  const summaryMetrics: TaskBoardSummaryMetrics = {
    totalLoaded: tasks.length,
    totalMatching: pagination.total,
    toDoCount: todoTasks.length,
    inProgressCount: inProgressTasks.length,
    blockedCount: blockedTasks.length,
    doneCount: doneTasks.length,
  };

  const hasActiveFilters = Boolean(selectedTeamId || selectedSprintId);

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* 1. Header */}
      <TaskBoardHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />

      {/* Notification Banner (Conflicts, Errors, Rollbacks) */}
      <TaskBoardNotificationBanner
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* 2. Summary KPI Cards */}
      <TaskBoardSummary metrics={summaryMetrics} />

      {/* 3. Filter Toolbar */}
      <TaskBoardFilters
        teams={teams}
        sprints={sprints}
        selectedTeamId={selectedTeamId}
        selectedSprintId={selectedSprintId}
        onTeamChange={handleTeamChange}
        onSprintChange={handleSprintChange}
        onClearFilters={handleClearFilters}
        totalMatching={pagination.total}
        loadedCount={tasks.length}
        isLoadingFilters={isLoadingFilters}
      />

      {/* 4. Main Board Content with DndContext */}
      {isLoading && tasks.length === 0 ? (
        <TaskBoardSkeleton />
      ) : error ? (
        <TaskBoardErrorState
          message={error}
          onRetry={handleRefresh}
        />
      ) : pagination.total === 0 ? (
        <TaskBoardEmptyState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {/* Responsive 4-Column Kanban Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
              <TaskBoardColumn
                status="To Do"
                title="To Do"
                tasks={todoTasks}
                isDraggable={isDraggable}
                pendingTaskIds={pendingTaskIds}
              />
              <TaskBoardColumn
                status="In Progress"
                title="In Progress"
                tasks={inProgressTasks}
                isDraggable={isDraggable}
                pendingTaskIds={pendingTaskIds}
              />
              <TaskBoardColumn
                status="Blocked"
                title="Blocked"
                tasks={blockedTasks}
                isDraggable={isDraggable}
                pendingTaskIds={pendingTaskIds}
              />
              <TaskBoardColumn
                status="Done"
                title="Done"
                tasks={doneTasks}
                isDraggable={isDraggable}
                pendingTaskIds={pendingTaskIds}
              />
            </div>

            {/* Drag Overlay: Renders elevated floating card during drag */}
            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <div className="w-[280px] sm:w-[300px]">
                  <TaskCard task={activeTask} isOverlay />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* 5. Pagination */}
          <TaskBoardPagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading || isRefreshing}
          />
        </div>
      )}
    </div>
  );
};
