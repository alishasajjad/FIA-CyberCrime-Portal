// Dependency-free export helpers: CSV (Excel-compatible) + print-to-PDF.

function escapeCsv(v) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// rows: array of arrays (first row = header). Opens cleanly in Excel/Sheets.
export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\r\n");
  // Prepend BOM so Excel detects UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Build CSV rows from labelled sections (each: { title, headers, rows }).
export function sectionsToCsv(sections) {
  const out = [];
  sections.forEach((sec, i) => {
    if (i > 0) out.push([]);
    if (sec.title) out.push([sec.title]);
    if (sec.headers) out.push(sec.headers);
    (sec.rows || []).forEach((r) => out.push(r));
  });
  return out;
}

// Open a print-friendly window for the given HTML (user can "Save as PDF").
export function printReport(title, bodyHtml) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    window.alert("Please allow pop-ups to print/export the report.");
    return;
  }
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <meta charset="utf-8" />
    <style>
      body{font-family:'DM Sans',Arial,sans-serif;color:#1b2559;padding:32px;}
      h1{font-size:20px;margin:0 0 4px;}
      .sub{color:#707eae;font-size:12px;margin-bottom:24px;}
      h2{font-size:14px;margin:24px 0 8px;color:#166534;text-transform:uppercase;letter-spacing:.05em;}
      table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;}
      th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;}
      th{background:#ecfdf3;}
      @media print{.noprint{display:none;}}
    </style></head><body>${bodyHtml}
    <script>window.onload=function(){setTimeout(function(){window.print();},250);}</script>
    </body></html>`);
  win.document.close();
}

// Helper to render a labelled dataset as an HTML table for printReport.
export function tableHtml(title, headers, rows) {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c == null ? "" : c}</td>`).join("")}</tr>`)
    .join("");
  return `<h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
