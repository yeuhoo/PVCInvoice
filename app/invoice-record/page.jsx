"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_OPTIONS = ["PENDING", "PAID", "OVERDUE", "CANCELLED"];

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function InvoiceRecordPage() {
  const { isSuperAdmin } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [searchInvoiceId, setSearchInvoiceId] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ status: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [filterStatus]);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await api.get("/invoice-records", { params });
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rec) => {
    setEditingId(rec.id);
    setEditData({ status: rec.status, remarks: rec.remarks || "" });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      await api.patch(`/invoice-records/${id}`, editData);
      setEditingId(null);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-PH") : "—");
  const fmt = (val) =>
    val !== null && val !== undefined
      ? Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2 })
      : "—";

  const displayed = records.filter((r) => {
    if (!searchInvoiceId) return true;
    return r.invoice?.invoiceNumber
      ?.toLowerCase()
      .includes(searchInvoiceId.toLowerCase());
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Invoice Record</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage invoice statuses and remarks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              Invoice No.:
            </label>
            <input
              type="text"
              value={searchInvoiceId}
              onChange={(e) => setSearchInvoiceId(e.target.value)}
              placeholder="Search..."
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {(filterStatus || searchInvoiceId) && (
            <button
              onClick={() => {
                setFilterStatus("");
                setSearchInvoiceId("");
              }}
              className="text-sm text-slate-400 hover:text-slate-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Loading records...
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Invoice No.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Client
                  </th>
                  {isSuperAdmin && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Broker
                    </th>
                  )}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount (Premium)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Remarks
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {fmtDate(rec.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold whitespace-nowrap">
                      {rec.invoice?.invoiceNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {rec.invoice?.client?.name || "—"}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-slate-700">
                        {rec.invoice?.broker?.name || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right text-slate-800 whitespace-nowrap">
                      ₱{fmt(rec.invoice?.premium)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {editingId === rec.id ? (
                        <select
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({ ...editData, status: e.target.value })
                          }
                          className="border border-slate-300 rounded px-2 py-1 text-xs"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0) + s.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[rec.status] || "bg-slate-100 text-slate-500"}`}
                        >
                          {rec.status.charAt(0) +
                            rec.status.slice(1).toLowerCase()}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {editingId === rec.id ? (
                        <input
                          type="text"
                          value={editData.remarks}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              remarks: e.target.value,
                            })
                          }
                          placeholder="Add remarks..."
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        <span>
                          {rec.remarks || (
                            <span className="text-slate-300 italic">
                              No remarks
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {editingId === rec.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(rec.id)}
                            disabled={saving}
                            className="text-xs text-green-600 hover:text-green-800 font-semibold"
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-slate-400 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(rec)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
