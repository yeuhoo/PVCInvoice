"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN",
  linkedBrokerId: "",
};

export default function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();

  // Redirect non-super-admins
  useEffect(() => {
    if (isSuperAdmin === false) {
      router.replace("/invoice-record");
    }
  }, [isSuperAdmin, router]);

  const [users, setUsers] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch users, brokers, and admins
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
      fetchBrokers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/users");
      setUsers(response.data);
      // Filter admins for broker assignment
      setAdmins(response.data.filter((u) => u.role === "ADMIN"));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchBrokers = async () => {
    try {
      const response = await api.get("/api/brokers");
      setBrokers(response.data);
    } catch (err) {
      console.error("Error fetching brokers:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear linkedBrokerId if role is not BROKER
      if (name === "role" && value !== "BROKER") {
        updated.linkedBrokerId = "";
      }
      return updated;
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate broker role requirements
      if (formData.role === "BROKER" && !formData.linkedBrokerId) {
        setError("Please select a broker to link this user to");
        setLoading(false);
        return;
      }

      const response = await api.post("/api/users", formData);
      setSuccess(`User ${response.data.name} created successfully!`);
      setFormData(EMPTY_FORM);
      fetchUsers(); // Refresh user list
      fetchBrokers(); // Refresh broker list (to show which have users)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create user. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBrokerAssignment = async (brokerId, adminId) => {
    try {
      await api.patch("/api/brokers/assign", { brokerId, adminId });
      setSuccess("Broker assignment updated successfully!");
      fetchBrokers(); // Refresh broker list
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update broker assignment");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!isSuperAdmin) {
    return null; // Don't render anything while redirecting
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            User Management
          </h1>
          <p className="text-slate-600">Create and manage user accounts</p>
        </div>

        {/* Create User Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Create New User
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="BROKER">Broker</option>
                </select>
              </div>

              {/* Show broker selection only for BROKER role */}
              {formData.role === "BROKER" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link to Broker <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="linkedBrokerId"
                    value={formData.linkedBrokerId}
                    onChange={handleChange}
                    required={formData.role === "BROKER"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="">Select a broker</option>
                    {brokers
                      .filter(
                        (b) => !users.some((u) => u.linkedBrokerId === b.id),
                      )
                      .map((broker) => (
                        <option key={broker.id} value={broker.id}>
                          {broker.name}
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Only brokers without user accounts are shown
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>

        {/* Broker Assignment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            Assign Brokers to Admins
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Admins can only manage invoices for their assigned brokers
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Broker
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Assigned Admin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {brokers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No brokers found
                    </td>
                  </tr>
                ) : (
                  brokers.map((broker) => (
                    <tr
                      key={broker.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {broker.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {broker.managedByAdmin?.name || (
                          <span className="text-slate-400 italic">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={broker.managedByAdminId || ""}
                          onChange={(e) =>
                            handleBrokerAssignment(
                              broker.id,
                              e.target.value || null,
                            )
                          }
                          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                          <option value="">Unassign</option>
                          {admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Existing Users ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Linked To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "SUPER_ADMIN"
                              ? "bg-amber-100 text-amber-800"
                              : user.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {user.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : user.role === "ADMIN"
                              ? "Admin"
                              : "Broker"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.linkedBroker ? (
                          <div>
                            <div className="font-medium">
                              {user.linkedBroker.name}
                            </div>
                            {user.linkedBroker.managedByAdmin && (
                              <div className="text-xs text-slate-500">
                                Managed by{" "}
                                {user.linkedBroker.managedByAdmin.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
