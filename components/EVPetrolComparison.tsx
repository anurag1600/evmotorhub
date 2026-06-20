'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, TrendingUp, PiggyBank, Leaf, Zap, Car, Fuel, Battery,
  Calculator, DollarSign, Calendar, Gauge, BarChart3, TreePine
} from 'lucide-react';

const EV_DATA = {
  perKmEv: 1.2, // Rs/km for EV (electricity ~Rs 6-8/unit, 10-15 km/kWh efficiency)
  perKmPetrolScooter: 3.5, // Rs/km for petrol scooter (~45-50 km/l, Rs 100/l)
  perKmPetrolCar: 8.0, // Rs/km for petrol car (~12-15 km/l, Rs 100/l)
  avgMaintenanceEv: 2500, // Annual maintenance in Rs
  avgMaintenancePetrol: 8000, // Annual maintenance in Rs
  avgEvPricePremium: 20000, // Extra upfront cost for EV vs petrol equivalent
};

export default function EVPetrolComparison() {
  const [dailyKm, setDailyKm] = useState(50);
  const [ownershipYears, setOwnershipYears] = useState(5);
  const [vehicleType, setVehicleType] = useState<'scooter' | 'car'>('scooter');

  // Calculate all values
  const yearlyKm = dailyKm * 365;
  const totalKm = yearlyKm * ownershipYears;

  const perKmPetrol = vehicleType === 'scooter' ? EV_DATA.perKmPetrolScooter : EV_DATA.perKmPetrolCar;

  // Running costs
  const evRunningCostPerYear = yearlyKm * EV_DATA.perKmEv;
  const petrolRunningCostPerYear = yearlyKm * perKmPetrol;
  const monthlyRunningSaving = (petrolRunningCostPerYear - evRunningCostPerYear) / 12;

  // Total costs over ownership
  const evTotalRunning = evRunningCostPerYear * ownershipYears;
  const petrolTotalRunning = petrolRunningCostPerYear * ownershipYears;
  const evTotalMaintenance = EV_DATA.avgMaintenanceEv * ownershipYears;
  const petrolTotalMaintenance = EV_DATA.avgMaintenancePetrol * ownershipYears;

  // Net savings (running + maintenance - premium)
  const runningSavings = petrolTotalRunning - evTotalRunning;
  const maintenanceSavings = petrolTotalMaintenance - evTotalMaintenance;
  const totalSavings = runningSavings + maintenanceSavings - EV_DATA.avgEvPricePremium;
  const monthlySavings = totalSavings / (ownershipYears * 12);
  const annualSavings = totalSavings / ownershipYears;

  // Annual running cost comparison
  const annualRunningSavings = petrolRunningCostPerYear - evRunningCostPerYear;

  // CO2 calculations
  // Petrol emits 2.31 kg CO2 per liter
  const kmPerLiter = vehicleType === 'scooter' ? 45 : 13;
  const petrolLitersTotal = totalKm / kmPerLiter;
  const co2Kg = petrolLitersTotal * 2.31;
  const co2Tonnes = (co2Kg / 1000).toFixed(2);
  const treesEquivalent = Math.round(co2Kg / 21); // 1 tree absorbs ~21 kg CO2/year

  const formatPrice = (val: number): string => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakh`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatCompact = (val: number): string => {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full mb-4 shadow-lg shadow-green-200">
            <TrendingUp size={14} />
            Savings Calculator
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            EV vs Petrol: The Real Savings
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            See exactly how much you&apos;ll save by switching to electric. Real numbers, real savings.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Calculator */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-100/50 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Calculator size={16} className="text-white" />
                </div>
                <span className="font-bold text-gray-900">Calculate Your Savings</span>
              </div>

              {/* Vehicle Type Toggle */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Vehicle Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setVehicleType('scooter')}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      vehicleType === 'scooter'
                        ? 'bg-[#145a2c] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Scooter/Bike
                  </button>
                  <button
                    onClick={() => setVehicleType('car')}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      vehicleType === 'car'
                        ? 'bg-[#145a2c] text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Car
                  </button>
                </div>
              </div>

              {/* Daily Distance Slider */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Daily Commute</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{dailyKm} km/day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={dailyKm}
                  onChange={(e) => setDailyKm(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-green-200 to-green-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                  <span>0 km</span>
                  <span>75 km</span>
                  <span>150 km</span>
                </div>
              </div>

              {/* Ownership Slider */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Ownership Period</span>
                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{ownershipYears} years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={ownershipYears}
                  onChange={(e) => setOwnershipYears(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
                  <span>1 yr</span>
                  <span>5 yrs</span>
                  <span>10 yrs</span>
                </div>
              </div>

              {/* Total Savings Card */}
              <div className="bg-gradient-to-br from-[#0a2e14] via-[#145a2c] to-emerald-700 rounded-2xl p-6 text-white text-center shadow-2xl shadow-green-900/30">
                <div className="text-green-300 text-sm font-medium mb-1">
                  {ownershipYears}-Year Total Savings
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold mb-3 tracking-tight">
                  {formatPrice(Math.max(0, totalSavings))}
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-2 inline-block">
                  <span className="text-green-200 text-sm">
                    That&apos;s <span className="font-bold text-white">{formatCompact(Math.max(0, monthlySavings))}/mo</span> in your pocket
                  </span>
                </div>
              </div>

              {/* Quick Stat */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <div className="text-green-600 text-2xl font-bold">{formatCompact(annualSavings)}</div>
                  <div className="text-green-700 text-xs font-medium">Annual Savings</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <div className="text-blue-600 text-2xl font-bold">{formatCompact(Math.max(0, monthlySavings))}</div>
                  <div className="text-blue-700 text-xs font-medium">Monthly Savings</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detailed Breakdown */}
          <div className="lg:col-span-7 space-y-4">
            {/* Monthly Running Cost */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
                    <Calendar size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Monthly Running Cost</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatPrice(monthlyRunningSaving)} saved
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                    <Battery size={14} />
                    EV: {formatPrice(evRunningCostPerYear / 12)}
                  </div>
                  <div className="bg-gray-100 text-gray-500 font-medium px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                    <Fuel size={14} />
                    Petrol: {formatPrice(petrolRunningCostPerYear / 12)}
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Per Kilometer */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-4">Cost Per Kilometer</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-2">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹{EV_DATA.perKmEv}</div>
                  <div className="text-xs text-green-700 font-medium">EV Running Cost</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange-500 flex items-center justify-center mb-2">
                    <Fuel size={18} className="text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">₹{perKmPetrol}</div>
                  <div className="text-xs text-orange-700 font-medium">Petrol Running Cost</div>
                </div>
              </div>
              <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="text-center">
                  <span className="text-amber-700 text-sm font-medium">
                    You save <span className="font-bold text-amber-800">₹{(perKmPetrol - EV_DATA.perKmEv).toFixed(2)}/km</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Lifetime Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{ownershipYears}-Year Cost Breakdown</span>
              </div>
              <div className="space-y-3">
                {/* EV */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      EV Total Cost
                    </span>
                    <span className="font-bold text-gray-900">{formatPrice(evTotalRunning + evTotalMaintenance + EV_DATA.avgEvPricePremium)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${Math.min(100, (evTotalRunning + evTotalMaintenance) / ( petrolTotalRunning + petrolTotalMaintenance ) * 100)}%` }}
                    />
                  </div>
                </div>
                {/* Petrol */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      Petrol Total Cost
                    </span>
                    <span className="font-bold text-gray-900">{formatPrice(petrolTotalRunning + petrolTotalMaintenance)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl shadow-green-900/20">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <TreePine size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-green-200 text-xs font-semibold uppercase tracking-wide mb-1">Environmental Impact</div>
                  <div className="text-3xl font-bold mb-1">{co2Tonnes} Tonnes</div>
                  <div className="text-green-100 text-sm mb-3">CO₂ prevented over {ownershipYears} years</div>
                  <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
                    <div className="text-sm">
                      <span className="text-green-200">Equivalent to planting</span>{' '}
                      <span className="font-bold text-white">{treesEquivalent.toLocaleString('en-IN')} trees</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <Link
                href="/vehicles"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white px-8 py-4 rounded-xl font-bold text-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 shadow-lg"
              >
                <Car size={18} />
                Explore Electric Vehicles
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #145a2c 0%, #0a2e14 100%);
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(20, 90, 44, 0.4);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #145a2c 0%, #0a2e14 100%);
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(20, 90, 44, 0.4);
        }
      `}</style>
    </section>
  );
}
