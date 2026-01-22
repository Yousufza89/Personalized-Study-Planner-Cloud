"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Upload, User, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Schedules", href: "/schedules", icon: Calendar },
  { name: "Upload Resources", href: "/upload", icon: Upload },
  { name: "Profile", href: "/profile", icon: User },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Microsoft" width={32} height={32} />
          <h1 className="text-2xl font-bold text-gray-900">Study Planner</h1>
        </div>
        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{session.user.name}</span>
              <span className="text-xs text-gray-500 truncate" style={{ maxWidth: 160 }}>{session.user.email}</span>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-600 hover:text-white focus:ring-red-500 w-full transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

