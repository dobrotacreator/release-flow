"use client";

import type React from "react";

import { useState, useRef } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Copy,
} from "lucide-react";
import {
  exportProjectData,
  importProjectData,
  loadProjectData,
} from "@/lib/storage";
import type { ProjectData } from "@/lib/types";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportExportDialogProps) {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportData, setExportData] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportProjectData();
    setExportData(data);
  };

  const handleDownloadExport = () => {
    if (!exportData) return;

    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `release-flow-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = async () => {
    if (!exportData) return;

    try {
      await navigator.clipboard.writeText(exportData);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      setImportError(null);
      setImportSuccess(false);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportError("Please provide data to import");
      return;
    }

    setImportError(null);
    setImportSuccess(false);

    try {
      // Validate JSON format first
      const parsed = JSON.parse(importText) as ProjectData;

      // Enhanced validation
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid data format: must be a valid JSON object");
      }

      if (!Array.isArray(parsed.releases)) {
        throw new Error("Invalid data format: releases must be an array");
      }

      // Validate each release structure
      for (const release of parsed.releases) {
        if (!release.id || !release.name || !release.startDate) {
          throw new Error(
            "Invalid release format: missing required fields (id, name, startDate)",
          );
        }

        if (!Array.isArray(release.employees)) {
          throw new Error("Invalid release format: employees must be an array");
        }

        if (!Array.isArray(release.tasks)) {
          throw new Error("Invalid release format: tasks must be an array");
        }

        if (!Array.isArray(release.customHolidays)) {
          throw new Error(
            "Invalid release format: customHolidays must be an array",
          );
        }
      }

      // Attempt to import
      const success = importProjectData(importText);

      if (success) {
        setImportSuccess(true);
        setImportText("");
        setTimeout(() => {
          onImportSuccess();
          onOpenChange(false);
        }, 1500);
      } else {
        throw new Error("Failed to import data");
      }
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Invalid JSON format",
      );
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setImportText("");
      setImportError(null);
      setImportSuccess(false);
      setExportData("");
    }
    onOpenChange(open);
  };

  const currentData = loadProjectData();
  const hasData = currentData.releases.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import & Export Data
          </DialogTitle>
          <DialogDescription>
            Backup your project data or import data from another instance of
            Release Flow.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Project Data
                </CardTitle>
                <CardDescription>
                  Download all your releases, tasks, and team data as a JSON
                  file for backup or sharing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!hasData ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No project data to export. Create some releases and tasks
                      first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleExport} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Generate Export Data
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentData.releases.length} releases,{" "}
                        {currentData.releases.reduce(
                          (sum, r) => sum + r.tasks.length,
                          0,
                        )}{" "}
                        tasks
                      </span>
                    </div>

                    {exportData && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleDownloadExport}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download JSON File
                          </Button>
                          <Button
                            onClick={handleCopyExport}
                            variant="outline"
                            className="gap-2 bg-transparent"
                          >
                            <Copy className="h-4 w-4" />
                            Copy to Clipboard
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Export Data Preview:</Label>
                          <Textarea
                            value={exportData}
                            readOnly
                            className="font-mono text-xs h-32"
                            placeholder="Export data will appear here..."
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Project Data
                </CardTitle>
                <CardDescription>
                  Import project data from a JSON file or paste the data
                  directly. This will replace all current data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Importing data will replace all
                    current releases, tasks, and team members. Make sure to
                    export your current data first if you want to keep it.
                  </AlertDescription>
                </Alert>

                {importSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-700">
                      Data imported successfully! The page will refresh shortly.
                    </AlertDescription>
                  </Alert>
                )}

                {importError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{importError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload JSON File:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-muted file:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="text-center text-muted-foreground">or</div>

                  <div className="space-y-2">
                    <Label>Paste JSON Data:</Label>
                    <Textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste your exported JSON data here..."
                      className="font-mono text-xs h-32"
                    />
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={!importText.trim() || importSuccess}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importSuccess ? "Import Successful!" : "Import Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
