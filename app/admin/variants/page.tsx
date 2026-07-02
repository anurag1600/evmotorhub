'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleVariant, Manufacturer } from '@/lib/types';
import { useVariants, VariantInput } from '@/hooks/useVariants';
import { Power, Plus, Pencil, Trash2, Copy, Star, Search, Loader as Loader2, Image as ImageIcon, FileText, CircleAlert as AlertCircle, ChevronDown, Car, Battery, TrendingUp, Clock, Zap, Archive, X, Filter, Grid2x2 as Grid, List, Package, ArrowRight, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import VariantDrawer from '@/components/admin/VariantDrawer';
import { formatPrice, getVehicleTypeLabel, timeAgo } from '@/lib/format';
import BulkImport from '@/components/admin/BulkImport';

interface VehicleWithManufacturer extends Vehicle {
  manufacturers?: Manufacturer;
  variant_count?: number;
  default_variant_name?: string;
}

const ITEMS_PER_PAGE = 12;

export default function VariantsAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get('vehicle');

  const [vehicles, setVehicles] = useState<VehicleWithManufacturer[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(initialVehicleId);

  // Top filters
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Variant filters
  const [variantSearch, setVariantSearch] = useState('');
  const [variantStatusFilter, setVariantStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updated'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // UI State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VehicleVariant | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find(v => v.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const {
    variants,
    loading: variantsLoading,
    error: variantsError,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    duplicateVariant,
    setDefaultVariant,
  } = useVariants(selectedVehicleId);

  // Fetch all vehicles with variant counts
  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id, name, slug, type, segment, image_url, manufacturer_id,
          status, updated_at, default_variant_id,
          manufacturers(id, name, slug, logo_url)
        `)
        .order('name');

      if (error) {
        console.error('Supabase query error:', error);
        toast.error(`Query error: ${error.message}`);
        setVehiclesLoading(false);
        return;
      }

      // Get variant counts
      const vehicleIds = (data || []).map(v => v.id);
      const { data: variantData, error: variantError } = await supabase
        .from('vehicle_variants')
        .select('vehicle_id, id, name, is_featured, status')
        .in('vehicle_id', vehicleIds);

      if (variantError) {
        console.error('Variant query error:', variantError);
      }

      const variantCounts: Record<string, number> = {};
      const defaultVariants: Record<string, string> = {};

      (variantData || []).forEach((v: any) => {
        variantCounts[v.vehicle_id] = (variantCounts[v.vehicle_id] || 0) + 1;
        if (v.is_featured && v.status === 'active') {
          defaultVariants[v.vehicle_id] = v.name;
        }
      });

      const vehiclesWithCounts = (data || []).map(v => ({
        ...v,
        manufacturers: v.manufacturers as unknown as Manufacturer,
        variant_count: variantCounts[v.id] || 0,
        default_variant_name: defaultVariants[v.id] || 'None',
      })) as VehicleWithManufacturer[];

      setVehicles(vehiclesWithCounts);
    } catch (e: any) {
      console.error('Failed to fetch vehicles:', e);
      toast.error(`Failed to load vehicles: ${e.message}`);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Get unique manufacturers for filter
  const manufacturers = useMemo(() => {
    const mfrs = new Map<string, string>();
    vehicles.forEach(v => {
      if (v.manufacturers?.id && v.manufacturers?.name) {
        mfrs.set(v.manufacturers.id, v.manufacturers.name);
      }
    });
    return Array.from(mfrs.entries()).map(([id, name]) => ({ id, name }));
  }, [vehicles]);

  // Filtered vehicles for the grid
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];
    if (vehicleSearch.trim()) {
      const q = vehicleSearch.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.manufacturers?.name?.toLowerCase().includes(q)
      );
    }
    if (brandFilter) {
      result = result.filter(v => v.manufacturer_id === brandFilter);
    }
    if (typeFilter) {
      result = result.filter(v => v.type === typeFilter);
    }
    if (statusFilter) {
      result = result.filter(v => v.status === statusFilter);
    }
    return result;
  }, [vehicles, vehicleSearch, brandFilter, typeFilter, statusFilter]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    let result = [...variants];
    if (variantSearch.trim()) {
      const q = variantSearch.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.short_name || '').toLowerCase().includes(q)
      );
    }
    if (variantStatusFilter !== 'all') {
      result = result.filter(v => v.status === variantStatusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [variants, variantSearch, variantStatusFilter, sortBy]);

  // Stats for selected vehicle
  const stats = useMemo(() => ({
    total: variants.length,
    active: variants.filter(v => v.status === 'active').length,
    discontinued: variants.filter(v => v.status === 'discontinued').length,
    upcoming: variants.filter(v => v.status === 'upcoming').length,
    defaultVariant: variants.find(v => v.is_featured)?.name || 'None',
  }), [variants]);

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    router.push(`/admin/variants?vehicle=${id}`, { scroll: false });
  };

  const handleAdd = () => {
    if (!selectedVehicleId) {
      toast.error('Select a vehicle first');
      return;
    }
    setEditingVariant(null);
    setDrawerOpen(true);
  };

  const handleEdit = (variant: VehicleVariant) => {
    setEditingVariant(variant);
    setDrawerOpen(true);
  };

  const handleSave = async (input: VariantInput, id?: string) => {
    try {
      if (id) {
        await updateVariant(id, input);
        toast.success('Variant updated successfully');
      } else {
        await createVariant(input);
        toast.success('Variant created successfully');
      }
      setDrawerOpen(false);
      setEditingVariant(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save variant');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteVariant(id);
      toast.success('Variant deleted');
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete variant');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (variant: VehicleVariant) => {
    try {
      await duplicateVariant(variant);
      toast.success('Variant duplicated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to duplicate variant');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultVariant(id);
      toast.success('Default variant updated');
    } catch (e: any) {
      toast.error('Failed to update default variant');
    }
  };

  const handleArchive = async (variant: VehicleVariant) => {
    try {
      await updateVariant(variant.id, { status: 'discontinued' });
      toast.success('Variant archived');
    } catch (e: any) {
      toast.error('Failed to archive variant');
    }
  };

  const formatVariantPrice = (price: number) => {
    if (price >= 100000) return `${(price / 100000).toFixed(2)}L`;
    return price.toLocaleString('en-IN');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Power size={28} className="text-[#145a2c]" />
              Variant Management
            </h1>
            <p className="admin-subtitle">Select a vehicle to manage its variants, pricing, and specifications</p>
          </div>
          {selectedVehicleId && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkImportOpen(true)}
                className="admin-btn-secondary"
              >
                <Upload size={16} /> Bulk Import
              </button>
              <button onClick={handleAdd} className="admin-btn-primary">
                <Plus size={18} /> Add Variant
              </button>
            </div>
          )}
        </div>

        {/* Top Filters - Vehicle Selection */}
        <div className="admin-card p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={vehicleSearch}
                onChange={e => setVehicleSearch(e.target.value)}
                placeholder="Search vehicles..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <select
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
            >
              <option value="">All Brands</option>
              {manufacturers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
            >
              <option value="">All Types</option>
              <option value="scooter">Scooters</option>
              <option value="bike">Bikes</option>
              <option value="car">Cars</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        {vehiclesLoading ? (
          <div className="admin-card p-12 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-gray-400 mr-3" />
            <span className="text-gray-500">Loading vehicles...</span>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="admin-card p-8 text-center">
            <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 mb-4">No vehicles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {filteredVehicles.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => handleSelectVehicle(vehicle.id)}
                className={cn(
                  'admin-card p-4 text-left transition-all hover:shadow-md hover:border-[#145a2c]',
                  selectedVehicleId === vehicle.id && 'ring-2 ring-[#145a2c] border-[#145a2c]'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {vehicle.image_url ? (
                      <img src={vehicle.image_url} alt={vehicle.name} className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Car size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{vehicle.name}</div>
                    <div className="text-xs text-gray-500 truncate">{vehicle.manufacturers?.name || 'Unknown'}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',
                        vehicle.type === 'scooter' && 'bg-purple-50 text-purple-700',
                        vehicle.type === 'bike' && 'bg-blue-50 text-blue-700',
                        vehicle.type === 'car' && 'bg-amber-50 text-amber-700'
                      )}>
                        {vehicle.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Package size={12} className="text-gray-400" />
                    <span className="text-sm font-semibold text-[#145a2c]">{vehicle.variant_count || 0}</span>
                    <span className="text-xs text-gray-400">variants</span>
                  </div>
                  {selectedVehicleId === vehicle.id && (
                    <ArrowRight size={14} className="text-[#145a2c]" />
                  )}
                </div>
                {vehicle.default_variant_name && vehicle.default_variant_name !== 'None' && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    {vehicle.default_variant_name}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Selected Vehicle Variant Management */}
        {selectedVehicle && (
          <div className="space-y-4">
            {/* Selected Vehicle Header */}
            <div className="admin-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {selectedVehicle.image_url ? (
                    <img src={selectedVehicle.image_url} alt={selectedVehicle.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Car size={24} className="text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedVehicle.name}</h2>
                    <p className="text-sm text-gray-500">{selectedVehicle.manufacturers?.name || 'Unknown'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        <strong className="text-[#145a2c]">{stats.total}</strong> variants
                      </span>
                      <span className="text-sm text-gray-600">
                        Default: <strong>{stats.defaultVariant}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'admin-badge',
                    stats.active > 0 && 'bg-green-100 text-green-700'
                  )}>
                    {stats.active} Active
                  </span>
                  {stats.upcoming > 0 && (
                    <span className="admin-badge bg-blue-100 text-blue-700">{stats.upcoming} Upcoming</span>
                  )}
                  {stats.discontinued > 0 && (
                    <span className="admin-badge bg-gray-100 text-gray-600">{stats.discontinued} Discontinued</span>
                  )}
                </div>
              </div>
            </div>

            {/* Variant Filters */}
            <div className="admin-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-1 gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={variantSearch}
                      onChange={e => setVariantSearch(e.target.value)}
                      placeholder="Search variants..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                  <select
                    value={variantStatusFilter}
                    onChange={e => setVariantStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="discontinued">Discontinued</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="price">Sort: Price</option>
                    <option value="updated">Sort: Updated</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Grid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Variant List */}
            {variantsLoading ? (
              <div className="admin-card p-12 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-400 mr-3" />
                <span className="text-gray-500">Loading variants...</span>
              </div>
            ) : variantsError ? (
              <div className="admin-card p-8 text-center">
                <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
                <p className="text-red-600 mb-3">{variantsError}</p>
                <button onClick={fetchVariants} className="text-sm text-[#145a2c] underline">Retry</button>
              </div>
            ) : filteredVariants.length === 0 ? (
              <div className="admin-card p-12 text-center">
                <Power size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-1">
                  {variantSearch || variantStatusFilter !== 'all' ? 'No variants match your filters' : 'No variants added yet'}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {variantSearch || variantStatusFilter !== 'all' ? 'Try adjusting filters' : 'Create your first variant'}
                </p>
                {!variantSearch && variantStatusFilter === 'all' && (
                  <button onClick={handleAdd} className="admin-btn-primary inline-flex">
                    <Plus size={16} /> Add First Variant
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead className="admin-table-head">
                      <tr>
                        <th className="w-12"></th>
                        <th>Variant</th>
                        <th className="hidden md:table-cell">Price</th>
                        <th className="hidden lg:table-cell">Battery</th>
                        <th className="hidden lg:table-cell">Range</th>
                        <th className="hidden xl:table-cell">Updated</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="admin-table-body">
                      {filteredVariants.map(variant => (
                        <tr key={variant.id} className="group">
                          <td>
                            <div className="relative">
                              {variant.image_url ? (
                                <img src={variant.image_url} alt={variant.name} className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <ImageIcon size={16} className="text-gray-300" />
                                </div>
                              )}
                              {variant.is_featured && (
                                <span className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                                  <Star size={10} className="text-white" fill="white" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="font-semibold text-gray-900 text-sm">{variant.name}</div>
                            {variant.short_name && <div className="text-xs text-gray-500">{variant.short_name}</div>}
                            <div className="flex items-center gap-2 mt-1">
                              {variant.brochure_url && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                  <FileText size={10} /> Brochure
                                </span>
                              )}
                              {variant.gallery_urls && variant.gallery_urls.length > 0 && (
                                <span className="text-xs text-gray-400">{variant.gallery_urls.length} images</span>
                              )}
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            <span className="text-sm font-semibold text-gray-900">Rs. {formatVariantPrice(variant.price)}</span>
                          </td>
                          <td className="hidden lg:table-cell">
                            <span className="text-sm text-gray-600">
                              {variant.battery_capacity_kwh ? `${variant.battery_capacity_kwh} kWh` : '—'}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell">
                            <span className="text-sm text-gray-600">
                              {variant.range_km ? `${variant.range_km} km` : '—'}
                            </span>
                          </td>
                          <td className="hidden xl:table-cell">
                            <span className="text-xs text-gray-500">{formatDate(variant.updated_at)}</span>
                          </td>
                          <td>
                            <span className={cn(
                              'admin-badge',
                              variant.status === 'active' && 'bg-green-100 text-green-700',
                              variant.status === 'discontinued' && 'bg-gray-100 text-gray-600',
                              variant.status === 'upcoming' && 'bg-blue-100 text-blue-700',
                            )}>
                              {variant.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!variant.is_featured && variant.status === 'active' && (
                                <button
                                  onClick={() => handleSetDefault(variant.id)}
                                  title="Set as default"
                                  className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg"
                                >
                                  <Star size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(variant)}
                                title="Edit"
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(variant)}
                                title="Duplicate"
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Copy size={14} />
                              </button>
                              {variant.status === 'active' && (
                                <button
                                  onClick={() => handleArchive(variant)}
                                  title="Archive"
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                  <Archive size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => setConfirmDelete(variant.id)}
                                title="Delete"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVariants.map(variant => (
                  <div key={variant.id} className="admin-card p-4 group">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        {variant.image_url ? (
                          <img src={variant.image_url} alt={variant.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-300" />
                          </div>
                        )}
                        {variant.is_featured && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                            <Star size={10} className="text-white" fill="white" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{variant.name}</div>
                        {variant.short_name && <div className="text-xs text-gray-500">{variant.short_name}</div>}
                        <div className="text-sm font-semibold text-[#145a2c] mt-1">Rs. {formatVariantPrice(variant.price)}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {variant.battery_capacity_kwh && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                              <Battery size={10} /> {variant.battery_capacity_kwh} kWh
                            </span>
                          )}
                          {variant.range_km && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                              <TrendingUp size={10} /> {variant.range_km} km
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          'admin-badge mt-2 inline-block',
                          variant.status === 'active' && 'bg-green-100 text-green-700',
                          variant.status === 'discontinued' && 'bg-gray-100 text-gray-600',
                          variant.status === 'upcoming' && 'bg-blue-100 text-blue-700',
                        )}>
                          {variant.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!variant.is_featured && variant.status === 'active' && (
                        <button onClick={() => handleSetDefault(variant.id)} title="Set as default" className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-lg">
                          <Star size={14} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(variant)} title="Edit" className="p-1.5 text-gray-400 hover:text-[#145a2c] rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDuplicate(variant)} title="Duplicate" className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => setConfirmDelete(variant.id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - No Vehicle Selected */}
        {!selectedVehicle && !vehiclesLoading && (
          <div className="admin-card p-16 text-center">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Vehicle Above</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Click on a vehicle card to view and manage its variants. Each vehicle can have multiple variants with different pricing, specifications, and features.
            </p>
          </div>
        )}
      </div>

      {/* Drawer */}
      <VariantDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingVariant(null); }}
        onSave={handleSave}
        variant={editingVariant}
        vehicleId={selectedVehicleId || ''}
        isDefault={!!editingVariant?.is_featured}
        hasOtherVariants={variants.length > 1}
      />

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="admin-modal-overlay" onClick={() => setBulkImportOpen(false)}>
          <div className="admin-modal max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-lg font-bold text-gray-900">Bulk Import Variants</h3>
              <button onClick={() => setBulkImportOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="admin-modal-body">
              <BulkImport
                type="variants"
                onComplete={(stats) => {
                  if (stats.success > 0) {
                    fetchVehicles();
                    fetchVariants();
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="text-lg font-bold text-gray-900">Delete Variant?</h3>
            </div>
            <div className="admin-modal-body">
              <p className="text-sm text-gray-600">This action cannot be undone. The variant and all its data will be permanently removed.</p>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="admin-btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="admin-btn bg-red-600 text-white hover:bg-red-700"
              >
                {deleting === confirmDelete ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
