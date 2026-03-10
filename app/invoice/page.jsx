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

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Invoice</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and view all invoices
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Invoice
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-5">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
            Filter by Client:
          </label>
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="flex-1 max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {filterClientId && (
            <button
              onClick={() => setFilterClientId("")}
              className="text-sm text-slate-400 hover:text-slate-700 underline"
            >
              Clear
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
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Invoice No.
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Company Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Client
                  </th>
                  {isSuperAdmin && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Broker
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Check Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Payroll No.
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Premium
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Claim Payment
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Employees
                  </th>
                  {isSuperAdmin && (
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {inv.companyCode}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {inv.client?.name || "—"}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-slate-700">
                        {inv.broker?.name || "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-600">
                      {fmtDate(inv.checkDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {inv.payrollNumber || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      ₱{fmt(inv.premium)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      ₱{fmt(inv.claimPayment)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingId === inv.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center"
                          />
                          <button
                            onClick={() => handleEmployeeSave(inv.id)}
                            className="text-xs text-green-600 font-semibold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-slate-400"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-slate-800">
                            {inv.noOfEmployees}
                          </span>
                          <button
                            onClick={() => {
                              setEditingId(inv.id);
                              setEditValue(inv.noOfEmployees);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-600 ml-1"
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-xs text-red-400 hover:text-red-600 font-medium"
                        >
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">New Invoice</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="clientId"
                    value={form.clientId}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Broker
                    </label>
                    <select
                      name="brokerId"
                      value={form.brokerId}
                      onChange={handleFormChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select broker...</option>
                      {brokers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Check Date
                  </label>
                  <input
                    type="date"
                    name="checkDate"
                    value={form.checkDate}
                    onChange={handleFormChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Payroll Number
                  </label>
                  <input
                    type="text"
                    name="payrollNumber"
                    value={form.payrollNumber}
                    onChange={handleFormChange}
                    placeholder="e.g. PAY-001"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Premium (₱)
                  </label>
                  <input
                    type="number"
                    name="premium"
                    value={form.premium}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Claim Payment (₱)
                  </label>
                  <input
                    type="number"
                    name="claimPayment"
                    value={form.claimPayment}
                    onChange={handleFormChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    No. of Employees
                  </label>
                  <input
                    type="number"
                    name="noOfEmployees"
                    value={form.noOfEmployees}
                    onChange={handleFormChange}
                    min="0"
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                Company Code and Invoice Number are auto-generated.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
