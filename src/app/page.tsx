"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Calendar,
  Users,
  CheckSquare,
  AlertCircle,
  UserPlus,
  BarChart3,
  MoreVertical,
  Download,
  Upload,
} from "lucide-react";
import {
  loadProjectData,
  saveProjectData,
  createRelease,
  updateRelease,
  deleteRelease,
  addEmployeeToRelease,
  updateEmployeeInRelease,
  deleteEmployeeFromRelease,
  addTaskToRelease,
  updateTaskInRelease,
  deleteTaskFromRelease,
  reorderTasksInRelease,
} from "@/lib/storage";
import { type ProjectData } from "@/lib/types";
import { formatDate } from "@/lib/date-utils";
import { ReleaseDialog } from "@/components/release-dialog";
import { ReleaseSelector } from "@/components/release-selector";
import { EmployeeDialog } from "@/components/employee-dialog";
import { EmployeeList } from "@/components/employee-list";
import { TaskDialog } from "@/components/task-dialog";
import { TaskList } from "@/components/task-list";
import { GanttChart } from "@/components/gantt-chart";
import { ImportExportDialog } from "@/components/import-export-dialog";
import type { Release, Employee, Task } from "@/lib/types";

export default function HomePage() {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showImportExportDialog, setShowImportExportDialog] = useState(false);

  useEffect(() => {
    setProjectData(loadProjectData());
  }, []);

  const refreshData = () => {
    setProjectData(loadProjectData());
  };

  const handleCreateRelease = (
    releaseData: Omit<Release, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newRelease = createRelease(
      releaseData.name,
      releaseData.startDate,
      releaseData.description,
    );

    // Copy over additional properties
    newRelease.targetEndDate = releaseData.targetEndDate;
    newRelease.customHolidays = releaseData.customHolidays;

    const data = loadProjectData();
    data.releases.push(newRelease);

    // Set as active if it's the first release
    if (data.releases.length === 1) {
      data.activeReleaseId = newRelease.id;
    }

    saveProjectData(data);
    refreshData();
  };

  const handleUpdateRelease = (
    releaseData: Omit<Release, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!editingRelease) return;

    updateRelease(editingRelease.id, releaseData);
    setEditingRelease(null);
    refreshData();
  };

  const handleReleaseChange = (releaseId: string) => {
    const data = loadProjectData();
    data.activeReleaseId = releaseId;
    saveProjectData(data);
    refreshData();
  };

  const handleEditRelease = (release: Release) => {
    setEditingRelease(release);
    setShowReleaseDialog(true);
  };

  const handleDeleteRelease = (releaseId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this release? This action cannot be undone.",
      )
    ) {
      deleteRelease(releaseId);
      refreshData();
    }
  };

  const handleReleaseDialogSave = (
    releaseData: Omit<Release, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (editingRelease) {
      handleUpdateRelease(releaseData);
    } else {
      handleCreateRelease(releaseData);
    }
  };

  const handleReleaseDialogClose = (open: boolean) => {
    setShowReleaseDialog(open);
    if (!open) {
      setEditingRelease(null);
    }
  };

  const handleAddEmployee = (employeeData: Omit<Employee, "id">) => {
    if (!projectData?.activeReleaseId) return;

    addEmployeeToRelease(projectData.activeReleaseId, employeeData);
    refreshData();
  };

  const handleUpdateEmployee = (employeeData: Omit<Employee, "id">) => {
    if (!projectData?.activeReleaseId || !editingEmployee) return;

    updateEmployeeInRelease(
      projectData.activeReleaseId,
      editingEmployee.id,
      employeeData,
    );
    setEditingEmployee(null);
    refreshData();
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEmployeeDialog(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (!projectData?.activeReleaseId) return;

    if (
      confirm("Are you sure you want to remove this employee from the release?")
    ) {
      deleteEmployeeFromRelease(projectData.activeReleaseId, employeeId);
      refreshData();
    }
  };

  const handleEmployeeDialogSave = (employeeData: Omit<Employee, "id">) => {
    if (editingEmployee) {
      handleUpdateEmployee(employeeData);
    } else {
      handleAddEmployee(employeeData);
    }
  };

  const handleEmployeeDialogClose = (open: boolean) => {
    setShowEmployeeDialog(open);
    if (!open) {
      setEditingEmployee(null);
    }
  };

  const handleAddTask = (
    taskData: Omit<Task, "id" | "calculatedStartDate" | "calculatedEndDate">,
  ) => {
    if (!projectData?.activeReleaseId) return;

    addTaskToRelease(projectData.activeReleaseId, taskData);
    refreshData();
  };

  const handleUpdateTask = (
    taskData: Omit<Task, "id" | "calculatedStartDate" | "calculatedEndDate">,
  ) => {
    if (!projectData?.activeReleaseId || !editingTask) return;

    updateTaskInRelease(projectData.activeReleaseId, editingTask.id, taskData);
    setEditingTask(null);
    refreshData();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!projectData?.activeReleaseId) return;

    if (
      confirm(
        "Are you sure you want to delete this task? This will also remove it from any dependencies.",
      )
    ) {
      deleteTaskFromRelease(projectData.activeReleaseId, taskId);
      refreshData();
    }
  };

  const handleReorderTasks = (tasks: Task[]) => {
    if (!projectData?.activeReleaseId) return;

    reorderTasksInRelease(projectData.activeReleaseId, tasks);
    refreshData();
  };

  const handleUpdateTaskStatus = (taskId: string, status: Task["status"]) => {
    if (!projectData?.activeReleaseId) return;

    updateTaskInRelease(projectData.activeReleaseId, taskId, { status });
    refreshData();
  };

  const handleTaskDialogSave = (
    taskData: Omit<Task, "id" | "calculatedStartDate" | "calculatedEndDate">,
  ) => {
    if (editingTask) {
      handleUpdateTask(taskData);
    } else {
      handleAddTask(taskData);
    }
  };

  const handleTaskDialogClose = (open: boolean) => {
    setShowTaskDialog(open);
    if (!open) {
      setEditingTask(null);
    }
  };

  const handleImportSuccess = () => {
    refreshData();
  };

  if (!projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project data...</p>
        </div>
      </div>
    );
  }

  const activeRelease = projectData.releases.find(
    (r) => r.id === projectData.activeReleaseId,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground">
                Project Manager Pro
              </h1>
              <p className="text-muted-foreground">
                Professional project planning and resource management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowImportExportDialog(true)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Import / Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="gap-2"
                onClick={() => setShowReleaseDialog(true)}
              >
                <Plus className="h-4 w-4" />
                New Release
              </Button>
            </div>
          </div>

          {projectData.releases.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <ReleaseSelector
                releases={projectData.releases}
                activeReleaseId={projectData.activeReleaseId}
                onReleaseChange={handleReleaseChange}
                onEditRelease={handleEditRelease}
                onDeleteRelease={handleDeleteRelease}
              />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {projectData.releases.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold font-serif mb-2">
              Welcome to Project Manager Pro
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating your first release. Plan tasks, manage
              resources, and track progress with powerful Gantt charts.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => setShowReleaseDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Create Your First Release
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => setShowImportExportDialog(true)}
              >
                <Upload className="h-4 w-4" />
                Import Existing Data
              </Button>
            </div>
          </div>
        ) : !activeRelease ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active release selected. Please select a release from the
              dropdown above.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Release Overview */}
            <section>
              <h2 className="text-xl font-semibold font-serif mb-4">
                Release Overview
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {activeRelease.name}
                  </CardTitle>
                  <CardDescription>
                    {activeRelease.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Start Date
                        </p>
                        <p className="font-medium">
                          {formatDate(activeRelease.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Users className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Team Members
                        </p>
                        <p className="font-medium">
                          {activeRelease.employees.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-3/10 rounded-lg">
                        <CheckSquare className="h-4 w-4 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tasks</p>
                        <p className="font-medium">
                          {activeRelease.tasks.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeRelease.customHolidays.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Custom Holidays
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeRelease.customHolidays.map((holiday, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-sm"
                          >
                            {formatDate(holiday)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Tabbed Content */}
            <Tabs defaultValue="team" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="team">Team Management</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="team" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-serif">
                      Team Members
                    </h3>
                    <p className="text-muted-foreground">
                      Manage team members and their capacity schedules
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowEmployeeDialog(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Team Member
                  </Button>
                </div>

                <EmployeeList
                  employees={activeRelease.employees}
                  onEditEmployee={handleEditEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              </TabsContent>

              <TabsContent value="tasks" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-serif">Tasks</h3>
                    <p className="text-muted-foreground">
                      Manage project tasks and dependencies
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    onClick={() => setShowTaskDialog(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                <TaskList
                  tasks={activeRelease.tasks}
                  employees={activeRelease.employees}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onReorderTasks={handleReorderTasks}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                />
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-serif">
                      Project Timeline
                    </h3>
                    <p className="text-muted-foreground">
                      View Gantt chart and project schedule
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Auto-calculated based on capacity and dependencies
                    </span>
                  </div>
                </div>

                <GanttChart release={activeRelease} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <ReleaseDialog
        open={showReleaseDialog}
        onOpenChange={handleReleaseDialogClose}
        release={editingRelease}
        onSave={handleReleaseDialogSave}
      />

      <EmployeeDialog
        open={showEmployeeDialog}
        onOpenChange={handleEmployeeDialogClose}
        employee={editingEmployee}
        onSave={handleEmployeeDialogSave}
      />

      <TaskDialog
        open={showTaskDialog}
        onOpenChange={handleTaskDialogClose}
        task={editingTask}
        employees={activeRelease?.employees || []}
        existingTasks={activeRelease?.tasks || []}
        onSave={handleTaskDialogSave}
      />

      <ImportExportDialog
        open={showImportExportDialog}
        onOpenChange={setShowImportExportDialog}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
