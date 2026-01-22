"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/apiClient";
import { Schedule } from "@/lib/types";
import { Plus, Calendar, Search } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/schedules");
      setSchedules(response.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await apiClient.delete(`/schedules/${id}`);
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Failed to delete schedule");
    }
  };

  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Schedules</h1>
            <p className="text-gray-600 mt-1">
              Manage all your study schedules
            </p>
          </div>
          <Link href="/schedules/new">
            <Button variant="primary">
              <Plus size={20} className="mr-2" />
              New Schedule
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Schedules List */}
        {filteredSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "No schedules found matching your search"
                  : "No schedules yet. Create your first schedule!"}
              </p>
              {!searchTerm && (
                <Link href="/schedules/new">
                  <Button variant="primary">Create Schedule</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{schedule.title}</CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {schedule.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar size={14} className="mr-2" />
                      Start: {format(parseISO(schedule.startDate), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar size={14} className="mr-2" />
                      End: {format(parseISO(schedule.endDate), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/schedules/${schedule.id}`}
                      className="flex-1"
                    >
                      <Button variant="primary" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(schedule.id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

