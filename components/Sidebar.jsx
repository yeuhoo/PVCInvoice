"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useCallback } from "react";

const navItems = [
  {
    label: "Add Client",
    path: "/add-client",
    roles: ["SUPER_ADMIN"],
    icon: (
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    ),
  },
  {
    label: "Invoice",
    path: "/invoice",
    roles: ["SUPER_ADMIN", "ADMIN"], // Only super admin and admin
    icon: (
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
  {
    label: "Invoice Record",
    path: "/invoice-record",
    roles: ["SUPER_ADMIN", "ADMIN", "BROKER"], // All roles
    icon: (
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
        />
      </svg>
    ),
  },
  {
    label: "Users",
    path: "/users",
    roles: ["SUPER_ADMIN"], // Only super admin
    icon: (
      <svg
        className="w-[18px] h-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, logout, isSuperAdmin, isAdmin, isBroker } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  // Filter nav items based on role
  const visibleNavItems = useMemo(() => {
    const userRole = user?.role;
    if (!userRole) return [];
    return navItems.filter((item) => item.roles.includes(userRole));
  }, [user?.role]);

  const initials = useMemo(() => {
    return user?.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";
  }, [user?.name]);

  return (
    <header
      className="w-full flex items-center justify-between px-6 py-3 shadow-lg border-b border-white/5"
      style={{
        background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
            <Image
              src="/images/pvclogo.jpeg"
              alt="PVC Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-semibold leading-tight">
              PVC Record System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className={isActive ? "text-white" : "text-slate-500"}>
                  {item.icon}
                </span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: User Info + Role + Logout */}
      <div className="flex items-center gap-4">
        {/* User Info */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow flex-shrink-0 ${
              isSuperAdmin
                ? "bg-amber-500 text-white"
                : isAdmin
                  ? "bg-blue-500 text-white"
                  : "bg-slate-600 text-slate-200"
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight max-w-[150px]">
              {user?.name}
            </p>
            <p className="text-slate-400 text-[11px] truncate max-w-[150px]">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <span
          className={`hidden sm:inline-block text-[10px] px-2.5 py-1 rounded-full font-semibold ${
            isSuperAdmin
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : isAdmin
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-slate-600/50 text-slate-400 border border-slate-600"
          }`}
        >
          {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Broker"}
        </span>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all duration-150"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
