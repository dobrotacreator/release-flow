// Core data models for the project management system

export interface Employee {
  id: string;
  name: string;
  position: string;
  capacityPeriods: CapacityPeriod[];
}

export interface CapacityPeriod {
  id: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  hoursPerDay: number; // 0 means vacation/unavailable
  description?: string;
}

export interface Task {
  id: string;
  name: string;
  estimatedHours: number;
  assignedEmployeeId: string | null;
  blockerTaskIds: string[]; // Tasks that must be completed before this one
  priority: number; // Lower number = higher priority (for drag-and-drop ordering)
  status: "pending" | "in-progress" | "completed" | "blocked";
  actualStartDate?: string; // ISO date string
  actualEndDate?: string; // ISO date string
  calculatedStartDate?: string; // Auto-calculated based on dependencies and capacity
  calculatedEndDate?: string; // Auto-calculated based on dependencies and capacity
}

export interface Release {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO date string
  targetEndDate?: string; // User-defined target
  calculatedEndDate?: string; // Auto-calculated based on tasks and capacity
  customHolidays: string[]; // Array of ISO date strings for custom non-working days
  employees: Employee[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  releases: Release[];
  activeReleaseId: string | null;
}

// Gantt chart data structures
export interface GanttTask {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  progress: number; // 0-100
  dependencies: string[];
  assignedEmployee?: string;
  color?: string;
}

export interface GanttData {
  tasks: GanttTask[];
  employees: { id: string; name: string; color: string }[];
  releaseDate: Date | null;
}
