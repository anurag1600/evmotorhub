'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader as Loader2, Download, FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type ImportType = 'manufacturers' | 'vehicles' | 'variants';

interface ImportRow {
  _rowNumber: number;
  _errors: string[];
  _status: 'pending' | 'success' | 'error' | 'skipped';
  [key: string]: any;
}

interface ImportExportProps {
  type: ImportType;
  onComplete?: (stats: { success: number; errors: number }) => void;
}

// Column definitions for each type
const columnDefs: Record<ImportType, { required: string[]; optional: string[] }> = {
  manufacturers: {
    required: ['name'],
    optional: ['slug', 'country', 'headquarters', 'website', 'logo_url', 'hero_image_url', 'description', 'founded_year', 'is_featured', 'show_on_homepage', 'status'],
  },
  vehicles: {
    required: ['name', 'manufacturer_id'],
    optional: ['slug', 'type', 'segment', 'price_min', 'price_max', 'range_km', 'top_speed_kmh', 'battery_capacity_kwh', 'motor_power_kw', 'charging_time_hrs', 'image_url', 'gallery_urls', 'video_url', 'description', 'is_upcoming', 'is_featured', 'is_latest', 'status', 'launch_date', 'colors', 'features', 'pros', 'cons', 'specifications', 'seo_title', 'seo_description', 'seo_keywords'],
  },
  variants: {
    required: ['vehicle_name', 'name', 'price'],
    optional: ['short_name', 'short_description', 'range_km', 'battery_capacity_kwh', 'top_speed_kmh', 'motor_power_kw', 'charging_time_hrs', 'kerb_weight', 'image_url', 'gallery_urls', 'brochure_url', 'colors', 'color_hexes', 'features', 'specifications', 'status', 'is_available', 'is_featured', 'sort_order'],
  },
};

const sampleData: Record<ImportType, string> = {
  manufacturers: `name,country,headquarters,website,logo_url,description,founded_year,is_featured
Ather Electric,India,Bangalore,https://ather.com,,Smart electric scooter manufacturer,2013,true
Ola Electric,India,Bengaluru,https://olaelectric.com,,Leading EV manufacturer,2017,true
TVS Motor Company,India,Chennai,https://tvmotor.com,,Renowned two-wheeler manufacturer,1978,false`,
  vehicles: `name,manufacturer_id,type,segment,price_min,price_max,range_km,top_speed_kmh,battery_capacity_kwh,description,is_featured,status
Ola S1 Pro,<manufacturer_uuid>,scooter,premium,139999,144999,181,116,3.97,The Ola S1 Pro offers exceptional range and performance,true,published
Ather 450X,<manufacturer_uuid>,scooter,premium,128000,155000,146,115,2.9,Premium electric scooter with smart features,true,published`,
  variants: `vehicle_name,name,price,range_km,battery_capacity_kwh,top_speed_kmh,short_description,status
Ola S1 Pro,S1 Pro Gen 2,144999,181,4,116,Premium variant with 181km range,active
Ola S1 Pro,S1 Pro,139999,171,3.97,116,Standard premium variant,active
Ather 450X,450X Gen 3,155000,146,3.7,115,Latest generation Ather 450X,active`,
};

export default function BulkImport({ type, onComplete }: ImportExportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [importStats, setImportStats] = useState<{ success: number; errors: number; skipped: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    const result: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (const line of lines) {
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (!inQuotes) {
        result.push(currentRow);
        currentRow = [];
      }
    }
    return result;
  };

  const parseArray = (val: string | undefined): string[] => {
    if (!val) return [];
    return val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  };

  const parseJson = (val: string | undefined): Record<string, string> => {
    if (!val) return {};
    try {
      return JSON.parse(val);
    } catch {
      const obj: Record<string, string> = {};
      val.split(';').forEach(pair => {
        const [k, v] = pair.split(':').map(s => s.trim());
        if (k && v) obj[k] = v;
      });
      return obj;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.txt'))) {
      processFile(droppedFile);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setParsing(true);
    setShowPreview(true);
    setStep('preview');

    try {
      const text = await uploadedFile.text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast.error('File must have at least a header row and one data row');
        setStep('upload');
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));
      const requiredCols = columnDefs[type].required;
      const { optional } = columnDefs[type];

      // Validate required columns
      const missingRequired = requiredCols.filter(col => !headers.includes(col.toLowerCase()));
      if (missingRequired.length > 0) {
        toast.error(`Missing required columns: ${missingRequired.join(', ')}`);
        setStep('upload');
        return;
      }

      const previewRows: ImportRow[] = dataRows.map((row, idx) => {
        const rowData: ImportRow = {
          _rowNumber: idx + 2,
          _errors: [],
          _status: 'pending',
        };

        headers.forEach((header, colIdx) => {
          rowData[header] = row[colIdx] || '';
        });

        // Validate required fields
        requiredCols.forEach(col => {
          if (!rowData[col] || !String(rowData[col]).trim()) {
            rowData._errors.push(`${col} is required`);
          }
        });

        if (rowData._errors.length > 0) {
          rowData._status = 'error';
        }

        return rowData;
      });

      setPreviewData(previewRows);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file');
      setStep('upload');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    const stats = { success: 0, errors: 0, skipped: 0 };

    try {
      if (type === 'manufacturers') {
        await importManufacturers(stats);
      } else if (type === 'vehicles') {
        await importVehicles(stats);
      } else if (type === 'variants') {
        await importVariants(stats);
      }

      setImportStats(stats);
      setStep('result');
      toast.success(`Import complete: ${stats.success} imported, ${stats.errors} errors, ${stats.skipped} skipped`);
      onComplete?.(stats);
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const importManufacturers = async (stats: { success: number; errors: number; skipped: number }) => {
    for (const row of previewData) {
      if (row._status === 'error') {
        stats.skipped++;
        continue;
      }

      try {
        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const { error } = await supabase.from('manufacturers').insert([{
          name: row.name?.trim(),
          slug,
          country: row.country?.trim() || 'India',
          headquarters: row.headquarters?.trim() || null,
          website: row.website?.trim() || null,
          logo_url: row.logo_url?.trim() || null,
          hero_image_url: row.hero_image_url?.trim() || null,
          description: row.description?.trim() || null,
          founded_year: parseInt(row.founded_year) || null,
          is_featured: row.is_featured?.toLowerCase() === 'true',
          show_on_homepage: row.show_on_homepage?.toLowerCase() === 'true',
          status: row.status?.trim() || 'active',
        }]);

        if (error) {
          row._errors.push(error.message);
          row._status = 'error';
          stats.errors++;
        } else {
          row._status = 'success';
          stats.success++;
        }
      } catch (e: any) {
        row._errors.push(e.message);
        row._status = 'error';
        stats.errors++;
      }

      setPreviewData([...previewData]);
    }
  };

  const importVehicles = async (stats: { success: number; errors: number; skipped: number }) => {
    for (const row of previewData) {
      if (row._status === 'error') {
        stats.skipped++;
        continue;
      }

      try {
        const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const validTypes = ['scooter', 'bike', 'car'];
        const vehicleType = validTypes.includes(row.type?.toLowerCase()) ? row.type.toLowerCase() : 'scooter';

        const { error } = await supabase.from('vehicles').insert([{
          name: row.name?.trim(),
          slug,
          manufacturer_id: row.manufacturer_id?.trim(),
          type: vehicleType,
          segment: row.segment?.trim() || 'budget',
          price_min: parseInt(row.price_min) || 0,
          price_max: parseInt(row.price_max) || 0,
          range_km: parseInt(row.range_km) || 0,
          top_speed_kmh: parseInt(row.top_speed_kmh) || 0,
          battery_capacity_kwh: parseFloat(row.battery_capacity_kwh) || 0,
          motor_power_kw: parseFloat(row.motor_power_kw) || 0,
          charging_time_hrs: parseFloat(row.charging_time_hrs) || 0,
          image_url: row.image_url?.trim() || null,
          gallery_urls: parseArray(row.gallery_urls),
          video_url: row.video_url?.trim() || null,
          description: row.description?.trim() || null,
          is_upcoming: row.is_upcoming?.toLowerCase() === 'true',
          is_featured: row.is_featured?.toLowerCase() === 'true',
          is_latest: row.is_latest?.toLowerCase() === 'true',
          status: row.status?.trim() || 'draft',
          launch_date: row.launch_date?.trim() || null,
          colors: parseArray(row.colors),
          features: parseArray(row.features),
          pros: parseArray(row.pros),
          cons: parseArray(row.cons),
          specifications: parseJson(row.specifications),
          seo_title: row.seo_title?.trim() || null,
          seo_description: row.seo_description?.trim() || null,
          seo_keywords: parseArray(row.seo_keywords),
        }]);

        if (error) {
          row._errors.push(error.message);
          row._status = 'error';
          stats.errors++;
        } else {
          row._status = 'success';
          stats.success++;
        }
      } catch (e: any) {
        row._errors.push(e.message);
        row._status = 'error';
        stats.errors++;
      }

      setPreviewData([...previewData]);
    }
  };

  const importVariants = async (stats: { success: number; errors: number; skipped: number }) => {
    // Preload vehicles for name lookup
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, name');
    const vehicleMap = new Map((vehicles || []).map(v => [v.name.toLowerCase().trim(), v.id]));

    for (const row of previewData) {
      if (row._status === 'error') {
        stats.skipped++;
        continue;
      }

      try {
        const vehicleName = row.vehicle_name?.trim().toLowerCase();
        const vehicleId = vehicleMap.get(vehicleName);

        if (!vehicleId) {
          row._errors.push(`Vehicle "${row.vehicle_name}" not found`);
          row._status = 'error';
          stats.errors++;
          continue;
        }

        // Generate slug
        const slug = row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const { error } = await supabase.from('vehicle_variants').insert([{
          vehicle_id: vehicleId,
          name: row.name?.trim(),
          slug,
          short_name: row.short_name?.trim() || null,
          short_description: row.short_description?.trim() || null,
          price: parseInt(row.price) || 0,
          range_km: parseInt(row.range_km) || null,
          battery_capacity_kwh: parseFloat(row.battery_capacity_kwh) || null,
          top_speed_kmh: parseInt(row.top_speed_kmh) || null,
          motor_power_kw: parseFloat(row.motor_power_kw) || null,
          charging_time_hrs: parseFloat(row.charging_time_hrs) || null,
          kerb_weight: parseInt(row.kerb_weight) || null,
          image_url: row.image_url?.trim() || null,
          gallery_urls: parseArray(row.gallery_urls),
          brochure_url: row.brochure_url?.trim() || null,
          colors: parseArray(row.colors),
          color_hexes: parseArray(row.color_hexes),
          features: parseArray(row.features),
          specifications: parseJson(row.specifications),
          status: row.status?.trim() || 'active',
          is_available: row.is_available?.toLowerCase() !== 'false',
          is_featured: row.is_featured?.toLowerCase() === 'true',
          sort_order: parseInt(row.sort_order) || 0,
        }]);

        if (error) {
          row._errors.push(error.message);
          row._status = 'error';
          stats.errors++;
        } else {
          row._status = 'success';
          stats.success++;
        }
      } catch (e: any) {
        row._errors.push(e.message);
        row._status = 'error';
        stats.errors++;
      }

      setPreviewData([...previewData]);
    }
  };

  const downloadTemplate = () => {
    const content = sampleData[type];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const downloadErrorReport = () => {
    const errorRows = previewData.filter(row => row._errors.length > 0);
    if (errorRows.length === 0) {
      toast.info('No errors to report');
      return;
    }

    const content = [
      'Row Number,Errors',
      ...errorRows.map(row => `${row._rowNumber},"${row._errors.join('; ')}"`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_error_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Error report downloaded');
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setImportStats(null);
    setShowPreview(false);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
              isDragging
                ? 'border-[#145a2c] bg-green-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={40} className={cn('mx-auto mb-3', isDragging ? 'text-[#145a2c]' : 'text-gray-300')} />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports CSV files with header row
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Required columns: {columnDefs[type].required.join(', ')}
            </p>
            <button
              onClick={downloadTemplate}
              className="text-xs text-[#145a2c] hover:underline flex items-center gap-1"
            >
              <Download size={12} /> Download template
            </button>
          </div>
        </>
      )}

      {step === 'preview' && showPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{file?.name}</span>
              <span className="text-xs text-gray-500">
                ({previewData.length} rows)
              </span>
            </div>
            <button onClick={reset} className="text-xs text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>

          {parsing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400 mr-2" />
              <span className="text-gray-500">Parsing file...</span>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 w-16">Row</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                      {columnDefs[type].required.map(col => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-gray-600">{col}</th>
                      ))}
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {previewData.slice(0, 50).map((row) => (
                      <tr key={row._rowNumber} className={cn(
                        row._status === 'error' && 'bg-red-50',
                        row._status === 'success' && 'bg-green-50',
                      )}>
                        <td className="px-3 py-2 text-gray-500">{row._rowNumber}</td>
                        <td className="px-3 py-2">
                          {row._status === 'pending' && <span className="text-gray-400">Pending</span>}
                          {row._status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                          {row._status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                        </td>
                        {columnDefs[type].required.map(col => (
                          <td key={col} className="px-3 py-2 truncate max-w-[150px]" title={row[col]}>
                            {row[col] || '—'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-red-600">
                          {row._errors.length > 0 && (
                            <span title={row._errors.join(', ')}>
                              {row._errors.slice(0, 2).join(', ')}
                              {row._errors.length > 2 && '...'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.length > 50 && (
                <p className="text-xs text-gray-500 text-center">
                  Showing first 50 of {previewData.length} rows
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {previewData.filter(r => r._status === 'error').length} rows with errors
                </div>
                <div className="flex gap-2">
                  <button onClick={reset} className="admin-btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing || previewData.every(r => r._status === 'error')}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Import {previewData.filter(r => r._status === 'pending').length} Rows
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'result' && importStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
              <div className="text-2xl font-bold text-green-700">{importStats.success}</div>
              <div className="text-xs text-green-600">Imported</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <AlertCircle size={24} className="mx-auto text-red-500 mb-2" />
              <div className="text-2xl font-bold text-red-700">{importStats.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <Trash2 size={24} className="mx-auto text-gray-400 mb-2" />
              <div className="text-2xl font-bold text-gray-700">{importStats.skipped}</div>
              <div className="text-xs text-gray-600">Skipped</div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {importStats.errors > 0 && (
              <button onClick={downloadErrorReport} className="admin-btn-secondary text-xs">
                <Download size={14} /> Error Report
              </button>
            )}
            <button onClick={reset} className="admin-btn-primary">
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
