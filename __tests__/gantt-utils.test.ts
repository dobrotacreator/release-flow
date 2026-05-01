import {
  orderTasksByDependenciesAndPriority,
  calculateGanttData,
  formatGanttDate,
  getDateRange,
} from "@/lib/gantt-calculator";
import type { Task, Employee, Release } from "@/lib/types";

describe("orderTasksByDependenciesAndPriority", () => {
  it("сортирует задачи по приоритету без зависимостей", () => {
    const tasks: Task[] = [
      {
        id: "1",
        name: "A",
        priority: 2,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: [],
        assignedEmployeeId: null,
      },
      {
        id: "2",
        name: "B",
        priority: 1,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: [],
        assignedEmployeeId: null,
      },
    ];

    const ordered = orderTasksByDependenciesAndPriority(tasks);
    expect(ordered.map((t) => t.id)).toEqual(["2", "1"]);
  });

  it("сортирует задачи с зависимостями", () => {
    const tasks: Task[] = [
      {
        id: "1",
        name: "A",
        priority: 2,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: ["2"],
        assignedEmployeeId: null,
      },
      {
        id: "2",
        name: "B",
        priority: 1,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: [],
        assignedEmployeeId: null,
      },
    ];

    const ordered = orderTasksByDependenciesAndPriority(tasks);
    expect(ordered.map((t) => t.id)).toEqual(["2", "1"]);
  });

  it("разрешает циклические зависимости как unscheduled", () => {
    const tasks: Task[] = [
      {
        id: "1",
        name: "A",
        priority: 1,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: ["2"],
        assignedEmployeeId: null,
      },
      {
        id: "2",
        name: "B",
        priority: 2,
        estimatedHours: 8,
        status: "pending",
        blockerTaskIds: ["1"],
        assignedEmployeeId: null,
      },
    ];

    const ordered = orderTasksByDependenciesAndPriority(tasks);
    expect(ordered.length).toBe(2);
  });
});

describe("calculateGanttData", () => {
  const employees: Employee[] = [
    {
      id: "e1",
      name: "Alice",
      capacityPeriods: [
        {
          id: "p1",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          hoursPerDay: 8,
        },
      ],
      position: "",
    },
  ];

  it("расписывает простую задачу без зависимостей", () => {
    const release: Release = {
      id: "r1",
      name: "Rel",
      startDate: "2025-01-01",
      customHolidays: [],
      employees,
      tasks: [
        {
          id: "t1",
          name: "Task 1",
          priority: 1,
          estimatedHours: 16,
          status: "pending",
          blockerTaskIds: [],
          assignedEmployeeId: "e1",
        },
      ],
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    };

    const result = calculateGanttData(release);
    expect(result.tasks[0].startDate).toBeInstanceOf(Date);
    expect(result.tasks[0].endDate).toBeInstanceOf(Date);
    expect(result.releaseDate).not.toBeNull();
  });

  it("помечает задачу как unscheduled при отсутствии capacity", () => {
    const release: Release = {
      id: "r1",
      name: "Rel",
      startDate: "2025-01-01",
      customHolidays: [],
      employees: [{ id: "e2", name: "Bob", capacityPeriods: [], position: "" }],
      tasks: [
        {
          id: "t1",
          name: "NoCap",
          priority: 1,
          estimatedHours: 8,
          status: "pending",
          blockerTaskIds: [],
          assignedEmployeeId: "e2",
        },
      ],
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    };

    const result = calculateGanttData(release);
    expect(result.tasks[0].unscheduledReason).toBe("no_capacity");
  });

  it("ставит external_blocker при зависимости от неизвестной задачи", () => {
    const release: Release = {
      id: "r1",
      name: "Rel",
      startDate: "2025-01-01",
      customHolidays: [],
      employees,
      tasks: [
        {
          id: "t1",
          name: "Blocked",
          priority: 1,
          estimatedHours: 8,
          status: "pending",
          blockerTaskIds: ["unknown"],
          assignedEmployeeId: "e1",
        },
      ],
      createdAt: "2025-01-01",
      updatedAt: "2025-01-01",
    };

    const result = calculateGanttData(release);
    expect(result.tasks[0].unscheduledReason).toBe("external_blocker");
  });
});

describe("utils", () => {
  it("formatGanttDate форматирует дату", () => {
    const d = new Date("2025-01-15");
    expect(formatGanttDate(d)).toBe("Jan 15");
  });

  it("getDateRange возвращает диапазон", () => {
    const tasks = [
      {
        id: "t1",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-10"),
      },
      {
        id: "t2",
        startDate: new Date("2025-01-05"),
        endDate: new Date("2025-01-20"),
      },
    ] as any;

    const range = getDateRange(tasks);
    expect(range.start < new Date("2025-01-01")).toBe(true);
    expect(range.end > new Date("2025-01-20")).toBe(true);
  });
});
