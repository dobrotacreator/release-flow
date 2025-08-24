"use client";

import { useMemo, useRef, useEffect } from "react";
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
  formatGanttDate,
  getDateRange,
  calculateGanttData,
} from "@/lib/gantt-calculator";
import type { Release, GanttTask } from "@/lib/types";
import { NoticeCard } from "./NoticeCard";

interface GanttChartProps {
  release: Release;
}

export function GanttChart({ release }: GanttChartProps) {
  const ganttData = useMemo(() => calculateGanttData(release), [release]);
  const dateRange = useMemo(
    () => getDateRange(ganttData.tasks),
    [ganttData.tasks],
  );

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headerScroll = headerScrollRef.current;
    const contentScroll = contentScrollRef.current;

    if (!headerScroll || !contentScroll) return;

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      return () => {
        target.scrollLeft = source.scrollLeft;
      };
    };

    const headerScrollHandler = syncScroll(headerScroll, contentScroll);
    const contentScrollHandler = syncScroll(contentScroll, headerScroll);

    headerScroll.addEventListener("scroll", headerScrollHandler);
    contentScroll.addEventListener("scroll", contentScrollHandler);

    return () => {
      headerScroll.removeEventListener("scroll", headerScrollHandler);
      contentScroll.removeEventListener("scroll", contentScrollHandler);
    };
  }, []);

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
  const dayWidth = 60; // pixels per day
  const chartWidth = totalDays * dayWidth;
  const taskHeight = 64;
  const taskSpacing = 8;
  const headerHeight = 36;

  const getTaskPosition = (task: GanttTask) => {
    if (!task.startDate || !task.endDate) {
      return null;
    }

    const startOffset =
      (task.startDate.getTime() - dateRange.start.getTime()) /
      (1000 * 60 * 60 * 24);
    const duration =
      (task.endDate.getTime() - task.startDate.getTime()) /
      (1000 * 60 * 60 * 24);

    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, 8), // Minimum width of 8px for visibility
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
        {ganttData.tasks.some((t) => !t.startDate || !t.endDate) ? (
          <NoticeCard
            variant="danger"
            icon={<div className="w-3 h-3 rounded-full bg-rose-500" />}
            subtitle="Capacity problem"
            title={`${ganttData.tasks.filter((t) => !t.startDate || !t.endDate).length} task(s) could not be scheduled because assigned employees lack available hours in the planning horizon.`}
          >
            <ul className="list-disc ml-5 mt-2">
              {ganttData.tasks
                .filter((t) => !t.startDate || !t.endDate)
                .map((t) => (
                  <li key={t.id}>
                    <span className="font-medium">{t.name}</span>
                  </li>
                ))}
            </ul>
          </NoticeCard>
        ) : (
          ganttData.releaseDate && (
            <NoticeCard
              variant="info"
              icon={<Target className="h-5 w-5" />}
              subtitle="Calculated Release Date"
              title={ganttData.releaseDate.toLocaleDateString("en-EN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )
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
                  <div
                    className="w-64 border-r bg-muted/30 flex-shrink-0"
                    style={{ height: headerHeight }}
                  >
                    <div className="h-full flex items-center px-3 text-sm font-semibold leading-tight bg-primary/6 text-primary">
                      <Calendar className="w-4 h-4 mr-2" />
                      Tasks
                    </div>
                  </div>

                  {/* Scrollable timeline header */}
                  <div
                    className="flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    ref={headerScrollRef}
                  >
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
                            className={`border-r text-center text-xs font-medium flex-shrink-0 flex flex-col items-center justify-center ${isNonWorking ? "bg-red-50 text-red-600" : ""}`}
                            style={{ width: dayWidth, height: headerHeight }}
                          >
                            <div className="leading-tight text-[11px]">
                              {formatGanttDate(date)}
                            </div>
                            {isHoliday && (
                              <div className="text-xs mt-0.5">🎉</div>
                            )}
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
                  <div className="w-64 flex-shrink-0">
                    {ganttData.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border-b border-r p-3 bg-background"
                        style={{ height: taskHeight + taskSpacing }}
                      >
                        <div className="flex flex-col justify-center h-full min-w-0 gap-1">
                          {/* Task name */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="font-medium text-sm truncate w-full min-w-0 whitespace-nowrap overflow-hidden cursor-default">
                                {task.name}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="font-semibold">{task.name}</div>
                            </TooltipContent>
                          </Tooltip>

                          <div className="flex items-center gap-2 flex-wrap text-xs min-w-0">
                            {/* Assigned employee */}
                            {task.assignedEmployee && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="flex-shrink min-w-0 max-w-[120px] truncate cursor-default"
                                  >
                                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                      {task.assignedEmployee}
                                    </span>
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  {task.assignedEmployee}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Progress */}
                            <Badge
                              variant="secondary"
                              className="flex-shrink-0"
                            >
                              {task.progress}%
                            </Badge>

                            {/* No capacity */}
                            {(!task.startDate || !task.endDate) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="destructive"
                                    className="flex-shrink-0 cursor-default"
                                  >
                                    ⚠️
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  ⚠️ No capacity
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scrollable timeline content */}
                  <div
                    className="flex-1 overflow-x-auto"
                    ref={contentScrollRef}
                  >
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
                              {task.startDate && task.endDate && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="absolute top-1 rounded-md flex items-center px-2 text-white text-xs font-medium shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                      style={{
                                        left: position!.left,
                                        width: position!.width,
                                        height: taskHeight - 2,
                                        backgroundColor: task.color,
                                        opacity:
                                          task.progress === 100 ? 0.8 : 1,
                                      }}
                                    >
                                      <div className="flex items-center gap-1 truncate">
                                        <Clock className="h-3 w-3" />
                                        {position!.width > 60 && (
                                          <span className="truncate">
                                            {task.name}
                                          </span>
                                        )}
                                      </div>

                                      {/* Progress overlay */}
                                      {task.progress > 0 &&
                                        task.progress < 100 && (
                                          <div
                                            className="absolute top-0 left-0 h-full bg-white/20 rounded-md"
                                            style={{
                                              width: `${task.progress}%`,
                                            }}
                                          />
                                        )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs"
                                  >
                                    <div className="space-y-2">
                                      <div className="font-semibold">
                                        {task.name}
                                      </div>
                                      <div className="text-sm space-y-1">
                                        <div>
                                          📅{" "}
                                          {task.startDate.toLocaleDateString(
                                            "ru-RU",
                                          )}{" "}
                                          -{" "}
                                          {task.endDate.toLocaleDateString(
                                            "ru-RU",
                                          )}
                                        </div>
                                        <div>
                                          ⏱️ h (
                                          {Math.round(
                                            ((task.endDate.getTime() -
                                              task.startDate.getTime()) /
                                              (1000 * 60 * 60 * 24)) *
                                              10,
                                          ) / 10}{" "}
                                          days)
                                        </div>
                                        {task.assignedEmployee && (
                                          <div>👤 {task.assignedEmployee}</div>
                                        )}
                                        <div>📊 {task.progress}% complete</div>
                                        {task.dependencies.length > 0 && (
                                          <div>
                                            🔗 Depends on{" "}
                                            {task.dependencies.length} task(s)
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {/* Dependency arrows */}
                              {task.dependencies.map((depId) => {
                                const depTask = ganttData.tasks.find(
                                  (t) => t.id === depId,
                                );
                                if (
                                  !position ||
                                  !depTask ||
                                  !depTask.startDate ||
                                  !depTask.endDate
                                )
                                  return null;

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
                                        depPosition!.left + depPosition!.width,
                                      top:
                                        (depIndex - index) *
                                          (taskHeight + taskSpacing) +
                                        taskHeight / 2,
                                      width:
                                        position.left -
                                        (depPosition!.left +
                                          depPosition!.width),
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
