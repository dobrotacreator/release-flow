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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import type { Release } from "@/lib/types";

interface ReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release?: Release | null;
  onSave: (release: Omit<Release, "id" | "createdAt" | "updatedAt">) => void;
}

export function ReleaseDialog({
  open,
  onOpenChange,
  release,
  onSave,
}: ReleaseDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [targetEndDate, setTargetEndDate] = useState<Date | undefined>(
    undefined,
  );
  const [customHolidays, setCustomHolidays] = useState<Date[]>([]);
  const [newHoliday, setNewHoliday] = useState<Date | undefined>();

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setStartDate(new Date());
      setTargetEndDate(undefined);
      setCustomHolidays([]);
      setNewHoliday(undefined);
      return;
    }

    if (release) {
      setName(release.name ?? "");
      setDescription(release.description ?? "");
      setStartDate(
        release.startDate ? new Date(release.startDate) : new Date(),
      );
      setTargetEndDate(
        release.targetEndDate ? new Date(release.targetEndDate) : undefined,
      );
      setCustomHolidays(
        Array.isArray(release.customHolidays)
          ? release.customHolidays.map((h) => new Date(h))
          : [],
      );
      setNewHoliday(undefined);
    } else {
      setName("");
      setDescription("");
      setStartDate(new Date());
      setTargetEndDate(undefined);
      setCustomHolidays([]);
      setNewHoliday(undefined);
    }
  }, [release, open]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate.toISOString(),
      targetEndDate: targetEndDate?.toISOString(),
      customHolidays: customHolidays.map((d) => d.toISOString().split("T")[0]),
      employees: release?.employees || [],
      tasks: release?.tasks || [],
    });

    onOpenChange(false);
  };

  const addHoliday = () => {
    if (
      newHoliday &&
      !customHolidays.some(
        (h) => h.toDateString() === newHoliday.toDateString(),
      )
    ) {
      setCustomHolidays([...customHolidays, newHoliday]);
      setNewHoliday(undefined);
    }
  };

  const removeHoliday = (index: number) => {
    setCustomHolidays(customHolidays.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {release ? "Edit Release" : "Create New Release"}
          </DialogTitle>
          <DialogDescription>
            {release
              ? "Update release details and settings."
              : "Set up a new release with timeline and custom holidays."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Release Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Version 2.0, Q1 Release"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this release..."
                rows={3}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatDate(startDate) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Target End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetEndDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetEndDate ? formatDate(targetEndDate) : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={targetEndDate}
                    onSelect={setTargetEndDate}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Custom Holidays */}
          <div className="space-y-4">
            <Label>Custom Holidays</Label>
            <p className="text-sm text-muted-foreground">
              Add custom non-working days (holidays, company events, etc.) that
              should be excluded from project planning.
            </p>

            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !newHoliday && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newHoliday
                      ? formatDate(newHoliday)
                      : "Select holiday date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newHoliday}
                    onSelect={setNewHoliday}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={addHoliday} disabled={!newHoliday} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {customHolidays.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Added Holidays:</Label>
                <div className="flex flex-wrap gap-2">
                  {customHolidays.map((holiday, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                    >
                      <span>{formatDate(holiday)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeHoliday(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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
            {release ? "Update Release" : "Create Release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
