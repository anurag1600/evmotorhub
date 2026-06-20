'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Gauge, Battery, Clock, Power, Cog, Activity, Ruler, Palette, Check, ArrowRight, Scale, Calculator, ShoppingBag, X, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleVariant } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface VariantDetailPanelProps {
  variant: VehicleVariant | null;
  vehicleName: string;
  vehicleSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const specGroups = [
  {
    title: 'Performance',
    icon: Activity,
    specs: [
      { key: 'range_km', label: 'Range', unit: 'km', icon: Zap },
      { key: 'top_speed_kmh', label: 'Top Speed', unit: 'km/h', icon: Gauge },
      { key: 'motor_power_kw', label: 'Motor Power', unit: 'kW', icon: Power },
    ],
  },
  {
    title: 'Battery & Charging',
    icon: Battery,
    specs: [
      { key: 'battery_capacity_kwh', label: 'Battery Capacity', unit: 'kWh', icon: Battery },
      { key: 'charging_time_hrs', label: 'Charging Time', unit: 'hrs', icon: Clock },
    ],
  },
];

function formatPrice(price: number) {
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lakh`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

function extractSpecValue(variant: VehicleVariant, key: string): string | number | null {
  const directValue = (variant as any)[key];
  if (directValue !== null && directValue !== undefined) {
    return directValue;
  }
  const specs = variant.specifications || {};
  return specs[key] ?? null;
}

export default function VariantDetailPanel({
  variant,
  vehicleName,
  vehicleSlug,
  open,
  onOpenChange,
}: VariantDetailPanelProps) {
  if (!variant) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader className="space-y-3 pb-4 border-b border-gray-100">
          {/* Brand Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
              {vehicleName}
            </span>
            {variant.color && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-gray-200"
                  style={{ backgroundColor: variant.color_hex || '#888' }}
                />
                {variant.color}
              </span>
            )}
          </div>

          <SheetTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {variant.name}
          </SheetTitle>

          {/* Price */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 -mx-6 sm:-mx-0 sm:mx-0">
            <div className="text-xs text-gray-500 mb-0.5">Ex-showroom Price</div>
            <div className="text-3xl font-bold text-[#145a2c]">
              {formatPrice(variant.price)}
            </div>
          </div>
        </SheetHeader>

        <div className="py-5 space-y-6">
          {/* Variant Image */}
          {variant.image_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={variant.image_url}
                alt={`${vehicleName} ${variant.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 384px"
              />
            </div>
          )}

          {/* Quick Specs Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Zap size={14} className="text-[#145a2c]" />
              Key Specifications
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {variant.range_km && (
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Zap size={16} className="mx-auto text-green-600 mb-1" />
                  <div className="text-lg font-bold text-green-700">{variant.range_km}</div>
                  <div className="text-xs text-green-600/70">km Range</div>
                </div>
              )}
              {variant.top_speed_kmh && (
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Gauge size={16} className="mx-auto text-blue-600 mb-1" />
                  <div className="text-lg font-bold text-blue-700">{variant.top_speed_kmh}</div>
                  <div className="text-xs text-blue-600/70">km/h</div>
                </div>
              )}
              {variant.battery_capacity_kwh && (
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Battery size={16} className="mx-auto text-amber-600 mb-1" />
                  <div className="text-lg font-bold text-amber-700">{variant.battery_capacity_kwh}</div>
                  <div className="text-xs text-amber-600/70">kWh</div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Specs */}
          {specGroups.map((group) => {
            const items = group.specs
              .map((s) => ({
                ...s,
                value: extractSpecValue(variant, s.key),
              }))
              .filter((s) => s.value !== null);

            if (items.length === 0) return null;

            return (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <group.icon size={14} className="text-[#145a2c]" />
                  {group.title}
                </h3>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <div
                      key={item.key}
                      className={cn(
                        'flex items-center justify-between px-4 py-3',
                        idx === 0 && 'rounded-t-xl',
                        idx === items.length - 1 && 'rounded-b-xl'
                      )}
                    >
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <item.icon size={14} className="text-gray-400" />
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Features */}
          {variant.features && variant.features.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Cog size={14} className="text-[#145a2c]" />
                Features
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {variant.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <Check size={12} className="text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specifications JSON (extra specs) */}
          {variant.specifications && Object.keys(variant.specifications).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Ruler size={14} className="text-[#145a2c]" />
                Full Specifications
              </h3>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {Object.entries(variant.specifications).map(([key, value], idx, arr) => (
                  <div
                    key={key}
                    className={cn(
                      'flex justify-between px-4 py-2.5',
                      idx === 0 && 'rounded-t-xl',
                      idx === arr.length - 1 && 'rounded-b-xl'
                    )}
                  >
                    <span className="text-sm text-gray-600">{key}</span>
                    <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/compare?vehicles=${vehicleSlug}&variants=${variant.id}`}
              className="flex items-center justify-center gap-2 border border-[#145a2c] text-[#145a2c] rounded-xl py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              <Scale size={15} />
              Compare
            </Link>
            <Link
              href="/emi-calculator"
              className="flex items-center justify-center gap-2 bg-[#145a2c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0f4020] transition-colors"
            >
              <Calculator size={15} />
              EMI Calc
            </Link>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-3 text-sm font-bold hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg shadow-orange-500/20">
            <ShoppingBag size={16} />
            Get Best Offer
            <ArrowRight size={14} />
          </button>

          {!variant.is_available && (
            <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg py-2">
              Currently out of stock. Contact dealer for availability.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
