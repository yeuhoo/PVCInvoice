"use client";

import PrivateRoute from "@/components/PrivateRoute";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <PrivateRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </PrivateRoute>
  );
}
