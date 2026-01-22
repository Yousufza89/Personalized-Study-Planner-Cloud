"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { User, Mail, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                {session.user.image && (
                  <div className="w-24 h-24 rounded-full overflow-hidden avatar-ring">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {session.user.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{session.user.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">
                      {session.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <Button
                  variant="danger"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

