"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { InvoicePDF } from "@/components/InvoicePDF";

const STATUS_OPTIONS = ["Weekly", "Biweekly", "Monthly"];

const STATUS_STYLES = {
  Weekly:
    "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-200",
  Biweekly:
    "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-200",
  Monthly:
    "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200",
};

const STATUS_DOT = {
  Weekly: "bg-blue-300",
  Biweekly: "bg-purple-300",
  Monthly: "bg-emerald-300",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "ReceivedPayment", label: "Received Payment" },
  { value: "InvoiceReady", label: "Invoice Ready" },
  { value: "BilledAlready", label: "Billed Already" },
  { value: "InvoiceSent", label: "Invoice Sent" },
  { value: "InitialBilling", label: "Initial Billing" },
  { value: "SampleOnly", label: "Sample Only" },
  { value: "Cancel", label: "Cancel" },
  { value: "ACH", label: "ACH" },
  { value: "CancelAndIssueNew", label: "Cancel & Issue New" },
  { value: "PleaseBill", label: "Please Bill" },
  { value: "ACHReturn", label: "ACH Return" },
  {
    value: "BilledNeedsMonthlyStatement",
    label: "Billed Needs Monthly Statement",
  },
  { value: "BilledButDidntCharge", label: "Billed but didn't Charge" },
  { value: "FCACH", label: "F C ACH" },
  { value: "CreditCard", label: "Credit Card" },
];

const PAYMENT_STATUS_STYLES = {
  ReceivedPayment:
    "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm",
  InvoiceReady: "bg-sky-100 text-sky-800 border border-sky-300 shadow-sm",
  BilledAlready:
    "bg-purple-100 text-purple-800 border border-purple-300 shadow-sm",
  InvoiceSent: "bg-cyan-100 text-cyan-800 border border-cyan-300 shadow-sm",
  InitialBilling:
    "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm",
  SampleOnly: "bg-gray-100 text-gray-800 border border-gray-300 shadow-sm",
  Cancel: "bg-red-100 text-red-800 border border-red-300 shadow-sm",
  ACH: "bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm",
  CancelAndIssueNew:
    "bg-orange-100 text-orange-800 border border-orange-300 shadow-sm",
  PleaseBill: "bg-pink-100 text-pink-800 border border-pink-300 shadow-sm",
  ACHReturn: "bg-rose-100 text-rose-800 border border-rose-300 shadow-sm",
  BilledNeedsMonthlyStatement:
    "bg-violet-100 text-violet-800 border border-violet-300 shadow-sm",
  BilledButDidntCharge:
    "bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm",
  FCACH: "bg-teal-100 text-teal-800 border border-teal-300 shadow-sm",
  CreditCard: "bg-lime-100 text-lime-800 border border-lime-300 shadow-sm",
};

export default function InvoiceRecordPage() {
  const { isSuperAdmin, isAdmin, isBroker } = useAuth();

  // We source from /api/invoices — every invoice has a `record` field (or null)
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // Date range filter

  const [editingId, setEditingId] = useState(null); // invoice.id
  const [editData, setEditData] = useState({
    status: "Weekly",
    paymentStatus: null,
    remarks: "",
  });
  const [saving, setSaving] = useState(false);

  // PDF Preview states
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Optimized: Debounce search input to reduce filtering operations
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Generate date range options based on billing type
  const getDateRangeOptions = useCallback(() => {
    const now = new Date();
    const options = [];

    if (filterStatus === "Weekly") {
      // Generate weekly ranges for past 8 weeks
      for (let i = 0; i < 8; i++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - i * 7);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);

        options.push({
          value: `${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`,
          label: `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        });
      }
    } else if (filterStatus === "Biweekly") {
      // Generate biweekly ranges for past 8 periods (16 weeks)
      for (let i = 0; i < 8; i++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - i * 14);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 13);

        options.push({
          value: `${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`,
          label: `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        });
      }
    } else if (filterStatus === "Monthly") {
      // Generate monthly ranges for past 12 months
      for (let i = 0; i < 12; i++) {
        const year = now.getFullYear();
        const month = now.getMonth() - i;
        const date = new Date(year, month, 1);
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        options.push({
          value: `${startDate.toISOString().split("T")[0]}_${endDate.toISOString().split("T")[0]}`,
          label: startDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        });
      }
    }

    return options;
  }, [filterStatus]);

  // Reset date filter when billing status changes
  useEffect(() => {
    setDateFilter("");
  }, [filterStatus]);

  // Optimized: Use useCallback to prevent unnecessary re-renders
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch with higher limit for better UX - still faster than before due to API optimization
      const res = await api.get("/invoices?limit=200");
      setInvoices(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimized: Memoize filtered data to avoid recalculating on every render
  const displayed = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !debouncedSearch ||
        inv.invoiceNumber
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        inv.client?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const recordStatus = inv.record?.status || "Weekly";
      const matchStatus = !filterStatus || recordStatus === filterStatus;

      // Date range filter
      let matchDate = true;
      if (dateFilter) {
        const [startStr, endStr] = dateFilter.split("_");
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        endDate.setHours(23, 59, 59, 999); // Include full end date

        const invDate = inv.checkDate
          ? new Date(inv.checkDate)
          : inv.createdAt
            ? new Date(inv.createdAt)
            : null;
        if (invDate) {
          matchDate = invDate >= startDate && invDate <= endDate;
        } else {
          matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [invoices, debouncedSearch, filterStatus, dateFilter]);

  // Optimized: Memoize stats calculations to avoid recalculating on every render
  const stats = useMemo(() => {
    return {
      total: displayed.length,
      weekly: displayed.filter((inv) => inv.record?.status === "Weekly").length,
      biweekly: displayed.filter((inv) => inv.record?.status === "Biweekly")
        .length,
      monthly: displayed.filter((inv) => inv.record?.status === "Monthly")
        .length,
      grandTotal: displayed.reduce(
        (sum, inv) => sum + parseFloat(inv.premium || 0),
        0,
      ),
    };
  }, [displayed]);

  // Optimized: Use useCallback for event handlers
  const startEdit = useCallback((inv) => {
    setEditingId(inv.id);
    setEditData({
      status: inv.record?.status || "Weekly",
      paymentStatus: inv.record?.paymentStatus || null,
      remarks: inv.record?.remarks || "",
      employeeRate: inv.employeeRate || "7.50",
    });
  }, []);

  // Optimized: Optimistic UI update for better perceived performance
  const handleSave = useCallback(
    async (inv) => {
      setSaving(true);
      const previousInvoices = invoices;

      try {
        // Optimistic update
        setInvoices((prevInvoices) =>
          prevInvoices.map((i) =>
            i.id === inv.id
              ? {
                  ...i,
                  employeeRate: editData.employeeRate,
                  record: {
                    ...i.record,
                    status: editData.status,
                    paymentStatus: editData.paymentStatus,
                    remarks: editData.remarks,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : i,
          ),
        );
        setEditingId(null);

        // Update invoice record (billing status, payment status, remarks)
        if (inv.record) {
          await api.patch(`/invoice-records/${inv.record.id}`, {
            status: editData.status,
            paymentStatus: editData.paymentStatus,
            remarks: editData.remarks,
          });
        } else {
          await api.post("/invoice-records", {
            invoiceId: inv.id,
            status: editData.status,
            paymentStatus: editData.paymentStatus,
            remarks: editData.remarks,
          });
        }

        // Update invoice (employee rate)
        await api.patch(`/invoices/${inv.id}`, {
          employeeRate: editData.employeeRate,
        });

        // Refresh to get accurate data from server
        await fetchInvoices();
      } catch (err) {
        // Rollback on error
        setInvoices(previousInvoices);
        setEditingId(inv.id);
        alert(err.response?.data?.message || "Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [editData, invoices, fetchInvoices],
  );

  // Optimized: Optimistic delete for better UX
  const handleDelete = useCallback(
    async (inv) => {
      if (!inv.record) return;

      // Only super admin and admin can delete (brokers cannot)
      if (!isSuperAdmin && !isAdmin) {
        alert("You do not have permission to delete invoices");
        return;
      }

      if (
        !confirm(
          `Delete invoice ${inv.invoiceNumber} and its records? This cannot be undone.`,
        )
      ) {
        return;
      }

      const previousInvoices = invoices;

      try {
        // Optimistic delete
        setInvoices((prevInvoices) =>
          prevInvoices.filter((i) => i.id !== inv.id),
        );

        await api.delete(`/invoices/${inv.id}`);

        // Refresh to ensure consistency
        await fetchInvoices();
      } catch (err) {
        // Rollback on error
        setInvoices(previousInvoices);
        alert(err.response?.data?.message || "Failed to delete invoice");
      }
    },
    [invoices, fetchInvoices, isSuperAdmin],
  );

  // Optimized: Memoize formatting functions
  const fmtDate = useCallback(
    (d) => (d ? new Date(d).toLocaleDateString("en-PH") : "—"),
    [],
  );
  const fmt = useCallback(
    (val) =>
      val !== null && val !== undefined
        ? Number(val).toLocaleString("en-PH", { minimumFractionDigits: 2 })
        : "—",
    [],
  );

  // PDF handling functions
  const handlePreviewPDF = useCallback(async (invoice) => {
    console.log("handlePreviewPDF - invoice object:", invoice);
    console.log("handlePreviewPDF - employeeRate:", invoice.employeeRate);

    setGeneratingPdf(true);
    setPreviewInvoice(invoice);
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF preview");
      setPreviewInvoice(null);
    } finally {
      setGeneratingPdf(false);
    }
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    if (!previewInvoice) return;
    try {
      const blob = await pdf(<InvoicePDF invoice={previewInvoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${previewInvoice.invoiceNumber || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF");
    }
  }, [previewInvoice]);

  const closePreview = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPreviewInvoice(null);
    setPdfUrl(null);
  }, [pdfUrl]);

  return (
    <DashboardLayout>
      {/* Modern Header with Gradient */}
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
                Invoice Records
              </h1>
              <p className="text-slate-600 text-sm flex items-center gap-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Manage and track all invoice records with real-time status
                updates
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {stats.total}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Total Invoices
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-200">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {stats.weekly}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Weekly Billing
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-200">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {stats.biweekly}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Biweekly Billing
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                {stats.monthly}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Monthly Billing
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg shadow-slate-300">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-1">
                ${fmt(stats.grandTotal)}
              </p>
              <p className="text-xs text-slate-500 font-medium">Grand Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number or client name..."
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-12 pr-10 py-3 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Billing Cycles</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Filter - Shows when billing status is selected */}
            {filterStatus && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-12 pr-10 py-3 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer min-w-[220px]"
                >
                  <option value="">All {filterStatus} Periods</option>
                  {getDateRangeOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(filterStatus || searchQuery || dateFilter) && (
              <button
                onClick={() => {
                  setFilterStatus("");
                  setSearchQuery("");
                  setDateFilter("");
                }}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus("")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              !filterStatus
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus("Weekly")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "Weekly"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            Weekly ({stats.weekly})
          </button>
          <button
            onClick={() => setFilterStatus("Biweekly")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "Biweekly"
                ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                : "bg-purple-50 text-purple-600 hover:bg-purple-100"
            }`}
          >
            Biweekly ({stats.biweekly})
          </button>
          <button
            onClick={() => setFilterStatus("Monthly")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "Monthly"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            }`}
          >
            Monthly ({stats.monthly})
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 text-sm rounded-2xl border border-red-200 shadow-sm">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg
              className="w-5 h-5 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold mb-1">Error Loading Records</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Modern Table Container */}
      <div className="bg-white rounded-2xl shadow-xl  border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {/* Skeleton Header */}
            <div className="flex gap-4 mb-6">
              <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
              <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
              <div className="h-10 bg-slate-200 rounded-lg w-32 ml-auto"></div>
            </div>
            {/* Skeleton Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
            {/* Skeleton Table Rows */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-50 rounded-lg flex items-center gap-4 px-4"
                >
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                  <div className="h-8 w-40 bg-slate-200 rounded"></div>
                  <div className="h-8 w-32 bg-slate-200 rounded"></div>
                  <div className="h-8 w-20 bg-slate-200 rounded ml-auto"></div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-8">
              Loading invoice records...
            </p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl">
              <svg
                className="w-20 h-20 text-slate-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold text-lg">
              No invoices found
            </p>
            <p className="text-slate-400 text-sm max-w-md text-center">
              {searchQuery || filterStatus
                ? "Try adjusting your search filters to find what you're looking for"
                : "Create your first invoice to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Invoice No.
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Client
                  </th>
                  {isSuperAdmin && (
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                      Broker
                    </th>
                  )}
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Check Date/Payroll
                  </th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Emp.
                  </th>
                  <th className="text-right px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Total Premium
                  </th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Billing
                  </th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Payment
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Remarks
                  </th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Updated By
                  </th>
                  <th className="text-center px-2 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((inv) => {
                  const status = inv.record?.status || "Weekly";
                  const paymentStatus = inv.record?.paymentStatus;
                  const remarks = inv.record?.remarks || "";
                  const paymentStatusLabel = paymentStatus
                    ? PAYMENT_STATUS_OPTIONS.find(
                        (p) => p.value === paymentStatus,
                      )?.label
                    : null;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-all duration-200 group"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 bg-blue-50 rounded">
                            <svg
                              className="w-3 h-3 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {inv.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-semibold text-slate-800">
                          {inv.client?.name || "—"}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-3 py-3">
                          <span className="text-xs text-slate-600">
                            {inv.broker?.name || (
                              <span className="text-slate-300">—</span>
                            )}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-slate-600">
                          {inv.checkDate
                            ? fmtDate(inv.checkDate)
                            : inv.payrollNumber || (
                                <span className="text-slate-300">—</span>
                              )}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs">
                          {inv.noOfEmployees ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-900">
                          ${fmt(inv.claimPayment)}
                        </span>
                      </td>

                      <td className="px-2 py-3 text-center">
                        {editingId === inv.id ? (
                          <select
                            value={editData.status}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                status: e.target.value,
                              })
                            }
                            className="border-2 border-blue-400 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLES[status]}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`}
                            />
                            {status}
                          </span>
                        )}
                      </td>

                      <td className="px-2 py-3 text-center">
                        {editingId === inv.id ? (
                          <select
                            value={editData.paymentStatus || ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                paymentStatus: e.target.value || null,
                              })
                            }
                            className="border-2 border-blue-400 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm min-w-[140px]"
                          >
                            <option value="">— None —</option>
                            {PAYMENT_STATUS_OPTIONS.map((ps) => (
                              <option key={ps.value} value={ps.value}>
                                {ps.label}
                              </option>
                            ))}
                          </select>
                        ) : paymentStatus ? (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold ${PAYMENT_STATUS_STYLES[paymentStatus]}`}
                          >
                            {paymentStatusLabel}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-[10px] font-medium">
                            Not set
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 max-w-[180px]">
                        {editingId === inv.id ? (
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
                            className="w-full border-2 border-blue-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                          />
                        ) : (
                          <span
                            className={
                              remarks
                                ? "text-xs text-slate-700 line-clamp-2"
                                : "text-slate-300 italic text-[10px]"
                            }
                          >
                            {remarks || "No remarks"}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {(inv.record?.updatedBy?.name ||
                              inv.record?.createdBy?.name ||
                              "?")[0]?.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700">
                              {inv.record?.updatedBy?.name ||
                                inv.record?.createdBy?.name ||
                                "—"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {inv.record?.updatedAt
                                ? fmtDate(inv.record.updatedAt)
                                : inv.record?.createdAt
                                  ? fmtDate(inv.record.createdAt)
                                  : "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        {editingId === inv.id ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSave(inv)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePreviewPDF(inv)}
                              disabled={generatingPdf}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              PDF
                            </button>
                            <button
                              onClick={() => startEdit(inv)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-all shadow-sm hover:shadow"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                              Edit
                            </button>
                            {(isSuperAdmin || isAdmin) && (
                              <button
                                onClick={() => handleDelete(inv)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg transition-all shadow-sm hover:shadow"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
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

      {/* PDF Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Invoice Preview
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Invoice #{previewInvoice.invoiceNumber} -{" "}
                  {previewInvoice.client?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={closePreview}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-slate-100 p-6">
              {generatingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">
                      Generating PDF...
                    </p>
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[600px] rounded-xl shadow-lg bg-white"
                  title="Invoice PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Failed to load PDF preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
