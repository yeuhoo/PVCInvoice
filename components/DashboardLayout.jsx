"use client";

import PrivateRoute from "@/components/PrivateRoute";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <PrivateRoute>
      <div className="flex flex-col min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </PrivateRoute>
  );
}
