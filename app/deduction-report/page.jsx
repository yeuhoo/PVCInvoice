"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SpreadsheetGrid from "@/components/SpreadsheetGrid";
import api from "@/lib/api";

/* ─── constants ──────────────────────────────────────────────────────────── */
const FINGER_CHECK_HEADERS = [
  "EmployeeNum", "DedCode", "StartDate", "EndDate",
  "Rate", "Amount", "PayeeReference", "GoalAmount",
];
const FINGER_CHECK_COL_WIDTHS = [140, 130, 110, 110, 90, 100, 150, 120];

const TEMPLATES = [
  { value: "finger-check", label: "Finger Check" },
];

/* ─── helpers ────────────────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function StatusBadge({ status }) {
  const isDraft = status === "DRAFT";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      background: isDraft ? "#fef9c3" : "#dcfce7",
      color:      isDraft ? "#854d0e" : "#166534",
      border:     `1px solid ${isDraft ? "#fde68a" : "#bbf7d0"}`,
    }}>
      {status}
    </span>
  );
}

/* ─── main page ──────────────────────────────────────────────────────────── */
export default function DeductionReportPage() {
  // "list" | "create" | "edit"
  const [view, setView] = useState("list");

  /* ── list state ── */
  const [reports,      setReports]     = useState([]);
  const [listLoading,  setListLoading] = useState(true);
  const [listError,    setListError]   = useState("");

  /* ── create state ── */
  const [clients,         setClients]         = useState([]);
  const [selectedClient,  setSelectedClient]  = useState("");
  const [selectedTemplate,setSelectedTemplate]= useState("");
  const [reportTitle,     setReportTitle]     = useState("");
  const [creating,        setCreating]        = useState(false);
  const [createError,     setCreateError]     = useState("");

  /* ── edit state ── */
  const [activeReport,  setActiveReport]  = useState(null); // full report obj
  const [editLoading,   setEditLoading]   = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [saveMsg,       setSaveMsg]       = useState("");   // feedback toast

  /* ── fetch reports list ── */
  const fetchReports = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await api.get("/deduction-report/reports");
      setReports(res.data);
    } catch (err) {
      setListError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "list") fetchReports();
  }, [view, fetchReports]);

  /* ── fetch clients for create form ── */
  useEffect(() => {
    if (view === "create" && clients.length === 0) {
      api.get("/clients").then(r => setClients(r.data)).catch(() => {});
    }
  }, [view, clients.length]);

  /* ── create new report ── */
  const handleCreate = async () => {
    if (!selectedClient || !selectedTemplate) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await api.post("/deduction-report/reports", {
        clientId:  parseInt(selectedClient),
        template:  selectedTemplate,
        title:     reportTitle.trim() || null,
        rows:      [],
      });
      await openReport(res.data.id);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create report");
      setCreating(false);
    }
  };

  /* ── open an existing report for editing ── */
  const openReport = async (id) => {
    setEditLoading(true);
    setView("edit");
    try {
      const res = await api.get(`/deduction-report/reports/${id}`);
      setActiveReport(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load report");
      setView("list");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── save rows to DB ── */
  const handleSave = async (rows2D) => {
    if (!activeReport) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const nonEmpty = rows2D.filter(r => r.some(c => String(c).trim() !== ""));
      const res = await api.put(`/deduction-report/reports/${activeReport.id}`, {
        rows:  nonEmpty,
        title: activeReport.title,
      });
      setActiveReport(res.data);
      setSaveMsg("Saved ✓");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── submit report ── */
  const handleSubmit = async (rows2D) => {
    if (!activeReport) return;
    const ok = window.confirm(
      "Submit this report? It will be locked for editing."
    );
    if (!ok) return;
    setIsSubmitting(true);
    setSaveMsg("");
    try {
      // Save rows first, then change status
      const nonEmpty = rows2D.filter(r => r.some(c => String(c).trim() !== ""));
      await api.put(`/deduction-report/reports/${activeReport.id}`, {
        rows:  nonEmpty,
        title: activeReport.title,
      });
      const res = await api.patch(`/deduction-report/reports/${activeReport.id}`, {
        status: "SUBMITTED",
      });
      setActiveReport(prev => ({ ...prev, status: res.data.status }));
      setSaveMsg("Submitted ✓");
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── headers / widths for active template ── */
  const { headers, colWidths } = useMemo(() => {
    const tpl = activeReport?.template || selectedTemplate;
    if (tpl === "finger-check") {
      return { headers: FINGER_CHECK_HEADERS, colWidths: FINGER_CHECK_COL_WIDTHS };
    }
    return { headers: FINGER_CHECK_HEADERS, colWidths: FINGER_CHECK_COL_WIDTHS };
  }, [activeReport, selectedTemplate]);

  /* ── rows loaded from DB ── */
  const initialRows = useMemo(() => {
    if (!activeReport?.rows?.length) return null;
    return activeReport.rows.map(r => [
      r.employeeNum, r.dedCode, r.startDate, r.endDate,
      r.rate, r.amount, r.payeeReference, r.goalAmount,
    ]);
  }, [activeReport]);

  /* ─── render ──────────────────────────────────────────────────────────── */
  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-1">

        {/* ── Page header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deduction Report</h1>
            <p className="text-sm text-slate-500 mt-1">
              {view === "list"   && "All saved deduction reports"}
              {view === "create" && "New deduction report"}
              {view === "edit"   && activeReport && (
                <>
                  <button
                    onClick={() => { setView("list"); setActiveReport(null); }}
                    className="text-blue-600 hover:underline"
                  >
                    Reports
                  </button>
                  {" › "}
                  {activeReport.title || `Report #${activeReport.id}`}
                  {" — "}
                  {activeReport.client?.name}
                </>
              )}
            </p>
          </div>

          {view === "list" && (
            <button
              onClick={() => {
                setSelectedClient(""); setSelectedTemplate("");
                setReportTitle(""); setCreateError("");
                setView("create");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm font-medium rounded-lg hover:bg-[#163055] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Report
            </button>
          )}

          {view === "create" && (
            <button
              onClick={() => setView("list")}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back
            </button>
          )}

          {view === "edit" && (
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className="text-sm font-medium text-green-700">{saveMsg}</span>
              )}
              <button
                onClick={() => { setView("list"); setActiveReport(null); setSaveMsg(""); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Back to list
              </button>
            </div>
          )}
        </div>

        {/* ════════════════════ LIST VIEW ═════════════════════════════════ */}
        {view === "list" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {listLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Loading reports…</div>
            ) : listError ? (
              <div className="p-12 text-center text-red-500 text-sm">{listError}</div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="mx-auto w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-sm">No reports yet. Create one to get started.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Title / ID</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Client</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Template</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Rows</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Last Updated</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-600">Created By</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => openReport(r.id)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {r.title || `Report #${r.id}`}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.client?.name}</td>
                      <td className="px-5 py-3 text-slate-500 capitalize">{r.template}</td>
                      <td className="px-5 py-3 text-slate-500">{r._count?.rows ?? 0}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(r.updatedAt)}</td>
                      <td className="px-5 py-3 text-slate-500">{r.createdBy?.name}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-blue-600 text-xs font-medium hover:underline">Open →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════════════ CREATE VIEW ═══════════════════════════════ */}
        {view === "create" && (
          <div className="max-w-lg">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClient}
                  onChange={e => setSelectedClient(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Template <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a template…</option>
                  {TEMPLATES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Optional title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder="e.g. May 2026 Finger Check"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {createError && (
                <p className="text-red-600 text-sm">{createError}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={!selectedClient || !selectedTemplate || creating}
                className="w-full py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#163055] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {creating ? "Creating…" : "Create Report"}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ EDIT VIEW ═════════════════════════════════ */}
        {view === "edit" && (
          <div>
            {editLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Loading report…
              </div>
            ) : activeReport ? (
              <>
                {/* Report meta bar */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-3 mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span><span className="font-medium">Client:</span> {activeReport.client?.name}</span>
                  <span><span className="font-medium">Template:</span> {activeReport.template}</span>
                  <span><span className="font-medium">Created by:</span> {activeReport.createdBy?.name}</span>
                  <span><span className="font-medium">Last saved:</span> {fmtDate(activeReport.updatedAt)}</span>
                  <StatusBadge status={activeReport.status} />
                </div>

                {activeReport.status === "SUBMITTED" && (
                  <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    This report has been submitted and is read-only.
                  </div>
                )}

                <SpreadsheetGrid
                  headers={headers}
                  colWidths={colWidths}
                  initialRows={initialRows}
                  onSave={activeReport.status === "SUBMITTED" ? null : handleSave}
                  isSaving={isSaving}
                  onSubmit={activeReport.status === "DRAFT" ? handleSubmit : null}
                  isSubmitting={isSubmitting}
                  reportStatus={activeReport.status}
                />
              </>
            ) : null}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
