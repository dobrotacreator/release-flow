"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, User, Clock, Link } from "lucide-react";
import type { Task, Employee } from "@/lib/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  employees: Employee[];
  existingTasks: Task[];
  onSave: (
    task: Omit<Task, "id" | "calculatedStartDate" | "calculatedEndDate">,
  ) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  employees,
  existingTasks,
  onSave,
}: TaskDialogProps) {
  const [name, setName] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(8);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string | null>(
    null,
  );
  const [blockerTaskIds, setBlockerTaskIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Task["status"]>("pending");

  // Filter out the current task from potential blockers to prevent self-dependency
  const availableBlockerTasks = existingTasks.filter((t) => t.id !== task?.id);

  useEffect(() => {
    if (!open) {
      setName("");
      setEstimatedHours(8);
      setAssignedEmployeeId(null);
      setBlockerTaskIds([]);
      setStatus("pending");
      return;
    }

    if (task) {
      setName(task?.name || "");
      setEstimatedHours(task?.estimatedHours || 8);
      setAssignedEmployeeId(task?.assignedEmployeeId || null);
      setBlockerTaskIds(task?.blockerTaskIds || []);
      setStatus(task?.status || "pending");
    } else {
      setName("");
      setEstimatedHours(8);
      setAssignedEmployeeId(null);
      setBlockerTaskIds([]);
      setStatus("pending");
    }
  }, [task, open]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      estimatedHours,
      assignedEmployeeId,
      blockerTaskIds,
      priority: task?.priority || 0,
      status,
    });

    onOpenChange(false);
  };

  const toggleBlockerTask = (taskId: string) => {
    setBlockerTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unassigned";
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Unknown Employee";
  };

  const getTaskName = (taskId: string) => {
    const task = availableBlockerTasks.find((t) => t.id === taskId);
    return task ? task.name : "Unknown Task";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {task ? "Edit Task" : "Add New Task"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "Update task details, assignment, and dependencies."
              : "Create a new task with time estimates and dependencies."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Implement user authentication"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Estimated Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) =>
                    setEstimatedHours(Number.parseFloat(e.target.value) || 0)
                  }
                  placeholder="8"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value: Task["status"]) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <Label>Assigned Employee</Label>
            <Select
              value={assignedEmployeeId || "unassigned"}
              onValueChange={(value) =>
                setAssignedEmployeeId(value === "unassigned" ? null : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Unassigned
                  </div>
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <span>{employee.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {employee.position}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedEmployeeId && (
              <p className="text-sm text-muted-foreground">
                Assigned to: {getEmployeeName(assignedEmployeeId)}
              </p>
            )}
          </div>

          {/* Blocker Tasks */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Blocker Tasks</Label>
              <p className="text-sm text-muted-foreground">
                Select tasks that must be completed before this task can start.
              </p>
            </div>

            {availableBlockerTasks.length === 0 ? (
              <div className="p-4 border border-dashed rounded-lg text-center">
                <Link className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No other tasks available to set as blockers.
                  <br />
                  Create more tasks to establish dependencies.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {availableBlockerTasks.map((blockerTask) => (
                  <div
                    key={blockerTask.id}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`blocker-${blockerTask.id}`}
                      checked={blockerTaskIds.includes(blockerTask.id)}
                      onCheckedChange={() => toggleBlockerTask(blockerTask.id)}
                    />
                    <Label
                      htmlFor={`blocker-${blockerTask.id}`}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{blockerTask.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {blockerTask.estimatedHours}h
                          </Badge>
                          <Badge
                            variant={
                              blockerTask.status === "completed"
                                ? "default"
                                : blockerTask.status === "in-progress"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {blockerTask.status}
                          </Badge>
                        </div>
                      </div>
                      {blockerTask.assignedEmployeeId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to:{" "}
                          {getEmployeeName(blockerTask.assignedEmployeeId)}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {blockerTaskIds.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Selected Blockers:</Label>
                <div className="flex flex-wrap gap-2">
                  {blockerTaskIds.map((taskId) => {
                    const name = getTaskName(taskId);
                    return (
                      <Badge
                        key={taskId}
                        variant="secondary"
                        className="gap-1 max-w-[200px] truncate overflow-hidden whitespace-nowrap"
                        title={name}
                      >
                        <Link
                          className="h-3 w-3 flex-none shrink-0"
                          aria-hidden
                        />
                        <span className="ml-1 overflow-hidden truncate inline-block max-w-[140px]">
                          {name}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {task ? "Update Task" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
