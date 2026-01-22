"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/apiClient";
import { Resource } from "@/lib/types";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function UploadPage() {
  const [files, setFiles] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [schedules, setSchedules] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchAllResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await apiClient.get("/schedules");
      setSchedules(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedScheduleId(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const fetchAllResources = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/schedules");
      const allResources: Resource[] = [];

      (response.data || []).forEach((schedule: any) => {
        if (Array.isArray(schedule.resources)) {
          schedule.resources.forEach((resource: Resource) => {
            allResources.push({
              ...resource,
              // attach schedule info for display
              scheduleId: schedule.id,
              scheduleTitle: schedule.title,
            } as Resource);
          });
        }
      });

      setFiles(allResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset input so same file can be selected again later
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file || !selectedScheduleId) {
      alert("Please select a schedule first");
      return;
    }

    try {
      setIsUploading(true);

      // 1. get SAS url from server
      const sasResponse = await apiClient.get("/upload/sas", {
        params: {
          fileName: file.name,
          scheduleId: selectedScheduleId,
        },
      });

      // 2. upload to blob storage using SAS URL
      if (!sasResponse?.data?.sasUrl) {
        const serverMsg = sasResponse?.data?.error || JSON.stringify(sasResponse?.data || {});
        throw new Error(`Invalid SAS response: ${serverMsg}`);
      }

      const uploadResponse = await fetch(sasResponse.data.sasUrl, {
        method: "PUT",
        body: file,
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text().catch(() => "(no body)");
        throw new Error(`Upload failed: ${uploadResponse.status} ${text}`);
      }

      // 3. notify server to finish and save metadata
      await apiClient.post("/upload/finish", {
        scheduleId: selectedScheduleId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: sasResponse.data.fileUrl,
      });

      await fetchAllResources();
      alert("File uploaded successfully!");
    } catch (error: any) {
      // Try to extract as much useful info as possible for debugging
      console.error("Error uploading file:", error);

      let userMessage = "Failed to upload file";

      // Axios error with server response
      if (error?.response?.data) {
        try {
          const data = error.response.data;
          userMessage = data.error || data.message || JSON.stringify(data);
        } catch (_) {
          userMessage = String(error.message || userMessage);
        }
      } else if (error?.message) {
        userMessage = error.message;
      }

      alert(`Failed to upload file: ${userMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const openFilePicker = () => {
    if (!selectedScheduleId) {
      alert("Please select a schedule first");
      return;
    }
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      console.log("Deleting resource with id:", resourceId);
      // try deleting resource via API - adjust endpoint if your API uses another path
      const resp = await apiClient.delete(`/resources/${resourceId}`);
      console.log("Delete response:", resp?.data);
      await fetchAllResources();
      alert("File deleted");
    } catch (error) {
      // Provide detailed error info for debugging
      console.error("Error deleting file:", error);
      // still refresh list in case the server state changed
      await fetchAllResources();

      // Try to extract axios response details
      const anyErr = error as any;
      let msg = "Failed to delete file";
      if (anyErr?.response) {
        const status = anyErr.response.status;
        const data = anyErr.response.data;
        msg = `Delete failed: ${status} - ${JSON.stringify(data)}`;
      } else if (anyErr?.message) {
        msg = anyErr.message;
      }

      alert(msg);
    }
  };

  const handleDownload = async (file: any) => {
    try {
      // Request a temporary read-only SAS from the server
      const resp = await apiClient.get("/upload/read-sas", {
        params: {
          fileUrl: file.fileUrl,
          scheduleId: file.scheduleId,
        },
      });

      if (!resp?.data?.sasUrl) {
        alert("Failed to get download URL");
        return;
      }

      // Open in new tab
      window.open(resp.data.sasUrl, "_blank");
    } catch (error: any) {
      console.error("Error getting read SAS:", error);
      let msg = "Failed to get download URL";
      if (error?.response?.data?.error) msg = error.response.data.error;
      else if (error?.message) msg = error.message;
      alert(msg);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Resources</h1>
          <p className="text-gray-600 mt-1">Upload study materials and resources</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Schedule
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a schedule</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose File
                </label>

                {/* Hidden input triggered by the button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading || !selectedScheduleId}
                />

                <Button
                  variant="primary"
                  type="button"
                  isLoading={isUploading}
                  disabled={!selectedScheduleId || isUploading}
                  onClick={openFilePicker}
                >
                  <Upload size={18} className="mr-2" />
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>

                {!selectedScheduleId && (
                  <p className="mt-2 text-sm text-gray-500">Please select a schedule first</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Uploaded Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No resources uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file: any) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="text-gray-400" size={24} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.fileName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                          <span>•</span>
                          <span>
                            {file.uploadedAt
                              ? format(parseISO(file.uploadedAt), "MMM d, yyyy")
                              : "—"}
                          </span>
                          {file.scheduleTitle && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{file.scheduleTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download size={16} className="mr-2" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
