import ExcelJS from "exceljs";

const HEADERS = [
  { key: "EmployeeNum",     label: "EmployeeNum",     width: 18 },
  { key: "DedCode",         label: "DedCode",         width: 18 },
  { key: "StartDate",       label: "StartDate",       width: 16 },
  { key: "EndDate",         label: "EndDate",         width: 16 },
  { key: "Rate",            label: "Rate",            width: 12 },
  { key: "Amount",          label: "Amount",          width: 14 },
  { key: "PayeeReference",  label: "PayeeReference",  width: 20 },
  { key: "GoalAmount",      label: "GoalAmount",      width: 16 },
];

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PVC Record System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Deduction Report", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
  });

  // Define columns with widths
  sheet.columns = HEADERS.map(({ key, label, width }) => ({
    header: label,
    key,
    width,
  }));

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF2C5F8A" } },
    };
  });
  headerRow.height = 28;

  // Add a few blank rows so the user can start pasting right away
  for (let i = 0; i < 50; i++) {
    const row = sheet.addRow({});
    // Alternate light row shading for readability
    if (i % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= HEADERS.length) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FAFB" },
          };
        }
      });
    }
    row.height = 18;
  }

  // Generate buffer and return as download
  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="finger-check-template.xlsx"',
    },
  });
}
