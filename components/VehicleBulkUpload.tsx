'use client';

import { useState, useRef } from 'react';
import { FileSpreadsheet, Upload, Download, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, X, FileDown, Eye, EyeOff } from 'lucide-react';
import { parseCSV, downloadCSV } from '@/lib/import-export';

interface VehicleBulkUploadProps {
  onVehiclesChange: (vehicles: any[]) => void;
  onErrorsChange: (errors: any[]) => void;
}

interface PreviewRow {
  _rowNumber: number;
  _errors: string[];
  _status: 'valid' | 'error';
  [key: string]: any;
}

const REQUIRED_COLUMNS = ['name', 'type'];
const OPTIONAL_COLUMNS = [
  'segment', 'price_min', 'price_max', 'range_km', 'top_speed_kmh',
  'battery_capacity_kwh', 'motor_power_kw', 'charging_time_hrs',
  'image_url', 'description', 'is_upcoming', 'is_featured', 'colors',
  'features', 'pros', 'cons', 'launch_date',
];

const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

const VALID_TYPES = ['scooter', 'bike', 'car'];
const VALID_SEGMENTS = ['budget', 'mid', 'premium', 'luxury'];

function generateSampleCSV(): string {
  const headers = ALL_COLUMNS.join(',');
  const example1 = [
    'Ather 450X', 'scooter', 'premium', '130000', '160000', '150', '90',
    '3.7', '6', '4', 'https://example.com/450x.jpg',
    '"Premium electric scooter with smart features"',
    'false', 'true', '"Grey Blue;White;Black"',
    '"Fast charging;Bluetooth;App connectivity"',
    '"Quick acceleration;Good range;Smart features"',
    '"High price;Limited service centers"',
    '2024-01-15',
  ].join(',');
  const example2 = [
    'TVS iQube', 'scooter', 'mid', '100000', '120000', '100', '78',
    '3.04', '5', '4.2', 'https://example.com/iqube.jpg',
    '"Reliable electric scooter from TVS"',
    'false', 'false', '"White;Grey;Red"',
    '"Regenerative braking;Smartphone app"',
    '"Reliable brand;Decent range"',
    '"Basic features;Slow charging"',
    '2024-03-01',
  ].join(',');
  return `${headers}\n${example1}\n${example2}`;
}

function validateRow(row: Record<string, any>, rowNumber: number): PreviewRow {
  const errors: string[] = [];

  if (!row.name || String(row.name).trim() === '') errors.push('Name is required');
  if (!row.type || String(row.type).trim() === '') errors.push('Type is required');
  else if (!VALID_TYPES.includes(String(row.type).toLowerCase().trim())) errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);

  if (row.segment && String(row.segment).trim() && !VALID_SEGMENTS.includes(String(row.segment).toLowerCase().trim())) {
    errors.push(`Segment must be one of: ${VALID_SEGMENTS.join(', ')}`);
  }
  if (row.price_min && row.price_min !== '' && isNaN(Number(row.price_min))) errors.push('price_min must be a number');
  if (row.price_max && row.price_max !== '' && isNaN(Number(row.price_max))) errors.push('price_max must be a number');
  if (row.range_km && row.range_km !== '' && isNaN(Number(row.range_km))) errors.push('range_km must be a number');
  if (row.top_speed_kmh && row.top_speed_kmh !== '' && isNaN(Number(row.top_speed_kmh))) errors.push('top_speed_kmh must be a number');
  if (row.battery_capacity_kwh && row.battery_capacity_kwh !== '' && isNaN(Number(row.battery_capacity_kwh))) errors.push('battery_capacity_kwh must be a number');
  if (row.motor_power_kw && row.motor_power_kw !== '' && isNaN(Number(row.motor_power_kw))) errors.push('motor_power_kw must be a number');
  if (row.charging_time_hrs && row.charging_time_hrs !== '' && isNaN(Number(row.charging_time_hrs))) errors.push('charging_time_hrs must be a number');

  return {
    ...row,
    _rowNumber: rowNumber,
    _errors: errors,
    _status: errors.length > 0 ? 'error' : 'valid',
  };
}

export default function VehicleBulkUpload({ onVehiclesChange, onErrorsChange }: VehicleBulkUploadProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (text: string, fname: string) => {
    setParsing(true);
    setError('');
    try {
      const { headers, rows: parsedRows } = parseCSV(text);
      if (parsedRows.length === 0) {
        setError('The spreadsheet appears to be empty. Please fill in vehicle data.');
        setParsing(false);
        return;
      }

      const lowerHeaders = headers.map(h => h.toLowerCase().trim());
      const missingCols = REQUIRED_COLUMNS.filter(c => !lowerHeaders.includes(c));
      if (missingCols.length > 0) {
        setError(`Missing required columns: ${missingCols.join(', ')}. Please download the sample template.`);
        setParsing(false);
        return;
      }

      const normalizedRows = parsedRows.map((r, i) => {
        const normalized: Record<string, any> = {};
        headers.forEach(h => {
          normalized[h.toLowerCase().trim()] = r[h] ?? '';
        });
        return validateRow(normalized, i + 2);
      });

      // Check for duplicate names within the sheet
      const nameMap: Record<string, number[]> = {};
      normalizedRows.forEach(r => {
        const name = String(r.name || '').toLowerCase().trim();
        if (name) {
          if (!nameMap[name]) nameMap[name] = [];
          nameMap[name].push(r._rowNumber);
        }
      });
      Object.entries(nameMap).forEach(([name, rowNumbers]) => {
        if (rowNumbers.length > 1) {
          rowNumbers.forEach(rn => {
            const row = normalizedRows.find(r => r._rowNumber === rn);
            if (row) {
              row._errors.push(`Duplicate vehicle name "${name}" appears in rows ${rowNumbers.join(', ')}`);
              row._status = 'error';
            }
          });
        }
      });

      setRows(normalizedRows);
      setFileName(fname);
      setStep('preview');

      const validVehicles = normalizedRows
        .filter(r => r._status === 'valid')
        .map(r => {
          const { _rowNumber, _errors, _status, ...vehicle } = r;
          return {
            name: String(vehicle.name).trim(),
            slug: String(vehicle.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
            type: String(vehicle.type).toLowerCase().trim(),
            segment: vehicle.segment ? String(vehicle.segment).toLowerCase().trim() : 'mid',
            price_min: vehicle.price_min ? Number(vehicle.price_min) : 0,
            price_max: vehicle.price_max ? Number(vehicle.price_max) : 0,
            range_km: vehicle.range_km ? Number(vehicle.range_km) : 0,
            top_speed_kmh: vehicle.top_speed_kmh ? Number(vehicle.top_speed_kmh) : 0,
            battery_capacity_kwh: vehicle.battery_capacity_kwh ? Number(vehicle.battery_capacity_kwh) : 0,
            motor_power_kw: vehicle.motor_power_kw ? Number(vehicle.motor_power_kw) : 0,
            charging_time_hrs: vehicle.charging_time_hrs ? Number(vehicle.charging_time_hrs) : 0,
            image_url: vehicle.image_url || '',
            description: vehicle.description || '',
            is_upcoming: String(vehicle.is_upcoming).toLowerCase() === 'true',
            is_featured: String(vehicle.is_featured).toLowerCase() === 'true',
            colors: vehicle.colors ? String(vehicle.colors).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [],
            features: vehicle.features ? String(vehicle.features).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [],
            pros: vehicle.pros ? String(vehicle.pros).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [],
            cons: vehicle.cons ? String(vehicle.cons).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [],
            launch_date: vehicle.launch_date || null,
            status: 'published',
          };
        });

      onVehiclesChange(validVehicles);
      onErrorsChange(normalizedRows.filter(r => r._status === 'error'));
    } catch (err: any) {
      setError(`Failed to parse spreadsheet: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(csv|txt)$/i)) {
      setError('Please upload a CSV file. Download the sample template for the correct format.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processFile(text, file.name);
    };
    reader.onerror = () => setError('Failed to read the file.');
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(csv|txt)$/i)) {
      setError('Please upload a CSV file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processFile(text, file.name);
    };
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const csv = generateSampleCSV();
    downloadCSV(csv, 'evmotorhub_vehicle_template.csv');
  };

  const handleReset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setError('');
    onVehiclesChange([]);
    onErrorsChange([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = rows.filter(r => r._status === 'valid').length;
  const errorCount = rows.filter(r => r._status === 'error').length;
  const displayRows = showAllRows ? rows : rows.slice(0, 10);

  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-[#145a2c]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{fileName}</p>
              <p className="text-xs text-gray-500">{rows.length} rows parsed</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={14} /> Re-upload
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
            <div className="text-xs text-green-600">Valid</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-red-600">Errors</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-gray-600">{rows.length}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {errorCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold mb-1">{errorCount} row(s) have errors</p>
              <p className="text-xs">Valid rows will be submitted. Invalid rows will be skipped. Fix the errors and re-upload to include them.</p>
            </div>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Price Min</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Range</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={row._rowNumber} className={row._status === 'error' ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2 text-gray-400">{row._rowNumber}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{row.name || '-'}</td>
                    <td className="px-3 py-2 text-gray-600 capitalize">{row.type || '-'}</td>
                    <td className="px-3 py-2 text-gray-600">{row.price_min ? `₹${Number(row.price_min).toLocaleString()}` : '-'}</td>
                    <td className="px-3 py-2 text-gray-600">{row.range_km ? `${row.range_km} km` : '-'}</td>
                    <td className="px-3 py-2">
                      {row._status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600" title={row._errors.join(', ')}>
                          <AlertCircle size={12} /> {row._errors.length} error(s)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && (
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="w-full py-2 text-xs font-medium text-[#145a2c] hover:bg-gray-50 flex items-center justify-center gap-1.5 border-t border-gray-200"
            >
              {showAllRows ? <><EyeOff size={14} /> Show first 10</> : <><Eye size={14} /> Show all {rows.length} rows</>}
            </button>
          )}
        </div>

        {errorCount > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {rows.filter(r => r._status === 'error').map(r => (
              <div key={r._rowNumber} className="flex items-start gap-2 text-xs bg-red-50/50 rounded-lg p-2">
                <span className="font-bold text-red-600 flex-shrink-0">Row {r._rowNumber}:</span>
                <span className="text-red-600">{r._errors.join('; ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileDown size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Download Sample Template</p>
            <p className="text-xs text-gray-500">Get the spreadsheet format with example data</p>
          </div>
        </div>
        <button
          onClick={downloadSample}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#145a2c] hover:bg-[#0f4a23] text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={14} /> Download
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-[#145a2c] bg-green-50' : 'border-gray-300 hover:border-[#145a2c] hover:bg-green-50/50'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#145a2c] animate-spin" />
            <p className="text-sm text-gray-600">Parsing spreadsheet...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload size={24} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Upload your vehicle spreadsheet</p>
              <p className="text-xs text-gray-500 mt-1">Drag &amp; drop or click to browse. CSV format only.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Spreadsheet Fields:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-semibold text-red-600 mb-1">Required:</p>
            <ul className="space-y-0.5 text-gray-600">
              <li><code className="bg-white px-1 rounded">name</code> — Vehicle name</li>
              <li><code className="bg-white px-1 rounded">type</code> — scooter, bike, or car</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Optional:</p>
            <ul className="space-y-0.5 text-gray-500">
              <li><code className="bg-white px-1 rounded">price_min</code>, <code className="bg-white px-1 rounded">price_max</code></li>
              <li><code className="bg-white px-1 rounded">range_km</code>, <code className="bg-white px-1 rounded">top_speed_kmh</code></li>
              <li><code className="bg-white px-1 rounded">battery_capacity_kwh</code></li>
              <li><code className="bg-white px-1 rounded">colors</code>, <code className="bg-white px-1 rounded">features</code></li>
              <li className="text-gray-400">...and more (see template)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
