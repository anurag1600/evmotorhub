'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleVariant, Manufacturer } from '@/lib/types';
import { useVariants, VariantInput } from '@/hooks/useVariants';
import { Power, Plus, Pencil, Trash2, Copy, Star, Search, Loader as Loader2, Image as ImageIcon, FileText, CircleAlert as AlertCircle, ChevronDown, Car, Battery, TrendingUp, Clock, Zap, ArrowLeft, CircleCheck as CheckCircle2, Archive, MoveVertical as MoreVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import VariantDrawer from '@/components/admin/VariantDrawer';

interface VehicleWithManufacturer extends Vehicle {
  manufacturers?: Manufacturer;
}

const ITEMS_PER_PAGE = 10;

export default function VariantsAdminPage() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<VehicleWithManufacturer[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(searchParams.get('vehicle'));
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VehicleVariant | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [variantSearch, setVariantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updated'>('name');
  const [currentPage, setCurrentPage] = useState(1);

  const selectedVehicle = useMemo(
    () => vehicles.find(v => v.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const { variants, loading: variantsLoading, error: variantsError, fetchVariants, createVariant, updateVariant, deleteVariant, duplicateVariant, setDefaultVariant } = useVariants(selectedVehicleId);

  // Fetch all vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setVehiclesLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, name, slug, type, segment, image_url, manufacturer_id, default_variant_id, updated_at, manufacturers:id(name, slug)')
          .order('name');
        if (error) throw error;
        setVehicles((data || []) as unknown as VehicleWithManufacturer[]);
      } catch (e: any) {
        toast.error('Failed to load vehicles');
      } finally {
        setVehiclesLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // Sync URL param
  useEffect(() => {
    const param = searchParams.get('vehicle');
    if (param && param !== selectedVehicleId) {
      setSelectedVehicleId(param);
    }
  }, [searchParams]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles;
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter(v => v.name.toLowerCase().includes(q) || v.manufacturers?.name?.toLowerCase().includes(q));
  }, [vehicles, vehicleSearch]);

  const filteredVariants = useMemo(() => {
    let result = [...variants];
    if (variantSearch.trim()) {
      const q = variantSearch.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(q) || (v.short_name || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [variants, variantSearch, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredVariants.length / ITEMS_PER_PAGE);
  const paginatedVariants = filteredVariants.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [selectedVehicleId, variantSearch, statusFilter, sortBy]);

  const stats = useMemo(() => ({
    total: variants.length,
    active: variants.filter(v => v.status === 'active').length,
    discontinued: variants.filter(v => v.status === 'discontinued').length,
    upcoming: variants.filter(v => v.status === 'upcoming').length,
    defaultVariant: variants.find(v => v.is_featured)?.name || 'None',
  }), [variants]);

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    setShowVehicleDropdown(false);
    setVehicleSearch('');
  };

  const handleAdd = () => {
    if (!selectedVehicleId) { toast.error('Select a vehicle first'); return; }
    setEditingVariant(null);
    setDrawerOpen(true);
  };

  const handleEdit = (variant: VehicleVariant) => {
    setEditingVariant(variant);
    setDrawerOpen(true);
  };

  const handleSave = async (input: VariantInput, id?: string) => {
    if (id) {
      await updateVariant(id, input);
      toast.success('Variant updated successfully');
    } else {
      await createVariant(input);
      toast.success('Variant created successfully');
    }
    setDrawerOpen(false);
    setEditingVariant(null);
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
      toast.success('Variant duplicated successfully');
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

  const formatPrice = (price: number) => {
    if (price >= 100000) return `Rs. ${(price / 100000).toFixed(2)}L`;
    return `Rs. ${price.toLocaleString('en-IN')}`;
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
            <h1 className="admin-title">Variant Management</h1>
            <p className="admin-subtitle">Manage vehicle variants, pricing, specifications, and media</p>
          </div>
          {selectedVehicleId && (
            <button onClick={handleAdd} className="admin-btn-primary">
              <Plus size={18} /> Add Variant
            </button>
          )}
        </div>

        {/* Vehicle Selector */}
        <div className="admin-card p-5 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Vehicle</label>
          {vehiclesLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Loading vehicles...
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm hover:border-[#145a2c] transition-colors"
              >
                <span className="flex items-center gap-2">
                  {selectedVehicle ? (
                    <>
                      {selectedVehicle.image_url && <img src={selectedVehicle.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                      <span className="font-medium text-gray-900">{selectedVehicle.name}</span>
                      {selectedVehicle.manufacturers && <span className="text-gray-500">• {selectedVehicle.manufacturers.name}</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">Choose a vehicle to manage its variants...</span>
                  )}
                </span>
                <ChevronDown size={18} className={cn('text-gray-400 transition-transform', showVehicleDropdown && 'rotate-180')} />
              </button>

              {showVehicleDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                        placeholder="Search vehicles..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredVehicles.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">No vehicles found</p>
                    ) : (
                      filteredVehicles.map(v => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVehicle(v.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left',
                            v.id === selectedVehicleId && 'bg-green-50'
                          )}
                        >
                          {v.image_url ? (
                            <img src={v.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Car size={14} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{v.name}</div>
                            <div className="text-xs text-gray-500">{v.manufacturers?.name || 'Unknown'} • {v.type}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Summary + Variant List */}
        {selectedVehicle && (
          <>
            {/* Summary Card */}
            <div className="admin-card p-5 mb-6">
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-shrink-0">
                  {selectedVehicle.image_url ? (
                    <img src={selectedVehicle.image_url} alt={selectedVehicle.name} className="w-24 h-24 rounded-xl object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center"><Car size={32} className="text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vehicle</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedVehicle.name}</p>
                    <p className="text-xs text-gray-500">{selectedVehicle.manufacturers?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Variants</p>
                    <p className="text-2xl font-bold text-[#145a2c] mt-0.5">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Default Variant</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" fill="currentColor" />
                      {stats.defaultVariant}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Last Updated</p>
                    <p className="text-sm text-gray-700 mt-0.5">{formatDate(selectedVehicle.updated_at || new Date().toISOString())}</p>
                  </div>
                </div>
              </div>
              {/* Status badges */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <span className="admin-badge-success">{stats.active} Active</span>
                {stats.upcoming > 0 && <span className="admin-badge-info">{stats.upcoming} Upcoming</span>}
                {stats.discontinued > 0 && <span className="admin-badge bg-gray-100 text-gray-600">{stats.discontinued} Discontinued</span>}
              </div>
            </div>

            {/* Filters Bar */}
            <div className="admin-card p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={variantSearch}
                    onChange={e => setVariantSearch(e.target.value)}
                    placeholder="Search variants..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                  />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="discontinued">Discontinued</option>
                  <option value="upcoming">Upcoming</option>
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]">
                  <option value="name">Sort: Name</option>
                  <option value="price">Sort: Price</option>
                  <option value="updated">Sort: Updated</option>
                </select>
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
            ) : paginatedVariants.length === 0 ? (
              <div className="admin-card p-12 text-center">
                <Power size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-1">{variantSearch || statusFilter !== 'all' ? 'No variants match your filters' : 'No variants added yet'}</p>
                <p className="text-xs text-gray-400 mb-4">{variantSearch || statusFilter !== 'all' ? 'Try adjusting filters' : 'Create your first variant to get started'}</p>
                {!variantSearch && statusFilter === 'all' && (
                  <button onClick={handleAdd} className="admin-btn-primary inline-flex"><Plus size={16} /> Add First Variant</button>
                )}
              </div>
            ) : (
              <>
                {/* Table */}
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
                        {paginatedVariants.map(variant => (
                          <tr key={variant.id} className="group">
                            <td>
                              <div className="relative">
                                {variant.image_url ? (
                                  <img src={variant.image_url} alt={variant.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon size={16} className="text-gray-300" /></div>
                                )}
                                {variant.is_featured && (
                                  <span className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5"><Star size={10} className="text-white" fill="white" /></span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="font-semibold text-gray-900 text-sm">{variant.name}</div>
                              {variant.short_name && <div className="text-xs text-gray-500">{variant.short_name}</div>}
                              <div className="flex items-center gap-2 mt-1">
                                {variant.brochure_url && <span className="text-xs text-gray-400 flex items-center gap-0.5"><FileText size={10} /> Brochure</span>}
                                {variant.gallery_urls && variant.gallery_urls.length > 0 && <span className="text-xs text-gray-400">{variant.gallery_urls.length} images</span>}
                                {variant.colors && variant.colors.length > 0 && (
                                  <div className="flex -space-x-0.5">
                                    {variant.colors.slice(0, 3).map((_, i) => (
                                      <span key={i} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: variant.color_hexes?.[i] || '#9ca3af' }} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="hidden md:table-cell"><span className="text-sm font-semibold text-gray-900">{formatPrice(variant.price)}</span></td>
                            <td className="hidden lg:table-cell"><span className="text-sm text-gray-600">{variant.battery_capacity_kwh ? `${variant.battery_capacity_kwh} kWh` : '—'}</span></td>
                            <td className="hidden lg:table-cell"><span className="text-sm text-gray-600">{variant.range_km ? `${variant.range_km} km` : '—'}</span></td>
                            <td className="hidden xl:table-cell"><span className="text-xs text-gray-500">{formatDate(variant.updated_at)}</span></td>
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
                                  <button onClick={() => handleSetDefault(variant.id)} title="Set as default" className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg">
                                    <Star size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleEdit(variant)} title="Edit" className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => handleDuplicate(variant)} title="Duplicate" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                  <Copy size={14} />
                                </button>
                                {variant.status === 'active' && (
                                  <button onClick={() => handleArchive(variant)} title="Archive" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <Archive size={14} />
                                  </button>
                                )}
                                <button onClick={() => setConfirmDelete(variant.id)} title="Delete" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-gray-500">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredVariants.length)} of {filteredVariants.length}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                      >Previous</button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                      >Next</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty State - No Vehicle Selected */}
        {!selectedVehicle && !vehiclesLoading && (
          <div className="admin-card p-16 text-center">
            <Car size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Vehicle to Manage Variants</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Choose a vehicle from the dropdown above to view, create, edit, and manage its variants. Each vehicle can have multiple variants with independent pricing, specs, and media.</p>
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
