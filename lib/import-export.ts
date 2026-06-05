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
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const vals = parseRow(line);
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] ?? '' }), {} as Record<string, string>);
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
