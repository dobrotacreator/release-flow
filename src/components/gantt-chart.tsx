"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Clock, User, ArrowRight, Target } from "lucide-react";
import {
  calculateGanttData,
  formatGanttDate,
  getDateRange,
} from "@/lib/gantt-calculator";
import type { Release, GanttTask } from "@/lib/types";

interface GanttChartProps {
  release: Release;
}

export function GanttChart({ release }: GanttChartProps) {
  const ganttData = useMemo(() => calculateGanttData(release), [release]);
  const dateRange = useMemo(
    () => getDateRange(ganttData.tasks),
    [ganttData.tasks],
  );

  if (ganttData.tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Tasks to Display</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add tasks to your release to see the Gantt chart visualization.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate timeline dimensions
  const totalDays = Math.ceil(
    (dateRange.end.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const dayWidth = 40; // pixels per day
  const chartWidth = totalDays * dayWidth;
  const taskHeight = 40;
  const taskSpacing = 8;

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.floor(
      (task.startDate.getTime() - dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const duration = Math.ceil(
      (task.endDate.getTime() - task.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, dayWidth), // Minimum width of 1 day
    };
  };

  const generateTimelineHeaders = () => {
    const headers = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return headers;
  };

  const timelineHeaders = generateTimelineHeaders();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {ganttData.releaseDate && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Calculated Release Date
                  </p>
                  <p className="font-semibold text-lg text-primary">
                    {ganttData.releaseDate.toLocaleDateString("ru-RU", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Team Legend:</span>
          </div>
          {ganttData.employees.map((employee) => (
            <div key={employee.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: employee.color }}
              />
              <span className="text-sm">{employee.name}</span>
            </div>
          ))}
          {ganttData.tasks.some((t) => !t.assignedEmployee) && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-sm">Unassigned</span>
            </div>
          )}
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Fixed Header Row */}
              <div className="sticky top-0 z-10 bg-background border-b">
                <div className="flex">
                  {/* Fixed task names header */}
                  <div className="w-48 border-r bg-muted/30 p-4 flex-shrink-0">
                    <div className="font-medium text-sm">Tasks</div>
                  </div>

                  {/* Scrollable timeline header */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex" style={{ minWidth: chartWidth }}>
                      {timelineHeaders.map((date, index) => {
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6;
                        const isHoliday = release.customHolidays.includes(
                          date.toISOString().split("T")[0],
                        );
                        const isNonWorking = isWeekend || isHoliday;

                        return (
                          <div
                            key={index}
                            className={`border-r text-center py-2 text-xs font-medium flex-shrink-0 ${
                              isNonWorking ? "bg-red-50 text-red-600" : ""
                            }`}
                            style={{ width: dayWidth }}
                          >
                            <div>{formatGanttDate(date)}</div>
                            {isHoliday && <div className="text-xs">🎉</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Task Rows */}
              <div className="max-h-[600px] overflow-y-auto">
                <div className="flex">
                  {/* Fixed task names column */}
                  <div className="w-48 flex-shrink-0">
                    {ganttData.tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="border-b border-r p-3 bg-background"
                        style={{ height: taskHeight + taskSpacing }}
                      >
                        <div className="flex flex-col justify-center h-full">
                          <div
                            className="font-medium text-sm truncate"
                            title={task.name}
                          >
                            {task.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {task.assignedEmployee && (
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignedEmployee}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {task.progress}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scrollable timeline content */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="relative" style={{ minWidth: chartWidth }}>
                      {ganttData.tasks.map((task, index) => {
                        const position = getTaskPosition(task);

                        return (
                          <div
                            key={task.id}
                            className="border-b"
                            style={{ height: taskHeight + taskSpacing }}
                          >
                            <div className="relative h-full">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute top-1 rounded-md flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    style={{
                                      left: position.left,
                                      width: position.width,
                                      height: taskHeight - 2,
                                      backgroundColor: task.color,
                                      opacity: task.progress === 100 ? 0.8 : 1,
                                    }}
                                  >
                                    <div className="flex items-center gap-1 truncate">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {formatGanttDate(task.startDate)} -{" "}
                                        {formatGanttDate(task.endDate)}
                                      </span>
                                    </div>

                                    {/* Progress overlay */}
                                    {task.progress > 0 &&
                                      task.progress < 100 && (
                                        <div
                                          className="absolute top-0 left-0 h-full bg-white/20 rounded-md"
                                          style={{ width: `${task.progress}%` }}
                                        />
                                      )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="space-y-2">
                                    <div className="font-semibold">
                                      {task.name}
                                    </div>
                                    <div className="text-sm space-y-1">
                                      <div>
                                        📅 Start:{" "}
                                        {task.startDate.toLocaleDateString(
                                          "ru-RU",
                                        )}
                                      </div>
                                      <div>
                                        🏁 End:{" "}
                                        {task.endDate.toLocaleDateString(
                                          "ru-RU",
                                        )}
                                      </div>
                                      <div>
                                        ⏱️ Duration:{" "}
                                        {Math.ceil(
                                          (task.endDate.getTime() -
                                            task.startDate.getTime()) /
                                            (1000 * 60 * 60 * 24),
                                        )}{" "}
                                        days
                                      </div>
                                      {task.assignedEmployee && (
                                        <div>
                                          👤 Assigned: {task.assignedEmployee}
                                        </div>
                                      )}
                                      <div>📊 Progress: {task.progress}%</div>
                                      {task.dependencies.length > 0 && (
                                        <div>
                                          🔗 Dependencies:{" "}
                                          {task.dependencies.length} task(s)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>

                              {/* Dependency arrows */}
                              {task.dependencies.map((depId) => {
                                const depTask = ganttData.tasks.find(
                                  (t) => t.id === depId,
                                );
                                if (!depTask) return null;

                                const depPosition = getTaskPosition(depTask);
                                const depIndex = ganttData.tasks.findIndex(
                                  (t) => t.id === depId,
                                );

                                return (
                                  <div
                                    key={depId}
                                    className="absolute flex items-center text-muted-foreground"
                                    style={{
                                      left:
                                        depPosition.left + depPosition.width,
                                      top:
                                        (depIndex - index) *
                                          (taskHeight + taskSpacing) +
                                        taskHeight / 2,
                                      width:
                                        position.left -
                                        (depPosition.left + depPosition.width),
                                      height: 1,
                                    }}
                                  >
                                    <div className="w-full border-t border-dashed border-muted-foreground/50" />
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Project Duration
                  </p>
                  <p className="font-medium">
                    {Math.ceil(
                      (dateRange.end.getTime() - dateRange.start.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Estimated Hours
                  </p>
                  <p className="font-medium">
                    {release.tasks.reduce(
                      (sum, task) => sum + task.estimatedHours,
                      0,
                    )}
                    h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-chart-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                  <p className="font-medium">{ganttData.employees.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded-full" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">
                    {ganttData.tasks.filter((t) => t.progress === 100).length}/
                    {ganttData.tasks.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
