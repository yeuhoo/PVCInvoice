"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY_FORM = {
  clientName: "",
  brokerName: "",
  checkDate: "",
  payrollNumber: "",
  premium: "",
  claimPayment: "",
  noOfEmployees: "",
};

export default function InvoicePage() {
  const { isSuperAdmin } = useAuth();

  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [paymentType, setPaymentType] = useState("checkDate"); // "checkDate" or "payrollNumber"

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

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      // Validate client name
      if (!form.clientName || !form.clientName.trim()) {
        setFormError("Client name is required");
        setSubmitting(false);
        return;
      }

      // Find or create client
      let clientId;
      const existingClient = clients.find(
        (c) => c.name.toLowerCase() === form.clientName.trim().toLowerCase(),
      );
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client
        const clientRes = await api.post("/clients", {
          name: form.clientName.trim(),
        });
        clientId = clientRes.data.id;
        // Refresh clients list
        const updatedClients = await api.get("/clients");
        setClients(updatedClients.data);
      }

      // Find or create broker (if provided and super admin)
      let brokerId = undefined;
      if (isSuperAdmin && form.brokerName && form.brokerName.trim()) {
        const existingBroker = brokers.find(
          (b) => b.name.toLowerCase() === form.brokerName.trim().toLowerCase(),
        );
        if (existingBroker) {
          brokerId = existingBroker.id;
        } else {
          // Create new broker
          const brokerRes = await api.post("/brokers", {
            name: form.brokerName.trim(),
          });
          brokerId = brokerRes.data.id;
          // Refresh brokers list
          const updatedBrokers = await api.get("/brokers");
          setBrokers(updatedBrokers.data);
        }
      }

      // Create the invoice (invoice record is auto-created by the backend)
      await api.post("/invoices", {
        clientId,
        brokerId,
        checkDate: form.checkDate || undefined,
        payrollNumber: form.payrollNumber || undefined,
        premium: form.premium || "0",
        claimPayment: form.claimPayment || "0",
        noOfEmployees: form.noOfEmployees || 0,
      });

      setShowModal(false);
      setForm(EMPTY_FORM);
      setPaymentType("checkDate");
      alert("Invoice created successfully!");
    } catch (err) {
      console.error("Invoice creation error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create invoice";
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-semibold px-12 py-8 rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
        >
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add new invoice
        </button>
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
                  setForm(EMPTY_FORM);
                  setPaymentType("checkDate");
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
                {/* Client */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={form.clientName}
                    onChange={handleFormChange}
                    list="clients-list"
                    required
                    placeholder="Type or select client name..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="clients-list">
                    {clients.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                {/* Broker - super admin only */}
                {isSuperAdmin && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Broker
                    </label>
                    <input
                      type="text"
                      name="brokerName"
                      value={form.brokerName}
                      onChange={handleFormChange}
                      list="brokers-list"
                      placeholder="Type or select broker name..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="brokers-list">
                      {brokers.map((b) => (
                        <option key={b.id} value={b.name} />
                      ))}
                    </datalist>
                  </div>
                )}

                {/* Check Date / Payroll Number - Merged */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Payment Reference
                  </label>

                  {/* Radio buttons to choose type */}
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="checkDate"
                        checked={paymentType === "checkDate"}
                        onChange={(e) => {
                          setPaymentType(e.target.value);
                          setForm({ ...form, payrollNumber: "" });
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Check Date</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentType"
                        value="payrollNumber"
                        checked={paymentType === "payrollNumber"}
                        onChange={(e) => {
                          setPaymentType(e.target.value);
                          setForm({ ...form, checkDate: "" });
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        Payroll Number
                      </span>
                    </label>
                  </div>

                  {/* Conditional input based on selection */}
                  {paymentType === "checkDate" ? (
                    <input
                      type="date"
                      name="checkDate"
                      value={form.checkDate}
                      onChange={handleFormChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="text"
                      name="payrollNumber"
                      value={form.payrollNumber}
                      onChange={handleFormChange}
                      placeholder="e.g. PAY-001"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Premium */}
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

                {/* Claim Payment */}
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

                {/* No. of Employees */}
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
                Invoice Number will be auto-generated.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                    setForm(EMPTY_FORM);
                    setPaymentType("checkDate");
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
