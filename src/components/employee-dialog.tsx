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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Trash2, User } from "lucide-react";
import type { Employee, CapacityPeriod } from "@/lib/types";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSave: (employee: Omit<Employee, "id">) => void;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: EmployeeDialogProps) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [capacityPeriods, setCapacityPeriods] = useState<CapacityPeriod[]>([]);

  useEffect(() => {
    if (!open) {
      setName("");
      setPosition("");
      setCapacityPeriods([]);
      return;
    }

    if (employee) {
      setName(employee.name ?? "");
      setPosition(employee.position ?? "");
      setCapacityPeriods(employee.capacityPeriods || []);
    } else {
      setName("");
      setPosition("");
      setCapacityPeriods([]);
    }
  }, [employee, open]);

  const handleSave = () => {
    if (!name.trim() || !position.trim()) return;

    onSave({
      name: name.trim(),
      position: position.trim(),
      capacityPeriods,
    });

    onOpenChange(false);
  };

  const addCapacityPeriod = () => {
    const newPeriod: CapacityPeriod = {
      id: crypto.randomUUID(),
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      hoursPerDay: 8,
      description: "",
    };
    setCapacityPeriods([...capacityPeriods, newPeriod]);
  };

  const updateCapacityPeriod = (
    index: number,
    updates: Partial<CapacityPeriod>,
  ) => {
    const updated = capacityPeriods.map((period, i) =>
      i === index ? { ...period, ...updates } : period,
    );
    setCapacityPeriods(updated);
  };

  const removeCapacityPeriod = (index: number) => {
    setCapacityPeriods(capacityPeriods.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <User className="h-5 w-5" />
            {employee ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? "Update employee information and capacity periods."
              : "Add a new team member with their working capacity schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Senior Developer"
              />
            </div>
          </div>

          {/* Capacity Periods */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Capacity Periods</Label>
                <p className="text-sm text-muted-foreground">
                  Define working hours for different time periods. Set hours to
                  0 for vacation periods.
                </p>
              </div>
              <Button
                onClick={addCapacityPeriod}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                Add Period
              </Button>
            </div>

            {capacityPeriods.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center mb-4">
                    No capacity periods defined yet.
                    <br />
                    Add periods to specify working hours over time.
                  </p>
                  <Button
                    onClick={addCapacityPeriod}
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Period
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {capacityPeriods.map((period, index) => (
                  <Card key={period.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        Period {index + 1}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCapacityPeriod(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={period.startDate}
                            onChange={(e) =>
                              updateCapacityPeriod(index, {
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={period.endDate}
                            onChange={(e) =>
                              updateCapacityPeriod(index, {
                                endDate: e.target.value,
                              })
                            }
                            min={period.startDate}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Hours per Day</Label>
                          <Input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={period.hoursPerDay}
                            onChange={(e) =>
                              updateCapacityPeriod(index, {
                                hoursPerDay:
                                  Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input
                          value={period.description || ""}
                          onChange={(e) =>
                            updateCapacityPeriod(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder={
                            period.hoursPerDay === 0
                              ? "e.g., Vacation, Sick leave"
                              : "e.g., Full-time, Part-time, Reduced hours"
                          }
                        />
                      </div>

                      {period.hoursPerDay === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <CalendarIcon className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-700 dark:text-amber-300">
                            This period is marked as unavailable
                            (vacation/leave)
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !position.trim()}
          >
            {employee ? "Update Employee" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
