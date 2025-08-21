"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  CheckSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  User,
  Link,
  GripVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { Task, Employee } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  employees: Employee[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onUpdateTaskStatus: (taskId: string, status: Task["status"]) => void;
}

export function TaskList({
  tasks,
  employees,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  onUpdateTaskStatus,
}: TaskListProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unassigned";
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.name : "Unknown Task";
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Play className="h-4 w-4 text-blue-600" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Pause className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
    const draggedIndex = sortedTasks.findIndex((t) => t.id === draggedTask.id);
    const targetIndex = sortedTasks.findIndex((t) => t.id === targetTask.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged task and insert at target position
    const newTasks = [...sortedTasks];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    // Update priorities
    const updatedTasks = newTasks.map((task, index) => ({
      ...task,
      priority: index,
    }));

    onReorderTasks(updatedTasks);
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const getTaskProgress = (task: Task) => {
    switch (task.status) {
      case "completed":
        return 100;
      case "in-progress":
        return 50;
      case "blocked":
        return 0;
      default:
        return 0;
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  if (tasks.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add tasks to start planning your release timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks • Drag to reorder priority
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>
              Completed ({tasks.filter((t) => t.status === "completed").length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>
              In Progress (
              {tasks.filter((t) => t.status === "in-progress").length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full"></div>
            <span>
              Blocked ({tasks.filter((t) => t.status === "blocked").length})
            </span>
          </div>
        </div>
      </div>

      {sortedTasks.map((task) => (
        <Card
          key={task.id}
          className={`transition-all duration-200 ${
            draggedTask?.id === task.id
              ? "opacity-50 scale-95"
              : "hover:shadow-md"
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, task)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, task)}
          onDragEnd={handleDragEnd}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="cursor-grab active:cursor-grabbing mt-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    {task.name}
                    <Badge variant="outline" className="text-xs">
                      #{task.priority + 1}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.estimatedHours}h estimated
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getEmployeeName(task.assignedEmployeeId)}
                    </span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getStatusBadgeVariant(task.status)}
                  className="text-xs"
                >
                  {task.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onUpdateTaskStatus(task.id, "pending")}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Mark as Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateTaskStatus(task.id, "in-progress")}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateTaskStatus(task.id, "completed")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateTaskStatus(task.id, "blocked")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Mark as Blocked
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditTask(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteTask(task.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{getTaskProgress(task)}%</span>
              </div>
              <Progress value={getTaskProgress(task)} className="h-2" />
            </div>

            {/* Blocker Tasks */}
            {task.blockerTaskIds.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Blocked by:</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-6">
                  {task.blockerTaskIds.map((blockerId) => {
                    const blockerTask = tasks.find((t) => t.id === blockerId);
                    return (
                      <Badge
                        key={blockerId}
                        variant={
                          blockerTask?.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs gap-1"
                      >
                        <Link className="h-3 w-3" />
                        {getTaskName(blockerId)}
                        {blockerTask?.status === "completed" && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
