"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMemo, useCallback } from "react";

const navItems = [
  {
    label: "Invoice",
    path: "/invoice",
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
];

export default function Sidebar() {
  const { user, logout, isSuperAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

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
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              PVC Invoice
            </p>
            <p className="text-slate-400 text-[11px] leading-tight">
              Record System
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/5 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span
                className={
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }
              >
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="mx-3 mb-4 mt-4 rounded-2xl p-3.5 bg-white/[0.04] border border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow flex-shrink-0 ${isSuperAdmin ? "bg-amber-500 text-white" : "bg-slate-600 text-slate-200"}`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">
              {user?.name}
            </p>
            <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isSuperAdmin ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-600/50 text-slate-400 border border-slate-600"}`}
          >
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
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
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
