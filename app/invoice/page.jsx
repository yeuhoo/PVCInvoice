"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FORM = {
  clientId: "",
  brokerId: "",
  checkDate: "",
  payrollNumber: "",
  premium: "",
  claimPayment: "",
  noOfEmployees: "",
};

export default function InvoicePage() {
  const { isSuperAdmin } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [filterClientId, setFilterClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    api
      .get("/clients")
      .then((r) => setClients(r.data))
      .catch(console.error);
    if (isSuperAdmin) {
      api
        .get("/brokers")
        .then((r) => setBrokers(r.data))
        .catch(console.error);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchInvoices();
  }, [filterClientId]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const params = filterClientId ? { clientId: filterClientId } : {};
      const res = await api.get("/invoices", { params });
      setInvoices(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.post("/invoices", {
        ...form,
        clientId: form.clientId || undefined,
        brokerId: form.brokerId || undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchInvoices();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeSave = async (id) => {
    try {
      await api.patch(`/invoices/${id}`, {
        noOfEmployees: parseInt(editValue),
      });
      setEditingId(null);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice?")) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const fmt = (val) =>
    val !== null && val !== undefined
      ? Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2 })
      : "—";

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-PH") : "—");

  const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white";
  const labelCls =
    "block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide";

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and view all invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/25 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Filter by Client:</label>
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {filterClientId && (
            <button
              onClick={() => setFilterClientId("")}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
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
            <span className="text-slate-400 text-sm">Loading invoices...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-slate-400 text-sm font-medium">No invoices found</p>
            <p className="text-slate-300 text-xs">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Invoice No.</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Company Code</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Client</th>
                  {isSuperAdmin && (
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Broker</th>
                  )}
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Check Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Payroll No.</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Premium</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Claim Payment</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Employees</th>
                  {isSuperAdmin && (
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/60">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{inv.companyCode}</td>
                    <td className="px-5 py-4 text-slate-800 font-medium">{inv.client?.name || "—"}</td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4 text-slate-600">{inv.broker?.name || "—"}</td>
                    )}
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{fmtDate(inv.checkDate)}</td>
                    <td className="px-5 py-4 text-slate-500">{inv.payrollNumber || <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">₱{fmt(inv.premium)}</td>
                    <td className="px-5 py-4 text-right font-medium text-slate-800">₱{fmt(inv.claimPayment)}</td>
                    <td className="px-5 py-4 text-center">
                      {editingId === inv.id ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-16 border border-blue-300 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleEmployeeSave(inv.id)}
                            className="w-6 h-6 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-slate-700 font-medium">{inv.noOfEmployees}</span>
                          <button
                            onClick={() => { setEditingId(inv.id); setEditValue(inv.noOfEmployees); }}
                            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Invoice</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details to create an invoice</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setFormError(""); }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Client <span className="text-red-500 normal-case font-normal">*</span></label>
                    <select name="clientId" value={form.clientId} onChange={handleFormChange} required className={inputCls}>
                      <option value="">Select client...</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {isSuperAdmin && (
                    <div className="col-span-2">
                      <label className={labelCls}>Broker</label>
                      <select name="brokerId" value={form.brokerId} onChange={handleFormChange} className={inputCls}>
                        <option value="">Select broker...</option>
                        {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Check Date</label>
                    <input type="date" name="checkDate" value={form.checkDate} onChange={handleFormChange} className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Payroll Number</label>
                    <input type="text" name="payrollNumber" value={form.payrollNumber} onChange={handleFormChange} placeholder="e.g. PAY-001" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Premium (₱)</label>
                    <input type="number" name="premium" value={form.premium} onChange={handleFormChange} min="0" step="0.01" placeholder="0.00" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Claim Payment (₱)</label>
                    <input type="number" name="claimPayment" value={form.claimPayment} onChange={handleFormChange} min="0" step="0.01" placeholder="0.00" className={inputCls} />
                  </div>

                  <div className="col-span-2">
                    <label className={labelCls}>No. of Employees</label>
                    <input type="number" name="noOfEmployees" value={form.noOfEmployees} onChange={handleFormChange} min="0" placeholder="0" className={inputCls} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                  Company Code and Invoice Number are auto-generated.
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setFormError(""); }}
                    className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                  >
                    {submitting ? "Creating..." : "Create Invoice"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
