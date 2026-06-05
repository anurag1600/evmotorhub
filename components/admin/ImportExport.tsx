'use client';

import { useState, useRef } from 'react';
import {
  Download, Upload, FileText, AlertCircle, CheckCircle, X, Loader2
} from 'lucide-react';
import {
  arrayToCSV, downloadCSV, parseCSV, generateTemplate,
  arrayToExcel, downloadExcel
} from '@/lib/import-export';

interface ImportExportProps {
  tableName: string;
  exportColumns: string[];
  importColumns: string[];
  data: Record<string, any>[];
  onImport: (rows: Record<string, string>[]) => Promise<{ success: number; errors: string[] }>;
}

export default function ImportExport({
  tableName, exportColumns, importColumns, data, onImport
}: ImportExportProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    const csv = arrayToCSV(data, exportColumns);
    downloadCSV(csv, `${tableName}_export_${Date.now()}.csv`);
  };

  const handleExportExcel = () => {
    const tsv = arrayToExcel(data, exportColumns);
    downloadExcel(tsv, `${tableName}_export_${Date.now()}.xls`);
  };

  const handleTemplate = () => {
    const template = generateTemplate(importColumns);
    downloadCSV(template, `${tableName}_template.csv`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setReport(null);

    try {
      const text = await file.text();
      const { rows } = parseCSV(text);

      if (rows.length === 0) {
        setReport({ success: 0, errors: ['File is empty or has no data rows.'] });
        return;
      }

      const result = await onImport(rows);
      setReport(result);
    } catch (err: any) {
      setReport({ success: 0, errors: [err.message || 'Failed to parse file'] });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setReport(null); }}
        className="admin-btn-secondary flex items-center gap-2 text-sm"
      >
        <Download size={15} />
        Import / Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Import / Export</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* Export */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Export</p>
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  <FileText size={13} />
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Import */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Import</p>
              <button
                onClick={handleTemplate}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 px-3 rounded-lg transition-colors mb-2"
              >
                <Download size={13} />
                Download Sample Template
              </button>
              <label className="w-full flex items-center justify-center gap-1.5 bg-[#145a2c] hover:bg-[#0f4020] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors cursor-pointer">
                {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {importing ? 'Importing...' : 'Import CSV / Excel'}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xls,.xlsx,.tsv"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>

            {/* Report */}
            {report && (
              <div className={`rounded-lg p-3 text-xs space-y-1 ${report.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                {report.success > 0 && (
                  <div className="flex items-center gap-1.5 text-green-700 font-medium">
                    <CheckCircle size={13} />
                    {report.success} record{report.success !== 1 ? 's' : ''} imported successfully
                  </div>
                )}
                {report.errors.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <AlertCircle size={13} />
                      {report.errors.length} error{report.errors.length !== 1 ? 's' : ''}
                    </div>
                    <ul className="list-disc list-inside text-amber-700 space-y-0.5 max-h-32 overflow-y-auto">
                      {report.errors.slice(0, 10).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {report.errors.length > 10 && <li>...and {report.errors.length - 10} more</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
