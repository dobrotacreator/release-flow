// Local storage utilities for data persistence

import type { ProjectData, Release, Employee, Task } from "@/lib/types";
import { v4 } from "uuid";
const STORAGE_KEY = "release-flow-data";

export const defaultProjectData: ProjectData = {
  releases: [],
  activeReleaseId: null,
};

export function loadProjectData(): ProjectData {
  if (typeof window === "undefined") return defaultProjectData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultProjectData;

    const parsed = JSON.parse(stored) as ProjectData;
    return {
      releases: parsed.releases || [],
      activeReleaseId: parsed.activeReleaseId || null,
    };
  } catch (error) {
    console.error("Failed to load project data:", error);
    return defaultProjectData;
  }
}

export function saveProjectData(data: ProjectData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save project data:", error);
  }
}

export function exportProjectData(): string {
  const data = loadProjectData();
  return JSON.stringify(data, null, 2);
}

export function importProjectData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as ProjectData;

    // Enhanced validation
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format: must be a valid JSON object");
    }

    if (!Array.isArray(data.releases)) {
      throw new Error("Invalid data format: releases must be an array");
    }

    // Validate each release structure
    for (const release of data.releases) {
      if (!release.id || !release.name || !release.startDate) {
        throw new Error("Invalid release format: missing required fields");
      }

      if (!Array.isArray(release.employees)) {
        release.employees = [];
      }

      if (!Array.isArray(release.tasks)) {
        release.tasks = [];
      }

      if (!Array.isArray(release.customHolidays)) {
        release.customHolidays = [];
      }

      // Validate employees
      for (const employee of release.employees) {
        if (!employee.id || !employee.name || !employee.position) {
          throw new Error("Invalid employee format: missing required fields");
        }
        if (!Array.isArray(employee.capacityPeriods)) {
          employee.capacityPeriods = [];
        }
      }

      // Validate tasks
      for (const task of release.tasks) {
        if (!task.id || !task.name || typeof task.estimatedHours !== "number") {
          throw new Error("Invalid task format: missing required fields");
        }
        if (!Array.isArray(task.blockerTaskIds)) {
          task.blockerTaskIds = [];
        }
        if (typeof task.priority !== "number") {
          task.priority = 0;
        }
        if (
          !["pending", "in-progress", "completed", "blocked"].includes(
            task.status,
          )
        ) {
          task.status = "pending";
        }
      }
    }

    // Ensure activeReleaseId is valid
    if (
      data.activeReleaseId &&
      !data.releases.find((r) => r.id === data.activeReleaseId)
    ) {
      data.activeReleaseId =
        data.releases.length > 0 ? data.releases[0].id : null;
    }

    saveProjectData(data);
    return true;
  } catch (error) {
    console.error("Failed to import project data:", error);
    return false;
  }
}

// Utility functions for working with releases
export function createRelease(
  name: string,
  startDate: string,
  description?: string,
): Release {
  const now = new Date().toISOString();

  return {
    id: v4(),
    name,
    description,
    startDate,
    customHolidays: [],
    employees: [],
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateRelease(
  releaseId: string,
  updates: Partial<Release>,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  data.releases[releaseIndex] = {
    ...data.releases[releaseIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveProjectData(data);
}

export function deleteRelease(releaseId: string): void {
  const data = loadProjectData();
  data.releases = data.releases.filter((r) => r.id !== releaseId);

  if (data.activeReleaseId === releaseId) {
    data.activeReleaseId =
      data.releases.length > 0 ? data.releases[0].id : null;
  }

  saveProjectData(data);
}

// Utility functions for working with employees
export function addEmployeeToRelease(
  releaseId: string,
  employee: Omit<Employee, "id">,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  const newEmployee: Employee = {
    id: v4(),
    ...employee,
  };

  data.releases[releaseIndex].employees.push(newEmployee);
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

export function updateEmployeeInRelease(
  releaseId: string,
  employeeId: string,
  updates: Omit<Employee, "id">,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  const employeeIndex = data.releases[releaseIndex].employees.findIndex(
    (e) => e.id === employeeId,
  );

  if (employeeIndex === -1) return;

  data.releases[releaseIndex].employees[employeeIndex] = {
    id: employeeId,
    ...updates,
  };
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

export function deleteEmployeeFromRelease(
  releaseId: string,
  employeeId: string,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  data.releases[releaseIndex].employees = data.releases[
    releaseIndex
  ].employees.filter((e) => e.id !== employeeId);
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

// Utility functions for working with tasks
export function addTaskToRelease(
  releaseId: string,
  task: Omit<Task, "id" | "calculatedStartDate" | "calculatedEndDate">,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  const newTask: Task = {
    id: v4(),
    ...task,
  };

  data.releases[releaseIndex].tasks.push(newTask);
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

export function updateTaskInRelease(
  releaseId: string,
  taskId: string,
  updates: Partial<Task>,
): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  const taskIndex = data.releases[releaseIndex].tasks.findIndex(
    (t) => t.id === taskId,
  );

  if (taskIndex === -1) return;

  data.releases[releaseIndex].tasks[taskIndex] = {
    ...data.releases[releaseIndex].tasks[taskIndex],
    ...updates,
  };
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

export function deleteTaskFromRelease(releaseId: string, taskId: string): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  // Remove the task
  data.releases[releaseIndex].tasks = data.releases[releaseIndex].tasks.filter(
    (t) => t.id !== taskId,
  );

  // Remove this task from any blocker dependencies
  data.releases[releaseIndex].tasks.forEach((task) => {
    task.blockerTaskIds = task.blockerTaskIds.filter((id) => id !== taskId);
  });

  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}

export function reorderTasksInRelease(releaseId: string, tasks: Task[]): void {
  const data = loadProjectData();
  const releaseIndex = data.releases.findIndex((r) => r.id === releaseId);

  if (releaseIndex === -1) return;

  data.releases[releaseIndex].tasks = tasks;
  data.releases[releaseIndex].updatedAt = new Date().toISOString();

  saveProjectData(data);
}
