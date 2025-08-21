"use client";
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
import { User, MoreHorizontal, Edit, Trash2, Clock } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { Employee } from "@/lib/types";

interface EmployeeListProps {
  employees: Employee[];
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export function EmployeeList({
  employees,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeListProps) {
  const getEmployeeCurrentCapacity = (
    employee: Employee,
  ): { hoursPerDay: number; description: string } => {
    const today = new Date().toISOString().split("T")[0];
    const currentPeriod = employee.capacityPeriods.find(
      (period) => period.startDate <= today && period.endDate >= today,
    );

    if (!currentPeriod) {
      return { hoursPerDay: 0, description: "No current capacity defined" };
    }

    return {
      hoursPerDay: currentPeriod.hoursPerDay,
      description:
        currentPeriod.description ||
        (currentPeriod.hoursPerDay === 0 ? "Unavailable" : "Available"),
    };
  };

  const getCapacityBadgeVariant = (hoursPerDay: number) => {
    if (hoursPerDay === 0) return "destructive";
    if (hoursPerDay < 4) return "secondary";
    if (hoursPerDay < 8) return "outline";
    return "default";
  };

  if (employees.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add team members to start planning tasks and managing capacity.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((employee) => {
        const currentCapacity = getEmployeeCurrentCapacity(employee);
        return (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <CardDescription>{employee.position}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditEmployee(employee)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Employee
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteEmployee(employee.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Current Capacity */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Capacity:
                </span>
                <Badge
                  variant={getCapacityBadgeVariant(currentCapacity.hoursPerDay)}
                  className="gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {currentCapacity.hoursPerDay}h/day
                </Badge>
              </div>

              {currentCapacity.description && (
                <p className="text-xs text-muted-foreground">
                  {currentCapacity.description}
                </p>
              )}

              {/* Capacity Periods Summary */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Capacity Periods:</span>
                  <span className="text-xs text-muted-foreground">
                    {employee.capacityPeriods.length} defined
                  </span>
                </div>

                {employee.capacityPeriods.length > 0 ? (
                  <div className="space-y-1">
                    {employee.capacityPeriods
                      .slice(0, 2)
                      .map((period, index) => (
                        <div
                          key={period.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground">
                            {formatDate(period.startDate)} -{" "}
                            {formatDate(period.endDate)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {period.hoursPerDay}h
                          </Badge>
                        </div>
                      ))}
                    {employee.capacityPeriods.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{employee.capacityPeriods.length - 2} more periods
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No capacity periods defined
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
