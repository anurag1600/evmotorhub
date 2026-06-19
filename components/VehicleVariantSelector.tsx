'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Palette, ChevronRight, Zap, Gauge, Battery, Clock, Power } from 'lucide-react';
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
  return '#9ca3af'; // Default gray
}

interface VehicleVariantSelectorProps {
  colors: string[];
  priceMin: number;
  priceMax: number;
  vehicleName: string;
  variants?: VehicleVariant[];
}

export default function VehicleVariantSelector({
  colors,
  priceMin,
  priceMax,
  vehicleName,
  variants = [],
}: VehicleVariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(
    variants.length > 0 ? variants[0] : null
  );
  const hasPriceRange = priceMin !== priceMax && priceMax > 0;

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
      {/* Variant Cards - if we have actual variants */}
      {hasVariants && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Power size={16} className="text-[#145a2c]" />
            <h3 className="text-sm font-bold text-gray-800">Choose Your Variant</h3>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-auto">
              {variants.length} variants
            </span>
          </div>

          <div className="grid gap-3">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={cn(
                  'group relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                  selectedVariant?.id === variant.id
                    ? 'border-[#145a2c] bg-[#145a2c]/5 shadow-sm'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                )}
              >
                {/* Variant Image */}
                {variant.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={variant.image_url}
                      alt={variant.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                {/* Variant Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'font-semibold text-sm',
                      selectedVariant?.id === variant.id ? 'text-[#145a2c]' : 'text-gray-900'
                    )}>
                      {variant.name}
                    </span>
                    {variant.color && (
                      <span
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: variant.color_hex || getColorHex(variant.color) }}
                        title={variant.color}
                      />
                    )}
                  </div>

                  {/* Quick Specs */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    {variant.range_km && (
                      <span className="flex items-center gap-1">
                        <Zap size={10} />
                        {variant.range_km} km
                      </span>
                    )}
                    {variant.top_speed_kmh && (
                      <span className="flex items-center gap-1">
                        <Gauge size={10} />
                        {variant.top_speed_kmh} km/h
                      </span>
                    )}
                    {variant.battery_capacity_kwh && (
                      <span className="flex items-center gap-1">
                        <Battery size={10} />
                        {variant.battery_capacity_kwh} kWh
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className={cn(
                    'font-bold text-lg',
                    selectedVariant?.id === variant.id ? 'text-[#145a2c]' : 'text-gray-900'
                  )}>
                    {formatPrice(variant.price)}
                  </div>
                  {!variant.is_available && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Selected indicator */}
                {selectedVariant?.id === variant.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#145a2c] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector - if we have colors but no variants, or as additional color picker */}
      {colors.length > 0 && !hasVariants && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-[#145a2c]" />
            <h3 className="text-sm font-bold text-gray-800">Choose your color</h3>
          </div>

          {/* Color Swatches */}
          <div className="flex flex-wrap gap-3 mb-4">
            {colorVariants.map((variant) => (
              <button
                key={variant.name}
                onClick={() => setSelectedColor(variant.name)}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200',
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
                    boxShadow: variant.hex === '#f5f5f5' || variant.hex === '#e8f4f8' || variant.hex === '#f0ebe3'
                      ? 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                      : undefined
                  }}
                >
                  {selectedColor === variant.name && (
                    <Check
                      size={18}
                      className={cn(
                        'transition-colors',
                        variant.hex === '#f5f5f5' || variant.hex === '#e8f4f8' || variant.hex === '#f0ebe3' || variant.hex === '#ffd700' || variant.hex === '#f7e7ce'
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

          {/* Selected Config Info */}
          {selectedColor && (
            <div className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Selected</div>
                  <div className="font-semibold text-gray-900">
                    {vehicleName} - <span className="text-[#145a2c]">{selectedColor}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">
                    {hasPriceRange ? 'Price Range' : 'Price'}
                  </div>
                  <div className="font-bold text-[#145a2c] text-lg">
                    {hasPriceRange ? (
                      <>
                        Rs. {(priceMin / 100000).toFixed(2)}L - Rs. {(priceMax / 100000).toFixed(2)}L
                      </>
                    ) : (
                      `Rs. ${(priceMin / 100000).toFixed(2)}L`
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Color count indicator */}
          <div className="mt-3 text-xs text-gray-500 text-center">
            {colors.length} color{colors.length > 1 ? 's' : ''} available
          </div>
        </div>
      )}

      {/* Selected Variant Summary */}
      {selectedVariant && (
        <div className="bg-gradient-to-br from-[#0a2e14] to-[#145a2c] rounded-2xl p-5 text-white">
          <div className="text-xs text-green-300 uppercase tracking-wide mb-2">Your Selection</div>
          <div className="flex items-center justify-between mb-4">
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
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
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
    </div>
  );
}
