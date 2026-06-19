'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Zap, Gauge, Battery, Clock, Power, ArrowRight, Square, SquareCheck as CheckSquare, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VehicleVariant } from '@/lib/types';

// Color swatch mapping for common vehicle colors
const colorSwatchMap: Record<string, string> = {
  black: '#1a1a1a',
  midnight: '#0a0a0a',
  obsidian: '#1c1c1c',
  white: '#f5f5f5',
  pearl: '#f0ebe3',
  glacier: '#e8f4f8',
  silver: '#c0c0c0',
  metallic: '#a8a8a8',
  grey: '#808080',
  gray: '#808080',
  graphite: '#4a4a4a',
  slate: '#708090',
  blue: '#1e40af',
  navy: '#1e3a5f',
  ocean: '#0077b6',
  celestial: '#4a90d9',
  red: '#dc2626',
  crimson: '#b91c1c',
  scarlet: '#ff2400',
  maroon: '#800000',
  green: '#16a34a',
  olive: '#556b2f',
  forest: '#228b22',
  emerald: '#047857',
  teal: '#0d9488',
  bronze: '#cd7f32',
  copper: '#b87333',
  gold: '#ffd700',
  champagne: '#f7e7ce',
  orange: '#ea580c',
  amber: '#d97706',
  yellow: '#eab308',
  purple: '#7c3aed',
  violet: '#8b5cf6',
  brown: '#78350f',
  tan: '#d2b48c',
  beige: '#f5f5dc',
};

function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(colorSwatchMap)) {
    if (normalized.includes(key)) return hex;
  }
  return '#9ca3af';
}

interface VehicleVariantSelectorProps {
  colors: string[];
  priceMin: number;
  priceMax: number;
  vehicleName: string;
  vehicleSlug?: string;
  variants?: VehicleVariant[];
}

export default function VehicleVariantSelector({
  colors,
  priceMin,
  priceMax,
  vehicleName,
  vehicleSlug,
  variants = [],
}: VehicleVariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(
    variants.length > 0 ? variants[0] : null
  );
  const [compareList, setCompareList] = useState<string[]>([]);

  const toggleCompare = (variantId: string) => {
    setCompareList(prev =>
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  // Generate color variants with visual swatches
  const colorVariants = colors.map((color) => ({
    name: color,
    hex: getColorHex(color),
  }));

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} Lakh`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const hasVariants = variants.length >= 1;

  return (
    <div className="space-y-5">
      {/* Variants Table (BikeDekho-style) */}
      {hasVariants && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Power size={16} className="text-[#145a2c]" />
            <h3 className="text-sm font-bold text-gray-900">Variants & Prices</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
              {variants.length} variants
            </span>
          </div>

          {/* Variants Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-100">
              <div className="col-span-4">Variant</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-center">Range</div>
              <div className="col-span-2 text-center">Action</div>
              <div className="col-span-2 text-center">Compare</div>
            </div>

            {/* Table Body */}
            {variants.map((variant, idx) => (
              <div
                key={variant.id}
                className={cn(
                  'grid grid-cols-12 gap-2 px-4 py-4 items-center transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  selectedVariant?.id === variant.id && 'bg-green-50/50'
                )}
              >
                {/* Variant Name + Color */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{variant.name}</span>
                      {variant.color && (
                        <span
                          className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: variant.color_hex || getColorHex(variant.color) }}
                          title={variant.color}
                        />
                      )}
                    </div>
                    {variant.color && (
                      <span className="text-xs text-gray-500">{variant.color}</span>
                    )}
                    {!variant.is_available && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-2">
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 text-right">
                  <div className="font-bold text-gray-900">{formatPrice(variant.price)}</div>
                  <div className="text-[10px] text-gray-400">Ex-showroom</div>
                </div>

                {/* Range */}
                <div className="col-span-2 text-center">
                  {variant.range_km ? (
                    <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
                      <Zap size={12} />
                      {variant.range_km} km
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>

                {/* Action Button */}
                <div className="col-span-2 text-center">
                  <button
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      selectedVariant?.id === variant.id
                        ? 'bg-[#145a2c] text-white shadow-md'
                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                    )}
                  >
                    <Sparkles size={12} />
                    {selectedVariant?.id === variant.id ? 'Selected' : 'Get Offer'}
                  </button>
                </div>

                {/* Compare Checkbox */}
                <div className="col-span-2 flex justify-center">
                  <button
                    onClick={() => toggleCompare(variant.id)}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      compareList.includes(variant.id)
                        ? 'text-[#145a2c] bg-green-50'
                        : 'text-gray-300 hover:text-gray-400 hover:bg-gray-50'
                    )}
                    title={compareList.includes(variant.id) ? 'Remove from compare' : 'Add to compare'}
                  >
                    {compareList.includes(variant.id) ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* Compare Bar */}
            {compareList.length > 0 && (
              <div className="px-4 py-3 bg-gradient-to-r from-[#0a2e14] to-[#145a2c] flex items-center justify-between">
                <div className="text-white text-sm">
                  <span className="font-semibold">{compareList.length}</span> variant{compareList.length > 1 ? 's' : ''} selected for comparison
                </div>
                <Link
                  href={`/compare?vehicles=${vehicleSlug}&variants=${compareList.join(',')}`}
                  className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                  Compare Now
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Variant Summary */}
      {selectedVariant && (
        <div className="bg-gradient-to-br from-[#0a2e14] to-[#145a2c] rounded-xl p-5 text-white">
          <div className="text-xs text-green-300 uppercase tracking-wide mb-2">Your Selection</div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-bold text-lg">{vehicleName}</div>
              <div className="text-green-200 text-sm">{selectedVariant.name}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(selectedVariant.price)}</div>
              <div className="text-green-300 text-xs">Ex-showroom</div>
            </div>
          </div>

          {selectedVariant.range_km && (
            <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-white/10">
              {selectedVariant.range_km && (
                <div className="text-center">
                  <Zap size={14} className="text-green-300 mx-auto mb-1" />
                  <div className="text-sm font-bold">{selectedVariant.range_km} km</div>
                  <div className="text-xs text-green-200/70">Range</div>
                </div>
              )}
              {selectedVariant.top_speed_kmh && (
                <div className="text-center">
                  <Gauge size={14} className="text-green-300 mx-auto mb-1" />
                  <div className="text-sm font-bold">{selectedVariant.top_speed_kmh} km/h</div>
                  <div className="text-xs text-green-200/70">Top Speed</div>
                </div>
              )}
              {selectedVariant.battery_capacity_kwh && (
                <div className="text-center">
                  <Battery size={14} className="text-green-300 mx-auto mb-1" />
                  <div className="text-sm font-bold">{selectedVariant.battery_capacity_kwh} kWh</div>
                  <div className="text-xs text-green-200/70">Battery</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Color Selector - for vehicles without formal variants but with colors */}
      {colors.length > 0 && !hasVariants && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-[#145a2c]/10 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#145a2c]" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">Available Colors</h3>
          </div>

          {/* Color Swatches */}
          <div className="flex flex-wrap gap-3">
            {colorVariants.map((variant) => (
              <button
                key={variant.name}
                onClick={() => setSelectedColor(variant.name)}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-200',
                  selectedColor === variant.name
                    ? 'bg-[#145a2c]/5 ring-2 ring-[#145a2c]/30'
                    : 'hover:bg-gray-50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
                    selectedColor === variant.name && 'ring-2 ring-offset-2 ring-[#145a2c]'
                  )}
                  style={{
                    backgroundColor: variant.hex,
                    boxShadow: ['#f5f5f5', '#e8f4f8', '#f0ebe3', '#ffd700'].includes(variant.hex)
                      ? 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                      : undefined
                  }}
                >
                  {selectedColor === variant.name && (
                    <Check
                      size={18}
                      className={cn(
                        ['#f5f5f5', '#e8f4f8', '#f0ebe3', '#ffd700', '#f7e7ce'].includes(variant.hex)
                          ? 'text-gray-800'
                          : 'text-white'
                      )}
                    />
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium transition-colors whitespace-nowrap',
                  selectedColor === variant.name ? 'text-[#145a2c]' : 'text-gray-600'
                )}>
                  {variant.name}
                </span>
              </button>
            ))}
          </div>

          {/* Price Display */}
          {selectedColor && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {vehicleName} - <span className="font-semibold text-[#145a2c]">{selectedColor}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  {priceMin === priceMax || priceMax === 0
                    ? `Rs. ${(priceMin / 100000).toFixed(2)}L`
                    : `Rs. ${(priceMin / 100000).toFixed(2)}L - Rs. ${(priceMax / 100000).toFixed(2)}L`}
                </div>
                <div className="text-xs text-gray-500">Ex-showroom</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
