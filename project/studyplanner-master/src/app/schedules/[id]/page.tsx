"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/apiClient";
import { Schedule, Resource } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CheckCircle2, FileText, Upload, Trash2, Download } from "lucide-react";
import Link from "next/link";

const scheduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
  });

  useEffect(() => {
    if (params.id) {
      fetchSchedule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/schedules/${params.id}`);
      setSchedule(response.data);
      reset({
        title: response.data.title,
        description: response.data.description,
        startDate: response.data.startDate.split("T")[0],
        endDate: response.data.endDate.split("T")[0],
      });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      alert("Failed to load schedule");
      router.push("/schedules");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ScheduleFormData) => {
    if (!schedule?.id) return;

    try {
      setIsSubmitting(true);
      await apiClient.put(`/schedules/${schedule.id}`, {
        ...data,
        userId: schedule.userId,
        status: schedule.status,
      });
      await fetchSchedule();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Failed to update schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!schedule?.id) return;

    try {
      await apiClient.put(`/schedules/${schedule.id}`, {
        ...schedule,
        status: "completed",
      });
      await fetchSchedule();
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Failed to update schedule");
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await apiClient.delete(`/schedules/${schedule.id}`);
      router.push("/schedules");
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset input so same file can be selected again later
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file || !schedule?.id) {
      alert("Please select a file and ensure schedule is loaded.");
      return;
    }

    try {
      setIsUploading(true);

      // 1. get SAS url from server
      const sasResponse = await apiClient.get("/upload/sas", {
        params: {
          fileName: file.name,
          scheduleId: schedule.id,
        },
      });

      if (!sasResponse?.data?.sasUrl) {
        const serverMsg = sasResponse?.data?.error || JSON.stringify(sasResponse?.data || {});
        throw new Error(`Invalid SAS response: ${serverMsg}`);
      }

      // 2. upload to blob storage using SAS URL
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
        scheduleId: schedule.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: sasResponse.data.fileUrl,
      });

      await fetchSchedule();
      alert("File uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading file:", error);

      let userMessage = "Failed to upload file";
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
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const resp = await apiClient.delete(`/resources/${resourceId}`);
      console.log("Delete resource response:", resp?.data);
      await fetchSchedule();
      alert("File deleted");
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      await fetchSchedule();

      let msg = "Failed to delete file";
      if (error?.response) {
        const status = error.response.status;
        const data = error.response.data;
        msg = `Delete failed: ${status} - ${JSON.stringify(data)}`;
      } else if (error?.message) {
        msg = error.message;
      }

      alert(msg);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const resp = await apiClient.get("/upload/read-sas", {
        params: {
          fileUrl: resource.fileUrl,
          scheduleId: schedule?.id,
        },
      });

      if (!resp?.data?.sasUrl) {
        alert("Failed to get download URL");
        return;
      }

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

  if (!schedule) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Schedule not found</p>
            <Link href="/schedules">
              <Button variant="primary" className="mt-4">
                Back to Schedules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/schedules">
            <Button variant="ghost">← Back</Button>
          </Link>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                {schedule.status === "pending" && (
                  <Button variant="primary" onClick={handleMarkComplete}>
                    <CheckCircle2 size={18} className="mr-2" />
                    Mark Complete
                  </Button>
                )}
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 size={18} className="mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            {isEditing ? (
              <CardTitle>Edit Schedule</CardTitle>
            ) : (
              <div className="flex items-center justify-between">
                <CardTitle>{schedule.title}</CardTitle>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    schedule.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {schedule.status}
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register("title")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      {...register("startDate")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      {...register("endDate")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      fetchSchedule();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900">{schedule.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                    <p className="text-gray-900">{format(parseISO(schedule.startDate), "MMMM d, yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                    <p className="text-gray-900">{format(parseISO(schedule.endDate), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resources Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resources</CardTitle>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  isLoading={isUploading}
                  onClick={openFilePicker}
                >
                  <Upload size={18} className="mr-2" />
                  Upload File
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {schedule.resources && schedule.resources.length > 0 ? (
              <div className="space-y-2">
                {schedule.resources.map((resource: Resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-gray-400" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">{resource.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(resource.fileSize / 1024).toFixed(2)} KB • {format(parseISO(resource.uploadedAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(resource)}>
                        <Download size={16} className="mr-2" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteResource(resource.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No resources uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
