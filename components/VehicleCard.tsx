import Link from 'next/link';
import ImageWithFallback from '@/components/ImageWithFallback';
import { Zap, Gauge, Clock, Battery, ArrowRight, Calendar, CircleCheck as CheckCircle2 } from 'lucide-react';
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
        'bg-white rounded-2xl border border-gray-100 overflow-hidden ev-card-hover',
        compact ? 'shadow-sm' : 'shadow-sm'
      )}>
        {/* Image */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-green-50">
          <div className={cn('relative w-full', compact ? 'h-40' : 'h-48 sm:h-52')}>
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
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {vehicle.is_upcoming && (
              <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Calendar size={10} />
                Upcoming
              </span>
            )}
            {vehicle.is_latest && !vehicle.is_upcoming && (
              <span className="flex items-center gap-1 bg-[#145a2c] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Zap size={10} />
                New
              </span>
            )}
            {vehicle.is_featured && !vehicle.is_latest && !vehicle.is_upcoming && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getSegmentColor(vehicle.segment))}>
              {getSegmentLabel(vehicle.segment)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Manufacturer + Type */}
          <div className="flex items-center justify-between mb-1">
            {vehicle.manufacturers && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                {vehicle.manufacturers.name}
              </span>
            )}
            <span className="text-xs text-gray-500">{getVehicleTypeLabel(vehicle.type)}</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-gray-900 text-base mt-2 mb-3 group-hover:text-[#145a2c] transition-colors leading-tight">
            {vehicle.name}
          </h3>

          {/* Key Specs */}
          {!compact && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                <Zap size={13} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Range</div>
                  <div className="text-sm font-semibold text-gray-800">{vehicle.range_km} km</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                <Gauge size={13} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Top Speed</div>
                  <div className="text-sm font-semibold text-gray-800">{vehicle.top_speed_kmh} kmh</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                <Battery size={13} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Battery</div>
                  <div className="text-sm font-semibold text-gray-800">{vehicle.battery_capacity_kwh} kWh</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                <Clock size={13} className="text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Charge</div>
                  <div className="text-sm font-semibold text-gray-800">{vehicle.charging_time_hrs}h</div>
                </div>
              </div>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              {vehicle.is_upcoming ? (
                <div>
                  <div className="text-xs text-gray-500">Expected Price</div>
                  <div className="font-bold text-[#145a2c] text-base">
                    {vehicle.price_min > 0 ? formatPrice(vehicle.price_min) : 'TBA'}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-gray-500">Starting at</div>
                  <div className="font-bold text-[#145a2c] text-base">{formatPrice(vehicle.price_min)}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-[#145a2c] group-hover:gap-2 transition-all">
              View Details
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
