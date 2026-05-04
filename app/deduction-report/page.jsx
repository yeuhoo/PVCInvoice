"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import DashboardLayout from "@/components/DashboardLayout";

const TEMPLATES = [
  {
    value: "finger-check",
    label: "Finger Check",
    description: "Deduction report based on Finger Check time records.",
  },
];

export default function DeductionReportPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [fileData, setFileData] = useState(null); // { headers, rows, fileName }
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const activeTemplate = useMemo(
    () => TEMPLATES.find((t) => t.value === selectedTemplate) || null,
    [selectedTemplate]
  );

  const parseFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      if (json.length === 0) return;

      const headers = json[0].map(String);
      const rows = json.slice(1).map((row) => {
        // Ensure every row has the same number of columns as headers
        const filled = [...row];
        while (filled.length < headers.length) filled.push("");
        return filled.map(String);
      });

      setFileData({ headers, rows, fileName: file.name });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = ""; // reset so same file can be re-uploaded
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleClearFile = () => setFileData(null);

  const handleDownload = (rows, headers) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, fileData?.fileName || "deduction-report.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto px-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Deduction Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate deduction reports from one of the available templates.
          </p>
        </div>

        {/* Template selector card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label
                  htmlFor="template"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Template
                </label>
                <div className="relative">
                  <select
                    id="template"
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      setFileData(null);
                    }}
                    className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="" disabled>
                      Select a template…
                    </option>
                    {TEMPLATES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                disabled={!activeTemplate}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
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
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload File
              </button>
            </div>
            {activeTemplate && (
              <p className="text-xs text-slate-500 mt-2">{activeTemplate.description}</p>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="mt-6">
          {!activeTemplate && (
            <div
              className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center"
            >
              <svg
                className="mx-auto w-10 h-10 text-slate-300"
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
              <p className="text-slate-500 text-sm mt-3">
                Pick a template above to start building a report.
              </p>
            </div>
          )}

          {activeTemplate && !fileData && (
            <DropZone
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={handleDrop}
              onBrowse={() => fileInputRef.current?.click()}
            />
          )}

          {activeTemplate && fileData && (
            <EditableSpreadsheet
              fileData={fileData}
              onClear={handleClearFile}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Drop Zone                                                           */
/* ------------------------------------------------------------------ */

function DropZone({ isDragging, setIsDragging, onDrop, onBrowse }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`bg-white rounded-xl border-2 border-dashed p-16 text-center transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-slate-300"
      }`}
    >
      <svg
        className="mx-auto w-12 h-12 text-slate-300 mb-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-slate-600 text-sm font-medium">
        Drag & drop your file here, or{" "}
        <button
          type="button"
          onClick={onBrowse}
          className="text-blue-600 hover:underline font-semibold"
        >
          browse
        </button>
      </p>
      <p className="text-slate-400 text-xs mt-1">Supports .xlsx, .xls, .csv</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editable Spreadsheet                                                */
/* ------------------------------------------------------------------ */

function EditableSpreadsheet({ fileData, onClear, onDownload }) {
  const [rows, setRows] = useState(fileData.rows);
  const { headers, fileName } = fileData;

  const updateCell = (rowIdx, colIdx, value) => {
    setRows((prev) => {
      const next = prev.map((r) => [...r]);
      next[rowIdx][colIdx] = value;
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, headers.map(() => "")]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-600"
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
          <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{fileName}</span>
          <span className="text-xs text-slate-400">{rows.length} rows · {headers.length} columns</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Row
          </button>
          <button
            type="button"
            onClick={() => onDownload(rows, headers)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
            </svg>
            Download
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[60vh]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {/* Row number col */}
              <th className="w-10 min-w-[40px] border-b border-r border-slate-200 px-2 py-2 text-center text-xs text-slate-400 font-medium select-none">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="group hover:bg-blue-50/40 transition-colors">
                <td className="border-b border-r border-slate-100 px-2 py-0 text-center text-xs text-slate-400 select-none bg-slate-50 group-hover:bg-blue-50/60">
                  {rIdx + 1}
                </td>
                {headers.map((_, cIdx) => (
                  <td key={cIdx} className="border-b border-r border-slate-100 p-0">
                    <input
                      type="text"
                      value={row[cIdx] ?? ""}
                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full min-w-[100px] px-3 py-2 text-sm text-slate-800 bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-1 focus:ring-inset focus:ring-blue-400 transition"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
