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

  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  const employeeCapacities = calculateEmployeeCapacities(
    employees,
    startDate,
    customHolidays,
  );

  const ganttTasks: GanttTask[] = [];
  const taskScheduleMap = new Map<string, { startDate: Date; endDate: Date }>();

  for (const task of sortedTasks) {
    const schedule = calculateTaskSchedule(
      release.startDate,
      task,
      taskScheduleMap,
      employeeCapacities,
      customHolidays,
    );

    const ganttTask: GanttTask = {
      id: task.id,
      name: task.name,
      startDate: schedule?.startDate,
      endDate: schedule?.endDate,
      progress: getTaskProgress(task.status),
      dependencies: task.blockerTaskIds,
      assignedEmployee: task.assignedEmployeeId
        ? getEmployeeName(task.assignedEmployeeId, employees)
        : undefined,
      color: getTaskColor(task.assignedEmployeeId, employees),
    };

    ganttTasks.push(ganttTask);
    if (schedule) {
      taskScheduleMap.set(task.id, schedule);
    }
  }

  const isUnsched = ganttTasks.some((t) => !t.startDate || !t.endDate);
  const projectEndDate =
    ganttTasks.length > 0 && !isUnsched
      ? new Date(Math.max(...ganttTasks.map((t) => t.endDate!.getTime())))
      : null;

  const employeeColors = employees.map((employee, index) => ({
    id: employee.id,
    name: employee.name,
    color: getEmployeeColor(index),
  }));

  return {
    tasks: ganttTasks,
    employees: employeeColors,
    releaseDate: projectEndDate,
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
  releaseStartDate: string,
  task: Task,
  taskScheduleMap: Map<string, { startDate: Date; endDate: Date }>,
  employeeCapacities: Map<string, EmployeeCapacity[]>,
  customHolidays: string[],
): { startDate: Date; endDate: Date } | null {
  // Find the earliest start date based on dependencies
  let earliestStartDate = new Date(
    task.calculatedStartDate || releaseStartDate,
  );
  earliestStartDate = nextWorkingDay(earliestStartDate, customHolidays);

  // Check blocker dependencies
  for (const blockerId of task.blockerTaskIds) {
    const blockerSchedule = taskScheduleMap.get(blockerId);
    if (blockerSchedule && blockerSchedule.endDate >= earliestStartDate) {
      const afterBlocker = new Date(blockerSchedule.endDate);
      afterBlocker.setDate(afterBlocker.getDate() + 1); // Start day after blocker ends
      earliestStartDate = nextWorkingDay(afterBlocker, customHolidays);
    }
  }

  // If no employee assigned, use simple duration calculation
  if (!task.assignedEmployeeId) {
    const rawEndDate = addWorkingDays(
      earliestStartDate,
      Math.ceil(task.estimatedHours / 8),
      customHolidays,
    );
    const endDate = nextWorkingDay(rawEndDate, customHolidays);
    return { startDate: earliestStartDate, endDate };
  }

  const employeeCapacity =
    employeeCapacities.get(task.assignedEmployeeId) || [];

  let remainingHours = task.estimatedHours;
  let startDate = new Date(earliestStartDate);
  let foundStart = false;

  // Build quick map from date -> index for O(1) locate of starting index
  const dateIndexMap = new Map<string, number>();
  employeeCapacity.forEach((c, i) => dateIndexMap.set(c.date, i));

  const startDateStr = earliestStartDate.toISOString().split("T")[0];
  // find starting index: exact date or next available index after earliestStartDate
  let idx = dateIndexMap.has(startDateStr)
    ? (dateIndexMap.get(startDateStr) as number)
    : employeeCapacity.findIndex((c) => c.date > startDateStr);

  if (idx === -1) {
    // No capacity entries on/after earliestStartDate. We'll start scanning from the end (no avail).
    idx = employeeCapacity.length; // will skip main loop
  }

  // Iterate over capacity entries from idx forward — guaranteed termination
  let lastUsedDateStr: string | null = null;
  for (let i = idx; i < employeeCapacity.length && remainingHours > 0; i++) {
    const dayCapacity = employeeCapacity[i];
    const availableHours =
      dayCapacity.hoursAvailable - dayCapacity.hoursAllocated;

    if (availableHours > 0) {
      if (!foundStart) {
        startDate = new Date(dayCapacity.date + "T00:00:00"); // treat as local day start
        foundStart = true;
      }

      const hoursToAllocate = Math.min(remainingHours, availableHours);
      remainingHours -= hoursToAllocate;
      dayCapacity.hoursAllocated += hoursToAllocate; // Track allocated hours
      lastUsedDateStr = dayCapacity.date;
    }
  }

  if (remainingHours <= 0 && lastUsedDateStr) {
    const endDate = new Date(lastUsedDateStr + "T00:00:00");
    endDate.setDate(endDate.getDate() - 1);
    return { startDate, endDate };
  } else {
    return null;
  }
}

function nextWorkingDay(date: Date, customHolidays: string[]): Date {
  const d = new Date(date);
  // normalize to local midnight to make comparisons predictable
  d.setHours(0, 0, 0, 0);
  while (!isWorkingDay(d, customHolidays)) {
    d.setDate(d.getDate() + 1);
  }
  return d;
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

  const schedulableTasks = tasks.filter((t) => t.startDate && t.endDate);
  const startDates = schedulableTasks.map((t) => t.startDate);
  const endDates = schedulableTasks.map((t) => t.endDate);

  const start = new Date(Math.min(...startDates.map((d) => d!.getTime())));
  const end = new Date(Math.max(...endDates.map((d) => d!.getTime())));

  start.setDate(start.getDate() - 1);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
