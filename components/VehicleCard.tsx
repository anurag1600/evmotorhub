import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import { Zap, Gauge, Clock, Battery, ArrowRight, Calendar } from 'lucide-react';
import { Vehicle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentColor, getSegmentLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle & { manufacturers?: { name: string; slug: string } };
  compact?: boolean;
}

export default function VehicleCard({ vehicle, compact = false }: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group block">
      <div className={cn(
        'bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:border-gray-200 hover:-translate-y-1',
        compact ? 'shadow-sm' : 'shadow-sm'
      )}>
        {/* Image */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <div className={cn('relative w-full', compact ? 'h-36' : 'h-44 sm:h-48')}>
            <ImageWithFallback
              src={vehicle.image_url || ''}
              alt={vehicle.name}
              fallbackCategory="vehicle"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {vehicle.is_upcoming && (
              <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                <Calendar size={10} />
                Upcoming
              </span>
            )}
            {vehicle.is_latest && !vehicle.is_upcoming && (
              <span className="flex items-center gap-1 bg-[#145a2c] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                <Zap size={10} />
                New Launch
              </span>
            )}
            {vehicle.is_featured && !vehicle.is_latest && !vehicle.is_upcoming && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                Featured
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5">
            <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full shadow', getSegmentColor(vehicle.segment))}>
              {getSegmentLabel(vehicle.segment)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Manufacturer + Type */}
          <div className="flex items-center justify-between mb-2">
            {vehicle.manufacturers && (
              <span className="text-[11px] font-semibold text-[#145a2c] bg-green-50 px-2.5 py-1 rounded-full">
                {vehicle.manufacturers.name}
              </span>
            )}
            <span className="text-[11px] text-gray-500 font-medium">{getVehicleTypeLabel(vehicle.type)}</span>
          </div>

          {/* Name */}
          <h3 className="font-bold text-gray-900 text-base mb-3 group-hover:text-[#145a2c] transition-colors leading-snug">
            {vehicle.name}
          </h3>

          {/* Key Specs */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 bg-amber-50 rounded-lg p-2.5">
                <Zap size={14} className="text-amber-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Range</div>
                  <div className="text-sm font-bold text-gray-900">{vehicle.range_km} km</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-2.5">
                <Gauge size={14} className="text-blue-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Speed</div>
                  <div className="text-sm font-bold text-gray-900">{vehicle.top_speed_kmh} km/h</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2.5">
                <Battery size={14} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Battery</div>
                  <div className="text-sm font-bold text-gray-900">{vehicle.battery_capacity_kwh} kWh</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg p-2.5">
                <Clock size={14} className="text-purple-600 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Charge</div>
                  <div className="text-sm font-bold text-gray-900">{vehicle.charging_time_hrs}h</div>
                </div>
              </div>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {vehicle.is_upcoming ? (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Expected Price</div>
                  <div className="text-lg font-bold text-[#145a2c]">
                    {vehicle.price_min > 0 ? formatPrice(vehicle.price_min) : 'TBA'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-medium">Starting at</div>
                  <div className="text-lg font-bold text-[#145a2c]">{formatPrice(vehicle.price_min)}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#145a2c] px-4 py-2 rounded-lg group-hover:bg-[#0f4020] transition-colors">
              View
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
