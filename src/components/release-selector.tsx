"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { Release } from "@/lib/types";

interface ReleaseSelectorProps {
  releases: Release[];
  activeReleaseId: string | null;
  onReleaseChange: (releaseId: string) => void;
  onEditRelease: (release: Release) => void;
  onDeleteRelease: (releaseId: string) => void;
}

export function ReleaseSelector({
  releases,
  activeReleaseId,
  onReleaseChange,
  onEditRelease,
  onDeleteRelease,
}: ReleaseSelectorProps) {
  const activeRelease = releases.find((r) => r.id === activeReleaseId);

  if (releases.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Active Release:</span>
      </div>

      <Select value={activeReleaseId || ""} onValueChange={onReleaseChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select a release" />
        </SelectTrigger>
        <SelectContent>
          {releases.map((release) => (
            <SelectItem key={release.id} value={release.id}>
              <div className="flex items-center justify-between w-full">
                <span>{release.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {formatDate(release.startDate)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeRelease && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditRelease(activeRelease)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Release
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeleteRelease(activeRelease.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Release
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
