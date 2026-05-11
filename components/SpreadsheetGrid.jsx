"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

const ROW_H        = 22;
const HDR_ROWS_H   = 44; // col-letter row (22) + field-name row (22)
const ROW_NUM_W    = 52;
const BUFFER       = 6;   // extra rows to render above/below viewport
const UNDO_LIMIT   = 50;
const CONTAINER_H  = 520;

function colLetter(i) {
  return String.fromCharCode(65 + i);
}

function norm(sel) {
  return {
    r0: Math.min(sel.r0, sel.r1),
    c0: Math.min(sel.c0, sel.c1),
    r1: Math.max(sel.r0, sel.r1),
    c1: Math.max(sel.c0, sel.c1),
  };
}

/* ─── Validation ──────────────────────────────────────────────────────────
 * Rule: any row where DedCode (col 1) = "PVC Claim" must have a negative
 * Amount (col 5).  Returns an array of 1-based row numbers that fail.
 */
function parseAmountValue(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return NaN;
  // Normalize different dash characters (en-dash, em-dash) to hyphen-minus
  s = s.replace(/[–—−]/g, "-");
  // Handle accounting / parenthesis format: (348) or (348.00) → -348
  s = s.replace(/^\((.+)\)$/, "-$1");
  // Strip currency symbols, commas, spaces
  s = s.replace(/[$£€¥,\s]/g, "");
  return parseFloat(s);
}

function normalizeDedCode(raw) {
  return String(raw ?? "")
    .trim()
    // collapse all whitespace (including non-breaking spaces) to single space
    .replace(/[\s ​]+/g, " ")
    .toLowerCase();
}

function validatePvcClaim(rows2D) {
  const bad = [];
  rows2D.forEach((row, i) => {
    const dedCode = normalizeDedCode(row[1]);
    if (dedCode === "pvc claim") {
      const num = parseAmountValue(row[5]);
      // Must be a real negative number
      if (isNaN(num) || num >= 0) {
        bad.push(i + 1); // 1-based row number for the user
      }
    }
  });
  return bad;
}

function padRows(rows2D, COLS) {
  const n = Math.max(100, rows2D.length + 20);
  const out = Array.from({ length: n }, () => Array(COLS).fill(""));
  rows2D.forEach((row, r) => {
    for (let c = 0; c < COLS; c++) out[r][c] = String(row[c] ?? "");
  });
  return out;
}

/* ─── SpreadsheetGrid ─────────────────────────────────────────────────── */
export default function SpreadsheetGrid({
  headers,
  colWidths,
  onDataChange,
  // persistence props
  initialRows,        // 2-D array pre-loaded from DB
  onSave,             // async (rows2D) => void — called by Save button
  isSaving,           // bool — shows spinner on Save button
  onSubmit,           // async (rows2D) => void — called by Submit button
  isSubmitting,       // bool
  reportStatus,       // "DRAFT" | "SUBMITTED" | null
}) {
  const COLS = headers.length;
  const makeEmptyRows = (n = 100) =>
    Array.from({ length: n }, () => Array(COLS).fill(""));

  const [rows,     setRows]     = useState(() =>
    initialRows?.length ? padRows(initialRows, COLS) : makeEmptyRows(100)
  );
  const [sel,      setSel]      = useState({ r0: 0, c0: 0, r1: 0, c1: 0 });
  const [editCell, setEditCell] = useState(null); // { r, c }
  const [editVal,  setEditVal]  = useState("");
  const [scrollTop,setScrollTop]= useState(0);
  const [undoStack,setUndoStack]= useState([]);
  const [redoStack,setRedoStack]= useState([]);
  const [fileName, setFileName] = useState(null);

  // Reload grid when initialRows changes (e.g. switching between reports)
  const prevInitialRef = useRef(initialRows);
  useEffect(() => {
    if (initialRows && initialRows !== prevInitialRef.current) {
      prevInitialRef.current = initialRows;
      setRows(padRows(initialRows, COLS));
      setUndoStack([]); setRedoStack([]);
      setSel({ r0: 0, c0: 0, r1: 0, c1: 0 });
    }
  }, [initialRows, COLS]);

  const containerRef = useRef(null);
  const editInputRef  = useRef(null);
  const dragging      = useRef(false);

  /* ── data helpers ── */
  const updateRows = useCallback((fn) => {
    setRows(prev => {
      const next = fn(prev);
      onDataChange?.(next);
      return next;
    });
  }, [onDataChange]);

  const pushUndo = useCallback((snapshot) => {
    setUndoStack(s => [...s.slice(-UNDO_LIMIT + 1), snapshot]);
    setRedoStack([]);
  }, []);

  /* ── load from file ── */
  const loadData = useCallback((parsed, name) => {
    const next = makeEmptyRows(Math.max(100, parsed.length + 20));
    parsed.forEach((row, r) => {
      headers.forEach((_, c) => { next[r][c] = String(row[c] ?? ""); });
    });
    setRows(next);
    setFileName(name);
    setUndoStack([]);
    setRedoStack([]);
    setSel({ r0: 0, c0: 0, r1: 0, c1: 0 });
  }, [headers]);

  /* ── selection ── */
  const n = useMemo(() => norm(sel), [sel]);

  const inSel = (r, c) => r >= n.r0 && r <= n.r1 && c >= n.c0 && c <= n.c1;
  const isAnchor = (r, c) => r === sel.r0 && c === sel.c0;

  /* ── edit commit ── */
  const commitEdit = useCallback(() => {
    if (!editCell) return;
    const { r, c } = editCell;
    updateRows(prev => {
      pushUndo(prev);
      const next = prev.map(row => [...row]);
      next[r][c] = editVal;
      return next;
    });
    setEditCell(null);
    setEditVal("");
  }, [editCell, editVal, updateRows, pushUndo]);

  /* ── start edit ── */
  const startEdit = useCallback((r, c, initial = null) => {
    if (editCell) commitEdit();
    const val = initial !== null ? initial : (rows[r]?.[c] ?? "");
    setEditCell({ r, c });
    setEditVal(val);
    setSel({ r0: r, c0: c, r1: r, c1: c });
    setTimeout(() => {
      editInputRef.current?.focus();
      if (initial === null) editInputRef.current?.select();
    }, 0);
  }, [editCell, commitEdit, rows]);

  /* ── scroll cell into view ── */
  const scrollToRow = useCallback((r) => {
    const el = containerRef.current;
    if (!el) return;
    const top    = r * ROW_H;
    const bottom = top + ROW_H;
    const vTop   = el.scrollTop;
    const vBot   = el.scrollTop + CONTAINER_H - HDR_ROWS_H;
    if (top    < vTop) el.scrollTop = top;
    else if (bottom > vBot) el.scrollTop = bottom - (CONTAINER_H - HDR_ROWS_H);
  }, []);

  /* ── mouse ── */
  const onCellMouseDown = useCallback((e, r, c) => {
    if (e.button !== 0) return;
    if (editCell && (editCell.r !== r || editCell.c !== c)) commitEdit();
    dragging.current = true;
    if (e.shiftKey) setSel(s => ({ ...s, r1: r, c1: c }));
    else            setSel({ r0: r, c0: c, r1: r, c1: c });
    containerRef.current?.focus();
    e.preventDefault();
  }, [editCell, commitEdit]);

  const onCellMouseEnter = useCallback((r, c) => {
    if (dragging.current) setSel(s => ({ ...s, r1: r, c1: c }));
  }, []);

  const onCellDblClick = useCallback((r, c) => startEdit(r, c), [startEdit]);

  useEffect(() => {
    const up = () => { dragging.current = false; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  /* ── copy / paste ── */
  const copySelection = useCallback(() => {
    const tsv = rows
      .slice(n.r0, n.r1 + 1)
      .map(row => row.slice(n.c0, n.c1 + 1).join("\t"))
      .join("\n");
    navigator.clipboard.writeText(tsv).catch(() => {});
  }, [rows, n]);

  const pasteClipboard = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      const pRows = text
        .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        .split("\n")
        .filter(r => r.length > 0)
        .map(r => r.split("\t"));
      const { r0, c0 } = n;
      updateRows(prev => {
        pushUndo(prev);
        const next = prev.map(r => [...r]);
        // expand rows if paste exceeds current length
        const needed = r0 + pRows.length;
        while (next.length < needed) next.push(Array(COLS).fill(""));
        pRows.forEach((pRow, dr) => {
          pRow.forEach((val, dc) => {
            const c = c0 + dc;
            if (c < COLS) next[r0 + dr][c] = val;
          });
        });
        return next;
      });
      setSel({
        r0: r0, c0: c0,
        r1: r0 + pRows.length - 1,
        c1: Math.min(COLS - 1, c0 + (pRows[0]?.length || 1) - 1),
      });
    }).catch(() => {});
  }, [n, updateRows, pushUndo, COLS]);

  /* ── undo / redo ── */
  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (!prev.length) return prev;
      const snapshot = prev[prev.length - 1];
      setRedoStack(r => [rows, ...r.slice(0, UNDO_LIMIT - 1)]);
      setRows(snapshot);
      return prev.slice(0, -1);
    });
  }, [rows]);

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (!prev.length) return prev;
      const snapshot = prev[0];
      setUndoStack(u => [...u.slice(-UNDO_LIMIT + 1), rows]);
      setRows(snapshot);
      return prev.slice(1);
    });
  }, [rows]);

  /* ── keyboard (on container) ── */
  const onKeyDown = useCallback((e) => {
    if (editCell) return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redo(); return; }
    if (ctrl && e.key === "c") { e.preventDefault(); copySelection(); return; }
    if (ctrl && e.key === "v") { e.preventDefault(); pasteClipboard(); return; }
    if (ctrl && e.key === "a") {
      e.preventDefault();
      setSel({ r0: 0, c0: 0, r1: rows.length - 1, c1: COLS - 1 });
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      updateRows(prev => {
        pushUndo(prev);
        const next = prev.map(r => [...r]);
        for (let r = n.r0; r <= n.r1; r++)
          for (let c = n.c0; c <= n.c1; c++)
            next[r][c] = "";
        return next;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const nr = e.shiftKey
        ? Math.max(0, sel.r0 - 1)
        : Math.min(rows.length - 1, sel.r0 + 1);
      setSel({ r0: nr, c0: sel.c0, r1: nr, c1: sel.c0 });
      scrollToRow(nr);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const nc = e.shiftKey
        ? Math.max(0, sel.c0 - 1)
        : Math.min(COLS - 1, sel.c0 + 1);
      setSel({ r0: sel.r0, c0: nc, r1: sel.r0, c1: nc });
      return;
    }

    if (e.key === "F2") { e.preventDefault(); startEdit(sel.r0, sel.c0); return; }

    const arrows = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
    if (arrows[e.key]) {
      e.preventDefault();
      const [dr, dc] = arrows[e.key];
      if (e.shiftKey) {
        const nr1 = Math.max(0, Math.min(rows.length - 1, sel.r1 + dr));
        const nc1 = Math.max(0, Math.min(COLS - 1, sel.c1 + dc));
        setSel(s => ({ ...s, r1: nr1, c1: nc1 }));
        scrollToRow(nr1);
      } else {
        const nr = Math.max(0, Math.min(rows.length - 1, sel.r0 + dr));
        const nc = Math.max(0, Math.min(COLS - 1, sel.c0 + dc));
        setSel({ r0: nr, c0: nc, r1: nr, c1: nc });
        scrollToRow(nr);
      }
      return;
    }

    // Start typing = start edit
    if (e.key.length === 1 && !ctrl && !e.altKey) {
      startEdit(sel.r0, sel.c0, e.key);
    }
  }, [editCell, sel, n, rows, undo, redo, copySelection, pasteClipboard,
      startEdit, updateRows, pushUndo, scrollToRow, COLS]);

  /* ── keyboard (on edit input) ── */
  const onEditKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setEditCell(null); setEditVal("");
      containerRef.current?.focus();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = editCell.r, c = editCell.c;
      commitEdit();
      const nr = Math.min(rows.length - 1, r + 1);
      setSel({ r0: nr, c0: c, r1: nr, c1: c });
      scrollToRow(nr);
      containerRef.current?.focus();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const r = editCell.r, c = editCell.c;
      commitEdit();
      const nc = e.shiftKey ? Math.max(0, c - 1) : Math.min(COLS - 1, c + 1);
      setSel({ r0: r, c0: nc, r1: r, c1: nc });
      containerRef.current?.focus();
      return;
    }
  }, [commitEdit, editCell, rows.length, scrollToRow, COLS]);

  /* ── add / delete rows ── */
  const addRow = () => updateRows(prev => [...prev, Array(COLS).fill("")]);

  const deleteRows = () => {
    updateRows(prev => {
      pushUndo(prev);
      const next = prev.filter((_, i) => i < n.r0 || i > n.r1);
      return next.length > 0 ? next : makeEmptyRows(1);
    });
    const nr = Math.max(0, n.r0 - 1);
    setSel({ r0: nr, c0: 0, r1: nr, c1: COLS - 1 });
  };

  const clearAll = () => {
    setRows(makeEmptyRows(100));
    setFileName(null);
    setUndoStack([]); setRedoStack([]);
    setSel({ r0: 0, c0: 0, r1: 0, c1: 0 });
  };

  /* ── import ── */
  const fileInputRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const wb   = XLSX.read(evt.target.result, { type: "binary", raw: false });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });

        if (!json.length) { alert("The file appears to be empty."); return; }

        const firstRow = json[0].map(String);
        const isHdr    = headers.some(h =>
          firstRow.some(c => c.toLowerCase() === h.toLowerCase())
        );
        const dataRows = isHdr ? json.slice(1) : json;
        const parsed   = dataRows.filter(r => r.some(c => String(c).trim() !== ""));

        if (!parsed.length) { alert("No data rows found in the file."); return; }

        loadData(parsed, file.name);
      } catch (err) {
        console.error("Import error:", err);
        alert("Could not read the file: " + err.message);
      }
    };

    reader.onerror = () => alert("Failed to read file.");
    reader.readAsBinaryString(file);
  };

  /* ── export ── */
  const handleExport = async () => {
    const effective = getEffectiveRows();
    const dataRows = effective.filter(r => r.some(c => c.trim() !== ""));
    const badRows = validatePvcClaim(dataRows);
    if (badRows.length) {
      alert(
        `Cannot export — the following row${badRows.length > 1 ? "s" : ""} ` +
        `have "PVC Claim" as DedCode but the Amount is not negative:\n\n` +
        `Row${badRows.length > 1 ? "s" : ""}: ${badRows.join(", ")}\n\n` +
        `Please enter a negative Amount (e.g. -348) for all PVC Claim rows.`
      );
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    ws["!cols"] = colWidths.map(w => ({ wch: Math.round(w / 7) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deduction Report");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = fileName || "finger-check-deduction.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── effective rows (merges any in-progress edit into the snapshot) ── */
  const getEffectiveRows = useCallback(() => {
    if (!editCell) return rows;
    const next = rows.map(r => [...r]);
    next[editCell.r][editCell.c] = editVal;
    return next;
  }, [rows, editCell, editVal]);

  /* ── virtualization ── */
  const firstRow = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER);
  const lastRow  = Math.min(rows.length - 1, Math.ceil((scrollTop + CONTAINER_H) / ROW_H) + BUFFER);
  const totalW   = ROW_NUM_W + colWidths.reduce((a, b) => a + b, 0);

  const filledCount = rows.filter(r => r.some(c => c.trim() !== "")).length;

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-xl overflow-hidden border border-slate-300 shadow"
      style={{ fontFamily: "Calibri, Arial, sans-serif", fontSize: 12 }}
    >

      {/* ── Ribbon ── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 bg-[#f3f2f1] flex-wrap">
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />

        <RibbonBtn icon="import" label="Import" color="green"
          onClick={() => fileInputRef.current?.click()} />
        <RibbonBtn icon="export" label="Export" color="green"
          onClick={handleExport} />

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <RibbonBtn icon="addrow" label="Add Row"
          onClick={addRow} />
        <RibbonBtn icon="delrow" label="Delete Row(s)" color="red"
          onClick={deleteRows} />

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <RibbonBtn icon="undo" label="Undo" disabled={!undoStack.length}
          onClick={undo} />
        <RibbonBtn icon="redo" label="Redo" disabled={!redoStack.length}
          onClick={redo} />

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <RibbonBtn icon="clear" label="Clear All" color="red"
          onClick={clearAll} />

        {/* Save / Submit (only shown when persistence props are provided) */}
        {onSave && (
          <>
            <div className="w-px h-5 bg-slate-300 mx-0.5" />
            <RibbonBtn
              icon="save"
              label={isSaving ? "Saving…" : "Save"}
              color="blue"
              disabled={isSaving || reportStatus === "SUBMITTED"}
              onClick={() => {
                const effective = getEffectiveRows();
                if (editCell) commitEdit();
                const dataRows = effective.filter(r => r.some(c => String(c).trim() !== ""));
                const badRows = validatePvcClaim(dataRows);
                if (badRows.length) {
                  alert(
                    `Cannot save — row${badRows.length > 1 ? "s" : ""} ${badRows.join(", ")} ` +
                    `${badRows.length > 1 ? "have" : "has"} "PVC Claim" as DedCode ` +
                    `but the Amount is not negative.\n\n` +
                    `Please enter a negative Amount (e.g. -348) for all PVC Claim rows.`
                  );
                  return;
                }
                onSave(effective);
              }}
            />
            {onSubmit && reportStatus === "DRAFT" && (
              <RibbonBtn
                icon="submit"
                label={isSubmitting ? "Submitting…" : "Submit"}
                color="green"
                disabled={isSubmitting || isSaving}
                onClick={() => {
                  const effective = getEffectiveRows();
                  if (editCell) commitEdit();
                  const dataRows = effective.filter(r => r.some(c => c.trim() !== ""));
                  const badRows = validatePvcClaim(dataRows);
                  if (badRows.length) {
                    alert(
                      `Cannot submit — row${badRows.length > 1 ? "s" : ""} ${badRows.join(", ")} ` +
                      `${badRows.length > 1 ? "have" : "has"} "PVC Claim" as DedCode ` +
                      `but the Amount is not negative.\n\n` +
                      `Please enter a negative Amount (e.g. -348) for all PVC Claim rows.`
                    );
                    return;
                  }
                  onSubmit(effective);
                }}
              />
            )}
          </>
        )}

        <span className="ml-auto flex items-center gap-2 text-[11px] text-slate-400 pr-1">
          {reportStatus && (
            <span style={{
              padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: reportStatus === "SUBMITTED" ? "#dcfce7" : "#fef9c3",
              color: reportStatus === "SUBMITTED" ? "#166534" : "#854d0e",
              border: `1px solid ${reportStatus === "SUBMITTED" ? "#bbf7d0" : "#fde68a"}`,
            }}>
              {reportStatus}
            </span>
          )}
          {filledCount} row{filledCount !== 1 ? "s" : ""} filled
          {fileName && <span className="ml-2 text-green-700">· {fileName}</span>}
        </span>
      </div>

      {/* ── Formula bar ── */}
      <div className="flex items-center border-b border-slate-200 bg-white" style={{ height: 26 }}>
        <div className="flex items-center justify-center border-r border-slate-200 bg-[#f3f2f1] text-[11px] font-semibold text-slate-500 shrink-0"
          style={{ width: ROW_NUM_W, height: 26 }}>
          {colLetter(n.c0)}{n.r0 + 1}
        </div>
        <span className="px-2 text-slate-300 text-sm select-none">fx</span>
        <input
          className="flex-1 text-[12px] text-slate-800 outline-none bg-white pr-3"
          style={{ height: 26, fontFamily: "Calibri, Arial, sans-serif" }}
          value={editCell ? editVal : (rows[n.r0]?.[n.c0] ?? "")}
          placeholder=""
          onChange={e => {
            if (editCell) { setEditVal(e.target.value); return; }
            startEdit(n.r0, n.c0, e.target.value);
          }}
        />
      </div>

      {/* ── Grid ── */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        style={{
          height: CONTAINER_H,
          overflowY: "auto",
          overflowX: "auto",
          outline: "none",
          cursor: "default",
          userSelect: "none",
        }}
      >
        <div style={{ position: "relative", width: totalW, height: HDR_ROWS_H + rows.length * ROW_H }}>

          {/* ── Sticky header block ── */}
          <div style={{ position: "sticky", top: 0, zIndex: 20, width: totalW }}>
            {/* Row 1 – column letters */}
            <div style={{ display: "flex", height: ROW_H }}>
              {/* corner */}
              <div style={cornerStyle(ROW_NUM_W)} />
              {headers.map((_, ci) => (
                <div key={ci}
                  style={{
                    ...colHdrStyle(colWidths[ci]),
                    background: n.c0 <= ci && ci <= n.c1 ? "#c6d9f1" : "#e9e9e9",
                    fontWeight: n.c0 <= ci && ci <= n.c1 ? 700 : 500,
                  }}>
                  {colLetter(ci)}
                </div>
              ))}
            </div>
            {/* Row 2 – field names */}
            <div style={{ display: "flex", height: ROW_H }}>
              <div style={cornerStyle(ROW_NUM_W)} />
              {headers.map((h, ci) => (
                <div key={ci} style={{
                  ...colHdrStyle(colWidths[ci]),
                  background: "#1e3a5f",
                  color: "#fff",
                  fontWeight: 700,
                  justifyContent: "flex-start",
                  paddingLeft: 6,
                  fontSize: 11,
                }}>
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* ── Virtual rows ── */}
          {Array.from({ length: lastRow - firstRow + 1 }, (_, i) => {
            const r = firstRow + i;
            const isRowInSel = r >= n.r0 && r <= n.r1;

            return (
              <div key={r} style={{
                position: "absolute",
                top: HDR_ROWS_H + r * ROW_H,
                height: ROW_H,
                display: "flex",
                width: totalW,
              }}>
                {/* Row number */}
                <div style={{
                  width: ROW_NUM_W, minWidth: ROW_NUM_W, height: ROW_H,
                  background: isRowInSel ? "#d6e4f7" : "#e9e9e9",
                  borderRight: "1px solid #c8c8c8",
                  borderBottom: "1px solid #e0e0e0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#555",
                  fontWeight: isRowInSel ? 700 : 400,
                  userSelect: "none",
                  flexShrink: 0,
                }}>
                  {r + 1}
                </div>

                {/* Cells */}
                {headers.map((_, c) => {
                  const active   = sel.r0 === r && sel.c0 === c;
                  const selected = inSel(r, c);
                  const isEditing = editCell?.r === r && editCell?.c === c;

                  return (
                    <div
                      key={c}
                      onMouseDown={e => onCellMouseDown(e, r, c)}
                      onMouseEnter={() => onCellMouseEnter(r, c)}
                      onDoubleClick={() => onCellDblClick(r, c)}
                      style={{
                        position: "relative",
                        width: colWidths[c],
                        minWidth: colWidths[c],
                        height: ROW_H,
                        borderRight: "1px solid #d0d0d0",
                        borderBottom: "1px solid #e0e0e0",
                        boxSizing: "border-box",
                        background: isEditing
                          ? "#fff"
                          : selected
                            ? active ? "#e8f0fb" : "#cce0ff"
                            : r % 2 === 0 ? "#fff" : "#f9fafb",
                        outline: active && !isEditing ? "2px solid #1a73e8" : "none",
                        outlineOffset: "-2px",
                        zIndex: active ? 1 : 0,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          onBlur={commitEdit}
                          style={{
                            position: "absolute", inset: 0,
                            border: "2px solid #1a73e8",
                            outline: "none",
                            padding: "0 5px",
                            fontSize: 12,
                            fontFamily: "Calibri, Arial, sans-serif",
                            background: "#fff",
                            color: "#111",
                            zIndex: 10,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <span style={{
                          display: "block",
                          height: "100%",
                          lineHeight: `${ROW_H}px`,
                          padding: "0 5px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          color: "#1a1a1a",
                          fontSize: 12,
                        }}>
                          {rows[r]?.[c] ?? ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={{
        background: "#217346", color: "#fff", fontSize: 11,
        padding: "2px 12px", display: "flex", gap: 16, alignItems: "center",
      }}>
        <span>Deduction Report</span>
        <span style={{ opacity: 0.7 }}>
          {rows.length} rows · {COLS} cols
          {n.r0 !== n.r1 || n.c0 !== n.c1
            ? ` · Selection: ${n.r1 - n.r0 + 1}R × ${n.c1 - n.c0 + 1}C`
            : ""}
        </span>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>
          Ctrl+C Copy · Ctrl+V Paste · Ctrl+Z Undo · Del Clear
        </span>
      </div>
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────── */
function cornerStyle(w) {
  return {
    width: w, minWidth: w, height: ROW_H, flexShrink: 0,
    background: "#e9e9e9",
    borderRight: "1px solid #c8c8c8",
    borderBottom: "1px solid #c8c8c8",
  };
}

function colHdrStyle(w) {
  return {
    width: w, minWidth: w, height: ROW_H, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, color: "#444",
    borderRight: "1px solid #c8c8c8",
    borderBottom: "1px solid #c8c8c8",
    boxSizing: "border-box",
    overflow: "hidden",
    whiteSpace: "nowrap",
  };
}

/* ─── Ribbon Button ───────────────────────────────────────────────────── */
const ICONS = {
  import:  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
  export:  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />,
  addrow:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
  delrow:  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
  undo:    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />,
  redo:    <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />,
  clear:   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  save:    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />,
  submit:  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

const COLOR = {
  green:   "#217346",
  red:     "#c0392b",
  blue:    "#1e3a5f",
  default: "#444",
};

function RibbonBtn({ icon, label, onClick, disabled, color = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 3, fontSize: 11,
        fontFamily: "Calibri, Arial, sans-serif",
        background: "#fff", border: "1px solid #c8c8c8",
        color: disabled ? "#bbb" : COLOR[color],
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,.06)",
      }}
    >
      <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        {ICONS[icon]}
      </svg>
      {label}
    </button>
  );
}
