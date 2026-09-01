// CSV/Excel import and export utilities for admin tables

export function arrayToCSV(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join(',');
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      const str = Array.isArray(val) ? val.join(';') : String(val);
      // Escape quotes and wrap in quotes if contains comma/newline/quote
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
  // Character-level parser that correctly handles embedded newlines and commas inside quoted fields
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
      // Handle \r\n and standalone \r
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

  // Flush last cell/row if file doesn't end with newline
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

// Generate a sample CSV template with the given columns
export function generateTemplate(columns: string[]): string {
  return columns.join(',') + '\n' + columns.map(() => '').join(',');
}

// Convert rows to JSON-downloadable Excel-compatible format (TSV for broad compatibility)
export function arrayToExcel(rows: Record<string, any>[], columns: string[]): string {
  const header = columns.join('\t');
  const body = rows.map((row) =>
    columns.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      return Array.isArray(val) ? val.join(';') : String(val);
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
