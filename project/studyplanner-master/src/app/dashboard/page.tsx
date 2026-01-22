"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import apiClient from "@/lib/apiClient";
import { Schedule } from "@/lib/types";
import { Calendar, CheckCircle2, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { format, isWithinInterval, parseISO } from "date-fns";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/schedules");
      const allSchedules = response.data;
      setSchedules(allSchedules);

      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcoming = allSchedules.filter((schedule: Schedule) => {
        const startDate = parseISO(schedule.startDate);
        return (
          isWithinInterval(startDate, { start: now, end: nextWeek }) &&
          schedule.status === "pending"
        );
      });

      const current = allSchedules.filter((schedule: Schedule) => {
        const startDate = parseISO(schedule.startDate);
        const endDate = parseISO(schedule.endDate);
        const now = new Date();
        return (
          isWithinInterval(now, { start: startDate, end: endDate }) &&
          schedule.status === "pending"
        );
      });

      const completed = allSchedules.filter(
        (schedule: Schedule) => schedule.status === "completed"
      );

      setStats({
        upcoming: upcoming.length,
        completed: completed.length,
        total: allSchedules.length,
      });
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSchedules = schedules
    .filter((schedule) => {
      const startDate = parseISO(schedule.startDate);
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return (
        isWithinInterval(startDate, { start: now, end: nextWeek }) &&
        schedule.status === "pending"
      );
    })
    .sort((a, b) => {
      return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    })
    .slice(0, 5);

  const ongoingSchedules = schedules
    .filter((schedule) => {
      const startDate = parseISO(schedule.startDate);
      const endDate = parseISO(schedule.endDate);
      const now = new Date();
      return (
        isWithinInterval(now, { start: startDate, end: endDate }) &&
        schedule.status === "pending"
      );
    })
    .sort((a, b) => {
      return parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    });

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
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your study schedule overview
            </p>
          </div>
          <Link href="/schedules/new">
            <Button variant="primary">
              <Plus size={20} className="mr-2" />
              New Schedule
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming Tasks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.upcoming}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Schedules</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Schedules */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedules (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No upcoming schedules in the next 7 days</p>
                <Link href="/schedules/new">
                  <Button variant="primary" className="mt-4">
                    Create A Schedule
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <Link
                    key={schedule.id}
                    href={`/schedules/${schedule.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {schedule.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {schedule.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(parseISO(schedule.startDate), "MMM d, yyyy")} -{" "}
                          {format(parseISO(schedule.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {schedule.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

          {/* // Add this CardContent for ongoing schedules below */}
        <Card>
          <CardHeader>
            <CardTitle>Ongoing Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            {ongoingSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No ongoing schedules</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ongoingSchedules.map((schedule) => (
                  <Link
                    key={schedule.id}
                    href={`/schedules/${schedule.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {schedule.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {schedule.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(parseISO(schedule.startDate), "MMM d, yyyy")} -{" "}
                          {format(parseISO(schedule.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          schedule.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {schedule.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}

