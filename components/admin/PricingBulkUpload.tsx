'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { parseCSV, downloadCSV, arrayToCSV, downloadExcel, arrayToExcel } from '@/lib/import-export';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, X, Loader as Loader2, CircleCheck as CheckCircle, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingBulkUploadProps {
  type: 'cities' | 'profiles';
  states: { id: string; name: string; code: string }[];
  cities: { id: string; name: string; state_id: string }[];
  onImported: () => void;
}

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  status: 'valid' | 'error';
  duplicate?: 'new' | 'existing';
}

const CITY_COLUMNS = [
  'state_name', 'state_code', 'city_name', 'pincode', 'is_popular', 'is_active',
];

const CITY_TEMPLATE_ROWS = [
  { state_name: 'Maharashtra', state_code: 'MH', city_name: 'Mumbai', pincode: '400001', is_popular: 'true', is_active: 'true' },
  { state_name: 'Karnataka', state_code: 'KA', city_name: 'Bangalore', pincode: '560001', is_popular: 'true', is_active: 'true' },
  { state_name: 'Delhi', state_code: 'DL', city_name: 'New Delhi', pincode: '110001', is_popular: 'true', is_active: 'true' },
];

const PROFILE_COLUMNS = [
  'profile_name', 'description', 'city_name', 'vehicle_category', 'status', 'priority', 'effective_date',
  'rto_percentage', 'insurance_percentage',
  'registration_fee', 'hsrp_fee', 'fastag_fee', 'handling_charges', 'dealer_charges', 'delivery_charges', 'accessories_charges', 'other_charges', 'misc_charges',
  'show_rto', 'show_insurance', 'show_registration', 'show_hsrp', 'show_fastag', 'show_handling', 'show_dealer', 'show_delivery', 'show_accessories', 'show_other', 'show_misc',
  'has_subsidy', 'subsidy_type', 'subsidy_value', 'subsidy_title', 'subsidy_badge_text', 'subsidy_description', 'subsidy_start_date', 'subsidy_end_date',
  'slab_min_price_1', 'slab_max_price_1', 'slab_tax_percentage_1',
  'slab_min_price_2', 'slab_max_price_2', 'slab_tax_percentage_2',
  'slab_min_price_3', 'slab_max_price_3', 'slab_tax_percentage_3',
];

const PROFILE_TEMPLATE_ROWS = [
  {
    profile_name: 'Mumbai Car Default', description: 'Default pricing for cars in Mumbai', city_name: 'Mumbai', vehicle_category: 'electric_car', status: 'draft', priority: '10', effective_date: '',
    rto_percentage: '10', insurance_percentage: '4',
    registration_fee: '2000', hsrp_fee: '1100', fastag_fee: '500', handling_charges: '0', dealer_charges: '0', delivery_charges: '0', accessories_charges: '0', other_charges: '0', misc_charges: '0',
    show_rto: 'true', show_insurance: 'true', show_registration: 'true', show_hsrp: 'true', show_fastag: 'true', show_handling: 'false', show_dealer: 'false', show_delivery: 'false', show_accessories: 'false', show_other: 'false', show_misc: 'false',
    has_subsidy: 'false', subsidy_type: 'fixed', subsidy_value: '0', subsidy_title: '', subsidy_badge_text: '', subsidy_description: '', subsidy_start_date: '', subsidy_end_date: '',
    slab_min_price_1: '0', slab_max_price_1: '500000', slab_tax_percentage_1: '5',
    slab_min_price_2: '500000', slab_max_price_2: '1000000', slab_tax_percentage_2: '8',
    slab_min_price_3: '1000000', slab_max_price_3: '', slab_tax_percentage_3: '12',
  },
  {
    profile_name: 'Bangalore Scooter Default', description: 'Default pricing for scooters in Bangalore', city_name: 'Bangalore', vehicle_category: 'electric_scooter', status: 'draft', priority: '10', effective_date: '',
    rto_percentage: '8', insurance_percentage: '3',
    registration_fee: '1500', hsrp_fee: '1100', fastag_fee: '0', handling_charges: '0', dealer_charges: '0', delivery_charges: '0', accessories_charges: '0', other_charges: '0', misc_charges: '0',
    show_rto: 'true', show_insurance: 'true', show_registration: 'true', show_hsrp: 'true', show_fastag: 'false', show_handling: 'false', show_dealer: 'false', show_delivery: 'false', show_accessories: 'false', show_other: 'false', show_misc: 'false',
    has_subsidy: 'true', subsidy_type: 'fixed', subsidy_value: '5000', subsidy_title: 'EV Subsidy Karnataka', subsidy_badge_text: 'Save ₹5000', subsidy_description: 'Government subsidy on electric scooters', subsidy_start_date: '2024-01-01', subsidy_end_date: '',
    slab_min_price_1: '0', slab_max_price_1: '', slab_tax_percentage_1: '5',
    slab_min_price_2: '', slab_max_price_2: '', slab_tax_percentage_2: '',
    slab_min_price_3: '', slab_max_price_3: '', slab_tax_percentage_3: '',
  },
];

const VEHICLE_CATEGORIES = ['electric_car', 'electric_scooter', 'electric_bike'];
const PROFILE_STATUSES = ['draft', 'published', 'archived'];

type DuplicateMode = 'skip' | 'update' | 'create';

function parseBool(val: string | undefined, defaultVal = false): boolean {
  if (!val) return defaultVal;
  const v = val.toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function parseNum(val: string | undefined, defaultVal = 0): number {
  if (!val) return defaultVal;
  const n = parseFloat(val);
  return isNaN(n) ? defaultVal : n;
}

export default function PricingBulkUpload({ type, states, cities, onImported }: PricingBulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; updated: number; errors: number; skipped: number } | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip');
  const fileRef = useRef<HTMLInputElement>(null);

  const columns = type === 'cities' ? CITY_COLUMNS : PROFILE_COLUMNS;
  const templateRows = type === 'cities' ? CITY_TEMPLATE_ROWS : PROFILE_TEMPLATE_ROWS;

  const handleDownloadTemplate = useCallback((format: 'csv' | 'excel') => {
    if (format === 'csv') {
      const csv = arrayToCSV(templateRows as any, columns);
      downloadCSV(csv, `${type}_bulk_upload_template.csv`);
    } else {
      const excel = arrayToExcel(templateRows as any, columns);
      downloadExcel(excel, `${type}_bulk_upload_template.xls`);
    }
  }, [type, columns, templateRows]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        toast.error('CSV file is empty or has no data rows');
        setParsing(false);
        return;
      }

      const lowerHeaders = headers.map(h => h.toLowerCase().trim());
      const missingCols = columns.filter(c => !lowerHeaders.includes(c));
      if (missingCols.length > 0) {
        toast.error(`Missing required columns: ${missingCols.join(', ')}`);
        setParsing(false);
        return;
      }

      const validated: ParsedRow[] = rows.map((row, i) => {
        const errors: string[] = [];

        if (type === 'cities') {
          if (!row.state_name?.trim()) errors.push('state_name is required');
          if (!row.city_name?.trim()) errors.push('city_name is required');
        } else {
          if (!row.profile_name?.trim()) errors.push('profile_name is required');
          if (!row.city_name?.trim()) errors.push('city_name is required');
          if (!VEHICLE_CATEGORIES.includes(row.vehicle_category?.trim())) errors.push(`vehicle_category must be one of: ${VEHICLE_CATEGORIES.join(', ')}`);
          if (row.status && !PROFILE_STATUSES.includes(row.status.trim())) errors.push(`status must be one of: ${PROFILE_STATUSES.join(', ')}`);
          if (row.rto_percentage?.trim() && isNaN(Number(row.rto_percentage))) errors.push('rto_percentage must be a number');
          if (row.insurance_percentage?.trim() && isNaN(Number(row.insurance_percentage))) errors.push('insurance_percentage must be a number');
          if (row.has_subsidy && parseBool(row.has_subsidy)) {
            if (!row.subsidy_type?.trim()) errors.push('subsidy_type required when has_subsidy is true');
            if (!row.subsidy_value?.trim()) errors.push('subsidy_value required when has_subsidy is true');
          }
          for (let s = 1; s <= 3; s++) {
            const minP = row[`slab_min_price_${s}`];
            const taxP = row[`slab_tax_percentage_${s}`];
            if (minP?.trim() && !taxP?.trim()) errors.push(`slab_tax_percentage_${s} required when slab_min_price_${s} is provided`);
            if (!minP?.trim() && taxP?.trim()) errors.push(`slab_min_price_${s} required when slab_tax_percentage_${s} is provided`);
          }
        }

        return {
          rowIndex: i + 2,
          data: row,
          errors,
          status: errors.length > 0 ? 'error' : 'valid',
          duplicate: 'new',
        };
      });

      // Check for existing records
      if (type === 'profiles') {
        const validCityNames = validated
          .filter(r => r.status === 'valid')
          .map(r => r.data.city_name?.trim())
          .filter(Boolean);

        if (validCityNames.length > 0) {
          const { data: existingProfiles } = await supabase
            .from('pricing_profiles')
            .select('id, name, city_id, vehicle_category')
            .in('city_id', cities.filter(c => validCityNames.includes(c.name)).map(c => c.id));

          if (existingProfiles) {
            const existingKeys = new Set(existingProfiles.map((p: any) => `${p.name}|${p.city_id}|${p.vehicle_category}`));
            const cityIdMap = new Map(cities.map(c => [c.name.toLowerCase(), c.id]));

            validated.forEach(r => {
              const cityId = cityIdMap.get(r.data.city_name?.toLowerCase().trim());
              const key = `${r.data.profile_name?.trim()}|${cityId}|${r.data.vehicle_category?.trim()}`;
              if (existingKeys.has(key)) {
                r.duplicate = 'existing';
              }
            });
          }
        }
      }

      setParsedRows(validated);
      const errorCount = validated.filter(r => r.status === 'error').length;
      if (errorCount === validated.length) {
        toast.error(`All ${errorCount} rows have errors. Please fix and re-upload.`);
      } else if (errorCount > 0) {
        toast.warning(`${errorCount} of ${validated.length} rows have errors. Valid rows can still be imported.`);
      } else {
        toast.success(`${validated.length} rows parsed successfully`);
      }
    } catch (err) {
      toast.error('Failed to parse CSV file');
    } finally {
      setParsing(false);
    }
  }, [type, columns, cities]);

  const handleImport = useCallback(async () => {
    const validRows = parsedRows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      if (type === 'cities') {
        const stateMap = new Map<string, string>();
        for (const s of states) {
          stateMap.set(s.name.toLowerCase(), s.id);
        }

        for (const row of validRows) {
          if (row.duplicate === 'existing' && duplicateMode === 'skip') {
            skippedCount++;
            continue;
          }
          try {
            const stateName = row.data.state_name.trim();
            const stateCode = row.data.state_code?.trim().toUpperCase() || stateName.substring(0, 2).toUpperCase();
            let stateId = stateMap.get(stateName.toLowerCase());

            if (!stateId) {
              const { data: newState, error } = await supabase
                .from('pricing_states')
                .insert([{
                  name: stateName,
                  code: stateCode,
                  is_active: true,
                }])
                .select()
                .single();

              if (error) throw error;
              stateId = newState.id;
              stateMap.set(stateName.toLowerCase(), newState.id);
            }

            const { data: existing } = await supabase
              .from('pricing_cities')
              .select('id')
              .eq('state_id', stateId)
              .eq('name', row.data.city_name.trim())
              .maybeSingle();

            const payload = {
              state_id: stateId,
              name: row.data.city_name.trim(),
              pincode: row.data.pincode?.trim() || null,
              is_popular: parseBool(row.data.is_popular, false),
              is_active: parseBool(row.data.is_active, true),
              state_code: stateCode,
            };

            if (existing) {
              if (duplicateMode === 'skip') {
                skippedCount++;
              } else {
                const { error } = await supabase.from('pricing_cities').update(payload).eq('id', existing.id);
                if (error) throw error;
                updateCount++;
              }
            } else {
              const { error } = await supabase.from('pricing_cities').insert([payload]);
              if (error) throw error;
              successCount++;
            }
          } catch (err: any) {
            errorCount++;
            console.error(`Row ${row.rowIndex}:`, err.message);
          }
        }
      } else {
        const cityMap = new Map<string, string>();
        for (const c of cities) {
          cityMap.set(c.name.toLowerCase(), c.id);
        }

        for (const row of validRows) {
          if (row.duplicate === 'existing' && duplicateMode === 'skip') {
            skippedCount++;
            continue;
          }
          try {
            const cityName = row.data.city_name.trim();
            let cityId = cityMap.get(cityName.toLowerCase());

            if (!cityId) {
              const { data: foundCity } = await supabase
                .from('pricing_cities')
                .select('id')
                .eq('name', cityName)
                .maybeSingle();
              if (foundCity) {
                cityId = foundCity.id;
                cityMap.set(cityName.toLowerCase(), cityId!);
              }
            }

            if (!cityId) {
              errorCount++;
              continue;
            }

            const profilePayload = {
              name: row.data.profile_name.trim(),
              description: row.data.description?.trim() || null,
              city_id: cityId,
              vehicle_category: row.data.vehicle_category.trim(),
              status: row.data.status?.trim() || 'draft',
              priority: parseInt(row.data.priority) || 0,
              effective_date: row.data.effective_date?.trim() || null,
              rto_percentage: parseNum(row.data.rto_percentage),
              insurance_percentage: parseNum(row.data.insurance_percentage || '0'),
              registration_fee: Math.round(parseNum(row.data.registration_fee || '0')),
              hsrp_fee: Math.round(parseNum(row.data.hsrp_fee || '0')),
              fastag_fee: Math.round(parseNum(row.data.fastag_fee || '0')),
              handling_charges: Math.round(parseNum(row.data.handling_charges || '0')),
              dealer_charges: Math.round(parseNum(row.data.dealer_charges || '0')),
              delivery_charges: Math.round(parseNum(row.data.delivery_charges || '0')),
              accessories_charges: Math.round(parseNum(row.data.accessories_charges || '0')),
              other_charges: Math.round(parseNum(row.data.other_charges || '0')),
              misc_charges: Math.round(parseNum(row.data.misc_charges || '0')),
              show_rto: parseBool(row.data.show_rto, true),
              show_insurance: parseBool(row.data.show_insurance, true),
              show_registration: parseBool(row.data.show_registration, true),
              show_hsrp: parseBool(row.data.show_hsrp, true),
              show_fastag: parseBool(row.data.show_fastag, true),
              show_handling: parseBool(row.data.show_handling, false),
              show_dealer: parseBool(row.data.show_dealer, false),
              show_delivery: parseBool(row.data.show_delivery, false),
              show_accessories: parseBool(row.data.show_accessories, false),
              show_other: parseBool(row.data.show_other, false),
              show_misc: parseBool(row.data.show_misc, false),
              has_subsidy: parseBool(row.data.has_subsidy, false),
              subsidy_type: row.data.subsidy_type?.trim() || 'fixed',
              subsidy_value: parseNum(row.data.subsidy_value || '0'),
              subsidy_title: row.data.subsidy_title?.trim() || null,
              subsidy_badge_text: row.data.subsidy_badge_text?.trim() || null,
              subsidy_description: row.data.subsidy_description?.trim() || null,
              subsidy_start_date: row.data.subsidy_start_date?.trim() || null,
              subsidy_end_date: row.data.subsidy_end_date?.trim() || null,
            };

            const { data: existing } = await supabase
              .from('pricing_profiles')
              .select('id')
              .eq('name', profilePayload.name)
              .eq('city_id', cityId)
              .eq('vehicle_category', profilePayload.vehicle_category)
              .maybeSingle();

            let profileId: string;

            if (existing) {
              if (duplicateMode === 'skip') {
                skippedCount++;
                continue;
              }
              const { error } = await supabase.from('pricing_profiles').update(profilePayload).eq('id', existing.id);
              if (error) throw error;
              profileId = existing.id;
              updateCount++;
              await supabase.from('pricing_profile_slabs').delete().eq('profile_id', profileId);
            } else {
              const { data: newProfile, error } = await supabase
                .from('pricing_profiles')
                .insert([profilePayload])
                .select()
                .single();
              if (error) throw error;
              profileId = newProfile.id;
              successCount++;
            }

            const slabs = [];
            for (let s = 1; s <= 3; s++) {
              const minP = row.data[`slab_min_price_${s}`];
              const maxP = row.data[`slab_max_price_${s}`];
              const taxP = row.data[`slab_tax_percentage_${s}`];
              if (minP?.trim() && taxP?.trim()) {
                slabs.push({
                  profile_id: profileId,
                  min_price: Math.round(parseNum(minP)),
                  max_price: maxP?.trim() ? Math.round(parseNum(maxP)) : null,
                  tax_percentage: parseNum(taxP),
                  sort_order: s - 1,
                  is_active: true,
                });
              }
            }

            if (slabs.length > 0) {
              const { error: slabError } = await supabase.from('pricing_profile_slabs').insert(slabs);
              if (slabError) throw slabError;
            }
          } catch (err: any) {
            errorCount++;
            console.error(`Row ${row.rowIndex}:`, err.message);
          }
        }
      }

      setImportResult({ success: successCount, updated: updateCount, errors: errorCount, skipped: skippedCount });
      if (successCount > 0 || updateCount > 0) {
        toast.success(`Import complete: ${successCount} new, ${updateCount} updated${errorCount > 0 ? `, ${errorCount} errors` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`);
        onImported();
      } else {
        toast.error('No rows were imported. Check for errors.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [parsedRows, type, states, cities, onImported, duplicateMode]);

  const reset = () => {
    setParsedRows([]);
    setFileName('');
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadErrorReport = () => {
    const errorRows = parsedRows.filter(r => r.status === 'error');
    if (errorRows.length === 0) return;
    const content = [
      'Row Number,Errors',
      ...errorRows.map(row => `${row.rowIndex},"${row.errors.join('; ').replace(/"/g, '""')}"`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_error_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const errorCount = parsedRows.filter(r => r.status === 'error').length;
  const duplicateCount = parsedRows.filter(r => r.duplicate === 'existing' && r.status === 'valid').length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-sm"
      >
        <Upload size={16} />
        Bulk Upload
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !importing && setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Upload size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Bulk Upload {type === 'cities' ? 'Cities' : 'Pricing Profiles'}
                  </h2>
                  <p className="text-xs text-slate-500">Upload a CSV file to import multiple records at once</p>
                </div>
              </div>
              <button
                onClick={() => !importing && setOpen(false)}
                disabled={importing}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {importResult ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Import Complete</h3>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{importResult.success}</div>
                      <div className="text-xs text-slate-500">New Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                      <div className="text-xs text-slate-500">Updated</div>
                    </div>
                    {importResult.skipped > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">{importResult.skipped}</div>
                        <div className="text-xs text-slate-500">Skipped</div>
                      </div>
                    )}
                    {importResult.errors > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{importResult.errors}</div>
                        <div className="text-xs text-slate-500">Errors</div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-2 mt-6">
                    {importResult.errors > 0 && (
                      <button onClick={downloadErrorReport} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50">
                        <Download size={14} className="inline mr-1" /> Error Report
                      </button>
                    )}
                    <button
                      onClick={() => { reset(); setOpen(false); }}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : parsedRows.length === 0 ? (
                <>
                  {/* Step 1: Upload */}
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-emerald-400 transition-colors">
                    <FileSpreadsheet size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-700 font-medium mb-1">Drop your CSV file here or click to browse</p>
                    <p className="text-xs text-slate-400 mb-5">Supports .csv format</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="bulk-upload-input"
                    />
                    <div className="flex justify-center gap-3 flex-wrap">
                      <label
                        htmlFor="bulk-upload-input"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all text-sm"
                      >
                        {parsing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {parsing ? 'Parsing...' : 'Select File'}
                      </label>
                      <button
                        onClick={() => handleDownloadTemplate('csv')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-sm"
                      >
                        <Download size={16} />
                        CSV Template
                      </button>
                      <button
                        onClick={() => handleDownloadTemplate('excel')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-sm"
                      >
                        <FileSpreadsheet size={16} />
                        Excel Template
                      </button>
                    </div>
                    {fileName && (
                      <p className="mt-4 text-xs text-slate-500">Selected: <span className="font-medium text-slate-700">{fileName}</span></p>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">CSV Format</h4>
                    <p className="text-xs text-slate-500 mb-2">
                      Required columns: <span className="font-mono text-slate-700">{columns.join(', ')}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Download the template for a ready-to-use format with example rows. Boolean fields accept: true/false, 1/0, yes/no. New profiles default to <strong>draft</strong> status. Existing records with matching names can be skipped or updated.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Preview & Import */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                        <CheckCircle size={12} /> {validCount} valid
                      </span>
                      {errorCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle size={12} /> {errorCount} errors
                        </span>
                      )}
                      {duplicateCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                          <AlertTriangle size={12} /> {duplicateCount} existing
                        </span>
                      )}
                      <span className="text-slate-400 text-xs">From: {fileName}</span>
                    </div>
                    <button
                      onClick={reset}
                      disabled={importing}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <X size={12} /> Start over
                    </button>
                  </div>

                  {/* Duplicate handling */}
                  {duplicateCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          {duplicateCount} existing record{duplicateCount !== 1 ? 's' : ''} found
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 mb-3">How should duplicates be handled?</p>
                      <div className="flex gap-2">
                        {([
                          { val: 'skip', label: 'Skip duplicates' },
                          { val: 'update', label: 'Update existing' },
                          { val: 'create', label: 'Create new' },
                        ] as const).map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => setDuplicateMode(opt.val)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                              duplicateMode === opt.val
                                ? 'bg-amber-600 text-white'
                                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16">Row</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-20">Status</th>
                            {columns.slice(0, 6).map(c => (
                              <th key={c} className="px-3 py-2.5 text-left font-semibold text-slate-500 whitespace-nowrap">{c}</th>
                            ))}
                            <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((row) => (
                            <tr key={row.rowIndex} className={cn(
                              row.status === 'error' ? 'bg-red-50/30' : 'bg-white',
                              row.duplicate === 'existing' && row.status === 'valid' && 'bg-amber-50/30',
                              'hover:bg-slate-50/50'
                            )}>
                              <td className="px-3 py-2 text-slate-400 font-mono">{row.rowIndex}</td>
                              <td className="px-3 py-2">
                                {row.status === 'valid' ? (
                                  row.duplicate === 'existing' ? (
                                    <span className="text-amber-600 text-xs">Existing</span>
                                  ) : (
                                    <CheckCircle size={14} className="text-emerald-500" />
                                  )
                                ) : (
                                  <AlertTriangle size={14} className="text-red-500" />
                                )}
                              </td>
                              {columns.slice(0, 6).map(c => (
                                <td key={c} className="px-3 py-2 text-slate-700 max-w-[120px] truncate" title={row.data[c]}>
                                  {row.data[c] || '\u2014'}
                                </td>
                              ))}
                              <td className="px-3 py-2 text-red-600">
                                {row.errors.length > 0 ? (
                                  <span className="text-xs">{row.errors.join('; ')}</span>
                                ) : (
                                  <span className="text-emerald-500 text-xs">OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Import Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={reset}
                      disabled={importing}
                      className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing || validCount === 0}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all text-sm disabled:opacity-50"
                    >
                      {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {importing ? 'Importing...' : `Import ${validCount} ${type === 'cities' ? 'Cities' : 'Profiles'}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
