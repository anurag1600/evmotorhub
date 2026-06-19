'use client';

import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

export default function VehicleVariantSelector({
  colors,
  priceMin,
  priceMax,
  vehicleName,
}: VehicleVariantSelectorProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0] || null);
  const hasPriceRange = priceMin !== priceMax && priceMax > 0;

  // Generate color variants with visual swatches
  const colorVariants = colors.map((color) => ({
    name: color,
    hex: getColorHex(color),
  }));

  if (colors.length === 0) return null;

  return (
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

      {/* Selected Variant Info */}
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
                    ₹{(priceMin / 100000).toFixed(2)}L - ₹{(priceMax / 100000).toFixed(2)}L
                  </>
                ) : (
                  `₹${(priceMin / 100000).toFixed(2)}L`
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
  );
}
