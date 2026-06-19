'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Zap, Gauge, Battery, Clock, Power, ArrowRight } from 'lucide-react';
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

  // Generate color variants with visual swatches
  const colorVariants = colors.map((color) => ({
    name: color,
    hex: getColorHex(color),
  }));

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `Rs. ${(price / 100000).toFixed(2)}L`;
    }
    return `Rs. ${price.toLocaleString()}`;
  };

  const hasVariants = variants.length > 1;

  return (
    <div className="space-y-5">
      {/* Premium Variant Cards */}
      {hasVariants && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Power size={16} className="text-[#145a2c]" />
            <h3 className="text-sm font-bold text-gray-800">Choose Your Variant</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
              {variants.length} variants
            </span>
          </div>

          {/* Variant Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'group relative bg-white rounded-xl border-2 p-4 text-left transition-all duration-200',
                  selectedVariant?.id === variant.id
                    ? 'border-[#145a2c] shadow-lg bg-[#145a2c]/5'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                )}
              >
                {/* Selected Badge */}
                {selectedVariant?.id === variant.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#145a2c] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}

                {/* Variant Image */}
                {variant.image_url && (
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-gray-100 mb-3">
                    <Image
                      src={variant.image_url}
                      alt={variant.name}
                      width={200}
                      height={120}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* Variant Name */}
                <div className="mb-2">
                  <span className={cn(
                    'font-semibold text-sm',
                    selectedVariant?.id === variant.id ? 'text-[#145a2c]' : 'text-gray-900'
                  )}>
                    {variant.name}
                  </span>
                  {variant.color && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: variant.color_hex || getColorHex(variant.color) }}
                      />
                      <span className="text-xs text-gray-500">{variant.color}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className={cn(
                  'text-lg font-bold mb-3',
                  selectedVariant?.id === variant.id ? 'text-[#145a2c]' : 'text-gray-900'
                )}>
                  {formatPrice(variant.price)}
                </div>

                {/* Key Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {variant.range_km && (
                    <div className="flex items-center gap-1">
                      <Zap size={10} className="text-green-500" />
                      <span>{variant.range_km} km</span>
                    </div>
                  )}
                  {variant.top_speed_kmh && (
                    <div className="flex items-center gap-1">
                      <Gauge size={10} className="text-blue-500" />
                      <span>{variant.top_speed_kmh} km/h</span>
                    </div>
                  )}
                  {variant.battery_capacity_kwh && (
                    <div className="flex items-center gap-1">
                      <Battery size={10} className="text-amber-500" />
                      <span>{variant.battery_capacity_kwh} kWh</span>
                    </div>
                  )}
                  {variant.charging_time_hrs && (
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-teal-500" />
                      <span>{variant.charging_time_hrs} hrs</span>
                    </div>
                  )}
                </div>

                {/* Unavailable Badge */}
                {!variant.is_available && (
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                    Out of stock
                  </div>
                )}
              </button>
            ))}
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
