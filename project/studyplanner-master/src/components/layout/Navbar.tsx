"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export const Navbar: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="app-header h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Image src="/logo.png" alt="Microsoft" width={36} height={36} />
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Study Planner</h1>
          <p className="text-xs text-muted-foreground text-gray-500">Personalized study schedules</p>
        </div>
      </div>

      <div>
        {session?.user ? (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={40}
                height={40}
                className="rounded-full avatar-ring"
              />
            )}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-gray-900">{session.user.name}</span>
              <span className="text-xs text-gray-500">{session.user.email}</span>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

