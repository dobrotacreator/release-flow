import type {
  Task,
  Employee,
  Release,
  GanttTask,
  GanttData,
  UnscheduledReason,
} from "@/lib/types";
import { isWorkingDay, addWorkingDays } from "@/lib/date-utils";

interface EmployeeCapacity {
  employeeId: string;
  date: string;
  hoursAvailable: number;
  hoursAllocated: number; // Track allocated hours per day
}

function orderTasksByDependenciesAndPriority(tasks: Task[]): Task[] {
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  for (const t of tasks) {
    if (!graph.has(t.id)) graph.set(t.id, new Set());
    if (!inDegree.has(t.id)) inDegree.set(t.id, 0);
  }

  for (const t of tasks) {
    for (const blockerId of t.blockerTaskIds || []) {
      if (!taskById.has(blockerId)) continue;
      if (!graph.has(blockerId)) graph.set(blockerId, new Set());
      if (!graph.get(blockerId)!.has(t.id)) {
        graph.get(blockerId)!.add(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    }
  }

  const zero: Task[] = [];
  for (const t of tasks) {
    if ((inDegree.get(t.id) || 0) === 0) zero.push(t);
  }

  const sortZero = () => zero.sort((a, b) => a.priority - b.priority);

  const ordered: Task[] = [];
  sortZero();

  while (zero.length > 0) {
    const node = zero.shift()!;
    ordered.push(node);

    const outs = graph.get(node.id);
    if (!outs) continue;
    for (const m of outs) {
      inDegree.set(m, (inDegree.get(m) || 1) - 1);
      if ((inDegree.get(m) || 0) === 0) {
        zero.push(taskById.get(m) as Task);
      }
    }
    sortZero();
  }

  if (ordered.length !== tasks.length) {
    const remaining = tasks
      .filter((t) => !ordered.includes(t))
      .sort((a, b) => a.priority - b.priority);
    return ordered.concat(remaining);
  }

  return ordered;
}

export function calculateGanttData(release: Release): GanttData {
  const { tasks, employees, startDate, customHolidays } = release;

  const tasksMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));

  const sortedTasks = orderTasksByDependenciesAndPriority(tasks);

  const employeeCapacities = calculateEmployeeCapacities(
    employees,
    startDate,
    customHolidays,
  );

  const ganttTasks: GanttTask[] = [];
  const taskScheduleMap = new Map<string, { startDate: Date; endDate: Date }>();

  for (const task of sortedTasks) {
    const schedule = calculateTaskSchedule(
      startDate,
      task,
      taskScheduleMap,
      employeeCapacities,
      customHolidays,
      tasksMap,
      new Set(), // visited
    );

    const ganttTask: GanttTask = {
      id: task.id,
      name: task.name,
      estimatedHours: task.estimatedHours,
      startDate: schedule?.startDate,
      endDate: schedule?.endDate,
      progress: getTaskProgress(task.status),
      dependencies: task.blockerTaskIds,
      assignedEmployee: task.assignedEmployeeId
        ? getEmployeeName(task.assignedEmployeeId, employees)
        : undefined,
      color: getTaskColor(task.assignedEmployeeId, employees),
    };

    if (schedule?.unscheduledReason) {
      ganttTask.unscheduledReason = schedule.unscheduledReason;
    }

    ganttTasks.push(ganttTask);
    if (schedule && schedule.startDate && schedule.endDate) {
      taskScheduleMap.set(task.id, {
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      });
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

  console.log(ganttTasks);
  return {
    tasks: ganttTasks,
    employees: employeeColors,
    releaseDate: projectEndDate,
  };
}

function calculateTaskSchedule(
  releaseStartDate: string,
  task: Task,
  taskScheduleMap: Map<string, { startDate: Date; endDate: Date }>,
  employeeCapacities: Map<string, EmployeeCapacity[]>,
  customHolidays: string[],
  tasksMap: Map<string, Task>,
  visited: Set<string>,
): {
  startDate?: Date;
  endDate?: Date;
  unscheduledReason?: UnscheduledReason;
} | null {
  if (visited.has(task.id)) {
    return {
      unscheduledReason: "cycle",
    };
  }
  visited.add(task.id);

  let earliestStartDate = new Date(
    task.calculatedStartDate || releaseStartDate,
  );
  earliestStartDate = nextWorkingDay(earliestStartDate, customHolidays);

  let latestBlockerEndTime: number | null = null;
  for (const blockerId of task.blockerTaskIds || []) {
    let blockerSchedule = taskScheduleMap.get(blockerId);

    if (!blockerSchedule && tasksMap.has(blockerId)) {
      const blockerTask = tasksMap.get(blockerId)!;
      const computed = calculateTaskSchedule(
        releaseStartDate,
        blockerTask,
        taskScheduleMap,
        employeeCapacities,
        customHolidays,
        tasksMap,
        new Set(visited),
      );
      if (computed?.unscheduledReason) {
        return { unscheduledReason: computed.unscheduledReason };
      }
      if (computed && computed.startDate && computed.endDate) {
        blockerSchedule = {
          startDate: computed.startDate,
          endDate: computed.endDate,
        };
        taskScheduleMap.set(blockerId, blockerSchedule);
      }
    }

    if (blockerSchedule && blockerSchedule.endDate) {
      const candidate = blockerSchedule.endDate.getTime();
      if (latestBlockerEndTime === null || candidate > latestBlockerEndTime) {
        latestBlockerEndTime = candidate;
      }
    } else if (!blockerSchedule && !tasksMap.has(blockerId)) {
      return {
        unscheduledReason: "external_blocker",
      };
    } else if (!blockerSchedule) {
      return {
        unscheduledReason: "unknown",
      };
    }
  }

  if (latestBlockerEndTime !== null) {
    const afterBlocker = new Date(latestBlockerEndTime);
    afterBlocker.setDate(afterBlocker.getDate() + 1);
    earliestStartDate = nextWorkingDay(afterBlocker, customHolidays);
  }

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

  if (!employeeCapacity || employeeCapacity.length === 0) {
    return {
      unscheduledReason: "no_capacity",
    };
  }

  let remainingHours = task.estimatedHours;
  let startDate = new Date(earliestStartDate);
  let foundStart = false;

  const dateIndexMap = new Map<string, number>();
  employeeCapacity.forEach((c, i) => dateIndexMap.set(c.date, i));

  const startDateStr = earliestStartDate.toISOString().split("T")[0];
  let idx = dateIndexMap.has(startDateStr)
    ? (dateIndexMap.get(startDateStr) as number)
    : employeeCapacity.findIndex((c) => c.date > startDateStr);

  if (idx === -1) {
    // нет доступных записей после earliestStartDate
    return {
      unscheduledReason: "no_capacity",
    };
  }

  let lastUsedDateStr: string | null = null;
  for (let i = idx; i < employeeCapacity.length && remainingHours > 0; i++) {
    const dayCapacity = employeeCapacity[i];
    const availableHours =
      dayCapacity.hoursAvailable - dayCapacity.hoursAllocated;

    if (availableHours > 0) {
      if (!foundStart) {
        startDate = new Date(dayCapacity.date + "T00:00:00");
        foundStart = true;
      }

      const hoursToAllocate = Math.min(remainingHours, availableHours);
      remainingHours -= hoursToAllocate;
      dayCapacity.hoursAllocated += hoursToAllocate;
      lastUsedDateStr = dayCapacity.date;
    }
  }

  if (remainingHours <= 0 && lastUsedDateStr) {
    const endDate = new Date(lastUsedDateStr + "T00:00:00");
    return { startDate, endDate };
  } else {
    return {
      unscheduledReason: "no_capacity",
    };
  }
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
  end.setDate(end.getDate() + 2);

  return { start, end };
}
