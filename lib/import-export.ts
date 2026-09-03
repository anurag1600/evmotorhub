// CSV/Excel import and export utilities for admin tables
import * as XLSX from 'xlsx';

export function arrayToCSV(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join(',');
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      const str = Array.isArray(val) ? val.join(';') : typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  return [header, ...body].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const records: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let hasAnyChar = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      hasAnyChar = true;
    } else if (ch === ',') {
      currentRow.push(currentCell);
      currentCell = '';
      hasAnyChar = true;
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim() !== '') || hasAnyChar) {
        records.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      hasAnyChar = false;
    } else {
      currentCell += ch;
      hasAnyChar = true;
    }
  }

  if (currentCell !== '' || currentRow.length > 0 || hasAnyChar) {
    currentRow.push(currentCell);
    if (currentRow.some(c => c.trim() !== '')) {
      records.push(currentRow);
    }
  }

  if (records.length < 2) return { headers: [], rows: [] };

  const headers = records[0].map(h => h.trim());
  const rows = records.slice(1).map((vals) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });

  return { headers, rows };
}

// Parse XLSX/XLS files using the xlsx library
export function parseExcel(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        
        if (json.length < 2) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = json[0].map((h: any) => String(h).trim());
        const rows = json.slice(1)
          .filter((row: any[]) => row.some(cell => String(cell).trim()))
          .map((row: any[]) => {
            const obj: Record<string, string> = {};
            headers.forEach((h: string, i: number) => {
              obj[h] = String(row[i] ?? '').trim();
            });
            return obj;
          });

        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// Unified file parser - detects format and parses accordingly
export async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const ext = file.name.toLowerCase().split('.').pop();
  
  if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }
  
  // CSV and TSV fallback
  const text = await file.text();
  return parseCSV(text);
}

export function generateTemplate(columns: string[]): string {
  return columns.join(',') + '\n' + columns.map(() => '').join(',');
}

// Convert rows to Excel-compatible format (TSV for broad compatibility)
export function arrayToExcel(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join('\t');
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      return Array.isArray(val) ? val.join(';') : typeof val === 'object' ? JSON.stringify(val) : String(val);
    }).join('\t')
  );
  return [header, ...body].join('\n');
}

export function downloadExcel(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate and download a real .xlsx template
export function downloadExcelTemplate(columns: string[], sampleRows: Record<string, any>[] = [], filename: string) {
  const wsData = [columns, ...sampleRows.map(r => columns.map(c => r[c] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}

// Export data to a real .xlsx file
export function exportToExcel(rows: Record<string, any>[], columns: string[], filename: string) {
  const wsData = [
    columns,
    ...rows.map(row => columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      return Array.isArray(val) ? val.join(';') : typeof val === 'object' ? JSON.stringify(val) : val;
    }))
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename);
}
