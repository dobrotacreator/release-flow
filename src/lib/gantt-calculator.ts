import type {
  Task,
  Employee,
  Release,
  GanttTask,
  GanttData,
} from "@/lib/types";
import { isWorkingDay, addWorkingDays } from "@/lib/date-utils";

interface EmployeeCapacity {
  employeeId: string;
  date: string;
  hoursAvailable: number;
  hoursAllocated: number; // Track allocated hours per day
}

export function calculateGanttData(release: Release): GanttData {
  const { tasks, employees, startDate, customHolidays } = release;

  // Sort tasks by priority (lower number = higher priority)
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  // Calculate employee capacities for the project duration
  const employeeCapacities = calculateEmployeeCapacities(
    employees,
    startDate,
    customHolidays,
  );

  // Calculate task schedules
  const ganttTasks: GanttTask[] = [];
  const taskScheduleMap = new Map<string, { startDate: Date; endDate: Date }>();

  for (const task of sortedTasks) {
    const schedule = calculateTaskSchedule(
      task,
      ganttTasks,
      taskScheduleMap,
      employeeCapacities,
      customHolidays,
    );

    const ganttTask: GanttTask = {
      id: task.id,
      name: task.name,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      progress: getTaskProgress(task.status),
      dependencies: task.blockerTaskIds,
      assignedEmployee: task.assignedEmployeeId
        ? getEmployeeName(task.assignedEmployeeId, employees)
        : undefined,
      color: getTaskColor(task.assignedEmployeeId, employees),
    };

    ganttTasks.push(ganttTask);
    taskScheduleMap.set(task.id, schedule);
  }

  const projectEndDate =
    ganttTasks.length > 0
      ? new Date(Math.max(...ganttTasks.map((t) => t.endDate.getTime())))
      : new Date(startDate);

  // Create employee color mapping
  const employeeColors = employees.map((employee, index) => ({
    id: employee.id,
    name: employee.name,
    color: getEmployeeColor(index),
  }));

  return {
    tasks: ganttTasks,
    employees: employeeColors,
    releaseDate: projectEndDate, // Add calculated release date
  };
}

function calculateEmployeeCapacities(
  employees: Employee[],
  projectStartDate: string,
  customHolidays: string[],
): Map<string, EmployeeCapacity[]> {
  const capacityMap = new Map<string, EmployeeCapacity[]>();
  const startDate = new Date(projectStartDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 12); // Calculate for 1 year ahead

  for (const employee of employees) {
    const capacities: EmployeeCapacity[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (isWorkingDay(currentDate, customHolidays)) {
        const hoursAvailable = getEmployeeHoursForDate(employee, currentDate);
        capacities.push({
          employeeId: employee.id,
          date: currentDate.toISOString().split("T")[0],
          hoursAvailable,
          hoursAllocated: 0, // Initialize allocated hours
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    capacityMap.set(employee.id, capacities);
  }

  return capacityMap;
}

function getEmployeeHoursForDate(employee: Employee, date: Date): number {
  const dateString = date.toISOString().split("T")[0];

  for (const period of employee.capacityPeriods) {
    if (period.startDate <= dateString && period.endDate >= dateString) {
      return period.hoursPerDay;
    }
  }

  return 0; // No capacity defined for this date
}

function calculateTaskSchedule(
  task: Task,
  completedTasks: GanttTask[],
  taskScheduleMap: Map<string, { startDate: Date; endDate: Date }>,
  employeeCapacities: Map<string, EmployeeCapacity[]>,
  customHolidays: string[],
): { startDate: Date; endDate: Date } {
  // Find the earliest start date based on dependencies
  let earliestStartDate = new Date(task.calculatedStartDate || new Date());

  // Check blocker dependencies
  for (const blockerId of task.blockerTaskIds) {
    const blockerSchedule = taskScheduleMap.get(blockerId);
    if (blockerSchedule && blockerSchedule.endDate >= earliestStartDate) {
      earliestStartDate = new Date(blockerSchedule.endDate);
      earliestStartDate.setDate(earliestStartDate.getDate() + 1); // Start day after blocker ends
    }
  }

  // If no employee assigned, use simple duration calculation
  if (!task.assignedEmployeeId) {
    const endDate = addWorkingDays(
      earliestStartDate,
      Math.ceil(task.estimatedHours / 8),
      customHolidays,
    );
    return { startDate: earliestStartDate, endDate };
  }

  const employeeCapacity =
    employeeCapacities.get(task.assignedEmployeeId) || [];
  let remainingHours = task.estimatedHours;
  const currentDate = new Date(earliestStartDate);
  let startDate = new Date(earliestStartDate);
  let foundStart = false;

  // Find first available working day at or after earliest start date
  const endDate = new Date(currentDate);
  while (currentDate && remainingHours > 0) {
    const dateString = currentDate.toISOString().split("T")[0];
    const dayCapacity = employeeCapacity.find((c) => c.date === dateString);

    if (dayCapacity && dayCapacity.hoursAvailable > 0) {
      const availableHours =
        dayCapacity.hoursAvailable - dayCapacity.hoursAllocated;

      if (availableHours > 0) {
        if (!foundStart) {
          startDate = new Date(currentDate);
          foundStart = true;
        }

        const hoursToAllocate = Math.min(remainingHours, availableHours);
        remainingHours -= hoursToAllocate;
        dayCapacity.hoursAllocated += hoursToAllocate; // Track allocated hours
      }
    }

    if (remainingHours > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    endDate.setDate(endDate.getDate() + 1);
  }

  return { startDate, endDate: new Date(endDate) };
}

function getTaskProgress(status: Task["status"]): number {
  switch (status) {
    case "completed":
      return 100;
    case "in-progress":
      return 50;
    case "blocked":
      return 0;
    default:
      return 0;
  }
}

function getEmployeeName(employeeId: string, employees: Employee[]): string {
  const employee = employees.find((e) => e.id === employeeId);
  return employee ? employee.name : "Unknown";
}

function getTaskColor(
  employeeId: string | null,
  employees: Employee[],
): string {
  if (!employeeId) return "#6b7280"; // gray for unassigned

  const employeeIndex = employees.findIndex((e) => e.id === employeeId);
  return getEmployeeColor(employeeIndex);
}

function getEmployeeColor(index: number): string {
  const colors = [
    "#0891b2", // cyan-600 (primary)
    "#f59e0b", // amber-500 (accent)
    "#10b981", // emerald-500
    "#8b5cf6", // violet-500
    "#f97316", // orange-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
    "#ec4899", // pink-500
  ];
  return colors[index % colors.length];
}

export function formatGanttDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getDateRange(tasks: GanttTask[]): { start: Date; end: Date } {
  if (tasks.length === 0) {
    const now = new Date();
    return {
      start: now,
      end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  const startDates = tasks.map((t) => t.startDate);
  const endDates = tasks.map((t) => t.endDate);

  const start = new Date(Math.min(...startDates.map((d) => d.getTime())));
  const end = new Date(Math.max(...endDates.map((d) => d.getTime())));

  // Add some padding
  start.setDate(start.getDate() - 1);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
