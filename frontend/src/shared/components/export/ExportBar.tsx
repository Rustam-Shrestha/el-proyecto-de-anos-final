import { useRef, useState, type RefObject } from 'react';
import { Download, FileSpreadsheet, FileText, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: Array<{ key: string; header: string; accessor?: (row: T) => string | number }>;
  filename: string;
  chartRef?: RefObject<HTMLElement>;
}

export function ExportBar<T extends Record<string, unknown>>({ data, columns, filename, chartRef }: Props<T>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const rows = data.map(row => {
    const o: Record<string, unknown> = {};
    for (const c of columns) o[c.header] = c.accessor ? c.accessor(row) : (row[c.key] as unknown);
    return o;
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setOpen(false);
  };
  const exportCsv = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(url);
    setOpen(false);
  };
  const exportPdf = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const headers = columns.map(c => c.header);
    const body = rows.map(r => headers.map(h => String(r[h] ?? '')));
    autoTable(doc, { head: [headers], body, styles: { fontSize: 7 }, headStyles: { fillColor: [21, 128, 61] }, margin: { top: 24 } });
    doc.setFontSize(10);
    doc.text(filename, 24, 16);
    if (chartRef?.current) {
      try {
        const canvas = await html2canvas(chartRef.current, { scale: 1.5, backgroundColor: '#ffffff' });
        const img = canvas.toDataURL('image/png');
        const pageW = doc.internal.pageSize.getWidth();
        const imgW = pageW - 48;
        const imgH = (canvas.height / canvas.width) * imgW;
        doc.addPage();
        doc.addImage(img, 'PNG', 24, 24, imgW, imgH);
      } catch (_e) { /* ignore chart capture failure */ }
    }
    doc.save(`${filename}.pdf`);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50" title="Export">
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-20">
          <button onClick={exportExcel} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"><FileSpreadsheet className="w-4 h-4 text-[#15803D]" /> Excel (.xlsx)</button>
          <button onClick={exportCsv} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"><TableIcon className="w-4 h-4 text-[#0ea5e9]" /> CSV (.csv)</button>
          <button onClick={exportPdf} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 rounded-lg"><FileText className="w-4 h-4 text-slate-600" /> PDF (.pdf)</button>
        </div>
      )}
    </div>
  );
}
