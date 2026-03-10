"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_OPTIONS = ["PENDING", "PAID", "OVERDUE", "CANCELLED"];

const STATUS_STYLES = {
  PENDING:   "bg-amber-50 text-amber-700 border border-amber-200",
  PAID:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  OVERDUE:   "bg-red-50 text-red-600 border border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border border-slate-200",
};

const STATUS_DOT = {
  PENDING:   "bg-amber-400",
  PAID:      "bg-emerald-400",
  OVERDUE:   "bg-red-400",
  CANCELLED: "bg-slate-400",
};

export default function InvoiceRecordPage() {
  const { isSuperAdmin } = useAuth();

  // We source from /api/invoices — every invoice has a `record` field (or null)
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState(null); // invoice.id
  const [editData, setEditData] = useState({ status: "PENDING", remarks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (inv) => {
    setEditingId(inv.id);
    setEditData({
      status: inv.record?.status || "PENDING",
      remarks: inv.record?.remarks || "",
    });
  };

  const handleSave = async (inv) => {
    setSaving(true);
    try {
      if (inv.record) {
        // Update existing record
        await api.patch(`/invoice-records/${inv.record.id}`, editData);
      } else {
        // Create record for legacy invoice that has none
        await api.post("/invoice-records", {
          invoiceId: inv.id,
          ...editData,
        });
      }
      setEditingId(null);
      fetchInvoices();
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

  const displayed = invoices.filter((inv) => {
    const matchSearch = !searchQuery ||
      inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const recordStatus = inv.record?.status || "PENDING";
    const matchStatus = !filterStatus || recordStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const inputCls = "border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";

  return (
    <DashboardLayout>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Records</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and update invoice statuses and remarks</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice no. or client..."
            className={`${inputCls} w-56`}
          />

          <div className="h-5 w-px bg-slate-200" />

          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputCls}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>

          {(filterStatus || searchQuery) && (
            <button
              onClick={() => { setFilterStatus(""); setSearchQuery(""); }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">{displayed.length} invoice{displayed.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-slate-400 text-sm">Loading records...</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">No records found</p>
            <p className="text-slate-300 text-xs">Create an invoice to see it here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Invoice No.</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Company Code</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Client</th>
                  {isSuperAdmin && <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Broker</th>}
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Check Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Payroll No.</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Premium</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Claim Payment</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Employees</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Remarks</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayed.map((inv) => {
                  const status = inv.record?.status || "PENDING";
                  const remarks = inv.record?.remarks || "";
                  return (
                    <tr key={inv.id} className="hover:bg-blue-50/20 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{inv.companyCode}</td>
                      <td className="px-5 py-4 text-slate-800 font-medium whitespace-nowrap">{inv.client?.name || "—"}</td>
                      {isSuperAdmin && <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{inv.broker?.name || "—"}</td>}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap text-xs">{fmtDate(inv.checkDate)}</td>
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{inv.payrollNumber || <span className="text-slate-300">—</span>}</td>
                      <td className="px-5 py-4 text-right font-medium text-slate-800 whitespace-nowrap">₱{fmt(inv.premium)}</td>
                      <td className="px-5 py-4 text-right font-medium text-slate-800 whitespace-nowrap">₱{fmt(inv.claimPayment)}</td>
                      <td className="px-5 py-4 text-center text-slate-700">{inv.noOfEmployees ?? "—"}</td>

                      <td className="px-5 py-4 text-center">
                        {editingId === inv.id ? (
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="border border-blue-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        {editingId === inv.id ? (
                          <input
                            type="text"
                            value={editData.remarks}
                            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                            placeholder="Add remarks..."
                            className="w-full border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className={remarks ? "text-slate-700" : "text-slate-300 italic text-xs"}>
                            {remarks || "No remarks"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {editingId === inv.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSave(inv)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(inv)}
                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

